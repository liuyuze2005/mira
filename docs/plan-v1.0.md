# Mira v1.0 — 知识驱动架构重写

> **核心洞察：不要喂 LLM 整本书，用书名+互联网就够了。**
> 对于《红楼梦》《三体》等名著，LLM 本身就知道人物和场景。
> 对于冷门书，web search 找角色 wiki / 百度百科。
> 只在完全找不到时，才 fallback 到上传文本分段提取。

---

## 架构变更：Knowledge-First Pipeline

```
用户输入书名 + 作者
  │
  ▼
┌─────────────────────────────────┐
│     KnowledgeResolver           │
│  ┌─ LLM 知识 (零 token 成本)    │
│  ├─ Web Search (少量 token)     │
│  └─ 文本提取 (最后 fallback)    │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│     ExtractionPipeline          │
│  合并 → 去重 → 置信度标注       │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│     SpoilerControl              │
│  按章节过滤 → 渐进式解锁        │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│     VisualPackGenerator         │
│  人物卡 + 场景卡 + 关系图 + 插图│
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│     ReadingView                 │
│  位置联动侧边栏 → 复习卡        │
└─────────────────────────────────┘
```

---

## v1.0 完整功能清单

### 数据层
- [x] IndexedDB 本地存储
- [x] BookProfile（书名、作者、章节数、风格设定）
- [ ] CharacterCard（人物卡 + sourceQuote + 置信度 + 章节追踪）
- [ ] SceneCard（场景卡：氛围图 vs 空间平面图）
- [ ] RelationshipGraph（人物关系图）
- [ ] VisualCompanionPack（整本书的视觉包导出）

### 知识获取（三层 fallback）
1. **LLM 内建知识** — 问模型"列出《红楼梦》所有角色"，零额外文本
2. **Web Search** — 搜百度百科 / Wikipedia / fandom wiki，提取结构化信息
3. **文本提取** — 上传 txt/epub，分段发给 LLM 提取（仅冷门书）

### 核心功能
- [ ] Visual Companion Pack 一键生成
- [ ] 无剧透模式（按章节进度过滤）
- [ ] 置信度标注（explicit / inferred / unknown）
- [ ] 人物关系图谱
- [ ] 阅读模式侧边栏联动
- [ ] 视觉记忆复习卡
- [ ] Prompt 编辑器 + 全书风格设定

### 格式支持
- [x] txt
- [x] epub（JSZip）
- [ ] pdf（pdf-parse）
- [x] 手动粘贴

### 界面
- [x] 中英双语
- [x] 深色文学风 UI
- [x] 移动端优先
- [ ] 阅读视图（左文本 + 右视觉面板）

---

## 新增 API 路由

| 路由 | 功能 |
|------|------|
| `/api/knowledge` | 知识解析：书名 → LLM知识 + web search → 结构化人物/场景 |
| `/api/extract` | 文本提取 fallback（已有，需增强分段+置信度） |
| `/api/generate` | 生图（已有） |
| `/api/parse` | 文件解析（已有） |

### `/api/knowledge` 设计

```
输入：{ title: "红楼梦", author: "曹雪芹", chapter: 3, language: "zh" }

内部流程：
1. LLM prompt: "列出《红楼梦》的主要人物（姓名、外貌、性格）和关键场景"
2. 如果 LLM 返回不足，触发 web search:
   - "红楼梦 人物列表 外貌描写"
   - "红楼梦 大观园 布局"
3. 合并结果，标注置信度
4. 按 chapter 参数过滤（无剧透）

输出：
{
  characters: [
    { name: "贾宝玉", aliases: ["宝玉","怡红公子"], appearance: {...},
      personality: [...], confidence: "explicit", sourceQuote: "原文..." }
  ],
  scenes: [...],
  moments: [...],
  source: "llm-knowledge" | "web-search" | "text-extraction"
}
```

### Web Search 集成
使用用户已有的搜索工具（中转站或搜索引擎 API）：
- 百度百科 → 结构化人物/场景数据
- Wikipedia → 英文书
- 豆瓣读书 → 中文书评中的角色分析

---

## 组件新增

```
src/components/
  KnowledgePanel.tsx      # 知识获取进度展示
  CharacterCard.tsx        # 人物卡片（含 sourceQuote 溯源）
  SceneCard.tsx            # 场景卡片
  RelationshipGraph.tsx    # 人物关系图
  ReadingView.tsx          # 阅读模式（左文本 + 右面板）
  ReviewPanel.tsx          # 复习卡片
  SpoilerGate.tsx          # 无剧透章节选择器
  PromptEditor.tsx         # 风格/Prompt 编辑
  VisualPackExport.tsx     # 导出 Visual Companion Pack
```

---

## 实施顺序

### Phase A：Knowledge-First Pipeline（核心重构）
1. `/api/knowledge` 路由 — LLM 知识 + web search 集成
2. `KnowledgePanel` — 展示获取进度和来源
3. 更新主页 — 书名输入即可生成，上传文本降级为可选

### Phase B：Character & Scene Cards
4. CharacterCard 类型 + 组件
5. SceneCard 类型 + 组件
6. 置信度 UI 展示
7. sourceQuote 溯源展示

### Phase C：无剧透 + 关系图
8. SpoilerGate 组件
9. 按章节过滤逻辑
10. RelationshipGraph 组件

### Phase D：阅读模式 + 复习
11. ReadingView（左文本 + 右视觉面板）
12. ReviewPanel（复习卡）
13. PromptEditor（风格设定）

### Phase E：导出 + 收尾
14. VisualPackExport
15. VisualCompanionPack JSON 格式定义
16. PDF 支持
17. 多书库 / 系列继承

---

## 技术决策

| 决策 | 理由 |
|------|------|
| 优先 LLM 知识 + web search，而非文本提取 | 省 token 90%+，速度快 10x |
| 上传文本降级为可选 | 名著不需要上传，冷门书才需要 |
| 置信度三档标注 | 建立用户信任，不假装知道 |
| 无剧透模式默认开启 | 文学工具最核心的体验保障 |
| 本地 IndexedDB 为主 | 隐私优先，不上传用户数据 |
