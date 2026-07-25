# 公考错题本 📝

公务员考试错题记录与复习工具 — PWA 移动端应用

## 功能

- 📊 **多级分类**：大类 → 文件夹 → 错题，灵活组织
- 📷 **拍照上传**：直接用手机拍照或从相册选择，自动压缩
- 🏷️ **标签系统**：每道题支持多个标签，自动补全
- 🔍 **全文搜索**：搜索标题、内容、答案、标签等
- 📝 **复习模式**：翻卡式复习，自评掌握程度，追踪复习记录
- 💾 **离线使用**：所有数据存本地，无需网络
- 📤 **备份恢复**：一键导出/导入 JSON 备份

## 技术栈

React · TypeScript · Vite · Tailwind CSS · Dexie.js (IndexedDB) · Zustand · PWA

## 开发

```bash
npm install
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览生产版本
```

## 使用方式

1. 部署到静态托管服务（Vercel、GitHub Pages 等）
2. 在 iPhone Safari 中打开网址
3. 点击分享按钮 → "添加到主屏幕"
4. 像原生 App 一样使用

## 项目结构

```
src/
├── models/       # TypeScript 类型定义
├── db/           # IndexedDB 数据库层
├── services/     # 业务逻辑层
├── stores/       # Zustand 全局状态
├── hooks/        # 自定义 React Hooks
├── lib/          # 工具函数（日志、搜索、日期、压缩等）
├── components/   # UI 组件
│   ├── ui/       # 基础组件
│   ├── layout/   # 布局组件
│   └── ...
└── pages/        # 页面组件
```

## AI 开发友好

- 严格的 TypeScript 类型
- 清晰的模块划分
- 结构化日志系统（`src/lib/logger.ts`）
- 完善的接口和注释
