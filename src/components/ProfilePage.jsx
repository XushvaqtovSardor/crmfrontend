import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { normalizeRole } from '../utils/roles.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const API_ORIGIN = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/$/, '');

function toDateInputValue(value) {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parsePhotoValue(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }

    if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            const parsedPhoto = String(parsed?.photoUrl || '').trim();
            if (parsedPhoto) {
                return parsedPhoto;
            }
        } catch {
            return raw;
        }
    }

    return raw;
}

function resolvePhotoUrl(value) {
    const raw = parsePhotoValue(value);
    if (!raw) {
        return '';
    }

    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) {
        return raw;
    }

    const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
    return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
}

function buildInitialForm(user) {
    return {
        fullName: String(user?.fullName || ''),
        phone: String(user?.phone || ''),
        birthDate: toDateInputValue(user?.birthDate),
        photo: parsePhotoValue(user?.photo),
        email: String(user?.email || ''),
        role: normalizeRole(user?.role),
        currentPassword: '',
        newPassword: '',
    };
}

function isSupportedProfileImage(file) {
    const mimeType = String(file?.type || '').toLowerCase();
    const fileName = String(file?.name || '').toLowerCase();
    const byMime = ALLOWED_IMAGE_TYPES.has(mimeType);
    const byExtension = ALLOWED_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension));

    return byMime || byExtension;
}

async function uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/erp/media/images/upload', formData, {
        headers: {
            'Content-Type': undefined,
        },
    });

    const payload = response?.data?.data || response?.data || {};
    const uploadedUrl = String(payload?.url || payload?.relativeUrl || '').trim();
    if (!uploadedUrl) {
        throw new Error('Rasm URL qaytmadi');
    }

    return uploadedUrl;
}

