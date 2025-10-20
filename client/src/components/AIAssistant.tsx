import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAIStore } from '@/store/useStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { aiAPI } from '@/lib/api';
import type { AIAction } from '@/types';

export default function AIAssistant() {
  const queryClient = useQueryClient();
  const { isOpen, autoExecute, toggleAI, setAutoExecute } = useAIStore();
  const isMobile = useIsMobile();
  const [command, setCommand] = useState('');
  const [actions, setActions] = useState<AIAction[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const processMutation = useMutation({
    mutationFn: (cmd: string) => aiAPI.process(cmd, autoExecute),
    onSuccess: (response) => {
      setActions(response.data.actions);
      if (response.data.results) {
        setResults(response.data.results);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        toast.success('Comandos ejecutados con éxito');
      }
      setCommand('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al procesar comando');
    },
  });

  const executeMutation = useMutation({
    mutationFn: (actionsToExecute: AIAction[]) => aiAPI.execute(actionsToExecute),
    onSuccess: (response) => {
      setResults(response.data.results);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Acciones ejecutadas');
      setActions([]);
    },
    onError: () => {
      toast.error('Error al ejecutar acciones');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    processMutation.mutate(command);
  };

  const handleExecute = () => {
    if (actions.length > 0) {
      executeMutation.mutate(actions);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleAI}
        />
      )}
      
      {/* AI Assistant Panel */}
      <div className={`
        fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50
        ${isMobile 
          ? 'inset-x-4 bottom-20 top-20' 
          : 'bottom-6 right-6 w-96'
        }
      `}>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Asistente IA</h3>
          </div>
          <button
            onClick={toggleAI}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className={`p-4 overflow-y-auto ${isMobile ? 'max-h-full' : 'max-h-96'}`}>
        {/* Modo auto-ejecutar */}
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="autoExecute"
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="autoExecute" className="text-sm text-gray-700 dark:text-gray-300">
            Ejecutar automáticamente
          </label>
        </div>

        {/* Ejemplos */}
        {actions.length === 0 && results.length === 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Ejemplos:</p>
            <div className="space-y-1">
              {[
                'añadir comprar leche para mañana prioridad alta',
                'completar la tarea de hacer ejercicio',
                'qué tengo pendiente esta semana',
                'eliminar tareas completadas',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setCommand(example)}
                  className="block w-full text-left text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Acciones sugeridas */}
        {actions.length > 0 && !autoExecute && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Acciones sugeridas:
            </p>
            {actions.map((action, i) => (
              <div
                key={i}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {action.confidence >= 0.8 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {action.explanation}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Confianza: {Math.round(action.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executeMutation.isPending ? 'Ejecutando...' : 'Ejecutar acciones'}
            </button>
          </div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resultados:
            </p>
            {results.map((result, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  result.success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {result.action.explanation}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {result.success ? '✓ Completado' : `✗ Error: ${result.error}`}
                </p>
              </div>
            ))}
            <button
              onClick={() => {
                setResults([]);
                setActions([]);
              }}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Escribe un comando..."
            disabled={processMutation.isPending}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={processMutation.isPending || !command.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}

