# 概要
factorioのサーバーをEC2で建てるためのcloud formationテンプレ。

サーバの起動と停止はLamdaで行い、discordに通知する。

EC2を再起動するたびにIPアドレスが変わるため、起動時に接続先をdiscordに通知するようにしている。

# 使い方
1. サーバースタート用のLamda関数URLを叩く
2. discordに通知された接続先を確認して、ゲームに接続する
3. ゲームを終了したら、サーバーストップ用のLamda関数URLを叩く（まだ接続している人がいたら、エンドポイントを叩いてもサーバーは停止されない）   

また、EventBrigeによって、23時に自動でサーバーが開始し、翌日1時に自動でサーバーが停止するようにしている。

# 初期設定手順

## parameter storeにパラメータを登録する

以下のパラメータについて、任意の値をparameter storeに登録する。
DISCORD_WEBHOOK_URLは、discordのチャンネル設定から発行しておく。

* ec2-api-auth-key
* ec2-ssh-allowed-cidr
* factorio-save-data-name（後でアップするセーブデータと同じ名前を登録しておく）
* factorio-rcon-password
* discord-webhook-url

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

配置後、CloudFormationのoutputに出力されたAppStartURLとAppStopURLを叩くとサーバーを起動・停止でき、discordに接続先が通知される。

# その他
セーブデータの持ち主がspase_ageのDLCを買っていてて、他の参加者が買っていない場合、サーバーログイン時に「modが違うので、同期しますか」が何度もでてログイン出来ないことがあった（DLCを買っているだけで、他はバニラ）。
その場合、DLCを買ってもらうか、 `/factorio/mods/mod-list.json`を書き換えてspase_age関連のmodをoffにしてからサーバーを起動する必要がある。
