import { Client, TextChannel, MessageEmbed } from "discord.js";
import * as dayjs from "dayjs";
import "dayjs/locale/ja";
import * as relativeTime from "dayjs/plugin/relativeTime";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
require("dotenv").config();

dayjs.locale("ja");
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const client = new Client();
const debug = process.env.DEBUG || false;
let mode = process.env.DEFAULT_MODE || "normal";
let quiz;
const soupReactions = process.env.SOUP_REACTIONS.split(",");
const soupChName = process.env.SOUP_CHANNEL_NAME;
const prefix = process.env.SOUP_PREFIX;
const nl = "\n　・";

const resetQuiz = () => {
    quiz = {
        isInProgress: false,
        title: "",
        questionCount: 0,
        submitCount: 0,
        startedAt: null,
    };
    return;
};
resetQuiz();

client.on("ready", () => {
    // アクティビティに関する処理
    (() => {
        if (process.env.SET_ACTIVITY === "true") {
            const activity = process.env.ACTIVITY_TEXT;
            if (!activity) {
                console.error(
                    "SET_ACTIVITYがtrueですが、ACTIVITY_TEXTにテキストがありません。アクティビティのセットを中断します。"
                );
                return;
            }
            client.user
                .setActivity(activity)
                .then((presence) => {
                    console.log(
                        `アクティビティをセットしました: ${presence.activities[0].name}`
                    );
                })
                .catch(console.error);
        } else {
            console.log(
                "SET_ACTIVITYがtrueではないので、アクティビティをセットしませんでした"
            );
        }
    })();
    console.log("Soup Chef 準備完了");
});

