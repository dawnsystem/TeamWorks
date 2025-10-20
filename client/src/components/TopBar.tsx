import { Menu, Plus, Search, Moon, Sun, LogOut, Sparkles, Settings as SettingsIcon, HelpCircle, Tag } from 'lucide-react';
import { useUIStore, useAuthStore, useTaskEditorStore, useAIStore, useCommandPaletteStore } from '@/store/useStore';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Settings from './Settings';
import HelpModal from './HelpModal';
import LabelModal from './LabelModal';

export default function TopBar() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const darkMode = useUIStore((state) => state.darkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const toggleAI = useAIStore((state) => state.toggleAI);
  const openPalette = useCommandPaletteStore((state) => state.openPalette);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
          onClick={() => isMobile ? setSidebarOpen(true) : toggleSidebar()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex-1 max-w-2xl min-w-0">
          <button
            onClick={openPalette}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Buscar tareas, acciones...</span>
            <span className="sm:hidden truncate">Buscar...</span>
            <span className="ml-auto hidden md:flex items-center gap-1 text-xs flex-shrink-0">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Cmd</kbd>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">P</kbd>
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Tarea</span>
        </button>

        {!isMobile && (
          <>
            <button
              onClick={() => setLabelModalOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Nueva etiqueta"
            >
              <Tag className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <button
              onClick={toggleAI}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Asistente IA"
            >
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
          </>
        )}

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          title="Configuración"
        >
          <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {!isMobile && (
          <>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Ayuda"
            >
              <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      
      {/* Label Modal */}
      <LabelModal isOpen={labelModalOpen} onClose={() => setLabelModalOpen(false)} />
    </header>
  );
}

