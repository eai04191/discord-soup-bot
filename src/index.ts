import { Client, TextChannel } from "discord.js";

require("dotenv").config();

const client = new Client();
const soupReactions = process.env.SOUP_REACTIONS.split(",");

client.on("ready", () => {
    console.log("Soup Chef 準備完了");
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
                console.log(`アクティビティをセットしました: ${presence.activities[0].name}`);
            })
            .catch(console.error);
    } else {
        console.log(
            "SET_ACTIVITYがtrueではないので、アクティビティをセットしませんでした"
        );
    }
});

// どこかのチャンネルにメッセージが投稿されたら
client.on("message", (message) => {
    // 投稿されたのがテキストチャンネル かつ
    // チャンネル名がスープチャンネル かつ
    // メッセージの末尾が"?"か"？" なら
    if (
        message.channel instanceof TextChannel &&
        message.channel.name === process.env.SOUP_CHANNEL_NAME &&
        /\?|？$/.test(message.content)
    ) {
        console.log(`質問が投稿されました:  ${message.content}`);
        // 順番にリアクションをつける
        soupReactions.reduce(
            (promise, emoji) => promise.then(() => message.react(emoji)),
            Promise.resolve()
        );
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
        messageReaction.message.channel.name ===
            process.env.SOUP_CHANNEL_NAME &&
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
