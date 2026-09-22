import type { Translation } from "../../translate";
import type en from "../en/vaults";

const messages: Translation<typeof en> = {
  exampleLabel: "Chia Network 的 Buy XCH 热钱包",
  actions: {
    initiateRecovery: "已发起恢复",
    finishRecovery: "恢复已完成",
    clawbackRecovery: "恢复已撤回",
  },
  invalid: {
    checksum: "这看起来像一个地址，但其校验和有误。",
    format: "请粘贴金库的 launcher id（64 位十六进制字符）或金库的 xch 地址。",
  },
  title: "Chia 金库",
  tooltip:
    "Chia 金库将花费权与币分离：由 passkey、硬件密钥或 m-of-n 签名者控制一个单例（singleton），恢复路径允许所有者在一段延迟后重新获得访问权，金库可在此期间撤回。Coinset 会推送恢复步骤，但没有金库目录；下方链接的扫描器收录了所有金库。",
  intro: "通过 launcher id 或地址查找金库，或在<link>社区金库扫描器</link>上浏览全部金库。",
  lookup: {
    title: "金库查询",
    placeholder: "金库 launcher id 或 xch 地址",
    inputLabel: "金库 launcher id 或地址",
    submit: "查询",
    example: "试试示例",
    needsCoinset: "查询金库的单例需要 Coinset；其资金从您的节点读取，地址由 launcher id 推导得出。",
    vaultAddress: "金库地址 <hash></hash>",
    noSingleton: "Coinset 中没有此 launcher id 对应的单例。",
    singleton: "单例",
    singletonFallback: "singleton",
    coinSpent: "当前币已花费",
    coinUnspent: "当前币未花费",
    coinSince: "当前币起始于",
    coinAmount: "币金额",
    coinAmountSub: "单例本身，而非金库资金",
    funds: "资金",
    fundsError: "无法加载金库的币",
    unspentCoins: { other: "{count} 个未花费的币" },
    fundsHint:
      "金库的资金位于由其 launcher id 推导出的谜题哈希（金库的 p2 singleton puzzle）上，此处在浏览器中计算。这是金库主地址的余额；不包括金库转移到其他地址的币。",
    launcher:
      "Launcher <launcher></launcher> · 资金位于 <funds></funds> · 当前币位于 <current></current> · <scanner>在扫描器中打开</scanner>",
    fullHistory: "<hash></hash> · 完整历史见地址页面。",
  },
  funds: {
    balance: "余额",
    balanceSub: "此地址上未花费的币",
    coins: "币",
    newestCoin: "最新的币",
  },
  activity: {
    title: "恢复活动",
    fromStream: "来自 Coinset 的金库数据流",
    needsStream: "需要 Coinset 数据流",
    empty: "此连接上尚未发现金库恢复。恢复很少见；一旦出现，事件会在多次访问中保留在此列表中。",
  },
};

export default messages;
