import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const STORAGE_KEY = 'erp_system_settings_v1';
const DEFAULT_FORM = {
    title: 'EduCoin',
    brandName: 'EduCoin',
    description: 'EduCoin',
    maxCoinPlus: '200',
    maxCoinMinus: '201',
};

const DEFAULT_COIN_POLICY_FORM = {
    standard: {
        coin60To89: '5',
        coin90To100: '7',
    },
    bootcamp: {
        coin60To89: '5',
        coin90To100: '7',
    },
};

function normalizeCoinPolicyForm(payload) {
    return {
        standard: {
            coin60To89: String(payload?.standard?.coin60To89 ?? DEFAULT_COIN_POLICY_FORM.standard.coin60To89),
            coin90To100: String(payload?.standard?.coin90To100 ?? DEFAULT_COIN_POLICY_FORM.standard.coin90To100),
        },
        bootcamp: {
            coin60To89: String(payload?.bootcamp?.coin60To89 ?? DEFAULT_COIN_POLICY_FORM.bootcamp.coin60To89),
            coin90To100: String(payload?.bootcamp?.coin90To100 ?? DEFAULT_COIN_POLICY_FORM.bootcamp.coin90To100),
        },
    };
}

function toCoinPolicyPayload(form) {
    return {
        standard: {
            coin60To89: Number(form.standard.coin60To89),
            coin90To100: Number(form.standard.coin90To100),
        },
        bootcamp: {
            coin60To89: Number(form.bootcamp.coin60To89),
            coin90To100: Number(form.bootcamp.coin90To100),
        },
    };
}

function loadSavedSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return DEFAULT_FORM;
        }

        const parsed = JSON.parse(raw);
        return {
            title: String(parsed?.title || DEFAULT_FORM.title),
            brandName: String(parsed?.brandName || DEFAULT_FORM.brandName),
            description: String(parsed?.description || DEFAULT_FORM.description),
            maxCoinPlus: String(parsed?.maxCoinPlus || DEFAULT_FORM.maxCoinPlus),
            maxCoinMinus: String(parsed?.maxCoinMinus || DEFAULT_FORM.maxCoinMinus),
        };
    } catch {
        return DEFAULT_FORM;
    }
}

function Field({ label, value, onChange, required = false, textarea = false }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </span>

            {textarea ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    rows={5}
                    className="w-full rounded-xl border border-[#d8deea] bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
            ) : (
                <input
                    value={value}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-[#d8deea] bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                />
            )}
        </label>
    );
}

