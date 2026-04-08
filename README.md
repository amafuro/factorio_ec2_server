# 概要
factorioのサーバーをEC2で建てるためのcloud formationテンプレ。

サーバの起動と停止はLamda経由で行い、discordのスラッシュコマンドで操作する。

EC2を再起動するたびにIPアドレスが変わるため、起動時に接続先をdiscordに通知するようにしている。

# 使い方
1. discord botを招待したチャンネルでスラッシュコマンド`/factorio start`を叩く
2. discordに通知された接続先を確認して、ゲームに接続する
3. ゲームを終了したら、スラッシュコマンド`/factorio stop`を叩く（まだ接続している人がいたら、エンドポイントを叩いてもサーバーは停止されない）   

また、EventBrigeによって、23時に自動でサーバーが開始し、翌日1時に自動でサーバーが停止するようにしている。

# 初期設定手順

## parameter storeにパラメータを登録する

以下のパラメータについて、任意の値をparameter storeに登録する。
discord-webhook-urlは、discordのチャンネル設定から発行しておく。
またdiscord-public-keyは、[Discord Developer Portal](https://discord.com/developers/applications) でbotを作成し、設定画面（General Information）にある PUBLIC KEY をコピーしておく。

* ec2-api-auth-key
* ec2-ssh-allowed-cidr
* factorio-save-data-name（後でアップするセーブデータと同じ名前を登録しておく）
* factorio-rcon-password
* discord-webhook-url
* discord-public-key

## cloud formationでスタックを作成する

cloud_formation/factorio-ec2-stack.ymlをcloud formationにアップロードし、スタックを作成する。
スタックの作成が完了したら、作成されたlamdaの関数URLの設定を開き、なにも設定変更しないまま保存をする。
これをしないとlamdaが権限エラーになる。

## サーバーにfactorioをインストールする

サーバーにsshで接続し、以下を実行してfactorioをインストールする。
最新のバージョンのfactorioは[ここ](https://factorio.com/download)から確認する。

```shell
wget --no-check-certificate https://factorio.com/get-download/2.0.76/headless/linux64
mv ./linux64 factorio_headless_x64_2.0.76.tar.gz
tar -xvf factorio_headless_x64_2.0.76.tar.gz
rm factorio_headless_x64_2.0.76.tar.gz
```

最後にローカルのセーブデータを`/factorio/bin/x64/`へscpコマンドなどで配置する。

## discord botの設定

[Discord Developer Portal](https://discord.com/developers/applications)を開き、General Information を選択する。

Interactions Endpoint URL の欄に、cloud formationのoutputにある、DiscordInteractionsEndpointのURLを貼り付けて「Save Changes」をクリックする。

`bash/add_discord_slash_command.sh`のYOUR_APP_ID（Application ID）と YOUR_BOT_TOKEN（BotタブにあるToken）を置き換えて実行する。


botをdiscordのチャンネルにインストールし、スラッシュコマンド`/factorio start`・`/factorio stop`を叩くとサーバーを起動・停止でき、discordに接続先が通知される。

# その他
セーブデータの持ち主がspase_ageのDLCを買っていてて、他の参加者が買っていない場合、サーバーログイン時に「modが違うので、同期しますか」が何度もでてログイン出来ないことがあった（DLCを買っているだけで、他はバニラ）。
その場合、DLCを買ってもらうか、 `/factorio/mods/mod-list.json`を書き換えてspase_age関連のmodをoffにしてからサーバーを起動する必要がある。
