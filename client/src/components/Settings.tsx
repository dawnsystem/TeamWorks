import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Server, Key, Palette, Image, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/store/useStore';
import { updateApiUrl } from '@/lib/api';
import { useApiStatus } from '@/hooks/useApiStatus';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const settings = useSettingsStore();
  const { isConnected, isChecking, checkConnection } = useApiStatus();
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [groqApiKey, setGroqApiKey] = useState(settings.groqApiKey);
  const [primaryColor, setPrimaryColor] = useState(settings.theme.primaryColor);
  const [accentColor, setAccentColor] = useState(settings.theme.accentColor);
  const [logoUrl, setLogoUrl] = useState(settings.theme.logoUrl);

  useEffect(() => {
    // Reset form when settings change externally
    setApiUrl(settings.apiUrl);
    setGeminiApiKey(settings.geminiApiKey);
    setGroqApiKey(settings.groqApiKey);
    setPrimaryColor(settings.theme.primaryColor);
    setAccentColor(settings.theme.accentColor);
    setLogoUrl(settings.theme.logoUrl);
  }, [settings]);

  const handleSave = () => {
    // Validate API URL
    try {
      new URL(apiUrl);
    } catch (e) {
      toast.error('URL de API inválida. Debe ser una URL completa (ej: http://192.168.0.165:3000/api)');
      return;
    }

    // Save all settings
    settings.setApiUrl(apiUrl);
    settings.setGeminiApiKey(geminiApiKey);
    settings.setGroqApiKey(groqApiKey);
    settings.setTheme({
      primaryColor,
      accentColor,
      logoUrl,
    });

    // Update axios instance
    updateApiUrl(apiUrl);

    // Apply theme colors
    applyThemeColors();

    toast.success('Configuración guardada. Recarga la página para aplicar todos los cambios.');
    onClose();
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto?')) {
      settings.resetToDefaults();
      setApiUrl('http://localhost:3000/api');
      setGeminiApiKey('');
      setGroqApiKey('');
      setPrimaryColor('#dc2626');
      setAccentColor('#ec4899');
      setLogoUrl('');
      updateApiUrl('http://localhost:3000/api');
      toast.success('Configuración restablecida a valores por defecto');
    }
  };

  const applyThemeColors = () => {
    // Update CSS variables for theme colors
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-accent', accentColor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Server Configuration */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuración del Servidor</h3>
            </div>
            <div className="space-y-4 ml-7">
              <div>
                <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL de la API
                </label>
                <div className="flex gap-2">
                  <input
                    id="apiUrl"
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://192.168.0.165:3000/api"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    onClick={checkConnection}
                    disabled={isChecking}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    title="Verificar conexión"
                  >
                    {isChecking ? (
                      <Loader2 className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" />
                    ) : (
                      <Server className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ej: http://192.168.0.165:3000/api (para acceso en red local)
                  </p>
                  {isConnected !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">Conectado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400">Sin conexión</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* API Keys */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Claves API</h3>
            </div>
            <div className="space-y-4 ml-7">
              <div>
                <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google Gemini API Key
                </label>
                <input
                  id="geminiApiKey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Obtén tu API key gratuita en{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div>
                <label htmlFor="groqApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Groq API Key (Opcional)
                </label>
                <input
                  id="groqApiKey"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Para usar modelos alternativos de IA
                </p>
              </div>
            </div>
          </section>

          {/* Theme Configuration */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personalización de Tema</h3>
            </div>
            <div className="space-y-4 ml-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Primario
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color de Acento
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="accentColor"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Logo Configuration */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logo Personalizado</h3>
            </div>
            <div className="space-y-4 ml-7">
              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL del Logo
                </label>
                <input
                  id="logoUrl"
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL de una imagen para usar como logo (opcional)
                </p>
              </div>
              {logoUrl && (
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Vista previa:</p>
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="max-w-xs max-h-20 object-contain border border-gray-300 dark:border-gray-600 rounded"
                    onError={() => toast.error('Error al cargar la imagen')}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
