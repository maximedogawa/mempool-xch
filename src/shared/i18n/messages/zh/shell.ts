import type { Translation } from "../../translate";
import type en from "../en/shell";

const messages: Translation<typeof en> = {
  home: "mempoolxch.space 首页",
  primaryNav: "主导航",
  mobileNav: "移动端导航",
  morePages: "更多页面",
  more: "更多",
  openMenu: "打开菜单",
  closeMenu: "关闭菜单",
  language: "语言",
  nav: {
    dashboard: "概览",
    blocks: "区块",
    mempool: "内存池",
    charts: "图表",
    market: "市场",
    map: "地图",
    tokens: "代币",
    nfts: "NFT",
    fees: "手续费",
    pools: "矿池",
    vaults: "金库",
    learn: "学习",
    help: "帮助",
    arcade: "游戏厅",
    wallet: "我的钱包",
    settings: "设置",
  },
  groups: {
    assets: "资产",
    network: "网络",
    learnPlay: "学习与娱乐",
    liveChain: "实时链上",
    you: "我的",
  },
};

export default messages;
