// =========================================
// 設定エリア
// =========================================
const CONFIG = {
    // CloudFormationのOutputs「BaseFunctionURL」の値を設定してください
    BASE_URL: 'YOUR_LAMBDA_FUNCTION_URL',

    // SSMパラメータストアに設定した Lambda用の認証キー を設定してください
    AUTH_KEY: 'YOUR_AUTH_KEY',

    // DiscordのWebhook URLを設定してください
    DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL',

    // Factorioのポート番号
    PORT: 34197
};

// =========================================
// 起動処理（手動で遊ぶときに実行）
// =========================================
function startFactorioServer() {
    notify_("🔄 サーバーの現在のステータスを確認しています...");
    const statusResponse = callLambda_('status');

    if (statusResponse.includes('Error')) {
        notify_("❌ エラーが発生しました: " + statusResponse);
        return;
    }

    // 既に起動している場合
    if (statusResponse.includes('[running]')) {
        notify_("👉 サーバーは既に [起動中] です。");
        const ipResponse = callLambda_('ip');
        const ipMatch = ipResponse.match(/Public IP:\s*([\d\.]+)/);
        if (ipMatch) {
            notify_(`現在の接続先: \`${ipMatch[1]}:${CONFIG.PORT}\``);
        }

        // 停止中の場合
    } else if (statusResponse.includes('[stopped]')) {
        notify_("👉 サーバーは現在 [停止中] です。起動処理を開始します...");
        const startResponse = callLambda_('start');

        notify_("⏳ EC2インスタンスの起動とIPアドレスの割り当てを待機しています（最大1分程度）...");

        let publicIp = null;
        for (let i = 0; i < 6; i++) {
            Utilities.sleep(10000); // 10秒待機
            const ipCheckResponse = callLambda_('ip');
            const ipMatch = ipCheckResponse.match(/Public IP:\s*([\d\.]+)/);

            if (ipMatch) {
                publicIp = ipMatch[1];
                break;
            }
        }

        if (publicIp) {
            notify_(`🚀 **サーバーが起動しました！**\n接続先: \`${publicIp}:${CONFIG.PORT}\``);
        } else {
            notify_("⚠️ 起動に時間がかかっているようです。少し待ってから checkServerIP() を実行して確認してください。");
        }

        // 処理中の場合
    } else if (statusResponse.includes('[pending]') || statusResponse.includes('[stopping]')) {
        notify_("👉 サーバーは現在 [処理中] です。しばらく待ってから再度実行してください。");
    } else {
        notify_("❓ 不明なステータスです: " + statusResponse);
    }
}

// =========================================
// 停止処理（毎日4時などの自動実行用）
// =========================================
function stopFactorioServer() {
    notify_("🔄 サーバーの現在のステータスを確認しています...");
    const statusResponse = callLambda_('status');

    if (statusResponse.includes('Error')) {
        notify_("❌ エラーが発生しました: " + statusResponse);
        return;
    }

    // 1. 起動中の場合のみ停止処理を行う
    if (statusResponse.includes('[running]')) {
        notify_("👉 サーバーは現在 [起動中] です。");

        // --- ここから追加・修正：オンラインプレイヤーの確認 ---
        notify_("👥 現在のオンラインプレイヤー数を確認しています...");
        const playersResponse = callLambda_('players');

        // FactorioのRCONコマンド "/players online" の戻り値で判定
        if (playersResponse.includes('Online players (0)')) {
            notify_("👤 オンラインプレイヤーは 0人 です。停止処理を進めます。");
        } else if (playersResponse.includes('Online players')) {
            // "Online players" が含まれているが "(0)" ではない場合（誰かプレイしている）
            notify_(`🎮 現在プレイ中のユーザーがいます。サーバーの停止をスキップします。\n（詳細: ${playersResponse}）`);
            return; // ここで処理を終了し、サーバーを停止させない
        } else {
            // エラーや、サーバー起動直後でRCONが応答しなかった場合
            notify_(`⚠️ プレイヤー人数の取得に失敗しました。安全のため停止をスキップします。\n（詳細: ${playersResponse}）`);
            return; // ここで処理を終了し、サーバーを停止させない
        }
        // --- ここまで ---

        // 停止する前に、現在割り当てられているIPとポートをログに残す
        const ipResponse = callLambda_('ip');
        const ipMatch = ipResponse.match(/Public IP:\s*([\d\.]+)/);
        if (ipMatch) {
            notify_(`（参考）停止するサーバーの接続先: ${ipMatch[1]}:${CONFIG.PORT}`);
        }

        notify_("🛑 停止処理を開始します...");
        const stopResponse = callLambda_('stop');
        if (stopResponse.includes('Success')) {
            notify_("💤 **サーバーの停止処理が正常に完了しました。**");
        } else {
            notify_("⚠️ 実行結果: " + stopResponse);
        }

        // 2. 既に停止中、または現在停止処理が進んでいる場合
    } else if (statusResponse.includes('[stopped]') || statusResponse.includes('[stopping]')) {
        notify_("👉 サーバーは既に [停止中] または [停止処理中] のため、スキップします。");

        // 3. 起動処理中の場合
    } else if (statusResponse.includes('[pending]')) {
        notify_("👉 サーバーは現在 [起動処理中] です。完全に起動してから停止を実行してください。");

        // 4. その他のステータス（エラー含む）
    } else {
        notify_("❓ 不明なステータスです: " + statusResponse);
    }
}

