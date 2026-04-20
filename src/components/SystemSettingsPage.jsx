import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

const STORAGE_KEY = 'erp_system_settings_v1';
const DEFAULT_FORM = {
    title: 'EduCoin',
    brandName: 'EduCoin',
    description: 'EduCoin',
    maxCoinPlus: '200',
    maxCoinMinus: '201',
};

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

    const hasChanges = useMemo(
        () => Object.keys(form).some((key) => form[key] !== savedForm[key]),
        [form, savedForm],
    );

    const onFieldChange = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const resetForm = () => {
        setForm(savedForm);
        setError('');
        setSuccess('');
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
        </div>
    );
}