function Input({ label, value, onChange, type = 'text', disabled = false, placeholder, rightSlot }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`h-11 w-full rounded-xl border border-[#d8deea] bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500 ${rightSlot ? 'pr-12' : ''} ${disabled ? 'opacity-70 cursor-not-allowed bg-[#f8fafc]' : ''}`}
                />
                {rightSlot && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightSlot}
                    </div>
                )}
            </div>
        </label>
    );
}

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [form, setForm] = useState(() => buildInitialForm(user));
    const [initialForm, setInitialForm] = useState(() => buildInitialForm(user));
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const role = normalizeRole(user?.role);
    const canEditBirthDate = role === 'TEACHER' || role === 'STUDENT';

    useEffect(() => {
        const next = buildInitialForm(user);
        setForm(next);
        setInitialForm(next);
    }, [user]);

    const hasChanges = useMemo(() => {
        const profileFieldsChanged = (
            form.fullName !== initialForm.fullName
            || form.phone !== initialForm.phone
            || form.birthDate !== initialForm.birthDate
            || form.photo !== initialForm.photo
        );

        const passwordFlowTouched = Boolean(form.currentPassword.trim() || form.newPassword.trim());
        return profileFieldsChanged || passwordFlowTouched;
    }, [form, initialForm]);

    const onFieldChange = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const processProfileImage = useCallback(async (file) => {
        if (!file) {
            return;
        }

        setError('');
        setSuccess('');

        if (!isSupportedProfileImage(file)) {
            setError('Faqat JPG yoki PNG rasm yuklash mumkin');
            return;
        }

        setUploadingPhoto(true);
        try {
            const uploadedUrl = await uploadProfileImage(file);
            setForm((prev) => ({
                ...prev,
                photo: uploadedUrl,
            }));
            setSuccess('Rasm yuklandi, Saqlash tugmasini bosing');
        } catch (e) {
            setError(getApiErrorMessage(e, 'Rasmni yuklashda xatolik yuz berdi'));
        } finally {
            setUploadingPhoto(false);
        }
    }, []);

    const handlePhotoUpload = useCallback(async (event) => {
        const file = event.target.files?.[0];
        await processProfileImage(file);
        event.target.value = '';
    }, [processProfileImage]);

    const handleDropPhoto = useCallback(async (event) => {
        event.preventDefault();
        const file = event.dataTransfer?.files?.[0];
        await processProfileImage(file);
    }, [processProfileImage]);

    const saveProfile = async () => {
        setError('');
        setSuccess('');

        const payload = {};

        if (form.fullName.trim() && form.fullName !== initialForm.fullName) {
            payload.fullName = form.fullName.trim();
        }

        if (form.phone !== initialForm.phone) {
            payload.phone = form.phone.trim();
        }

        if (form.photo !== initialForm.photo) {
            payload.photo = form.photo.trim();
        }

        if (canEditBirthDate && form.birthDate && form.birthDate !== initialForm.birthDate) {
            payload.birthDate = form.birthDate;
        }

        const nextPassword = form.newPassword.trim();
        const currentPassword = form.currentPassword.trim();

        if (nextPassword || currentPassword) {
            if (!currentPassword) {
                setError('Yangi parol uchun joriy parolni kiriting');
                return;
            }

            if (!nextPassword) {
                setError('Yangi parolni kiriting');
                return;
            }

            if (nextPassword.length < 6) {
                setError('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
                return;
            }

            payload.password = nextPassword;
        }

        if (Object.keys(payload).length === 0) {
            setSuccess('Saqlash uchun o\'zgarish topilmadi');
            return;
        }

        setSaving(true);
        try {
            const response = await api.patch('/auth/me', payload);
            const nextUser = response?.data?.data?.user || response?.data?.user || null;
            if (nextUser) {
                updateProfile(nextUser);
            }

            const nextForm = {
                ...buildInitialForm(nextUser || user),
                currentPassword: '',
                newPassword: '',
            };

            setInitialForm(nextForm);
            setForm(nextForm);
            setSuccess('Profil ma\'lumotlari muvaffaqiyatli yangilandi');
        } catch (e) {
            setError(getApiErrorMessage(e, 'Profilni saqlashda xatolik yuz berdi'));
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            ...initialForm,
            currentPassword: '',
            newPassword: '',
        });
        setError('');
        setSuccess('');
    };

    const avatarUrl = resolvePhotoUrl(form.photo);

    return (
        <div className="space-y-4">
            <h1 className="text-5xl font-semibold text-slate-900">Profil</h1>

            <section className="max-w-5xl rounded-2xl border border-[#e2e8f4] bg-white p-6">
                <h2 className="text-3xl font-semibold text-slate-900">Profil sozlamalari</h2>

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
                    <Input
                        label="Ism va Familiya"
                        value={form.fullName}
                        onChange={onFieldChange('fullName')}
                        placeholder="To'liq ismingiz"
                    />

                    <Input
                        label="Telefon raqam"
                        value={form.phone}
                        onChange={onFieldChange('phone')}
                        placeholder="998901234567"
                    />

                    <div className="md:col-span-2">
                        <Input
                            label={`Tug'ilgan kuni ${form.birthDate || ''}`}
                            type="date"
                            value={form.birthDate}
                            onChange={onFieldChange('birthDate')}
                            disabled={!canEditBirthDate}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start">
                            <div className="h-16 w-16 overflow-hidden rounded-full border border-[#dbe2ee] bg-[#f3f6fb] shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={form.fullName || 'Profile'} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="inline-flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                                        {form.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>

                            <label
                                className="flex-1 rounded-2xl border border-dashed border-[#cfd8e6] bg-[#fafbfd] px-5 py-6 text-center cursor-pointer"
                                onDrop={handleDropPhoto}
                                onDragOver={(event) => event.preventDefault()}
                            >
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={uploadingPhoto || saving}
                                />

                                <span className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce3ef] bg-white text-slate-500">
                                    <UploadCloud size={17} />
                                </span>
                                <p className="text-sm font-medium text-violet-600">Click to upload</p>
                                <p className="mt-1 text-xs text-slate-500">PNG, JPG (max. 800x400px)</p>

                                {uploadingPhoto && (
                                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                                        <Loader2 size={13} className="animate-spin" />
                                        Rasm yuklanmoqda...
                                    </p>
                                )}
                            </label>
                        </div>
                    </div>

                    <Input
                        label="Mail"
                        value={form.email}
                        onChange={() => { }}
                        disabled
                    />

                    <Input
                        label="Role"
                        value={form.role || 'USER'}
                        onChange={() => { }}
                        disabled
                    />

                    <Input
                        label="Joriy Parol"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={form.currentPassword}
                        onChange={onFieldChange('currentPassword')}
                        placeholder="Joriy parol"
                        rightSlot={(
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Parolni ko'rsatish"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        )}
                    />

                    <Input
                        label="Yangi Parol"
                        type={showNewPassword ? 'text' : 'password'}
                        value={form.newPassword}
                        onChange={onFieldChange('newPassword')}
                        placeholder="Yangi parol kiriting"
                        rightSlot={(
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Parolni ko'rsatish"
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        )}
                    />
                </div>

                <div className="mt-7 flex items-center justify-end gap-2 border-t border-[#edf1f7] pt-5">
                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving || uploadingPhoto}
                        className="h-11 rounded-xl border border-[#d6ddea] bg-white px-5 text-sm font-semibold text-slate-600 disabled:opacity-60"
                    >
                        Bekor qilish
                    </button>

                    <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving || uploadingPhoto || !hasChanges}
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
