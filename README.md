<h1 align="center">
<img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/1f468-200d-1f373.svg" width="150px">

Soup Chef

</h1>

[![Invite this Bot](https://img.shields.io/badge/Discord-Invite%20this%20bot-green?logo=discord&style=flat-square)](https://discordapp.com/oauth2/authorize?&client_id=657748609323892757&scope=bot) [![CodeFactor](https://www.codefactor.io/repository/github/eai04191/discord-soup-bot/badge?style=flat-square)](https://www.codefactor.io/repository/github/eai04191/discord-soup-bot)

![preview gif](https://i.imgur.com/DY010xq.gif)

ウミガメのスープのプレイを支援する Discord bot です。

監視対象のチャンネルに「？」か「?」で終わるメッセージが投稿されると ⭕,❌,😐 のリアクションを付与します。これにより出題者は質問に対する考えを簡単に示すことができます。

付与するリアクションの種類は設定可能です。

## ランダムモード

[ウミガメのスープはランダム生成してもそれなりに遊べることがわかりました - 開け閉め](https://hikido.hatenablog.com/entry/2020/05/31/021327)

このブログ記事を元にした問題に対する回答を bot がランダムに行うモードです。

詳しくは`help`コマンドを確認してください（デフォルトでは`!soup help`）

## Self-hosted Usage

### 依存関係のインストール

```
yarn
```

### .env の準備

1. `.env.example`をコピーして`.env`を作成する
2. https://discordapp.com/developers/applications/me
   でアプリケーションを作成する
3. アプリケーションの中で bot を作成し、bot の`Token`を`.env`の`DISCORD_TOKEN`に入れる

> ⚠: `Token`は Bot ページにあります。General Information ページにある`Client Secret`ではありません。

#### env の詳細

-   `DISCORD_TOKEN`
    -   bot が使うトークン
-   `SOUP_CHANNEL_NAME`
    -   bot が監視するテキストチャンネルの名前
-   `SOUP_REACTIONS`
    -   bot が質問に対してつけるリアクションのリスト
    -   `,` 区切りで記載する
-   `SET_ACTIVITY`
    -   bot が起動時にアクティビティ（～をプレイ中）をセットするかの値
    -   セットするには `true` を記載する
    -   `true` 以外の値の場合はセットしない
-   `ACTIVITY_TEXT`
    -   アクティビティをセットする際に表示するテキスト
-   `SOUP_PREFIX`
    -   bot にコマンドを送るための接頭辞
    -   デフォルトの`!soup`なら、bot のヘルプコマンドを呼ぶには`!soup help`と投稿します

### 招待

`https://discordapp.com/oauth2/authorize?&client_id=アプリケーションのClient ID&scope=bot`
を開いて bot をサーバーに招待する

### 起動

```
yarn start
```

`Soup Chef 準備完了`とログに出れば成功です。

### 権限

Bot には監視対象のチャンネルに対して少なくとも

-   メッセージを読む
-   メッセージ履歴を読む
-   リアクションの追加

の権限が必要です。

random モードでは上記に加えて

-   メッセージを送信
-   埋め込みリンク

の権限が必要です。

## Licence

This project is licensed under the MIT License.
