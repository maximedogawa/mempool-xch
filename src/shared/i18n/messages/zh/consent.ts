import type { Translation } from "../../translate";
import type en from "../en/consent";

const messages: Translation<(typeof en)["messages"]> = {
  consent: {
    title: "Cookie 与本地存储",
    intro:
      "本网站仅在您的浏览器中保存其运行所需的内容。除非您在此处允许，否则不会加载任何分析或广告内容。",
    cookiePolicy: "Cookie 政策",
    privacyPolicy: "隐私政策",
    signal:
      "您的浏览器发送了「请勿跟踪」（Do Not Track）或「全球隐私控制」（Global Privacy Control）信号，因此分析和广告保持关闭。",
    categoriesLegend: "类别",
    categories: {
      necessary: {
        label: "严格必要",
        detail: "您的设置、缓存和本次选择，保存在您的浏览器中。始终开启。",
      },
      analytics: {
        label: "分析",
        detail: "匿名使用统计。目前未使用。",
      },
      advertising: {
        label: "广告",
        detail: "广告及广告效果衡量。目前未使用。",
      },
    },
    rejectAll: "全部拒绝",
    saveChoice: "保存我的选择",
    acceptAll: "全部接受",
    close: "关闭",
    settingsButton: "Cookie 设置",
  },
  disclaimer: {
    label: "免责声明",
    text: "Alpha 版软件，仍在大幅变化中。不构成财务建议——请在您自己的钱包中核实。<link>使用条款</link>",
    dismiss: "关闭免责声明",
  },
};

export default messages;
