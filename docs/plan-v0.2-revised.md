# Mira v0.2 — 修订计划

> 根据用户反馈重新排序。核心原则：不做"图片生成器"，做"文学视觉辅助包生成器"。

**定位调整：** Mira = Visual Companion Pack generator for aphantasic readers.

---

## 路线图

### v0.2（当前）— 从"能生图"到"懂阅读"

```
✅ 中英双语
✅ txt + 手动粘贴文本导入
✅ 电子书解析（epub/txt，注：mammoth 未使用，epub 用 JSZip）
→ Extraction pipeline（分段提取 → 合并去重 → 用户审核）
→ Character Card + sourceQuote 溯源
→ 置信度标注（explicit / inferred / unknown）
→ 无剧透模式（仅基于当前进度生成）
→ 阅读模式侧边栏联动（根据当前段落推荐相关卡片）
→ Visual Companion Pack 导出概念
→ PROMPT 编辑器（全书风格设定）
→ 修复 README 技术描述
```

### v0.3 — 扩展格式 + 关系图

```
- epub 完善解析（章节、目录、编码）
- pdf 支持
- 批量生图队列
- 人物关系图
- 人物一致性档案（跨章节更新）
```

### v0.4 — 生态 + 本地化

```
- 多书库
- 系列小说角色继承
- 导出/分享 Visual Companion Pack
- 视觉记忆复习卡
- 本地模型 / Ollama 支持
- 隐私模式（用户选择发送范围）
```

---

## v0.2 具体任务

### Task 1: 修复 README 技术描述
- mammoth → 删除，改为 JSZip for epub
- 实验性功能标注

### Task 2: Pipeline 架构搭建
**新建** `src/lib/extractor.ts`

```ts
type ExtractionPipeline = {
  chunkText(text: string, maxChunkSize: number): string[]
  extractCandidates(chunks: string[]): Promise<RawExtraction[]>
  mergeEntities(raw: RawExtraction[]): MergedExtraction[]
  buildCharacterCards(merged: MergedExtraction[]): CharacterCard[]
}
```

流程：
```
Book text → chunk (按 ~3000 字/段) → 批量 LLM 提取 → merge 去重 → 用户审核 → 建卡片
```

### Task 3: CharacterCard 数据结构
```ts
type CharacterCard = {
  id: string
  name: string
  aliases: string[]
  appearance: { face?, hair?, clothing?, age?, body?, distinctiveFeatures? }
  personality: string[]
  sourceQuotes: { text: string; chapter: number; confidence: "explicit"|"inferred"|"unknown" }[]
  imagePrompt: string
  imageUrl?: string
}
```

关键：每个外貌/性格特征都带 sourceQuote，用户可以看到 AI 为什么这么说。

### Task 4: 置信度标注
提取 API 返回时增加 `confidence` 字段：
- `explicit`: 原文直接描述（"他个子很高"）
- `inferred`: 根据上下文推测（"穿着体面 → 可能穿西装"）
- `unknown`: 无依据，留空

### Task 5: 无剧透模式
新增 `SpoilerControl` 组件：
- 用户设定当前章节进度（第 X 章）
- 提取/生成时只使用 ≤ 当前章节的文本
- 人物卡随进度逐步更新，标注"上次更新：第 X 章"

### Task 6: 阅读联动侧边栏
阅读模式下：
- 左侧：文本段落
- 右侧：自动检测当前段落出现的角色/场景 → 显示对应卡片
- 用户点击段落中的人名 → 弹出 Character card

### Task 7: Prompt 编辑器 + 全书风格
- BookStyleProfile: `{ styleName, colorPalette, period, avoid[] }`
- 同书所有生成共享风格设定
- 全局 Style Preset 管理

### Task 8: Visual Companion Pack 定义
- 一本文学作品的完整视觉包结构
- 导出格式：JSON + images
- UI 上展示"这是一个 Visual Companion Pack"

---

## 不再做的（从旧 v0.2 计划中移除）

- ~~Phase 5: 阅读模式~~ → 由 Task 6 替代，更细粒度
- ~~整本书一次性丢给 LLM~~ → 改为 Pipeline 分段提取
- ~~mammoth docx 支持~~ → 从未实现，只是文档写错

---

## 文件树变更

```
新增:
  src/lib/extractor.ts          # Pipeline 核心
  src/lib/character-card.ts    # CharacterCard 类型 + 工具函数
  src/lib/spoiler-control.ts   # 无剧透逻辑
  src/components/ExtractionPanel.tsx  # 提取结果审核 UI
  src/components/ReadingView.tsx      # 阅读联动侧边栏
  src/components/SpoilerGate.tsx      # 章节进度设置
  src/components/CharacterCard.tsx    # 人物卡片展示

修改:
  src/app/page.tsx              # 集成 Pipeline + 阅读模式
  src/app/api/extract/route.ts  # 支持分段提取 + 置信度
  README.md                     # 修正技术描述
  docs/plan-v0.2.md             # 本文件
```