// =========================================
// IPアドレスだけを確認する補助機能
// =========================================
function checkServerIP() {
    notify_("🔍 サーバーのパブリックIPを取得しています...");
    const ipResponse = callLambda_('ip');

    const ipMatch = ipResponse.match(/Public IP:\s*([\d\.]+)/);
    if (ipMatch) {
        notify_(`現在の接続先: \`${ipMatch[1]}:${CONFIG.PORT}\``);
    } else {
        notify_("結果: " + ipResponse);
    }
}

// =========================================
// 内部関数：ログ出力 兼 Discord通知
// =========================================
function notify_(message) {
    // 元のGASログにも出力しておく
    Logger.log(message);

    // Webhook URLが初期値のまま、または空の場合はDiscord通知をスキップ
    if (!CONFIG.DISCORD_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
        return;
    }

    const payload = {
        content: message
    };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    try {
        UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
    } catch (e) {
        Logger.log("Discord通知エラー: " + e.message);
    }
}

// =========================================
// 内部関数：Lambdaへのリクエストを実行
// =========================================
function callLambda_(action) {
    const baseUrl = CONFIG.BASE_URL.replace(/\/$/, '');
    const url = `${baseUrl}?action=${action}&auth_key=${CONFIG.AUTH_KEY}`;

    const options = {
        method: 'get',
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    return response.getContentText();
}

// =========================================
// 外部からのアクセス用（Web App）設定
// =========================================

// GETリクエスト（ブラウザからのアクセスなど）を受け取る
function doGet(e) {
    return handleExternalRequest_(e);
}

// POSTリクエスト（他のシステムからのWebhookなど）を受け取る
function doPost(e) {
    return handleExternalRequest_(e);
}

// 共通のリクエスト処理
function handleExternalRequest_(e) {
    // パラメータが存在しない場合のエラーハンドリング
    if (!e || !e.parameter) {
        return ContentService.createTextOutput("Bad Request").setMimeType(ContentService.MimeType.TEXT);
    }

    const action = e.parameter.action;
    let responseMessage = "";

    // actionパラメータに応じて関数を呼び出す
    try {
        switch (action) {
            case 'start':
                startFactorioServer();
                responseMessage = "起動処理の命令を受け付けました。";
                break;
            case 'stop':
                stopFactorioServer();
                responseMessage = "停止処理の命令を受け付けました。";
                break;
            case 'check':
                checkServerIP();
                responseMessage = "IP確認の命令を受け付けました。";
                break;
            default:
                responseMessage = "無効なactionです。'start', 'stop', 'check' のいずれかを指定してください。";
        }
    } catch (error) {
        responseMessage = "処理中にエラーが発生しました: " + error.message;
    }

    // 結果をプレーンテキストで返す
    return ContentService.createTextOutput(responseMessage).setMimeType(ContentService.MimeType.TEXT);
}