export default function SystemSettingsPage() {
    const [form, setForm] = useState(() => loadSavedSettings());
    const [savedForm, setSavedForm] = useState(() => loadSavedSettings());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [coinPolicyForm, setCoinPolicyForm] = useState(DEFAULT_COIN_POLICY_FORM);
    const [savedCoinPolicyForm, setSavedCoinPolicyForm] = useState(DEFAULT_COIN_POLICY_FORM);
    const [coinPolicyLoading, setCoinPolicyLoading] = useState(true);
    const [coinPolicySaving, setCoinPolicySaving] = useState(false);
    const [coinPolicyError, setCoinPolicyError] = useState('');
    const [coinPolicySuccess, setCoinPolicySuccess] = useState('');
    const [coinPolicyReadOnly, setCoinPolicyReadOnly] = useState(false);

    const hasChanges = useMemo(
        () => Object.keys(form).some((key) => form[key] !== savedForm[key]),
        [form, savedForm],
    );

    const hasCoinPolicyChanges = useMemo(() => {
        return JSON.stringify(coinPolicyForm) !== JSON.stringify(savedCoinPolicyForm);
    }, [coinPolicyForm, savedCoinPolicyForm]);

    useEffect(() => {
        let active = true;

        const loadCoinPolicy = async () => {
            setCoinPolicyLoading(true);
            setCoinPolicyError('');

            try {
                const response = await api.get('/erp/superadmin/homework-coin-policies');
                const payload = response?.data?.data || response?.data || {};
                const next = normalizeCoinPolicyForm(payload);

                if (!active) return;

                setCoinPolicyForm(next);
                setSavedCoinPolicyForm(next);
                setCoinPolicyReadOnly(false);
            } catch (e) {
                if (!active) return;

                const status = e?.response?.status;
                if (status === 403) {
                    setCoinPolicyReadOnly(true);
                    setCoinPolicyError('Bu bo\'limni faqat SUPERADMIN o\'zgartira oladi');
                } else {
                    setCoinPolicyError(getApiErrorMessage(e, 'Coin siyosatini yuklab bo\'lmadi'));
                }

                const fallback = normalizeCoinPolicyForm(DEFAULT_COIN_POLICY_FORM);
                setCoinPolicyForm(fallback);
                setSavedCoinPolicyForm(fallback);
            } finally {
                if (active) {
                    setCoinPolicyLoading(false);
                }
            }
        };

        loadCoinPolicy();

        return () => {
            active = false;
        };
    }, []);

    const onFieldChange = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const onCoinPolicyFieldChange = (track, field) => (event) => {
        const value = event.target.value;
        setCoinPolicyForm((prev) => ({
            ...prev,
            [track]: {
                ...prev[track],
                [field]: value,
            },
        }));
    };

    const resetForm = () => {
        setForm(savedForm);
        setError('');
        setSuccess('');
    };

    const resetCoinPolicyForm = () => {
        setCoinPolicyForm(savedCoinPolicyForm);
        setCoinPolicyError('');
        setCoinPolicySuccess('');
    };

    const saveSettings = async () => {
        setError('');
        setSuccess('');

        if (!form.title.trim() || !form.brandName.trim()) {
            setError('Title va Brand Name maydonlarini to\'ldiring');
            return;
        }

        setSaving(true);
        try {
            const next = {
                title: form.title.trim(),
                brandName: form.brandName.trim(),
                description: form.description.trim(),
                maxCoinPlus: form.maxCoinPlus.trim(),
                maxCoinMinus: form.maxCoinMinus.trim(),
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            setSavedForm(next);
            setForm(next);
            setSuccess('Sozlamalar saqlandi');
        } catch {
            setError('Sozlamalarni saqlashda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const saveCoinPolicy = async () => {
        setCoinPolicyError('');
        setCoinPolicySuccess('');

        const payload = toCoinPolicyPayload(coinPolicyForm);

        const values = [
            payload.standard.coin60To89,
            payload.standard.coin90To100,
            payload.bootcamp.coin60To89,
            payload.bootcamp.coin90To100,
        ];

        if (values.some((value) => !Number.isInteger(value) || value < 0)) {
            setCoinPolicyError('Coin qiymatlari manfiy bo\'lmagan butun son bo\'lishi kerak');
            return;
        }

        if (payload.standard.coin90To100 < payload.standard.coin60To89) {
            setCoinPolicyError('Standard: 90-100 coin qiymati 60-89 dan kichik bo\'lmasligi kerak');
            return;
        }

        if (payload.bootcamp.coin90To100 < payload.bootcamp.coin60To89) {
            setCoinPolicyError('Bootcamp: 90-100 coin qiymati 60-89 dan kichik bo\'lmasligi kerak');
            return;
        }

        setCoinPolicySaving(true);
        try {
            const response = await api.patch('/erp/superadmin/homework-coin-policies', payload);
            const next = normalizeCoinPolicyForm(response?.data?.data || response?.data || payload);
            setCoinPolicyForm(next);
            setSavedCoinPolicyForm(next);
            setCoinPolicySuccess('Homework coin siyosati saqlandi');
        } catch (e) {
            setCoinPolicyError(getApiErrorMessage(e, 'Coin siyosatini saqlashda xatolik'));
        } finally {
            setCoinPolicySaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-5xl font-semibold text-slate-900">Sozlamalar</h1>
                <p className="mt-1 text-slate-500">Tizim sozlamalarini boshqaring va yangilang.</p>
            </div>

            <section className="max-w-4xl rounded-2xl border border-[#e2e8f4] bg-white p-6">
                <h2 className="text-4xl font-semibold text-slate-900">Tizim sozlamalari</h2>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Title" value={form.title} onChange={onFieldChange('title')} required />
                    <Field label="Brand Name" value={form.brandName} onChange={onFieldChange('brandName')} required />

                    <div className="md:col-span-2">
                        <Field label="Description" value={form.description} onChange={onFieldChange('description')} textarea />
                        <p className="mt-2 text-xs text-slate-500">Tizim haqida qisqacha ta'rif bering</p>
                    </div>

                    <Field label="Maksimum + coin" value={form.maxCoinPlus} onChange={onFieldChange('maxCoinPlus')} />
                    <Field label="Maksimum - coin" value={form.maxCoinMinus} onChange={onFieldChange('maxCoinMinus')} />
                </div>

                <div className="mt-7 flex items-center justify-end gap-2 border-t border-[#edf1f7] pt-5">
                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving}
                        className="h-11 rounded-xl border border-[#d6ddea] bg-white px-5 text-sm font-semibold text-slate-600 disabled:opacity-60"
                    >
                        Bekor qilish
                    </button>

                    <button
                        type="button"
                        onClick={saveSettings}
                        disabled={saving || !hasChanges}
                        className="h-11 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white disabled:opacity-60 inline-flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                        Saqlash
                    </button>
                </div>
            </section>

            <section className="max-w-4xl rounded-2xl border border-[#e2e8f4] bg-white p-6">
                <h2 className="text-2xl font-semibold text-slate-900">Homework Coin Siyosati</h2>
                <p className="mt-1 text-sm text-slate-500">
                    O\'qituvchi homeworkni baholaganda, superadmin belgilagan oraliq bo\'yicha coin beriladi.
                </p>

                {coinPolicyError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {coinPolicyError}
                    </div>
                )}

                {coinPolicySuccess && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {coinPolicySuccess}
                    </div>
                )}

                {coinPolicyLoading ? (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#e2e8f4] bg-[#f8fafc] px-3 py-2 text-sm text-slate-600">
                        <Loader2 size={15} className="animate-spin" />
                        Coin siyosati yuklanmoqda...
                    </div>
                ) : (
                    <>
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-[#e5eaf4] bg-[#fafcff] p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-900">Standard guruhlar</p>

                                <Field
                                    label="60-89 ball uchun coin"
                                    value={coinPolicyForm.standard.coin60To89}
                                    onChange={onCoinPolicyFieldChange('standard', 'coin60To89')}
                                />
                                <Field
                                    label="90-100 ball uchun coin"
                                    value={coinPolicyForm.standard.coin90To100}
                                    onChange={onCoinPolicyFieldChange('standard', 'coin90To100')}
                                />
                            </div>

                            <div className="rounded-xl border border-[#e5eaf4] bg-[#fafcff] p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-900">Bootcamp guruhlar</p>

                                <Field
                                    label="60-89 ball uchun coin"
                                    value={coinPolicyForm.bootcamp.coin60To89}
                                    onChange={onCoinPolicyFieldChange('bootcamp', 'coin60To89')}
                                />
                                <Field
                                    label="90-100 ball uchun coin"
                                    value={coinPolicyForm.bootcamp.coin90To100}
                                    onChange={onCoinPolicyFieldChange('bootcamp', 'coin90To100')}
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#edf1f7] pt-5">
                            <button
                                type="button"
                                onClick={resetCoinPolicyForm}
                                disabled={coinPolicySaving || coinPolicyLoading}
                                className="h-11 rounded-xl border border-[#d6ddea] bg-white px-5 text-sm font-semibold text-slate-600 disabled:opacity-60"
                            >
                                Bekor qilish
                            </button>

                            <button
                                type="button"
                                onClick={saveCoinPolicy}
                                disabled={coinPolicySaving || coinPolicyLoading || coinPolicyReadOnly || !hasCoinPolicyChanges}
                                className="h-11 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white disabled:opacity-60 inline-flex items-center gap-2"
                            >
                                {coinPolicySaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                Saqlash
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