// どこかのチャンネルにメッセージが投稿されたら
client.on("message", (message) => {
    if (debug) {
        console.log(
            `メッセージを受信: ${message.author.username}: ${message.content}`
        );
        console.log(`現在のモード:`, mode);
        if (mode === "random") {
            console.log(`現在のquiz:`, quiz);
        }
    }

    // 投稿されたのがテキストチャンネル かつ
    // チャンネル名がスープチャンネル かつ
    // 投稿したのがSoup Chefではない
    if (
        message.channel instanceof TextChannel &&
        message.channel.name === soupChName &&
        message.author !== client.user
    ) {
        if (message.content === `${prefix} help`) {
            const reactions = soupReactions.join(", ");
            const list = [
                `\n**Soup Chefで使えるコマンド:**\n`,
                `\`${prefix} help\`:${nl}このヘルプです`,
                `\`${prefix} normal\`:${nl}:point_up_2: ノーマルモードに設定します。${nl}botが「？」「?」で終わるメッセージにリアクションをつけるモードです。`,
                `\`${prefix} random\`:${nl}:game_die: ランダムモードに設定します。${nl}問題を設定して、質問の答えをbotが適当に回答するモードです。${nl}原案: https://hikido.hatenablog.com/entry/2020/05/31/021327`,
                `\`${prefix} status\`:${nl}:eyes: ゲーム中かなど現在の状況を確認します。`,
                `\n**ノーマルモードで使えるコマンド:**\n`,
                `\`「？」「?」で終わるメッセージ\`:${nl}:person_shrugging: 出題者に質問をします。${nl}botはリアクション(${reactions})を付けます。${nl}出題者はこのリアクションを押して回答できます。`,
                `\n**ランダムモードで使えるコマンド:**\n`,
                `\`${prefix} start <問題>\`:${nl}:man_cook: 出題して新しくランダムモードのゲームを開始します。${nl}**問題は1行で入力してください。**`,
                `\`「？」「?」で終わるメッセージ\`:${nl}:person_shrugging: botに質問をします。${nl}ゲームが開始してからのみ使えます。${nl}botは適当に**正解**か**不正解**を返します。`,
                `\`${prefix} submit <回答>\`:${nl}:person_raising_hand: botに回答を提出します。${nl}ゲームが開始してからのみ使えます。${nl}botは適当に**正解**か**不正解**を返します。${nl}正解が出たらゲーム終了です。`,
            ].join("\n");
            message.reply(list).then((message) => {
                message.suppressEmbeds(true);
            });
            return;
        }
        if (message.content === `${prefix} normal`) {
            mode = "normal";
            resetQuiz();
            const content = ":point_up_2: ノーマルモードに設定しました";
            console.log(content);
            message.reply(content);
            return;
        }
        if (message.content === `${prefix} random`) {
            mode = "random";
            const content = ":game_die: ランダムモードに設定しました";
            console.log(content);
            message.reply(content);
            return;
        }
        if (message.content === `${prefix} status`) {
            let content = `現在は${
                mode === "normal"
                    ? ":point_up_2: ノーマル"
                    : ":game_die: ランダム"
            }モードです。`;

            const quizStatus = quiz.isInProgress
                ? "ゲーム中です"
                : "問題がありません";
            const quizStartedAt = dayjs(quiz.startedAt).format("LT");
            const quizStartedAtRelative = dayjs(quiz.startedAt).fromNow();

            if (mode === "random") {
                content += `\n**:man_cook: ゲームの状態**:${nl}${quizStatus}`;
                if (quiz.isInProgress) {
                    content += `\n**:question: 問題**:${nl}${quiz.title}`;
                    content += `\n**:stopwatch: 開始時間**:${nl}${quizStartedAt} (${quizStartedAtRelative})`;
                    content += `\n**:person_shrugging: 質問回数**:${nl}${quiz.questionCount}回`;
                    content += `\n**:person_raising_hand: 回答提出回数**:${nl}${quiz.submitCount}回`;
                }
            }
            console.log(content);
            message.reply(content);
            return;
        }

        // normalモードの挙動
        if (mode === "normal") {
            // メッセージの末尾が"?"か"？" なら
            if (/(\?|？)$/.test(message.content)) {
                console.log(`質問が投稿されました:  ${message.content}`);
                // 順番にリアクションをつける
                soupReactions.reduce(
                    (promise, emoji) =>
                        promise.then(() => message.react(emoji)),
                    Promise.resolve()
                );
                return;
            }
        }

        // randomモードの挙動
        if (mode === "random") {
            if (message.content.startsWith(`${prefix} start`)) {
                const regex = new RegExp(`^${prefix} start (?<title>.+)`);
                const title = message.content.match(regex)?.groups?.title;
                if (title) {
                    quiz.title = title;
                    quiz.startedAt = new Date();
                    quiz.isInProgress = true;
                    const content = `問題が設定されました: **${quiz.title}**\nゲーム開始です！\`「？」か「?」で終わるメッセージ\`で質問ができます。\n回答を提出するには\`${prefix} submit <回答>\`と送ってください。`;
                    console.log(content);
                    message.reply(content);
                    return;
                } else {
                    const content = `\`start\`には問題が必要です。\n\`${prefix} start <問題>\``;
                    console.log(content);
                    message.reply(content);
                    return;
                }
            }

            // メッセージの末尾が"?"か"？"
            if (/(\?|？)$/.test(message.content)) {
                console.log(`質問が投稿されました:  ${message.content}`);
                // quizが進行中
                if (quiz.isInProgress) {
                    quiz.questionCount++;
                    const responseBoolean = Math.random() < 0.5 ? true : false;
                    const response = responseBoolean
                        ? "⭕ はい！"
                        : "❌ いいえ！";
                    const embed = new MessageEmbed()
                        .setAuthor(
                            // quiz.title 先頭100文字
                            Array.from(quiz.title).slice(0, 100).join("")
                        )
                        .setTitle(`Q.${quiz.questionCount}: ${message.content}`)
                        .setColor(responseBoolean ? "GREEN" : "RED")
                        .setDescription(`**${response}**`)
                        .setFooter(
                            `${message.author.username}・ 問題の開始時間`,
                            message.author.avatarURL()
                        )
                        .setTimestamp(quiz.startedAt);
                    message.channel.send(embed);
                    return;
                } else {
                    const content = `現在問題がありません。\`start\`で出題してください。\n\`${prefix} start <問題>\``;
                    console.log(content);
                    message.reply(content);
                    return;
                }
            }

            if (message.content.startsWith(`${prefix} submit`)) {
                console.log(`回答が投稿されました:  ${message.content}`);
                // quizが進行中
                if (quiz.isInProgress) {
                    const regex = new RegExp(`^${prefix} submit (?<answer>.+)`);
                    const answer = message.content.match(regex)?.groups?.answer;
                    if (!!answer) {
                        quiz.submitCount++;
                        const responseBoolean =
                            Math.random() < 0.5 ? true : false;

                        if (responseBoolean) {
                            // 正解
                            const answerTime = dayjs(quiz.startedAt).toNow(
                                true
                            );
                            const embed = new MessageEmbed()
                                .setTitle(`A.${quiz.submitCount}: ${answer}`)
                                .setColor("GREEN")
                                .setDescription(
                                    `**⭕ 正解！**\n正解までの質問回数は${quiz.questionCount}回、回答提出は${quiz.submitCount}回、かかった時間は${answerTime}でした。\n\n> 問題: ${quiz.title}`
                                )
                                .setFooter(
                                    `${message.author.username}・ 問題の開始時間`,
                                    message.author.avatarURL()
                                )
                                .setTimestamp(quiz.startedAt);

                            resetQuiz();
                            message.channel.send(embed);
                            return;
                        } else {
                            // 不正解
                            const embed = new MessageEmbed()
                                .setTitle(`A.${quiz.submitCount}: ${answer}`)
                                .setColor("RED")
                                .setDescription(`**❌ 不正解！**`)
                                .setFooter(
                                    `${message.author.username}・ 問題の開始時間`,
                                    message.author.avatarURL()
                                )
                                .setTimestamp(quiz.startedAt);
                            message.channel.send(embed);
                            return;
                        }
                    } else {
                        const content = `\`submit\`には回答が必要です。\n\`${prefix} submit <回答>\``;
                        message.reply(content);
                        return;
                    }

                    return;
                } else {
                    const content = `現在問題がありません。\`start\`で出題してください。\n\`${prefix} start <問題>\``;
                    message.reply(content);
                    return;
                }
            }
        }
    }
});

// どこかのチャンネルのメッセージにリアクションが追加されたら
// 注: キャッシュされている（=bot起動後に投稿された）メッセージにしか反応しない
client.on("messageReactionAdd", (messageReaction, user) => {
    // リアクションがついたメッセージが投稿されたのがテキストチャンネル かつ
    // リアクションがついたメッセージがチャンネル名がスープチャンネル かつ
    // リアクションしたのがこのbotではない かつ
    // 追加されたリアクションがスープのどれか なら
    if (
        messageReaction.message.channel instanceof TextChannel &&
        messageReaction.message.channel.name === soupChName &&
        user !== client.user &&
        soupReactions.includes(messageReaction.emoji.name)
    ) {
        // 自分のリアクションをすべて消す
        messageReaction.message.reactions.cache.forEach((reaction) => {
            reaction.users.remove(client.user);
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
