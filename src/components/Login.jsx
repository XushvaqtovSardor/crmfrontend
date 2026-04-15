import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { getDefaultRouteByRole, normalizeRole } from '../utils/roles.js';

export default function Login({ initialMode = 'login' }) {
  const normalizeMode = (value) => (value === 'register' ? 'register' : 'login');
  const [mode, setMode] = useState(normalizeMode(initialMode));
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [registerRole, setRegisterRole] = useState('STUDENT');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerBirthDate, setRegisterBirthDate] = useState('');
  const [registerPosition, setRegisterPosition] = useState('');
  const [registerExperience, setRegisterExperience] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMode(normalizeMode(initialMode));
    setError('');
  }, [initialMode]);

  const switchMode = (nextMode) => {
    const normalized = normalizeMode(nextMode);
    setMode(normalized);
    setError('');
    navigate(normalized === 'register' ? '/register' : '/login', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: identifier.trim(),
        password,
      });
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const fullName = registerFullName.trim();
    const email = registerEmail.trim();
    const phone = registerPhone.trim();

    if (!fullName) {
      setError('Ism-familiya kiritilishi shart');
      return;
    }

    if (!email && !phone) {
      setError('Email yoki telefon raqam kiritilishi shart');
      return;
    }

    if (registerRole === 'STUDENT' && !registerBirthDate) {
      setError('Student uchun tug‘ilgan sana majburiy');
      return;
    }

    if (registerRole === 'TEACHER' && registerExperience !== '') {
      const expNumber = Number(registerExperience);
      if (!Number.isFinite(expNumber) || expNumber < 0) {
        setError('Teacher tajribasi 0 yoki undan katta son bo‘lishi kerak');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        role: registerRole,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        password: registerPassword,
        birthDate: registerBirthDate || undefined,
        photo: undefined,
        position: registerPosition.trim() || undefined,
        experience: registerRole === 'TEACHER' && registerExperience !== ''
          ? Number(registerExperience)
          : undefined,
      };

      const res = await api.post('/auth/register', payload);
      const authData = res.data?.data;

      if (!authData?.accessToken || !authData?.user) {
        setError('Serverdan noto‘g‘ri register javobi keldi');
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
      setError(getApiErrorMessage(err, "Xatolik yuz berdi. Qayta urinib ko‘ring."));
    } finally {
      setLoading(false);
    }
  };

  const isRegisterMode = mode === 'register';

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
              <p className="text-sm font-semibold text-emerald-700 mb-2">EduERP Authentication</p>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {isRegisterMode ? 'Ro‘yxatdan o‘tish' : 'Tizimga kirish'}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {isRegisterMode
                  ? 'Yangi account oching: rolni tanlang va ma’lumotlarni kiriting.'
                  : 'Platformaga kirish uchun email yoki telefon va parolni kiriting.'}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl p-1 bg-emerald-50 border" style={{ borderColor: '#c9d9ce' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 rounded-lg text-sm font-bold transition ${!isRegisterMode ? 'text-white' : 'text-emerald-700'}`}
                style={{ background: !isRegisterMode ? 'linear-gradient(135deg, #1f8a4d, #16633a)' : 'transparent' }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2 rounded-lg text-sm font-bold transition ${isRegisterMode ? 'text-white' : 'text-emerald-700'}`}
                style={{ background: isRegisterMode ? 'linear-gradient(135deg, #1f8a4d, #16633a)' : 'transparent' }}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {!isRegisterMode ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email yoki telefon</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="example@mail.com yoki +998901234567"
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
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                    style={{ borderColor: '#c9d9ce' }}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ism-familiya</label>
                  <input
                    type="text"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    placeholder="F.I.Sh"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                    style={{ borderColor: '#c9d9ce' }}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email (ixtiyoriy)</label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                      style={{ borderColor: '#c9d9ce' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon (ixtiyoriy)</label>
                    <input
                      type="text"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="+998901234567"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                      style={{ borderColor: '#c9d9ce' }}
                    />
                  </div>
                </div>

                {(registerRole === 'STUDENT' || registerRole === 'TEACHER') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tug‘ilgan sana {registerRole === 'STUDENT' ? '(majburiy)' : '(ixtiyoriy)'}
                    </label>
                    <input
                      type="date"
                      value={registerBirthDate}
                      onChange={(e) => setRegisterBirthDate(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                      style={{ borderColor: '#c9d9ce' }}
                      required={registerRole === 'STUDENT'}
                    />
                  </div>
                )}

                {(registerRole === 'ADMIN' || registerRole === 'TEACHER') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position (ixtiyoriy)</label>
                    <input
                      type="text"
                      value={registerPosition}
                      onChange={(e) => setRegisterPosition(e.target.value)}
                      placeholder={registerRole === 'ADMIN' ? 'Administrator' : 'Frontend Mentor'}
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                      style={{ borderColor: '#c9d9ce' }}
                    />
                  </div>
                )}

                {registerRole === 'TEACHER' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tajriba (yil)</label>
                    <input
                      type="number"
                      min="0"
                      value={registerExperience}
                      onChange={(e) => setRegisterExperience(e.target.value)}
                      placeholder="0"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                      style={{ borderColor: '#c9d9ce' }}
                    />
                  </div>
                )}

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parol</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Kamida 6 ta belgidan iborat"
                      className="w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 transition"
                      style={{ borderColor: '#c9d9ce' }}
                      minLength={6}
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
                  Register
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

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