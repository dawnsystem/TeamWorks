import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import Settings from '@/components/Settings';
import ApiSetupBanner from '@/components/ApiSetupBanner';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      setAuth(response.data.user, response.data.accessToken, response.data.refreshToken);
      toast.success('¡Bienvenido de nuevo!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('No se puede conectar al servidor. Verifica la configuración de red y la URL del API en Configuración.');
      } else if (error.response?.status === 401) {
        toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.response?.status === 400) {
        // Manejar errores de validación
        if (error.response?.data?.details) {
          const validationErrors = error.response.data.details.map((err: any) => err.message).join(', ');
          toast.error(`Error de validación: ${validationErrors}`);
        } else if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Error de validación. Verifica los datos ingresados.');
        }
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600 p-4">
      {/* API Setup Banner */}
      <ApiSetupBanner onSettingsClick={() => setSettingsOpen(true)} />
      
      {/* Settings Button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition z-10"
        title="Configuración"
      >
        <SettingsIcon className="w-5 h-5 text-gray-700" />
      </button>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TeamWorks</h1>
          <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-red-600 hover:text-red-700 font-medium">
            Regístrate
          </Link>
        </p>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            💡 Si accedes desde otro dispositivo, primero configura la URL del servidor clickeando en el botón ⚙️ arriba a la derecha
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

