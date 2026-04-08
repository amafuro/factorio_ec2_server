curl -X POST "https://discord.com/api/v10/applications/YOUR_APP_ID/commands" \
-H "Authorization: Bot YOUR_BOT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "factorio",
  "description": "Factorioサーバーを操作します",
  "options": [
    {
      "type": 1,
      "name": "start",
      "description": "サーバーを起動します"
    },
    {
      "type": 1,
      "name": "stop",
      "description": "サーバーを停止します"
    },
    {
      "type": 1,
      "name": "check",
      "description": "サーバーの現在の状態とIPを確認します"
    }
  ]
}'
