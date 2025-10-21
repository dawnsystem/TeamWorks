import { Link, useLocation } from 'react-router-dom';
import { Inbox, Calendar, CalendarDays, FolderOpen, Sparkles } from 'lucide-react';
import { useAIStore, useUIStore } from '@/store/useStore';

/**
 * Mobile bottom navigation bar
 * Shows main navigation items for easy thumb access on mobile devices
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const toggleAI = useAIStore((state) => state.toggleAI);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Inbox, label: 'Inbox' },
    { path: '/today', icon: Calendar, label: 'Hoy' },
    { path: '/week', icon: CalendarDays, label: 'Semana' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Projects Button - Opens sidebar on mobile */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
        >
          <FolderOpen className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Proyectos</span>
        </button>
        
        {/* AI Assistant Button */}
        <button
          onClick={toggleAI}
          className="flex flex-col items-center justify-center flex-1 h-full text-purple-600 dark:text-purple-400 transition-colors hover:text-purple-700 dark:hover:text-purple-300"
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">IA</span>
        </button>
      </div>
    </nav>
  );
}
