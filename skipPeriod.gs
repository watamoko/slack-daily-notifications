// 朝会通知をしない期間の指定
// Dateオブジェクトの月は0始まりのため、-1する
const skipPeriod = [
  {
    event: "ゴールデンウイーク",
    startDate: new Date(2022, 4-1, 30), // 2022/4/29
    finishDate: new Date(2022, 5-1, 8), // 2022/5/8
  }
];
