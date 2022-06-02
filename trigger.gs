// ==========
// 定刻トリガー処理
// ==========

// 共通処理
function skipDate(dailyFunc, freetalkFunc) {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // スキップ期間中は実行しない
  if (skipPeriod.some(period => (period.startDate <= today && period.finishDate >= today))) {
    return;
  }

  // 土日は実行しない
  if (dayOfWeek === SATURDAY || dayOfWeek === SUNDAY) {
    return;
  }

  // 「朝会」処理
  dailyFunc();

  // 「フリートーク」処理
  // 月・木のみ通知する
  if (dayOfWeek === MONDAY || dayOfWeek === THURSDAY) {
    freetalkFunc();
  }
}

// 毎日実行する当番ユーザーの通知
function postDailyDutyUser() {
  skipDate(postDailyDutyUser(KIND_DAILY_MTG), postDailyDutyUser(KIND_FREE_TALK));
}

// 毎日実行する当番確定処理
function applyDailyDutyInfo() {
  skipDate(applyDutyInfo(KIND_DAILY_MTG), () => {
    applyDutyInfo(KIND_FREE_TALK);
    checkNextDutyUser(KIND_FREE_TALK);
  });
}

// 当番ユーザーの通知
function postDutyUser( kind ) {
  // 当番情報の取得
  const sheet = getDutySheet();
  const usersInfo = getUsersInfo( sheet );
  // 今日の当番を取得して、Slackに通知
  const dutyIndex = getTodayDutyUser( usersInfo, kind );
  if( dutyIndex >= 0 ) {
    postSlack( usersInfo[dutyIndex], kind );
  }
  else {
    postSlackError();
  }
}

// 本日の当番情報の確定
function applyDutyInfo( kind ) {
  // 当番情報の取得
  const sheet = getDutySheet();
  let usersInfo = getUsersInfo(sheet);

  // 本日の当番の回数を+1する
  const dutyIndex = getTodayDutyUser( usersInfo, kind );
  if( dutyIndex < 0 ) {
    // エラー
    console.log("当番情報の取得失敗");
    postMessage("当番情報の取得失敗");
    return;
  }

  if( usersInfo[dutyIndex][kind + INDEX_DUTY_INFO] === KEY_DUTY ) {
    usersInfo[dutyIndex][kind + INDEX_DUTY_COUNT]++;
  }

  // 全員の当番回数が1以上なら、全員の回数を-1する
  if( usersInfo.map( user => user[ kind + INDEX_DUTY_COUNT ] ).every( count => count > 0 ) ) {
    usersInfo.forEach( user => user[ kind + INDEX_DUTY_COUNT ]-- );
  }

  // 当番・スキップの情報を削除する
  usersInfo.forEach( user => user[ kind + INDEX_DUTY_INFO ] = "" );

  // 次の当番を設定する
  const nextIndex = getNextDutyUser( usersInfo, kind );
  if( nextIndex < 0 ) {
    // エラー処理
    console.log("次当番情報の設定失敗");
    postMessage("次当番情報の設定失敗");
    return;
  }
  usersInfo[nextIndex][ kind + INDEX_DUTY_INFO] = KEY_DUTY;

  // スプレッドシートへ反映
  setDutyInfo( sheet, usersInfo, kind );
}