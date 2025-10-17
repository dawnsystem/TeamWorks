import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'K'], description: 'Crear nueva tarea' },
    { keys: ['Cmd/Ctrl', '/'], description: 'Abrir/cerrar asistente de IA' },
    { keys: ['Esc'], description: 'Cerrar asistente de IA' },
    { keys: ['Cmd/Ctrl', 'Enter'], description: 'Enviar comentario (en campo de comentario)' },
  ];

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-40"
        title="Atajos de teclado"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Help modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atajos de teclado
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex}>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="mx-1 text-gray-500">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Presiona <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">?</kbd> para ver esta ayuda en cualquier momento
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
