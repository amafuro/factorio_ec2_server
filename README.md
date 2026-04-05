# 概要
factorioのサーバーをEC2で建てるためのcloud formationテンプレ
サーバの起動と停止はGASで行い、discordに通知する

EC2を再起動するたびにIPアドレスが変わるため、起動時に接続先をdiscordに通知するようにしている

# 使い方
1. サーバースタート用のGASエンドポイントを叩く
2. discordに通知された接続先を確認して、ゲームに接続する
3. ゲームを終了したら、サーバーストップ用のGASエンドポイントを叩く

# 初期設定手順

## parameter storeにパラメータを登録する

以下のパラメータについて、任意の値をparameter storeに登録する

* ec2-api-auth-key
* ec2-ssh-allowed-cidr
* factorio-save-data-name
* factorio-rcon-password

## cloud formationでスタックを作成する

cloud_formation/factorio-ec2-stack.ymlをcloud formationにアップロードし、スタックを作成する。
スタックの作成が完了したら、作成されたlamdaの関数URLの設定を開き、なにも設定変更しないまま保存をする。
これをしないとlamdaが権限エラーになる。

## サーバーにfactorioをインストールする

## GASアプリをデプロイする
