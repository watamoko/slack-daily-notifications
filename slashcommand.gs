// ==========
// スラッシュコマンド
// ==========

// 今日の当番をスキップする
function skipDutyUser( kind ) {
  // 当番情報の取得
  const sheet = getDutySheet();
  let usersInfo = getUsersInfo(sheet);

  // 今日の当番のユーザーにスキップ情報を設定
  const dutyIndex = getTodayDutyUser(usersInfo, kind);
  if( dutyIndex < 0 ) {
    postSlackError();
    return;
  }
  usersInfo[dutyIndex][kind + INDEX_DUTY_INFO] = KEY_SKIP;

  // 次の当番ユーザーを設定
  const nextIndex = getNextDutyUser(usersInfo, kind);
  usersInfo[nextIndex][kind + INDEX_DUTY_INFO] = KEY_DUTY;

  // スプレッドシートへ反映
  setDutyInfo( sheet, usersInfo, kind );

  // Slackへ通知する
  postMessage(`<@${usersInfo[dutyIndex][INDEX_USER_ID]}> 今日の${kind === KIND_DAILY_MTG ? "朝会" : "フリートーク" }当番がスキップされました。`);
  postSlack(usersInfo[nextIndex], kind);
}

// 今日の当番をしばらくスキップする（1周するまでスキップ）
function passDutyUser( kind ) {
  // 当番情報の取得
  const sheet = getDutySheet();
  let usersInfo = getUsersInfo(sheet);

  // 今日の当番のユーザーにスキップ情報を設定
  const dutyIndex = getTodayDutyUser(usersInfo, kind);
  if( dutyIndex < 0 ) {
    postSlackError();
    return;
  }
  usersInfo[dutyIndex][kind + INDEX_DUTY_INFO] = KEY_SKIP;
  usersInfo[dutyIndex][kind + INDEX_DUTY_COUNT]++;

  // 次の当番ユーザーを設定
  const nextIndex = getNextDutyUser(usersInfo, kind);
  usersInfo[nextIndex][kind + INDEX_DUTY_INFO] = KEY_DUTY;

  // スプレッドシートへ反映
  setDutyInfo( sheet, usersInfo, kind );

  // Slackへ通知する
  postMessage(`<@${usersInfo[dutyIndex][INDEX_USER_ID]}> ${kind === KIND_DAILY_MTG ? "朝会" : "フリートーク" }当番をしばらくスキップします。`);
  postSlack(usersInfo[nextIndex], kind);
}

// 開催を延期する
function postponeMtg( kind ) {
  // 当番情報の取得
  const sheet = getDutySheet();
  let usersInfo = getUsersInfo(sheet);

  // 今日の当番のユーザーに延期情報を設定
  const dutyIndex = getTodayDutyUser(usersInfo, kind);
  if( dutyIndex < 0 ) {
    postSlackError();
    return;
  }
  usersInfo[dutyIndex][kind + INDEX_DUTY_INFO] = KEY_POSTPONE;

  // スプレッドシートへ反映
  setDutyInfo( sheet, usersInfo, kind );

  // Slackへ通知する
  postMessage(`<!channel> 今日の${kind === KIND_DAILY_MTG ? "朝会" : "フリートーク" }を延期します。`);
}

// 次の当番を確認する
function checkNextDutyUser( kind ) {
  // 当番情報の取得
  const sheet = getDutySheet();
  let usersInfo = getUsersInfo(sheet);

  // 今日の当番のユーザーを取得
  const dutyIndex = getTodayDutyUser(usersInfo, kind);
  if( dutyIndex < 0 ) {
    postSlackError();
    return;
  }

  // Slackへ通知する
  postMessage(`<@${usersInfo[dutyIndex][INDEX_USER_ID]}> 次の${kind === KIND_DAILY_MTG ? "朝会" : "フリートーク" }当番は${usersInfo[dutyIndex][INDEX_USER_NAME]}さんです。`);
}
