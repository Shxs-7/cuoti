import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Toast } from '@/components/ui/Toast';

// 路由级代码分割，减少首屏体积
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const CategoryPage = lazy(() => import('@/pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const FolderPage = lazy(() => import('@/pages/FolderPage').then(m => ({ default: m.FolderPage })));
const AddQuestionPage = lazy(() => import('@/pages/AddQuestionPage').then(m => ({ default: m.AddQuestionPage })));
const QuestionDetailPage = lazy(() => import('@/pages/QuestionDetailPage').then(m => ({ default: m.QuestionDetailPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })));
const ReviewPage = lazy(() => import('@/pages/ReviewPage').then(m => ({ default: m.ReviewPage })));
const ReviewSessionPage = lazy(() => import('@/pages/ReviewSessionPage').then(m => ({ default: m.ReviewSessionPage })));
const KnowledgePage = lazy(() => import('@/pages/KnowledgePage').then(m => ({ default: m.KnowledgePage })));
const KnowledgeDetailPage = lazy(() => import('@/pages/KnowledgeDetailPage').then(m => ({ default: m.KnowledgeDetailPage })));
const AddKnowledgePage = lazy(() => import('@/pages/AddKnowledgePage').then(m => ({ default: m.AddKnowledgePage })));
const JournalPage = lazy(() => import('@/pages/JournalPage').then(m => ({ default: m.JournalPage })));
const JournalDayPage = lazy(() => import('@/pages/JournalDayPage').then(m => ({ default: m.JournalDayPage })));
const AddJournalPage = lazy(() => import('@/pages/AddJournalPage').then(m => ({ default: m.AddJournalPage })));
const AIPage = lazy(() => import('@/pages/AIPage').then(m => ({ default: m.AIPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              加载中...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/folder/:folderId" element={<FolderPage />} />
            <Route path="/question/new/:folderId?" element={<AddQuestionPage />} />
            <Route path="/question/:questionId" element={<QuestionDetailPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/knowledge/:kpId" element={<KnowledgeDetailPage />} />
            <Route path="/kp/new/:folderId" element={<AddKnowledgePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/review/session" element={<ReviewSessionPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/journal/day/:date" element={<JournalDayPage />} />
            <Route path="/journal/new" element={<AddJournalPage />} />
            <Route path="/journal/edit/:entryId" element={<AddJournalPage />} />
            <Route path="/ai" element={<AIPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
        <Toast />
      </AppShell>
    </HashRouter>
  );
}
