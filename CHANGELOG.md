# 更新记录

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
