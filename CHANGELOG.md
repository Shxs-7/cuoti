# 更新记录

## 2026-08-03（第四次）— 复习页标签按分类分组

- 复习页的标签不再全部混在一起，改为按分类（行测/申论/面试/公基等）分组展示，每组显示分类名。
- 先选择分类时，只显示该分类下的标签；切换分类会自动清掉不属于该分类的已选标签。
- 标签可点击再次取消选中。

## 2026-08-03（第三次）— 复习模式优化

- 每次进入复习都会把题目顺序随机打乱（Fisher-Yates），进度栏显示「🔀 随机顺序」提示。
- 复习卡片改为：有图片的题只显示**第一张图片**（大图，可点开全屏），不显示标题/内容/来源/其他图片；没有图片的题照常显示标题和内容。答案揭晓与自我评价不变。

## 2026-08-03（第二次）— 文件夹置顶

- 文件夹新增「置顶」功能：分类页里每个文件夹可一键置顶/取消（📌），置顶的文件夹排在最前，并以琥珀色边框/底色高亮显示，名称旁带 📌 标记。
- 云端同步支持 `pinned_at` 字段。
- 需要执行一条 SQL：`ALTER TABLE folders ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;`（完整脚本 `supabase.sql` 已同步更新）。

## 2026-08-03 — 知识点置顶

- 知识点新增「置顶」功能：置顶的知识点排在列表最前（按置顶时间倒序），支持多个同时置顶。
- 知识点列表页、文件夹页、详情页均可一键置顶/取消置顶（📌），置顶项显示标记。
- 云端同步支持 `pinned_at` 字段；同步层统一把时间戳字段转换为 ISO 格式推送、毫秒时间戳拉取，修复潜在的时间比较问题。
- 需要执行一条 SQL：`ALTER TABLE knowledge_points ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;`（完整脚本 `supabase.sql` 已同步更新）。

## 2026-08-01（第二次）— 复习图片与 AI 分析增强

- 复习模式支持点击图片全屏查看（之前图片不可点开）。
- AI 分析全面升级：
  - 本地分析（无需 Key）新增「最近错题」「日记高频错因」板块：列出最近错题及错答、统计日记错因里反复出现的片段并给出建议。
  - 云端 AI 支持配置模型名称（默认 deepseek-chat，OpenAI 兼容接口可填 gpt-4o-mini 等），提示词专门分析最近错题规律与日记高频错因。

## 2026-08-01 — 代码审查与修复

### 构建 / 工具链
- 修复 `npm run build` 失败：`vite.config.ts` 缺 Node 类型（新增 `@types/node`，`tsconfig.node.json` 加 `types`）。
- 新增 ESLint 9 flat 配置 `eslint.config.js`（此前 `npm run lint` 直接报错不可用），当前 lint/build 全绿。
- `.gitignore` 补充 `*.tsbuildinfo`、`vite.config.d.ts` 构建产物。

### 云同步（原"多设备数据互通"要求）
- `pullAll` 不再按 `device_id` 过滤，改为拉取全部设备数据并按 `updated_at` 合并，多设备真正互通。
- 修复 reviews 同步：upsert 冲突列改为 `question_id`，模型补 `updatedAt`，远端表补 `next_review_at`/`updated_at`。
- 修复知识点星级评分、学习日记无法同步：远端表补 `rating` 列、新增 `journal` 表（见 `supabase.sql`）。
- 新增删除墓碑机制（`deletions` 表 + Dexie v3），删除操作可同步到其他设备，防止删除后"复活"。
- 各 service 在增删改后即时推送到云端（原来是漏的）。

### 数据完整性
- 删除分类/文件夹时级联清理：错题的复习记录、知识点、标签计数（原来会残留孤儿数据）。
- 新增 `questionService.getAll()`，修复搜索页"只点标签无关键词"时结果恒为空的问题。

### 备份 / 自动备份
- 手动备份（导出/导入）补齐知识点、日记、删除墓碑（原来缺知识点和日记）。
- 自动备份真正启用（原来 `startAutoBackup` 定义了但从未调用）；补上 journal/deletions 表。
- 设置页新增"自动备份"区块：显示最近备份时间/大小，可一键恢复。

### 页面 / 交互
- "清空所有数据"改用 `db.delete()`（原来 `indexedDB.deleteDatabase` 因连接未关闭基本不生效）。
- 日记默认日期改用本地时区（原来 `toISOString` 在东八区凌晨前会差一天）。
- 搜索输入 250ms 防抖 + 过期请求丢弃。
- 文件夹题目计数改为并行查询。
- 确认弹窗等异步确认完成后再关闭。

### PWA / 其他
- 补齐缺失的应用图标（`public/icons/`）。
- manifest `start_url`/`scope`/图标与 HTML 资源改相对路径，兼容 GitHub Pages `/cuoti/` 子路径。
- 图片压缩按实际字节数判断（原来用 base64 字符数，阈值偏小）。
- Badge 组件清理无用样式类。

### 需要你操作
- 在 Supabase SQL Editor 执行一次 `supabase.sql`（幂等），让云端表结构与新同步逻辑一致；不执行也能离线使用，只是云同步会告警跳过。
