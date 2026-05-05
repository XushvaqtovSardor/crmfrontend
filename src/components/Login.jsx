import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { getDefaultRouteByRole, normalizeRole } from '../utils/roles.js';

const CONTACT_EMAIL = 'EMAIL';
const CONTACT_PHONE = 'PHONE';
const loginImageModules = import.meta.glob('../assets/login*.{png,jpg,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
});
const loginImages = Object.keys(loginImageModules)
    .sort()
    .map((key) => loginImageModules[key]);
const logoLabels = [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'NestJS',
    'Angular',
    'Python',
    'Node.js',
    'Express',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'Git',
    'Vite',
    'DevOps',
    'Figma',
    'C#',
    '.NET',
    'Go',
];
const logoTicker = [...logoLabels, ...logoLabels];

export default function Login({ initialMode = 'login' }) {
    const normalizeMode = (value) => (value === 'register' ? 'register' : 'login');
    const [mode, setMode] = useState(normalizeMode(initialMode));

    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [heroImageIndex, setHeroImageIndex] = useState(0);

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const [registerContactMethod, setRegisterContactMethod] = useState(CONTACT_EMAIL);
    const [registerFullName, setRegisterFullName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPhone, setRegisterPhone] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerBirthDate, setRegisterBirthDate] = useState('');

    const [registerStep, setRegisterStep] = useState('form');
    const [verificationId, setVerificationId] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpChannel, setOtpChannel] = useState('');
    const [otpDestination, setOtpDestination] = useState('');
    const [otpExpiresIn, setOtpExpiresIn] = useState(null);
    const [otpExpiresAt, setOtpExpiresAt] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMode(normalizeMode(initialMode));
        setError('');
        setInfo('');
        setLoading(false);
    }, [initialMode]);

    useEffect(() => {
        if (registerStep !== 'otp' || !otpExpiresAt) {
            return;
        }

        const updateRemaining = () => {
            const remainingSeconds = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
            setOtpExpiresIn(remainingSeconds);
            return remainingSeconds;
        };

        if (updateRemaining() <= 0) {
            return;
        }

        const intervalId = window.setInterval(() => {
            const remaining = updateRemaining();
            if (remaining <= 0) {
                window.clearInterval(intervalId);
            }
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [registerStep, otpExpiresAt]);

    useEffect(() => {
        if (loginImages.length <= 1) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setHeroImageIndex((prev) => (prev + 1) % loginImages.length);
        }, 3500);

        return () => window.clearInterval(intervalId);
    }, []);

    const clearRegisterOtpState = () => {
        setRegisterStep('form');
        setVerificationId('');
        setOtpCode('');
        setOtpChannel('');
        setOtpDestination('');
        setOtpExpiresIn(null);
        setOtpExpiresAt(null);
    };

    const switchMode = (nextMode) => {
        const normalized = normalizeMode(nextMode);
        setMode(normalized);
        setError('');
        setInfo('');
        setLoading(false);
        setShowLoginPassword(false);
        setShowRegisterPassword(false);

        if (normalized === 'login') {
            clearRegisterOtpState();
            navigate('/login', { replace: true });
            return;
        }

        clearRegisterOtpState();
        navigate('/register', { replace: true });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', {
                email: identifier.trim(),
                password,
            });

            const authData = res.data?.data;
            if (!authData?.accessToken || !authData?.user) {
                setError("Serverdan noto'g'ri login javobi keldi");
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

    const buildRegisterPayload = () => {
        const fullName = registerFullName.trim();
        if (!fullName) {
            throw new Error('Ism-familiya kiritilishi shart');
        }

        const payload = {
            fullName,
            email: undefined,
            phone: undefined,
            password: registerPassword,
            birthDate: registerBirthDate,
            role: 'STUDENT',
        };

        if (!registerBirthDate) {
            throw new Error("Tug'ilgan sana majburiy");
        }

        if (registerContactMethod === CONTACT_EMAIL) {
            const email = registerEmail.trim();
            if (!email) {
                throw new Error('Email kiritilishi shart');
            }
            payload.email = email;
        } else {
            const phone = registerPhone.trim();
            if (!phone) {
                throw new Error('Telefon raqam kiritilishi shart');
            }
            payload.phone = phone;
        }

        if (!registerPassword || registerPassword.length < 6) {
            throw new Error('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
        }

        return payload;
    };

    const requestOtp = async () => {
        const payload = buildRegisterPayload();

        const res = await api.post('/auth/register', payload);
        const data = res.data?.data || res.data;

        if (!data?.verificationId) {
            throw new Error("Serverdan noto'g'ri OTP javobi keldi");
        }

        setVerificationId(data.verificationId);
        setOtpCode('');
        setOtpChannel(data.channel || registerContactMethod);
        setOtpDestination(data.destination || '');
        const expiresInSeconds = Number(data.expiresIn);
        const normalizedExpiresIn = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
            ? Math.floor(expiresInSeconds)
            : null;
        setOtpExpiresIn(normalizedExpiresIn);
        setOtpExpiresAt(normalizedExpiresIn ? Date.now() + normalizedExpiresIn * 1000 : null);
        setRegisterStep('otp');

        if (data?.debugOtp) {
            setInfo(`Debug OTP: ${data.debugOtp}`);
            return;
        }

        setInfo('Tasdiqlash kodi yuborildi. Kodni kiriting.');
    };

    const handleRegisterRequest = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        try {
            await requestOtp();
        } catch (err) {
            if (err?.response) {
                setError(getApiErrorMessage(err, 'OTP yuborishda xatolik yuz berdi'));
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('OTP yuborishda xatolik yuz berdi');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');

        const otp = otpCode.trim();
        if (!/^\d{6}$/.test(otp)) {
            setError('OTP 6 xonali raqam bo‘lishi kerak');
            return;
        }

        if (!verificationId) {
            setError('Verification id topilmadi. Qayta OTP so‘rang');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/register/verify', {
                verificationId,
                otp,
            });
            const data = res.data?.data || res.data;

            const selectedIdentifier = registerContactMethod === CONTACT_EMAIL
                ? registerEmail.trim()
                : registerPhone.trim();

            if (selectedIdentifier) {
                setIdentifier(selectedIdentifier);
            }

            clearRegisterOtpState();
            setInfo(data?.message || "Ro'yxatdan o'tish yakunlandi. Endi login qiling.");
            setMode('login');
            navigate('/login', { replace: true });
        } catch (err) {
            setError(getApiErrorMessage(err, 'OTP tekshirishda xatolik yuz berdi'));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpResend = async () => {
        setError('');
        setInfo('');
        setLoading(true);

        try {
            await requestOtp();
            setInfo('Yangi OTP yuborildi');
        } catch (err) {
            if (err?.response) {
                setError(getApiErrorMessage(err, 'OTP qayta yuborishda xatolik yuz berdi'));
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('OTP qayta yuborishda xatolik yuz berdi');
            }
        } finally {
            setLoading(false);
        }
    };

    const isRegisterMode = mode === 'register';

    return (
        <div
            className="h-screen overflow-hidden fancy-enter"
            style={{
                background:
                    'radial-gradient(circle at 18% 18%, rgba(36, 122, 88, 0.28), transparent 35%), radial-gradient(circle at 82% 78%, rgba(255, 214, 120, 0.2), transparent 35%), linear-gradient(145deg, #0b1714 0%, #123126 48%, #edf4ef 100%)',
            }}
        >
            <div className="h-full grid lg:grid-cols-[1fr_1fr]">
                <aside className="hidden lg:flex px-8 py-8 text-white relative overflow-hidden flex-col items-center gap-10">
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(135deg, rgba(15, 88, 65, 0.9) 0%, rgba(8, 45, 35, 0.95) 50%, rgba(5, 30, 25, 0.9) 100%)',
                    }} />

                    {/* Decorative elements */}
                    <div className="absolute top-10 right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/3 left-1/4 w-24 h-24 border border-emerald-400/20 rounded-full blur-xl" />

                    <div className="relative z-10 text-center">
                        <p className="text-emerald-200 text-xs tracking-[0.3em] font-bold">EDUERP</p>
                        <p className="mt-3 text-sm text-white/85 leading-relaxed">
                            Bu platforma student va teacherni bir biriga boglab beradi.
                        </p>
                    </div>

                    {/* CRM Image */}
                    <div className="relative z-10 w-full h-80 flex items-center justify-center">
                        {loginImages.length > 0 ? (
                            <img
                                key={heroImageIndex}
                                src={loginImages[heroImageIndex]}
                                alt="Login visual"
                                className="w-full h-full object-contain drop-shadow-2xl transition-opacity duration-700"
                                style={{
                                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
                                }}
                            />
                        ) : null}
                    </div>

                    <div className="relative z-10 w-full logo-marquee">
                        <div className="logo-track">
                            {logoTicker.map((label, index) => (
                                <span key={`${label}-${index}`} className="logo-item">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

                <section className="flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
                    {/* Background decorative elements for right side */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div
                        className="w-full max-w-md max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-3xl border bg-white/98 p-5 sm:p-6 shadow-2xl backdrop-blur-sm relative z-10"
                        style={{ borderColor: '#d7e4dc' }}
                    >
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-full" />
                                <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-700">AUTH CENTER</p>
                            </div>
                            <h2 className="mt-2 text-3xl font-black text-gray-900">
                                {isRegisterMode ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}
                            </h2>
                            <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                                {isRegisterMode
                                    ? "Faqat Student. Email yoki telefon orqali ro'yxatdan o'tish."
                                    : 'Email yoki telefon orqali tizimga kiring.'}
                            </p>
                        </div>

                        <div className="mb-5 grid grid-cols-2 rounded-xl p-1.5 bg-gradient-to-r from-emerald-50 to-blue-50 border" style={{ borderColor: '#cfe0d6' }}>
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${!isRegisterMode ? 'text-white shadow-lg scale-[1.02]' : 'text-emerald-700'}`}
                                style={{ background: !isRegisterMode ? 'linear-gradient(135deg, #1f8a4d, #145c35)' : 'transparent' }}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('register')}
                                className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${isRegisterMode ? 'text-white shadow-lg scale-[1.02]' : 'text-emerald-700'}`}
                                style={{ background: isRegisterMode ? 'linear-gradient(135deg, #1f8a4d, #145c35)' : 'transparent' }}
                            >
                                Register
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="mb-4 p-3 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 text-sm text-emerald-700">
                                {info}
                            </div>
                        )}

                        {!isRegisterMode && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email yoki telefon
                                    </label>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="example@mail.com yoki +998901234567"
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Parol
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showLoginPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Parol"
                                            className="w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                            style={{ borderColor: '#c9d9ce' }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                        >
                                            {showLoginPassword ? "Yashir" : "Ko'rsat"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #1f8a4d, #145c35)' }}
                                >
                                    {loading ? 'Kirilyapti...' : 'Kirish'}
                                </button>
                            </form>
                        )}

                        {isRegisterMode && registerStep === 'form' && (
                            <form onSubmit={handleRegisterRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ism-familiya
                                    </label>
                                    <input
                                        type="text"
                                        value={registerFullName}
                                        onChange={(e) => setRegisterFullName(e.target.value)}
                                        placeholder="F.I.Sh"
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Aloqa turi
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRegisterContactMethod(CONTACT_EMAIL)}
                                            className={`rounded-xl py-3 text-sm font-bold border transition ${registerContactMethod === CONTACT_EMAIL
                                                ? 'text-white border-transparent shadow-lg'
                                                : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                                                }`}
                                            style={{
                                                background:
                                                    registerContactMethod === CONTACT_EMAIL
                                                        ? 'linear-gradient(135deg, #1f8a4d, #145c35)'
                                                        : undefined,
                                            }}
                                        >
                                            Email
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setRegisterContactMethod(CONTACT_PHONE)}
                                            className={`rounded-xl py-3 text-sm font-bold border transition ${registerContactMethod === CONTACT_PHONE
                                                ? 'text-white border-transparent shadow-lg'
                                                : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                                                }`}
                                            style={{
                                                background:
                                                    registerContactMethod === CONTACT_PHONE
                                                        ? 'linear-gradient(135deg, #1f8a4d, #145c35)'
                                                        : undefined,
                                            }}
                                        >
                                            Telefon
                                        </button>
                                    </div>
                                </div>

                                {registerContactMethod === CONTACT_EMAIL ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            placeholder="example@mail.com"
                                            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                            style={{ borderColor: '#c9d9ce' }}
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Telefon
                                        </label>
                                        <input
                                            type="text"
                                            value={registerPhone}
                                            onChange={(e) => setRegisterPhone(e.target.value)}
                                            placeholder="+998901234567"
                                            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                            style={{ borderColor: '#c9d9ce' }}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tug'ilgan sana
                                    </label>
                                    <input
                                        type="date"
                                        value={registerBirthDate}
                                        onChange={(e) => setRegisterBirthDate(e.target.value)}
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Parol
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showRegisterPassword ? 'text' : 'password'}
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            placeholder="Kamida 6 ta belgi"
                                            className="w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                            style={{ borderColor: '#c9d9ce' }}
                                            minLength={6}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegisterPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                        >
                                            {showRegisterPassword ? "Yashir" : "Ko'rsat"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #1f8a4d, #145c35)' }}
                                >
                                    {loading ? 'Yuborilmoqda...' : 'OTP yuborish'}
                                </button>
                            </form>
                        )}

                        {isRegisterMode && registerStep === 'otp' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="p-3 rounded-xl border bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300 text-sm text-emerald-800">
                                    <p className="font-bold">Tasdiqlash kodi yuborildi</p>
                                    <p className="mt-2">
                                        Kanal: {otpChannel || registerContactMethod}
                                        {otpDestination ? ` ${otpDestination}` : ''}
                                    </p>
                                    {otpExpiresIn !== null ? <p className="mt-2">Amal qilish muddati: <span className="font-bold text-red-600">{otpExpiresIn} soniya</span></p> : null}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        OTP kod
                                    </label>
                                    <input
                                        type="text"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full border rounded-xl px-4 py-3 text-sm tracking-[0.3em] text-center font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white/80 hover:bg-white"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #1f8a4d, #145c35)' }}
                                >
                                    {loading ? 'Tekshirilmoqda...' : 'OTP tasdiqlash'}
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError('');
                                            setInfo('');
                                            setRegisterStep('form');
                                        }}
                                        className="py-3 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                                        disabled={loading}
                                    >
                                        Orqaga
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleOtpResend}
                                        className="py-3 rounded-xl text-sm font-bold border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                                        disabled={loading}
                                    >
                                        Qayta yuborish
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs">
                            <div className="text-emerald-700 font-bold">OTP Protected</div>
                            <div className="text-gray-400 text-[10px]">EDUERP v1.0</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
