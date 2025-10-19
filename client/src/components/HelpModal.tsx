import { X, BookOpen, CheckCircle, Circle, Info } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manual de Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Getting Started */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Comenzando</h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>Bienvenido a TeamWorks, tu aplicación de gestión de tareas con IA integrada.</p>
              <p>Para empezar a usar TeamWorks:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Configura la URL del servidor si accedes desde otro dispositivo</li>
                <li>Opcionalmente, añade tu API key de Google Gemini para usar el asistente de IA</li>
                <li>Crea tu primer proyecto o usa el proyecto "Inbox" predeterminado</li>
                <li>Añade tareas usando el botón "Nueva Tarea" o el atajo Cmd/Ctrl+K</li>
              </ol>
            </div>
          </section>

          {/* Configuration */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuración para Acceso en Red Local</h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Acceso desde otro dispositivo</p>
                    <p className="text-sm">Si quieres acceder a TeamWorks desde otro dispositivo en tu red local (móvil, tablet, otro ordenador):</p>
                  </div>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Asegúrate de que el servidor está ejecutándose (el servidor escucha en 0.0.0.0 por defecto)</li>
                <li>Obtén la IP local del servidor (ej: 192.168.0.165)</li>
                <li>En el dispositivo desde el que quieres acceder, abre TeamWorks</li>
                <li>Click en el icono de Configuración (⚙️) en la barra superior</li>
                <li>En "URL de la API", introduce: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">http://[IP-DEL-SERVIDOR]:3000/api</code></li>
                <li>Ejemplo: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">http://192.168.0.165:3000/api</code></li>
                <li>Guarda la configuración y recarga la página</li>
              </ol>
            </div>
          </section>

          {/* Basic Features */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Funciones Principales</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Gestión de Tareas</h4>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Crear tareas con título, descripción, fecha de vencimiento y prioridad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Organizar tareas en proyectos y secciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Añadir etiquetas de colores para categorizar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Crear subtareas ilimitadas para dividir el trabajo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Arrastrar y soltar para reordenar tareas (desde cualquier parte de la tarjeta)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Comentarios y Recordatorios</h4>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Añadir comentarios a las tareas para colaborar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span>Configurar recordatorios con presets o fecha personalizada</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Asistente de IA ✨ (Mejorado)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Usa comandos en lenguaje natural para gestionar tareas de forma eficiente</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span><strong>Crear tareas avanzadas:</strong> "añadir reunión con cliente en proyecto Trabajo sección Reuniones con etiqueta urgente para el próximo lunes"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span><strong>Bulk actions:</strong> "crear 3 tareas: comprar pan, sacar basura y lavar ropa todas para hoy"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span><strong>Actualizar tareas:</strong> "cambiar prioridad de comprar leche a alta"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span><strong>Completar:</strong> "marcar como completada la tarea de escribir informe"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span><strong>Consultas:</strong> "qué tengo pendiente esta semana" o "mostrar tareas de hoy"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span><strong>Fechas inteligentes:</strong> Soporta "hoy", "mañana", "próximo lunes", "en 3 días", "en 2 semanas"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                    <span>Requiere API key de Groq (gratuita) - configúrala en Ajustes ⚙️</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎉 Nueva función: Gestión Inteligente de Subtareas</h5>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Cuando completes la última subtarea de una tarea, se mostrará un popup preguntándote si quieres:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-purple-800 dark:text-purple-200 ml-4">
                  <li>• Completar también la tarea padre</li>
                  <li>• Añadir un comentario de progreso</li>
                  <li>• Crear una nueva subtarea (si olvidaste algo)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔍 Búsqueda Avanzada (Nuevo)</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Command Palette - Búsqueda Universal</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Pulsa <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 rounded text-sm font-mono">Cmd/Ctrl + P</kbd> para abrir 
                el buscador universal estilo VSCode. Busca tareas, proyectos, etiquetas y ejecuta acciones rápidas.
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Filtros Inteligentes:</span>
                  <ul className="ml-4 mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">p:Trabajo</code> - Buscar en proyecto "Trabajo"</li>
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">#urgente</code> - Buscar con etiqueta "urgente"</li>
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">@hoy</code> - Tareas de hoy</li>
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">!alta</code> - Prioridad alta</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Acciones Rápidas:</span>
                  <p className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                    Escribe "nueva", "ia", "tema", "hoy" para ejecutar acciones sin tocar el ratón
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Atajos de Teclado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Búsqueda / Command Palette</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                  Cmd/Ctrl + P
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Nueva tarea</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                  Cmd/Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Asistente IA</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                  Cmd/Ctrl + /
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Cerrar modal</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Enviar comentario</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                  Cmd/Ctrl + Enter
                </kbd>
              </div>
            </div>
          </section>

          {/* Label Management */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🏷️ Gestión de Etiquetas (Mejorado)</h3>
            <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Panel de Gestión de Etiquetas</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Ahora puedes gestionar todas tus etiquetas desde un panel centralizado. Accede desde el sidebar → "Gestionar etiquetas"
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Crear, editar y eliminar etiquetas con facilidad</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Selector de color mejorado con 8 colores predefinidos</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Buscar y filtrar etiquetas</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Ver cuántas tareas tiene cada etiqueta</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tooltips mejorados en tarjetas de tareas - pasa el ratón para ver todas las etiquetas</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Tips & Tricks */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Consejos y Trucos</h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Circle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                <p>Haz click derecho en tareas, proyectos y etiquetas para ver más opciones</p>
              </div>
              <div className="flex gap-2">
                <Circle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                <p>Arrastra tareas desde cualquier parte de la tarjeta para reordenarlas</p>
              </div>
              <div className="flex gap-2">
                <Circle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                <p>Usa las prioridades P1-P4 para organizar tus tareas por urgencia</p>
              </div>
              <div className="flex gap-2">
                <Circle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                <p>Crea subtareas infinitas para dividir proyectos grandes en pasos manejables</p>
              </div>
              <div className="flex gap-2">
                <Circle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                <p>Personaliza los colores del tema desde Configuración para adaptar la app a tu marca</p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Solución de Problemas</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">No puedo conectarme desde otro dispositivo</h4>
                <ul className="space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>• Verifica que el servidor esté ejecutándose</li>
                  <li>• Asegúrate de que ambos dispositivos estén en la misma red</li>
                  <li>• Comprueba que has configurado la URL correcta en Configuración</li>
                  <li>• El formato debe ser: http://[IP]:3000/api (no https)</li>
                  <li>• Verifica que el firewall no esté bloqueando el puerto 3000</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">No puedo crear nuevos usuarios</h4>
                <ul className="space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>• Verifica que la URL de la API esté configurada correctamente</li>
                  <li>• Comprueba que el servidor esté ejecutándose</li>
                  <li>• Revisa la consola del navegador para ver errores específicos</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">El asistente de IA no funciona</h4>
                <ul className="space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>• Asegúrate de haber configurado tu API key de Gemini en Configuración</li>
                  <li>• Verifica que la API key sea válida y tenga cuota disponible</li>
                  <li>• Comprueba tu conexión a internet</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            TeamWorks v1.0 • Desarrollado con ❤️ • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
