# 概要
factorioのサーバーをEC2で建てるためのcloud formationテンプレ。
サーバの起動と停止はGASで行い、discordに通知する。

EC2を再起動するたびにIPアドレスが変わるため、起動時に接続先をdiscordに通知するようにしている。

# 使い方
1. サーバースタート用のGASエンドポイントを叩く
2. discordに通知された接続先を確認して、ゲームに接続する
3. ゲームを終了したら、サーバーストップ用のGASエンドポイントを叩く

# 初期設定手順

## parameter storeにパラメータを登録する

以下のパラメータについて、任意の値をparameter storeに登録する。

* ec2-api-auth-key
* ec2-ssh-allowed-cidr
* factorio-save-data-name（後でアップするセーブデータと同じ名前を登録しておく）
* factorio-rcon-password

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

## GASアプリをデプロイする
gasファイルを作成し、コード.gsにリポジトリのコードを貼り付け、BASE_UR、AUTH_KEY、DISCORD_WEBHOOK_URLを記載しておく。
DISCORD_WEBHOOK_URLは、discordのチャンネル設定から発行しておく。

デプロイからウェブアプリとしてデプロイをし、生成されたURLをメモしておく。
生成されたURLに`?action=start`もしくは`?action=stop`のパラメータをつけて叩くとサーバーを起動・停止でき、discordに接続先が通知される。
