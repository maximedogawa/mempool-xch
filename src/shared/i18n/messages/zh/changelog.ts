import type { Translation } from "../../translate";
import type en from "../en/changelog";

const messages: Translation<typeof en> = {
  title: "更新日志",
  intro:
    "mempoolxch.space 的每个版本，均根据仓库的标签和提交信息生成。已发布的版本说明位于 <releases>GitHub</releases>，完整的提交历史<commits>也在那里</commits>。",
  unreleased: "未发布",
  untagged: "在分支上，尚未打标签",
  running: "运行中",
  compareOnGitHub: "在 GitHub 上比较",
  releaseNotes: "版本说明",
  compare: "比较",
  footer: "生成于 {date}。打标签后使用 <code>bun run changelog</code> 重新生成。",
};

export default messages;
