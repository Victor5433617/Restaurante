import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ChefHat, Coffee, Croissant } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

export default function LoginPage() {
  const [email, setEmail] = useState(() => localStorage.getItem('recordarEmail') || '');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(() => !!localStorage.getItem('recordarEmail'));
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const datosUsuario = await iniciarSesion(email, password);
      if (recordar) {
        localStorage.setItem('recordarEmail', email);
      } else {
        localStorage.removeItem('recordarEmail');
      }
      const destinos = { funcionario: '/pedido', admin: '/' };
      navigate(destinos[datosUsuario.rol] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative bg-espresso-900 overflow-hidden items-center justify-center">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute top-16 right-16 opacity-[0.07] text-cream-50 rotate-12">
          <ChefHat className="w-40 h-40" strokeWidth={1} />
        </div>
        <div className="absolute bottom-20 left-14 opacity-[0.07] text-cream-50 -rotate-12">
          <Coffee className="w-32 h-32" strokeWidth={1} />
        </div>

        <div className="relative z-10 max-w-md px-10 text-center">
          <span className="w-14 h-14 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-black/30">
            <UtensilsCrossed className="w-7 h-7" />
          </span>
          <h1 className="text-4xl font-bold text-cream-50 mt-6 leading-tight tracking-tight">
            Almuerzos Corporativos
          </h1>
          <p className="font-medium text-brand-300 mt-5">Gestión de almuerzos para empresas</p>
          <p className="text-stone-400 mt-2 leading-relaxed">
            Simplificamos la gestión de tu comedor corporativo
          </p>

          <div className="flex items-center justify-center gap-3 mt-10">
            {[Croissant, ChefHat, Coffee].map((Icono, i) => (
              <span
                key={i}
                className={`w-11 h-11 rounded-full border border-white/15 text-brand-300 flex items-center justify-center ${
                  i === 1 ? '-translate-y-2' : ''
                }`}
              >
                <Icono className="w-5 h-5" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-cream-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <span className="w-12 h-12 rounded-2xl bg-espresso-900 text-brand-300 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
            </span>
            <p className="text-xl font-bold text-espresso-900 mt-3 tracking-tight">
              Almuerzos Corporativos
            </p>
          </div>

          <form
            onSubmit={manejarSubmit}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-stone-900">Iniciar sesión</h2>
            <p className="text-sm text-stone-500 mt-1 mb-6">
              Ingresá con tu cuenta para continuar.
            </p>

            {error && (
              <Alert tipo="error" className="mb-4">
                {error}
              </Alert>
            )}
            {aviso && !error && (
              <Alert tipo="info" className="mb-4">
                {aviso}
              </Alert>
            )}

            <div className="space-y-4">
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
              />

              <Input
                id="password"
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="w-4 h-4 accent-brand-600 rounded"
              />
              <span className="text-sm text-stone-600">Recordarme</span>
            </label>

            <Button type="submit" cargando={cargando} tamanio="lg" className="w-full mt-6">
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <button
              type="button"
              onClick={() =>
                setAviso('La recuperación de contraseña estará disponible próximamente.')
              }
              className="block mx-auto mt-5 text-sm font-medium text-brand-700 hover:text-brand-800 transition"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
