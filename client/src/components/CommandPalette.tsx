import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, FileText, Folder, Tag, Zap, Eye, Settings as SettingsIcon,
  Moon, Sun, HelpCircle, Sparkles, Plus, X, ClipboardList, Brain
} from 'lucide-react';
import { tasksAPI, projectsAPI, labelsAPI } from '@/lib/api';
import { searchAll, type Action } from '@/utils/search';
import { useUIStore, useTaskEditorStore, useAIStore, useTaskDetailStore } from '@/store/useStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const darkMode = useUIStore(state => state.darkMode);
  const toggleDarkMode = useUIStore(state => state.toggleDarkMode);
  const openEditor = useTaskEditorStore(state => state.openEditor);
  const toggleAI = useAIStore(state => state.toggleAI);
  const setMode = useAIStore(state => state.setMode);
  const openTaskDetail = useTaskDetailStore(state => state.openDetail);
  
  // Fetch data for search
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getAll().then(res => res.data),
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(res => res.data),
  });
  
  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsAPI.getAll().then(res => res.data),
  });
  
  // Define available actions
  const actions: Action[] = useMemo(() => [
    {
      id: 'new-task',
      title: 'Nueva tarea',
      description: 'Crear una nueva tarea',
      icon: 'plus',
      keywords: ['crear', 'nueva', 'añadir', 'task'],
      handler: () => {
        openEditor();
        onClose();
      }
    },
    {
      id: 'open-ai',
      title: 'Abrir asistente IA',
      description: 'Usar el asistente de IA',
      icon: 'sparkles',
      keywords: ['ia', 'asistente', 'ai', 'inteligencia'],
      handler: () => {
        toggleAI();
        onClose();
      }
    },
    {
      id: 'open-ai-ask',
      title: 'IA: Modo ASK (Preguntar)',
      description: 'Resolver dudas sin ejecutar acciones',
      icon: 'help-circle',
      keywords: ['ia', 'preguntar', 'ask', 'ayuda', 'consulta'],
      handler: () => {
        setMode('ASK');
        toggleAI();
        onClose();
      }
    },
    {
      id: 'open-ai-plan',
      title: 'IA: Modo PLAN (Planificar)',
      description: 'Crear planes estructurados',
      icon: 'clipboard-list',
      keywords: ['ia', 'plan', 'planificar', 'estrategia'],
      handler: () => {
        setMode('PLAN');
        toggleAI();
        onClose();
      }
    },
    {
      id: 'open-ai-agent',
      title: 'IA: Modo AGENT (Agente)',
      description: 'Ejecutar acciones automáticamente',
      icon: 'brain',
      keywords: ['ia', 'agente', 'agent', 'automatico', 'ejecutar'],
      handler: () => {
        setMode('AGENT');
        toggleAI();
        onClose();
      }
    },
    {
      id: 'toggle-theme',
      title: darkMode ? 'Modo claro' : 'Modo oscuro',
      description: 'Cambiar tema de la aplicación',
      icon: darkMode ? 'sun' : 'moon',
      keywords: ['tema', 'oscuro', 'claro', 'dark', 'light'],
      handler: () => {
        toggleDarkMode();
        onClose();
      }
    },
    {
      id: 'go-today',
      title: 'Ir a Hoy',
      description: 'Ver tareas de hoy',
      icon: 'eye',
      keywords: ['hoy', 'today', 'vista'],
      handler: () => {
        navigate('/today');
        onClose();
      }
    },
    {
      id: 'go-week',
      title: 'Ir a Próximos 7 días',
      description: 'Ver tareas de la semana',
      icon: 'eye',
      keywords: ['semana', 'week', 'próximos', 'días'],
      handler: () => {
        navigate('/week');
        onClose();
      }
    },
    {
      id: 'go-inbox',
      title: 'Ir a Inbox',
      description: 'Ver todas las tareas',
      icon: 'eye',
      keywords: ['inbox', 'todas', 'tareas'],
      handler: () => {
        navigate('/');
        onClose();
      }
    },
  ], [darkMode, navigate, onClose, openEditor, toggleAI, toggleDarkMode]);
  
  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchAll(tasks, projects, labels, actions, query);
  }, [query, tasks, projects, labels, actions]);
  
  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  const handleSelectResult = useCallback((result: any) => {
    switch (result.type) {
      case 'task':
        // Open task detail modal
        openTaskDetail(result.id);
        break;
      case 'project':
        navigate(`/project/${result.id}`);
        break;
      case 'label':
        navigate(`/label/${result.id}`);
        break;
      case 'action':
        result.data.handler();
        break;
    }
    onClose();
  }, [navigate, onClose, openTaskDetail]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, handleSelectResult]);
  
  const getIcon = (result: any) => {
    switch (result.type) {
      case 'task':
        return <FileText className="w-4 h-4" />;
      case 'project':
        return <Folder className="w-4 h-4" />;
      case 'label':
        return <Tag className="w-4 h-4" />;
      case 'action':
        return getActionIcon(result.data.icon);
      default:
        return <Search className="w-4 h-4" />;
    }
  };
  
  const getActionIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      plus: <Plus className="w-4 h-4" />,
      sparkles: <Sparkles className="w-4 h-4" />,
      'help-circle': <HelpCircle className="w-4 h-4" />,
      'clipboard-list': <ClipboardList className="w-4 h-4" />,
      brain: <Brain className="w-4 h-4" />,
      sun: <Sun className="w-4 h-4" />,
      moon: <Moon className="w-4 h-4" />,
      eye: <Eye className="w-4 h-4" />,
      settings: <SettingsIcon className="w-4 h-4" />,
      help: <HelpCircle className="w-4 h-4" />,
    };
    return icons[iconName] || <Zap className="w-4 h-4" />;
  };
  
  const getCategoryTitle = (type: string) => {
    switch (type) {
      case 'task':
        return 'TAREAS';
      case 'project':
        return 'PROYECTOS';
      case 'label':
        return 'ETIQUETAS';
      case 'action':
        return 'ACCIONES';
      default:
        return 'RESULTADOS';
    }
  };
  
  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const result of results) {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    }
    return groups;
  }, [results]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[600px] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas, proyectos, acciones... (p:proyecto #etiqueta @hoy !alta)"
            className="flex-1 text-base bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Comienza a escribir para buscar tareas, proyectos y más...
              </p>
              <div className="mt-4 text-xs space-y-1">
                <p><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">p:proyecto</code> - Filtrar por proyecto</p>
                <p><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">#etiqueta</code> - Filtrar por etiqueta</p>
                <p><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">@hoy</code> - Tareas de hoy</p>
                <p><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">!alta</code> - Prioridad alta</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron resultados para "{query}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type}>
                  <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {getCategoryTitle(type)}
                  </h3>
                  <div className="space-y-1">
                    {items.map((result) => {
                      const globalIndex = results.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                            isSelected
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className={`${isSelected ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                            {getIcon(result)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">
                              {result.icon} {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="text-xs text-gray-400">
                              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">⏎</kbd>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">⏎</kbd> Seleccionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Cerrar
            </span>
          </div>
          <div>
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
