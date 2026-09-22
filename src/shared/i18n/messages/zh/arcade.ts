import type { Translation } from "../../translate";
import type en from "../en/arcade";

const messages: Translation<typeof en> = {
  title: "游戏厅",
  titleHint:
    "基于 Chia 游戏协议构建的游戏：两名玩家在链上的状态通道中锁定赌注，以密码学保证的公平性在链下对局（纸牌使用心理扑克），再把结果结算回链上。游戏需要支持该游戏协议的 Chia 钱包；每个游戏都会在 tracker 自己的网站上打开。",
  games: "游戏",
  filterByGenre: "按类型筛选",
  allGenres: "全部",
  disclaimer:
    "游戏按其开发者在 <link>{tracker} tracker</link> 上登记的内容列出；mempoolxch.space 不对其进行审核，赌注是真实的 XCH。",
  game: {
    verified: "已验证",
    developer: "开发者",
    stake: "赌注",
    licence: "许可证",
    plays: "局数",
    howToPlay: "玩法说明",
    hideHowToPlay: "收起玩法说明",
    play: "开始游戏",
    homepage: "主页",
  },
  rooms: {
    title: "游戏房间",
    live: "实时 · {seconds} 秒",
    loading: "加载中…",
    snapshot: "快照 {date}",
    searchPlaceholder: "搜索游戏或玩家",
    searchLabel: "搜索房间",
    phases: {
      waiting: "等待对手",
      playing: "对局中",
      closed: "已关闭",
    },
    countOf: "{shown} / {total}",
    noMatch: "没有匹配项。",
    noneNow: "目前没有。",
    table: "牌桌",
    join: "加入",
    watch: "观战",
    noPlayers: "暂无玩家",
    versusSeparator: " 对 ",
    online: "{count} 人在线",
    wager: "赌注 {amount}",
    gamesPlayed: { other: "{count} 局" },
    announced: {
      other: "tracker 上共公布了 <b>{count}</b> 个房间{breakdown}。",
    },
    breakdown: "（{list}）",
    openArcade: "打开游戏厅",
  },
  potato: {
    hint: "一个完全在链上进行的烫手山芋游戏：谁持有土豆币满 {hours} 小时，谁就拿走奖池。在此之前，任何人都可以向奖池支付 {price}，并向之前的每位持有者支付 {royalty}，把它抢走。这里的状态只从 Coinset 上的币沿袭记录读取。",
    live: "正在实时跟踪该币",
    unreachable: "无法连接 Coinset，显示快照",
    snapshot: "快照 {date}",
    heldLongEnough: "已持有足够时间",
    untilKeeps: "距持有者赢得全部奖池",
    roundOver: "本轮结束",
    ripe: "已成熟",
    ended: "土豆已被领取或推送完成；本轮已结束。",
    ripeNote: "截止时间已过：奖池现在就是持有者的 XCH，无需领取。",
    deadline: "截止 {date} · 前后误差 {buffer} 秒，以抢夺交易自身的时间戳为准",
    meter: "已完成的持有时间比例",
    held: "已持有 {time}",
    hold: "需持有 {hours} 小时",
    inPot: "奖池",
    snatches: "抢夺次数",
    nextCost: "下次抢夺费用",
    nextCostNote: "{price} 进入奖池 + 版税",
    taken: "抢得时间",
    inBlock: "位于区块 <link>#{height}</link>",
    coinNote:
      "土豆币 <hash></hash> · 持有者被包装在回拨（clawback）中，因此链上显示的是默克尔根而不是地址。",
  },
};

export default messages;
