# 公考错题本 — 项目记录

> 本文档给 AI 助手 / 开发者回来维护时快速上手用。改动历史见 `CHANGELOG.md`。

## 一、项目概况

- 公考（公务员考试）错题记录与复习工具，PWA 移动端应用，全中文界面。
- 技术栈：React 18 + TypeScript + Vite 5 + Tailwind CSS + Dexie (IndexedDB) + Zustand + Supabase 云同步 + Vite PWA。
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

## 三、数据与同步机制

- 本地数据全在 IndexedDB（`cuoti-db`），离线可用；表：categories、folders、questions、tags、reviews、knowledgePoints、journal、deletions。
- 云同步（`sync.service.ts`）：
  - `fullSync()` = 注册设备 → `pushAll()`（本地全量 upsert，带上 `device_id`）→ `pullAll()`（拉取**所有设备**的行，按 `updated_at` 后写覆盖）。
  - 单条即时同步：各 service 在 create/update 后调用 `syncOne(远程表名, row)`（best effort，失败只记日志）。
  - 删除用**墓碑机制**：`markDeleted(表名, id)` 在本地 `deletions` 表写入并 push 到云端；其他设备 pull 时发现墓碑（`deleted_at >= updated_at`）则删除本地行，防止"复活"。墓碑会一直保留在云端（不清理，可接受）。
  - 注意：`reviews` 表主键是 `question_id`，upsert 冲突列与其他表不同（`sync.service` 的 TABLE_MAP 里配置）。
- Supabase 需在服务器执行 `supabase.sql`（幂等，可重复跑）；RLS 目前是 `USING (true)` + anon key，无真实用户鉴权，适合个人使用，不建议多人共用同一 Supabase 项目。

## 四、已知限制（有意保留）

1. **无用户登录/鉴权**：所有拿到 anon key 的人都能读写全部数据，只适合个人项目。
2. **每台设备会各自创建默认分类**（行测/申论/面试/公基），多设备首次同步后可能看到重复分类，需手动删掉多余的。
3. **云端保留已删除行**（墓碑不清除），数据量会缓慢增长；对个人错题本规模无影响。
4. **图片 EXIF 方向未处理**：iPhone 竖拍照片在旧浏览器上可能旋转；现代浏览器大多已自动处理。
5. 分类排序接口 `categoryService.reorder` 已存在但 UI 未提供拖拽排序入口。

## 五、运维

- `npm run dev` 本地开发；`npm run build` 构建；`npm run preview` 预览；`npm run deploy` 发布 GitHub Pages。
- PWA 图标在 `public/icons/`（icon-192/512、apple-touch-icon-180），manifest 用相对路径，兼容 `/cuoti/` 子路径。
- 修改 Dexie 表结构必须 `version(n+1)` 升级，不要改库名。
- 自动备份：应用启动时 `autoBackupService.startAutoBackup()`，数据变更 2s 后写入 localStorage，每 5 分钟兜底；设置页可查看并恢复。

## 六、最近一次大检查（2026-08-01）

修复了构建失败、Lint 不可用、多设备同步失效、reviews/知识点/日记无法同步、删除残留（复习记录/知识点/标签计数）、备份缺知识点和日记、自动备份未启动、清空数据不生效、日记默认日期时区偏移、搜索无防抖且纯标签搜索无结果、PWA 图标缺失等问题。详见 `CHANGELOG.md`。
