const GSS_ID = 'ここにスプレッドシートIDをペースト';
const GSS_SHEET_NAME = "当番表";
const NUMBER_OF_PERSON = 0; // ここにユーザー数を入力
const USER_NUM_COL = 10; // ユーザー数の列番号

// 当番情報として設定する文字列
const KEY_DUTY = "当番";
const KEY_SKIP = "スキップ";
const KEY_POSTPONE = "延期";

// 当番の種別
const KIND_DAILY_MTG = 3;
const KIND_FREE_TALK = 5;
const INDEX_USER_INDEX = 0;
const INDEX_USER_NAME = 1;
const INDEX_USER_ID = 2;

// 当番情報のインデックス（当番種別共通で使用）
const INDEX_DUTY_COUNT = 0;
const INDEX_DUTY_INFO = 1;

// slackの情報
const CHANNEL = "メッセージを投稿するチャンネル名をペースト";  // メッセージを投稿するチャンネル
const SLACK_BOT_TOKEN = "ここにボットのトークンをペーストI";

// ==========
// ユーティリティ
// ==========
// 本日の当番予定のユーザーを取得
function getTodayDutyUser( usersInfo, kind ) {
  return usersInfo.findIndex( user => user[ kind + INDEX_DUTY_INFO ] === KEY_DUTY || user[ kind + INDEX_DUTY_INFO ] === KEY_POSTPONE );
}

// 次の当番予定のユーザーを取得
function getNextDutyUser( usersInfo, kind ) {
  let index = 0;
  let minCount = 10; // 仮の大きな値
  usersInfo
    .filter( user => user[ kind + INDEX_DUTY_INFO ] !== KEY_SKIP)
    .forEach( user => {
      if( user[ kind + INDEX_DUTY_COUNT ] < minCount ){
        index = user[ INDEX_USER_INDEX ] - 1;
        minCount = user[ kind + INDEX_DUTY_COUNT ];
      }
    });
  return index;
}

// Slackへ通知
function postSlack( user, kind ) {
  console.log(`<@${user[INDEX_USER_ID]}> 今日の${kind === KIND_DAILY_MTG ? "朝会" : "フリートーク" }当番は${user[INDEX_USER_NAME]}さんです。`);
  postMessage(`<@${user[INDEX_USER_ID]}> 今日の${kind === KIND_DAILY_MTG ? "朝会" : "フリートーク" }当番は${user[INDEX_USER_NAME]}さんです。`);
}

function postSlackError( ) {
  console.log(`当番情報を取得できませんでした。`);
  postMessage(`当番情報を取得できませんでした。`);
}

function postMessage( message ) {
  const slackApp = SlackApp.create(SLACK_BOT_TOKEN);

  // postMessageメソッドでボット投稿を行う
  slackApp.postMessage(CHANNEL, message);
}

// Slack Slash Commandレシーバー
function doPost(e) {
  const command = e.parameter.command.split(':')[0];
  const arg = e.parameter.text;
  let kind;
  let returnMessage = `${command} ${arg}が実行されました。`;

  if (arg === 'd') {
    kind = KIND_DAILY_MTG;
    returnMessage += '朝会';
  } else if (arg === 'f') {
    kind = KIND_FREE_TALK;
    returnMessage += 'フリートーク';
  } else {
    return ContentService.createTextOutput("コマンドの利用方法が違います。");
  }

  switch(command) {
    case '/skip':
      skipDutyUser(kind);
      returnMessage += 'の今日の当番がスキップされました。';
      break;
    case '/pass':
      passDutyUser(kind);
      returnMessage += 'の今日の当番が1週分スキップされました。';
      break;
    case '/pone':
      postponeMtg(kind);
      returnMessage += 'がスキップされました。';
      break;
    case '/check':
      checkNextDutyUser(kind);
      returnMessage += 'の当番を確認します。';
      break;
    default:
      break;
  }
  
  return ContentService.createTextOutput(returnMessage);
}

// ==========
// GAS操作
// ==========
function getDutySheet() {
  return SpreadsheetApp.openById(GSS_ID).getSheetByName(GSS_SHEET_NAME);
}

function getUsersInfo( sheet ) {
  // メンバ数取得
  const userNum = sheet.getRange( 1, USER_NUM_COL ).getValue();
  return sheet.getRange(1, 1, userNum, 7).getValues();
}

// 書き込み高速化のため、列のデータをまとめて書き込む
function setDutyInfo( sheet, usersInfo, kind ) {
  const values = usersInfo.map( user => [user[ kind + INDEX_DUTY_COUNT], user[ kind + INDEX_DUTY_INFO]] );
  sheet.getRange(1, kind + INDEX_DUTY_COUNT + 1, NUMBER_OF_PERSON, 2).setValues( values );
}
