import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { getDefaultRouteByRole, normalizeRole } from '../utils/roles.js';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const authData = res.data?.data;

      if (!authData?.accessToken || !authData?.user) {
        setError('Serverdan noto\'g\'ri login javobi keldi');
        return;
      }

      const normalizedRole = normalizeRole(authData.user.role);
      if (!normalizedRole) {
        setError('Foydalanuvchi roli aniqlanmadi');
        return;
      }

      login({
        ...authData,
        user: {
          ...authData.user,
          role: normalizedRole,
        },
      });
      navigate(getDefaultRouteByRole(normalizedRole), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Xatolik yuz berdi. Qayta urinib ko'ring."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen fancy-enter" style={{ background: 'linear-gradient(120deg, #0d1810 0%, #14271a 40%, #eef5ef 100%)' }}>
      <header className="h-16 border-b flex items-center justify-between px-6 lg:px-12" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(8,16,10,0.7)' }}>
        <div className="text-2xl font-extrabold tracking-tight text-white">Edu<span style={{ color: '#4fd784' }}>ERP</span></div>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-white/80">
          <span>Kurslar</span>
          <span>Yo'nalishlar</span>
          <span>Live</span>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #1f8a4d, #2fa25f)' }}>
          Join Now
        </button>
      </header>

      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        <div className="hidden lg:flex relative overflow-hidden items-end p-12">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 15%, rgba(79, 215, 132, 0.22), transparent 35%), radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.55), transparent 40%)' }} />
          <div className="relative max-w-xl text-white">
            <p className="text-emerald-300 font-semibold mb-4 tracking-wide">Master the Full Stack</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-5">
              Your Path to Senior Developer and Beyond
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              O'quv jarayonini bir joydan boshqaring: guruhlar, darslar, vazifalar va progress real vaqt ko'rinishida.
            </p>
            <div className="mt-8 flex gap-3">
              <button className="px-5 py-3 rounded-xl text-sm font-bold text-black bg-white hover:opacity-90 transition">Browse Courses</button>
              <button className="px-5 py-3 rounded-xl text-sm font-bold text-white border border-white/40 hover:bg-white/10 transition">View Learning Paths</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md bg-white/95 rounded-3xl border p-8 shadow-2xl" style={{ borderColor: '#d4e1d7' }}>
            <div className="mb-7">
              <p className="text-sm font-semibold text-emerald-700 mb-2">Sign in to your account</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Tizimga kirish</h2>
              <p className="text-sm text-gray-500 mt-2">Platformaga xavfsiz kirish uchun email va parolni kiriting.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email manzilingiz"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: '#c9d9ce' }}
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parol</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parolni kiriting"
                    className="w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 transition"
                    style={{ borderColor: '#c9d9ce' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1f8a4d, #16633a)' }}
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Kirish
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck size={14} /> Secure Login
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Sparkles size={14} /> Modern UI
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}