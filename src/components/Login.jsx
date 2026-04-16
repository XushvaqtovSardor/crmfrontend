import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { getDefaultRouteByRole, normalizeRole } from '../utils/roles.js';

const CONTACT_EMAIL = 'EMAIL';
const CONTACT_PHONE = 'PHONE';

export default function Login({ initialMode = 'login' }) {
    const normalizeMode = (value) => (value === 'register' ? 'register' : 'login');
    const [mode, setMode] = useState(normalizeMode(initialMode));

    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

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
                <aside className="hidden lg:flex px-10 py-10 text-white relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,20,15,0.75), rgba(8,20,15,0.3))' }} />
                    <div className="relative self-end max-w-md">
                        <p className="text-emerald-300 text-xs tracking-[0.2em] font-semibold">EDUERP</p>
                        <h1 className="mt-3 text-4xl font-black leading-tight">Xavfsiz kirish va ro‘yxatdan o‘tish</h1>
                        <p className="mt-3 text-sm text-white/80">Register faqat Student uchun, email yoki telefon orqali OTP bilan.</p>
                    </div>
                </aside>

                <section className="flex items-center justify-center p-3 sm:p-4 lg:p-6">
                    <div
                        className="w-full max-w-md max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-3xl border bg-white/95 p-5 sm:p-6 shadow-2xl"
                        style={{ borderColor: '#d7e4dc' }}
                    >
                        <div className="mb-4">
                            <p className="text-[11px] font-bold tracking-[0.18em] text-emerald-700">AUTH CENTER</p>
                            <h2 className="mt-1.5 text-2xl font-black text-gray-900">
                                {isRegisterMode ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1.5">
                                {isRegisterMode
                                    ? 'Faqat Student register qilinadi. OTP tasdiqlash majburiy.'
                                    : 'Email/telefon va parol bilan kiring.'}
                            </p>
                        </div>

                        <div className="mb-3 grid grid-cols-2 rounded-xl p-1 bg-emerald-50 border" style={{ borderColor: '#cfe0d6' }}>
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className={`py-2 rounded-lg text-sm font-bold transition ${!isRegisterMode ? 'text-white' : 'text-emerald-700'}`}
                                style={{ background: !isRegisterMode ? 'linear-gradient(135deg, #1f8a4d, #145c35)' : 'transparent' }}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('register')}
                                className={`py-2 rounded-lg text-sm font-bold transition ${isRegisterMode ? 'text-white' : 'text-emerald-700'}`}
                                style={{ background: isRegisterMode ? 'linear-gradient(135deg, #1f8a4d, #145c35)' : 'transparent' }}
                            >
                                Register
                            </button>
                        </div>

                        {error && (
                            <div className="mb-3 p-2.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="mb-3 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
                                {info}
                            </div>
                        )}

                        {!isRegisterMode && (
                            <form onSubmit={handleLogin} className="space-y-3.5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email yoki telefon</label>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="example@mail.com yoki +998901234567"
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
                                    <div className="relative">
                                        <input
                                            type={showLoginPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Parol"
                                            className="w-full border rounded-xl px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2"
                                            style={{ borderColor: '#c9d9ce' }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        >
                                            {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #1f8a4d, #145c35)' }}
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    Kirish
                                    {!loading && <ArrowRight size={16} />}
                                </button>
                            </form>
                        )}

                        {isRegisterMode && registerStep === 'form' && (
                            <form onSubmit={handleRegisterRequest} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ism-familiya</label>
                                    <input
                                        type="text"
                                        value={registerFullName}
                                        onChange={(e) => setRegisterFullName(e.target.value)}
                                        placeholder="F.I.Sh"
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1.5">Aloqa turi</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRegisterContactMethod(CONTACT_EMAIL)}
                                            className={`rounded-xl py-2 text-sm font-bold border transition ${registerContactMethod === CONTACT_EMAIL
                                                ? 'text-white border-transparent'
                                                : 'text-emerald-700 border-emerald-200 bg-emerald-50'
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
                                            className={`rounded-xl py-2 text-sm font-bold border transition ${registerContactMethod === CONTACT_PHONE
                                                ? 'text-white border-transparent'
                                                : 'text-emerald-700 border-emerald-200 bg-emerald-50'
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            placeholder="example@mail.com"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                                            style={{ borderColor: '#c9d9ce' }}
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon</label>
                                        <input
                                            type="text"
                                            value={registerPhone}
                                            onChange={(e) => setRegisterPhone(e.target.value)}
                                            placeholder="+998901234567"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                                            style={{ borderColor: '#c9d9ce' }}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tug‘ilgan sana</label>
                                    <input
                                        type="date"
                                        value={registerBirthDate}
                                        onChange={(e) => setRegisterBirthDate(e.target.value)}
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
                                    <div className="relative">
                                        <input
                                            type={showRegisterPassword ? 'text' : 'password'}
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            placeholder="Kamida 6 ta belgi"
                                            className="w-full border rounded-xl px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2"
                                            style={{ borderColor: '#c9d9ce' }}
                                            minLength={6}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegisterPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        >
                                            {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #1f8a4d, #145c35)' }}
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    OTP yuborish
                                    {!loading && <ArrowRight size={16} />}
                                </button>
                            </form>
                        )}

                        {isRegisterMode && registerStep === 'otp' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                                <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 text-sm text-emerald-800">
                                    <p className="font-semibold">Tasdiqlash kodi yuborildi</p>
                                    <p className="mt-1">
                                        Kanal: {otpChannel || registerContactMethod}
                                        {otpDestination ? ` • ${otpDestination}` : ''}
                                    </p>
                                    {otpExpiresIn !== null ? <p className="mt-1">Amal qilish muddati: {otpExpiresIn} soniya</p> : null}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">OTP kod</label>
                                    <input
                                        type="text"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm tracking-[0.3em] text-center focus:outline-none focus:ring-2"
                                        style={{ borderColor: '#c9d9ce' }}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #1f8a4d, #145c35)' }}
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    OTP tasdiqlash
                                    {!loading && <ArrowRight size={16} />}
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError('');
                                            setInfo('');
                                            setRegisterStep('form');
                                        }}
                                        className="py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        disabled={loading}
                                    >
                                        Orqaga
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleOtpResend}
                                        className="py-2 rounded-xl text-sm font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                        disabled={loading}
                                    >
                                        Qayta yuborish
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                <ShieldCheck size={14} /> OTP Protected
                            </div>
                            <div className="text-gray-500">Bitta sahifa</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
