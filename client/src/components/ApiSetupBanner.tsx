import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Server, X, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useStore';
import { updateApiUrl } from '@/lib/api';
import { isRemoteAccess, suggestApiUrl, isApiUrlLikelyCorrect } from '@/utils/apiUrlDetection';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ApiSetupBannerProps {
  onSettingsClick: () => void;
}

export default function ApiSetupBanner({ onSettingsClick }: ApiSetupBannerProps) {
  const settings = useSettingsStore();
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const suggestedUrl = suggestApiUrl();
  
  // Check if we should show the banner
  const shouldShow = 
    !dismissed && 
    isRemoteAccess() && 
    !isApiUrlLikelyCorrect(settings.apiUrl);

  useEffect(() => {
    // Auto-check connection status on mount
    if (shouldShow) {
      checkConnection(settings.apiUrl);
    }
  }, [shouldShow, settings.apiUrl]);

  const checkConnection = async (url: string) => {
    setChecking(true);
    try {
      const baseUrl = url.replace(/\/api\/?$/, '');
      // Try health endpoint first
      const healthUrl = `${baseUrl}/health`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      
      if (response.status === 200) {
        // Also try to get server info for additional validation
        try {
          const serverInfoUrl = `${url}/server-info`;
          await axios.get(serverInfoUrl, { timeout: 3000 });
        } catch (e) {
          // Server info endpoint is optional, health check is enough
        }
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      setConnectionStatus('failed');
    } finally {
      setChecking(false);
    }
  };

  const handleAutoFix = async () => {
    setChecking(true);
    
    // First, check if the suggested URL works
    try {
      const baseUrl = suggestedUrl.replace(/\/api\/?$/, '');
      const healthUrl = `${baseUrl}/health`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      
      if (response.status === 200) {
        // Verify server info endpoint as well
        try {
          const serverInfoUrl = `${suggestedUrl}/server-info`;
          const serverInfo = await axios.get(serverInfoUrl, { timeout: 3000 });
          console.log('Server info:', serverInfo.data);
        } catch (e) {
          // Server info is optional, health check is enough
          console.log('Server info endpoint not available, but health check passed');
        }
        
        // It works! Update the settings
        settings.setApiUrl(suggestedUrl);
        updateApiUrl(suggestedUrl);
        setConnectionStatus('connected');
        toast.success('✅ Configuración actualizada correctamente');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('No se pudo conectar a la URL sugerida');
        setConnectionStatus('failed');
      }
    } catch (error: any) {
      console.error('Auto-fix error:', error);
      const errorMessage = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
        ? 'No se pudo conectar al servidor. Asegúrate de que el servidor esté ejecutándose.'
        : 'No se pudo conectar a la URL sugerida. Configura manualmente en Ajustes.';
      toast.error(errorMessage);
      setConnectionStatus('failed');
    } finally {
      setChecking(false);
    }
  };

  if (!shouldShow || connectionStatus === 'connected') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg shadow-2xl p-4 animate-slide-down">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">
              ⚠️ Configuración de Red Requerida
            </h3>
            <p className="text-sm mb-3 opacity-90">
              Estás accediendo desde <strong>{window.location.hostname}</strong> pero la API está configurada 
              para <strong>{new URL(settings.apiUrl).hostname}</strong>. Necesitas actualizar la configuración para que funcione.
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
              <p className="text-xs mb-2 font-semibold">URL Sugerida:</p>
              <code className="text-sm bg-black/20 px-2 py-1 rounded block overflow-x-auto">
                {suggestedUrl}
              </code>
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
