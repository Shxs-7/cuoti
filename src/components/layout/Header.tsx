import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';

export function Header() {
  const { title, showBack } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isRoot = location.pathname === '/';
  const canGoBack = !isRoot || showBack;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 safe-top">
      <div className="flex items-center h-12 px-4 gap-3">
        {canGoBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full -ml-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold truncate flex-1">{title}</h1>
        <div className="flex items-center gap-1">
          {isRoot && (
            <button
              onClick={() => navigate('/search')}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full"
            >
              🔍
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            title="设置"
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
}
