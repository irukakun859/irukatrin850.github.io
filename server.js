const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const WebSocket = require('ws');

const app = express();
const wss = new WebSocket.Server({ noServer: true });

// セッションの設定
app.use(
  session({
    secret: 'your_secret_key', // セッションの暗号化キー
    resave: false,
    saveUninitialized: false,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// トークンデータのロード
function loadTokenData() {
  if (fs.existsSync('token_data.json')) {
    return JSON.parse(fs.readFileSync('token_data.json', 'utf8'));
  }
  return null;
}

// 認証ページの表示
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 認証処理
app.post('/authenticate', (req, res) => {
  const { token, password } = req.body;
  const tokenData = loadTokenData();

  // トークンとパスワードの検証
  if (
    tokenData &&
    token === tokenData.token &&
    password === '' && // 正しいパスワードを設定
    new Date() < new Date(tokenData.expiration)
  ) {
    req.session.authenticated = true; // 認証フラグをセッションに保存
    res.redirect('/trains');
  } else {
    res.send('無効なトークンまたはパスワードです。再度お試しください。');
  }
});

// /trains ページの表示（認証が必要）
app.get('/trains', (req, res) => {
  if (req.session.authenticated) {
    res.sendFile(path.join(__dirname, 'public', 'trains.html'));
  } else {
    res.redirect('/'); // 認証されていない場合はログインページにリダイレクト
  }
});

// サポートページの表示
app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

// WebSocketサーバーの設定
wss.on('connection', (ws) => {
  console.log('クライアントが接続しました');

  // メッセージを受け取った時の処理
  ws.on('message', (message) => {
    console.log('受信したメッセージ:', message);

    // 自動応答
    let response = '';
    if (message.includes('こんにちは')) {
      response = 'こんにちは！ご質問は何でしょうか？';
    } else if (message.includes('運行')) {
      response = '運行情報については、こちらのページをご確認ください。';
    } else {
      response = 'サポートAI: ご質問ありがとうございます。現在、不在のため反応できません。ですのでAIにより反応を行っております。一部のことしか回答できません大変申し訳ございません';
    }

    // クライアントに自動応答メッセージを送信（管理者の応答として表示）
    ws.send(`<div class="message admin"><strong>管理者: </strong>${response}</div>`);
  });

  // 接続が切断されたときの処理
  ws.on('close', () => {
    console.log('クライアントが切断されました');
  });
});




// サーバーの起動
const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocketサーバーの設定
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
