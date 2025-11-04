import { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Server,
  Key,
  Palette,
  Image,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/store/useStore';
import { updateApiUrl, getAvailableApiUrls, testApiConnection } from '@/lib/api';
import { useApiStatus } from '@/hooks/useApiStatus';
import { Button, Modal, ScrollArea, Card } from '@/components/ui';

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
  const [aiProvider, setAiProvider] = useState(settings.aiProvider);
  const [primaryColor, setPrimaryColor] = useState(settings.theme.primaryColor);
  const [accentColor, setAccentColor] = useState(settings.theme.accentColor);
  const [logoUrl, setLogoUrl] = useState(settings.theme.logoUrl);
  const [testingUrls, setTestingUrls] = useState<Record<string, boolean>>({});
  const [urlStatuses, setUrlStatuses] = useState<Record<string, boolean | null>>({});

  const availableUrls = getAvailableApiUrls();

  useEffect(() => {
    setApiUrl(settings.apiUrl);
    setGeminiApiKey(settings.geminiApiKey);
    setGroqApiKey(settings.groqApiKey);
    setAiProvider(settings.aiProvider);
    setPrimaryColor(settings.theme.primaryColor);
    setAccentColor(settings.theme.accentColor);
    setLogoUrl(settings.theme.logoUrl);
  }, [settings]);

  const handleSave = () => {
    try {
      new URL(apiUrl);
    } catch (e) {
      toast.error('URL de API inválida. Debe ser una URL completa (ej: http://192.168.0.165:3000/api)');
      return;
    }

    settings.setApiUrl(apiUrl);
    settings.setGeminiApiKey(geminiApiKey);
    settings.setGroqApiKey(groqApiKey);
    settings.setAiProvider(aiProvider);
    settings.setTheme({
      primaryColor,
      accentColor,
      logoUrl,
    });

    updateApiUrl(apiUrl);
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
      setAiProvider('groq');
      setPrimaryColor('#dc2626');
      setAccentColor('#ec4899');
      setLogoUrl('');
      updateApiUrl('http://localhost:3000/api');
      applyThemeColors();
      toast.success('Configuración restablecida a valores por defecto');
    }
  };

  const applyThemeColors = () => {
    document.documentElement.style.setProperty('--accent-600', primaryColor);
    document.documentElement.style.setProperty('--accent-500', accentColor);
  };

  const testUrl = async (url: string) => {
    setTestingUrls((prev) => ({ ...prev, [url]: true }));
    const isAvailable = await testApiConnection(url);
    setUrlStatuses((prev) => ({ ...prev, [url]: isAvailable }));
    setTestingUrls((prev) => ({ ...prev, [url]: false }));

    toast[isAvailable ? 'success' : 'error'](
      isAvailable ? `✅ ${url} está disponible` : `❌ ${url} no está disponible`,
    );
  };

  const selectUrl = (url: string) => {
    setApiUrl(url);
    toast.success('URL seleccionada. Haz clic en Guardar para aplicar los cambios.');
  };

  const modalFooter = (
    <div className="w-full flex items-center justify-between gap-3">
      <Button variant="ghost" onClick={handleReset} className="gap-2">
        <RotateCcw className="w-4 h-4" />
        Restablecer
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" /> Guardar
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración"
      description="Personaliza la conexión, claves API y apariencia."
      size="xl"
      footer={modalFooter}
    >
      <ScrollArea className="max-h-[70vh] pr-2">
        <div className="space-y-8">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-300">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configuración del servidor
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestiona los endpoints disponibles y las conexiones de red.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {availableUrls.length > 1 && (
                <div className="space-y-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    URLs detectadas
                  </p>
                  {availableUrls.map((url) => {
                    const isTesting = testingUrls[url];
                    const status = urlStatuses[url];
                    const isSelected = apiUrl === url;

                    return (
                      <div
                        key={url}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-xl border p-3 transition',
                          isSelected
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-800/40'
                            : 'border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-slate-800/60',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <code className="block truncate text-sm text-gray-900 dark:text-white">{url}</code>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {url.includes('localhost')
                              ? '🏠 Localhost (desarrollo local - solo en esta PC)'
                              : url.includes('192.168.') || url.includes('10.') || url.includes('172.')
                              ? '📱 Red Local (WiFi - móvil y otros dispositivos)'
                              : '🌐 Tailscale (acceso remoto - cualquier lugar)'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {status !== undefined && status !== null && !isTesting && (
                            status ? (
                              <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => testUrl(url)}
                            disabled={isTesting}
                            className="min-w-[92px]"
                          >
                            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar'}
                          </Button>
                          {!isSelected ? (
                            <Button size="sm" onClick={() => selectUrl(url)}>
                              Usar
                            </Button>
                          ) : (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              ✓ Activa
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL de la API {availableUrls.length > 1 && '(o introduce una personalizada)'}
                </label>
                <div className="flex gap-2">
                  <input
                    id="apiUrl"
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://192.168.0.165:3000/api"
                    className="input-elevated flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={checkConnection}
                    disabled={isChecking}
                    title="Verificar conexión"
                    className="w-11 h-11 flex items-center justify-center"
                  >
                    {isChecking ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    ) : (
                      <Server className="w-5 h-5 text-gray-500" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>URL actual conectándose al servidor backend</span>
                  {isConnected !== null && (
                    <span className="flex items-center gap-1">
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span>Conectado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>Sin conexión</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 text-purple-600 dark:text-purple-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Claves API</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestiona tus claves para los proveedores de IA disponibles.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="aiProvider" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Proveedor de IA
                </label>
                <select
                  id="aiProvider"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as 'groq' | 'gemini')}
                  className="input-elevated"
                >
                  <option value="groq">Groq · Llama 3.1 Instant</option>
                  <option value="gemini">Google Gemini 1.5 Flash</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    className="input-elevated"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
                    className="input-elevated"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Para usar modelos alternativos de IA
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-100 dark:bg-rose-900/30 p-2 text-rose-600 dark:text-rose-300">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tema y marca</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ajusta los colores principales y añade un logo personalizado.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color primario
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-md border border-gray-200 dark:border-gray-700"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="input-elevated flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color de acento
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="accentColor"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-md border border-gray-200 dark:border-gray-700"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="input-elevated flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL del logo
                  </label>
                  <input
                    id="logoUrl"
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className="input-elevated"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    URL de una imagen para usar como logo (opcional)
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/60 p-4 flex items-center justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="max-h-20 w-auto object-contain"
                      onError={() => toast.error('Error al cargar la imagen')}
                    />
                  ) : (
                    <div className="text-center text-sm text-gray-400 dark:text-gray-500">
                      <Image className="mx-auto mb-2 h-8 w-8" />
                      Sin logo configurado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </Modal>
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}
