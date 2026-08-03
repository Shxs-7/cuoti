# 公考错题本 — 项目记录

> 本文档给 AI 助手 / 开发者回来维护时快速上手用。改动历史见 `CHANGELOG.md`。

## 一、项目概况

- 公考（公务员考试）错题记录与复习工具，PWA 移动端应用，全中文界面。
- 技术栈：React 18 + TypeScript + Vite 5 + Tailwind CSS + Dexie (IndexedDB) + Zustand + Vite PWA（纯本地应用，无云端）。
- 部署基路径为 `/cuoti/`（GitHub Pages 子路径），路由用 HashRouter。

## 二、目录结构

```
src/
├── models/       # 类型定义：Category/Folder/Question/Tag/ReviewInfo/KnowledgePoint/JournalEntry/Deletion
├── db/           # Dexie 数据库（库名 cuoti-db，当前 version 3）
├── services/     # 业务 + 同步：question/folder/category/tag/review/knowledge/journal/backup/autobackup/ai/sync
├── stores/       # Zustand：app.store（标题/返回）、ui.store（Toast）
├── lib/          # 工具：date、search、compression、logger、uid、constants、supabase 客户端
├── components/   # ui/（基础组件）+ layout/（Header/BottomNav/AppShell）
└── pages/        # 17 个路由页面（见 App.tsx）
```

## 三、数据与备份

- **纯本地存储**：所有数据在 IndexedDB（`cuoti-db`），表：categories、folders、questions、tags、reviews、knowledgePoints、journal、deletions（deletions 为早期云同步遗留的空表，无实际作用）。
- **自动备份**：应用启动时 `autoBackupService.startAutoBackup()`，任何数据变更 2 秒后写入 localStorage，每 5 分钟兜底保存一次；「设置」页可查看最近备份时间并一键恢复。
- **手动备份**：设置页可导出全部数据为 JSON 文件（含知识点、日记等全部 8 张表），也可导入恢复；导入会覆盖当前数据。
- 2026-08-03 起已按用户要求**移除云同步**（Supabase），`supabase.sql` 仅作历史参考保留，不再使用。

## 四、已知限制（有意保留）

1. **图片 EXIF 方向未处理**：iPhone 竖拍照片在旧浏览器上可能旋转；现代浏览器大多已自动处理。
2. 分类排序接口 `categoryService.reorder` 已存在但 UI 未提供拖拽排序入口。
3. **数据只在当前设备**：换手机/换浏览器不会自动带数据，请用「导出备份」转移，或依赖自动备份。

## 五、运维

- `npm run dev` 本地开发；`npm run build` 构建；`npm run preview` 预览；`npm run deploy` 发布 GitHub Pages。
- PWA 图标在 `public/icons/`（icon-192/512、apple-touch-icon-180），manifest 用相对路径，兼容 `/cuoti/` 子路径。
- 修改 Dexie 表结构必须 `version(n+1)` 升级，不要改库名。
- 自动备份：应用启动时 `autoBackupService.startAutoBackup()`，数据变更 2s 后写入 localStorage，每 5 分钟兜底；设置页可查看并恢复。

## 六、最近一次大检查（2026-08-01）

修复了构建失败、Lint 不可用、多设备同步失效、reviews/知识点/日记无法同步、删除残留（复习记录/知识点/标签计数）、备份缺知识点和日记、自动备份未启动、清空数据不生效、日记默认日期时区偏移、搜索无防抖且纯标签搜索无结果、PWA 图标缺失等问题。2026-08-03 按用户要求移除云同步，改为纯本地 + 备份方案。详见 `CHANGELOG.md`。
