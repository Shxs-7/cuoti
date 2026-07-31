import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Toast } from '@/components/ui/Toast';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { FolderPage } from '@/pages/FolderPage';
import { AddQuestionPage } from '@/pages/AddQuestionPage';
import { QuestionDetailPage } from '@/pages/QuestionDetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { ReviewSessionPage } from '@/pages/ReviewSessionPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { KnowledgeDetailPage } from '@/pages/KnowledgeDetailPage';
import { AddKnowledgePage } from '@/pages/AddKnowledgePage';
import { JournalPage } from '@/pages/JournalPage';
import { AddJournalPage } from '@/pages/AddJournalPage';
import { AIPage } from '@/pages/AIPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <HashRouter>
      <AppShell>
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
          <Route path="/journal/new" element={<AddJournalPage />} />
          <Route path="/journal/edit/:entryId" element={<AddJournalPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <Toast />
      </AppShell>
    </HashRouter>
  );
}
