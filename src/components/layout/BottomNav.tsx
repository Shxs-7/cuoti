import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: '错题', icon: '📋' },
  { path: '/search', label: '搜索', icon: '🔍' },
  { path: '/journal', label: '日记', icon: '📔' },
  { path: '/review', label: '复习', icon: '📝' },
  { path: '/ai', label: 'AI', icon: '🤖' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky bottom-0 z-40 bg-white/80 backdrop-blur-md border-t border-gray-100 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => {
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] flex-1 ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
