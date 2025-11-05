import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Server, X, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useStore';
import { updateApiUrl, getAvailableApiUrls, autoDetectApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface ApiSetupBannerProps {
  onSettingsClick: () => void;
}

export default function ApiSetupBanner({ onSettingsClick }: ApiSetupBannerProps) {
  const setApiUrl = useSettingsStore((state) => state.setApiUrl);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'failed' | 'connected'>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Check if we should show the banner
  const shouldShow = 
    !dismissed && 
    connectionStatus !== 'connected';

  const autoConnectToServer = useCallback(async () => {
    // Evitar reconexiones si ya está conectado
    if (connectionStatus === 'connected') {
      return;
    }

    setAutoDetecting(true);
    setChecking(true);
    
    try {
      const detectedUrl = await autoDetectApiUrl();
      
      if (detectedUrl) {
        // Found a working URL
        setApiUrl(detectedUrl);
        updateApiUrl(detectedUrl);
        setRetryCount(0);
        setConnectionStatus('connected');
        
        // Solo mostrar toast la primera vez que se conecta
        if (!hasConnectedOnce) {
          toast.success(`✅ Conectado a ${detectedUrl}`);
          setHasConnectedOnce(true);
        }
      } else {
        // No working URL found
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.error('Error en auto-detección:', error);
      setConnectionStatus('failed');
    } finally {
      setAutoDetecting(false);
      setChecking(false);
    }
  }, [setApiUrl, connectionStatus, hasConnectedOnce]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Auto-detect and connect on mount, solo una vez
    if (mounted && connectionStatus === 'unknown' && !hasConnectedOnce) {
      autoConnectToServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]); // Solo ejecutar cuando el componente se monte

  // Auto-retry connection every 10 seconds if failed (but not if connected)
  useEffect(() => {
    if (connectionStatus === 'failed' && retryCount < 10 && !hasConnectedOnce) {
      const timer = setTimeout(() => {
        console.log(`🔄 Reintentando conexión (intento ${retryCount + 1}/10)...`);
        setRetryCount(prev => prev + 1);
        // Llamar directamente sin usar la dependencia para evitar bucles
        autoConnectToServer();
      }, 10000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus, retryCount, hasConnectedOnce]); // Remover autoConnectToServer para evitar bucles

  const handleAutoFix = async () => {
    setRetryCount(0);
    await autoConnectToServer();
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg shadow-2xl p-4 animate-slide-down">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">
              {autoDetecting ? '🔍 Buscando servidor...' : '⚠️ No se puede conectar al servidor'}
            </h3>
            <p className="text-sm mb-3 opacity-90">
              {autoDetecting 
                ? 'Intentando conectar a todas las URLs disponibles...'
                : `No se pudo conectar al servidor. ${retryCount > 0 ? `Reintentando automáticamente (${retryCount}/10)...` : 'Verificando URLs disponibles...'}`
              }
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
              <p className="text-xs mb-2 font-semibold">URLs intentadas:</p>
              <div className="space-y-1">
                {getAvailableApiUrls().map((url) => (
                  <code key={url} className="text-xs bg-black/20 px-2 py-1 rounded block overflow-x-auto">
                    {url}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAutoFix}
                disabled={checking}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100 transition disabled:opacity-50 text-sm"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Configurar Automáticamente
                  </>
                )}
              </button>
              
              <button
                onClick={onSettingsClick}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg font-medium transition text-sm"
              >
                <Server className="w-4 h-4" />
                Configurar Manualmente
              </button>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white transition flex-shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
