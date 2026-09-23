import type { Translation } from "../../translate";
import type en from "../en/settings";

const messages: Translation<typeof en> = {
  title: "设置",
  channel: "<strong>实时通道：{name}。</strong>{detail} 所有数据均直接从端点读取。",
  network: {
    title: "网络",
    active: "当前网络",
    intro:
      "整个应用都跟随当前网络：地址前缀、区块浏览器链接、实时数据流和内存池摘要。当前端点：<endpoint>{url}</endpoint>",
  },
  endpoints: {
    title: "全节点 RPC 端点",
    sage: "<strong>在 Sage 中：</strong>您的余额、币和交易来自钱包本身。Sage 的应用桥不提供节点 RPC（无法查询最新高度、内存池或区块），因此全链数据来自下方的端点；保存自定义端点时会在 Sage 中将其加入白名单。",
    intro:
      "默认情况下，mempoolxch.space 直接在您的浏览器中通过 <coinset>Coinset</coinset> 的公共全节点 RPC 读取链上数据，无需自己运行节点。您也可以将每个网络指向任何兼容 Chia 全节点 RPC 的 HTTPS 端点。使用自定义端点时，仅 Coinset 提供的功能（语义化交易摘要、地址历史和 WebSocket 数据流）会自动关闭，应用将改为轮询，并在浏览器中获取原始内存池。",
    ownNode:
      "<strong>使用自己的节点？</strong>标准的 Chia 全节点在 <code>https://localhost:8555</code> 上以双向 TLS 监听：它要求提供节点的客户端证书（浏览器无法提供），并且不发送 CORS 头。请在其前面放置一个小型反向代理，用客户端证书终止 TLS 并添加 <code>Access-Control-Allow-Origin</code>，然后在此处输入代理 URL。<guide>分步指南</guide>。",
  },
  endpoint: {
    addresses: "（{prefix} 地址）",
    coinsetDefault: "Coinset 默认",
    customNode: "自定义节点",
    test: "测试连接",
    save: "保存",
    reset: "重置为 Coinset",
    ok: "最新高度 {height}，耗时 {ms} 毫秒",
    okCustom:
      "最新高度 {height}，耗时 {ms} 毫秒 · 自定义节点：索引 API、WebSocket 和摘要 API 已关闭",
    sageHttpsOnly: "在 Sage 中只能将 https 端点加入白名单。",
    sageRefused: "Sage 未允许此主机；端点未保存。",
    sageAllowed: "Sage 已允许此主机。",
  },
  appearance: {
    title: "外观",
    theme: "主题",
    dark: "深色",
    darkHint: "mempool.space 风格",
    light: "浅色",
    lightHint: "明亮清晰",
    system: "系统",
    systemHint: "跟随设备",
    sageLocked: "在 Sage 中，应用跟随钱包的主题（当前为{theme}）。请在 Sage 的设置中更改。",
    language: "语言",
    languageAuto: "自动（浏览器语言）",
    chime: "确认提示音",
    chimeHint: "当您钱包中的交易被打包进区块时，播放轻柔的硬币声（仅限 Sage）。",
    recentBlocks: "概览中的最近区块数",
  },
  resetAll: "重置所有设置",
};

export default messages;
