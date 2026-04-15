import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Download,
    Edit3,
    Eye,
    Loader2,
    Mail,
    Minus,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
    Upload,
    UploadCloud,
    X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = {
    fullName: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    gender: 'MALE',
    photo: '',
    position: "O'qituvchi",
    experience: 1,
};

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function formatDate(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('uz-UZ');
}

function formatDateTime(value) {
    if (!value) return { date: '--', time: '--:--' };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: '--', time: '--:--' };
    return {
        date: parsed.toLocaleDateString('uz-UZ'),
        time: parsed.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };
}

function normalizeDateInput(value) {
    if (!value) return '';
    const raw = String(value);
    if (raw.includes('T')) return raw.split('T')[0];
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
}

function initialLetter(value) {
    const text = String(value || '').trim();
    if (!text) return 'O';
    return text.charAt(0).toUpperCase();
}

function DrawerField({ label, required = false, children }) {
    return (
        <div>
            <label className="mb-2 block text-[15px] font-medium text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

export default function TeachersPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [coinLoadingId, setCoinLoadingId] = useState(0);
    const [error, setError] = useState('');

    const [tab, setTab] = useState('ACTIVE');
    const [search, setSearch] = useState('');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editId, setEditId] = useState(0);
    const [selectedGroupCount, setSelectedGroupCount] = useState(0);
    const [form, setForm] = useState(INITIAL_FORM);

    const load = useCallback(async () => {
        setError('');
        setLoading(true);
        try {
            const res = await api.get('/teachers?page=1&limit=300');
            setTeachers(normalizeList(res.data));
        } catch (e) {
            setError(getApiErrorMessage(e, "O'qituvchilarni yuklashda xatolik"));
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const resetForm = useCallback(() => {
        setEditId(0);
        setSelectedGroupCount(0);
        setForm(INITIAL_FORM);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        resetForm();
    }, [resetForm]);

    const openCreate = useCallback(() => {
        resetForm();
        setDrawerOpen(true);
    }, [resetForm]);

    const openEdit = useCallback((teacher) => {
        setEditId(Number(teacher.id));
        setSelectedGroupCount(Array.isArray(teacher.groups) ? teacher.groups.length : 0);
        setForm({
            fullName: teacher.fullName || '',
            email: teacher.email || '',
            phone: teacher.phone || '',
            birth_date: normalizeDateInput(teacher.birth_date),
            password: '',
            gender: 'MALE',
            photo: teacher.photo || '',
            position: teacher.position || "O'qituvchi",
            experience: Number(teacher.experience) || 1,
        });
        setDrawerOpen(true);
    }, []);

    useEffect(() => {
        if (searchParams.get('create') !== '1') return;
        openCreate();
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('create');
        setSearchParams(nextParams, { replace: true });
    }, [openCreate, searchParams, setSearchParams]);

    const filteredTeachers = useMemo(() => {
        const query = search.trim().toLowerCase();

        let list = teachers.filter((teacher) => {
            if (tab === 'ARCHIVE') return teacher.status === 'INACTIVE';
            return teacher.status !== 'INACTIVE';
        });

        if (!query) return list;

        return list.filter((teacher) => {
            const byName = String(teacher.fullName || '').toLowerCase().includes(query);
            const byEmail = String(teacher.email || '').toLowerCase().includes(query);
            const byPhone = String(teacher.phone || '').toLowerCase().includes(query);
            return byName || byEmail || byPhone;
        });
    }, [search, tab, teachers]);

    const saveTeacher = async () => {
        if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.birth_date) {
            setError("Telefon, email, FIO va tug'ilgan sana majburiy");
            return;
        }

        if (!editId && !form.password.trim()) {
            setError('Yangi o\'qituvchi uchun parol majburiy');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                birth_date: new Date(form.birth_date).toISOString(),
                position: form.position || "O'qituvchi",
                experience: Number(form.experience) || 1,
                ...(form.photo ? { photo: form.photo } : {}),
                ...(form.password.trim() ? { password: form.password.trim() } : {}),
            };

            if (editId) {
                await api.patch(`/teachers/${editId}`, payload);
            } else {
                await api.post('/teachers', payload);
            }

            closeDrawer();
            await load();
        } catch (e) {
            setError(getApiErrorMessage(e, "O'qituvchini saqlashda xatolik"));
        } finally {
            setSaving(false);
        }
    };

    const removeTeacher = async (teacherId) => {
        if (!window.confirm("O'qituvchini arxivga o'tkazishni xohlaysizmi?")) return;

        setError('');
        setLoading(true);
        try {
            await api.delete(`/teachers/${teacherId}`);
            await load();
        } catch (e) {
            setError(getApiErrorMessage(e, "O'qituvchini arxivga o'tkazishda xatolik"));
        } finally {
            setLoading(false);
        }
    };

    const adjustCoin = async (teacherId, operation) => {
        setCoinLoadingId(Number(teacherId));
        setError('');

        try {
            await api.post(`/teachers/${teacherId}/coin/adjust`, {
                operation,
                amount: 10,
            });
            await load();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Coinni yangilashda xatolik'));
        } finally {
            setCoinLoadingId(0);
        }
    };

    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({ ...prev, photo: String(reader.result || '') }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <h1 className="text-5xl font-semibold text-gray-900">O'qituvchilar</h1>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 text-sm font-semibold inline-flex items-center gap-2"
                    >
                        <Download size={16} /> Export
                    </button>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-violet-700 transition"
                    >
                        <Plus size={16} /> O'qituvchi qo'shish
                    </button>

                    <button
                        type="button"
                        className="h-11 px-5 rounded-xl bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-emerald-600 transition"
                    >
                        <Upload size={16} /> Exceldan yuklash
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-[#e2e8f4] bg-white p-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTab('ACTIVE')}
                            className={cn(
                                'h-9 px-4 rounded-xl text-sm font-semibold',
                                tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-500 hover:bg-gray-100',
                            )}
                        >
                            Faol o'qituvchilar
                        </button>

                        <button
                            type="button"
                            onClick={() => setTab('ARCHIVE')}
                            className={cn(
                                'h-9 px-4 rounded-xl text-sm font-semibold',
                                tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-500 hover:bg-gray-100',
                            )}
                        >
                            Arxiv
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-full lg:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Qidirish..."
                                className="w-full h-10 border border-[#dfe4ef] rounded-xl pl-9 pr-3 text-sm"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={load}
                            title="Yangilash"
                            className="w-9 h-9 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 inline-flex items-center justify-center"
                        >
                            <RefreshCcw size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">#</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Nomi</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Guruh</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Telefon</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Tug'ilgan sanasi</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Yaratilgan sana</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Kim qo'shgan</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Coin</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto text-violet-500" />
                                    </td>
                                </tr>
                            ) : filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher, index) => {
                                    const groupNames = Array.isArray(teacher.groups)
                                        ? teacher.groups.map((group) => group.name).filter(Boolean)
                                        : [];
                                    const created = formatDateTime(teacher.created_at);
                                    const coinBalance = Number(teacher.coinBalance) || 0;

                                    return (
                                        <tr key={teacher.id} className="border-b border-[#eff3fa] hover:bg-[#fcfdff] transition">
                                            <td className="py-4 px-4 text-base text-gray-500">{index + 1}</td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center font-medium text-sm">
                                                        {initialLetter(teacher.fullName)}
                                                    </div>
                                                    <p className="text-[26px] leading-none font-medium text-[#27314f]">{teacher.fullName}</p>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 text-sm text-gray-700">
                                                {groupNames.length > 0 ? (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded-full border border-[#e1e7f2] text-xs text-gray-600 bg-[#fafbff]">
                                                            {groupNames[0]}
                                                        </span>
                                                        {groupNames.length > 1 && (
                                                            <span className="text-xs text-gray-400">+{groupNames.length - 1}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-sm text-gray-700">{teacher.phone || '--'}</td>
                                            <td className="py-4 px-4 text-sm text-gray-700">{formatDate(teacher.birth_date)}</td>

                                            <td className="py-4 px-4 text-sm text-gray-700">
                                                <p>{created.date}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{created.time}</p>
                                            </td>

                                            <td className="py-4 px-4 text-sm text-gray-700">
                                                {teacher.createdByUser?.fullName || '--'}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                                        <span>🪙</span> {coinBalance}
                                                    </span>

                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => adjustCoin(teacher.id, 'DECREMENT')}
                                                            disabled={coinLoadingId === Number(teacher.id)}
                                                            className="w-7 h-7 rounded-lg border border-[#e1e7f2] text-red-500 hover:bg-red-50 inline-flex items-center justify-center disabled:opacity-60"
                                                        >
                                                            <Minus size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => adjustCoin(teacher.id, 'INCREMENT')}
                                                            disabled={coinLoadingId === Number(teacher.id)}
                                                            className="w-7 h-7 rounded-lg border border-[#e1e7f2] text-emerald-600 hover:bg-emerald-50 inline-flex items-center justify-center disabled:opacity-60"
                                                        >
                                                            <Plus size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                                                        className="w-8 h-8 rounded-lg text-gray-500 border border-[#e1e7f2] hover:bg-gray-100 inline-flex items-center justify-center"
                                                        title="Ko'rish"
                                                    >
                                                        <Eye size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeTeacher(teacher.id)}
                                                        className="w-8 h-8 rounded-lg text-red-500 border border-red-100 hover:bg-red-50 inline-flex items-center justify-center"
                                                        title="Arxivga o'tkazish"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(teacher)}
                                                        className="w-8 h-8 rounded-lg text-gray-500 border border-[#e1e7f2] hover:bg-gray-100 inline-flex items-center justify-center"
                                                        title="Tahrirlash"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-sm text-gray-400">
                                        O'qituvchilar topilmadi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/25" onClick={closeDrawer} />

                    <aside className="relative h-full w-full max-w-[420px] border-l border-slate-200 bg-white shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-[34px] leading-none font-semibold text-slate-900">
                                    {editId ? "O'qituvchi tahrirlash" : "O'qituvchi qo'shish"}
                                </h2>
                                <p className="mt-2 text-[15px] text-slate-500">
                                    Bu yerda siz yangi o'qituvchi qo'shishingiz mumkin.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            <DrawerField label="Telefon raqam" required>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                                    placeholder="+998 __ ___ __ __"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none placeholder:text-slate-400 focus:border-violet-400"
                                />
                            </DrawerField>

                            <DrawerField label="Mail" required>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                        placeholder="example@gmail.com"
                                        className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 outline-none placeholder:text-slate-400 focus:border-violet-400"
                                    />
                                </div>
                            </DrawerField>

                            <DrawerField label="O'qituvchi FIO" required>
                                <input
                                    type="text"
                                    value={form.fullName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                                    placeholder="Ism Familiya Otasining ismi"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none placeholder:text-slate-400 focus:border-violet-400"
                                />
                            </DrawerField>

                            <DrawerField label="Tug'ilgan sana" required>
                                <input
                                    type="date"
                                    value={form.birth_date}
                                    onChange={(event) => setForm((prev) => ({ ...prev, birth_date: event.target.value }))}
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-violet-400"
                                />
                            </DrawerField>

                            <DrawerField label="Parol" required>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                    placeholder="Parol kiriting"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none placeholder:text-slate-400 focus:border-violet-400"
                                />
                            </DrawerField>

                            <DrawerField label="Guruhlar">
                                <div className="text-[30px] leading-none text-slate-700">{selectedGroupCount}</div>
                                <button type="button" className="mt-1 text-violet-500 text-[22px] leading-none">
                                    + Qo'shish
                                </button>
                            </DrawerField>

                            <DrawerField label="Jinsi" required>
                                <div className="flex w-fit gap-8 rounded-2xl bg-slate-50 px-6 py-4">
                                    <label className="flex items-center gap-2 text-slate-700">
                                        <input
                                            type="radio"
                                            name="teacher-gender"
                                            checked={form.gender === 'MALE'}
                                            onChange={() => setForm((prev) => ({ ...prev, gender: 'MALE' }))}
                                            className="h-4 w-4 accent-violet-500"
                                        />
                                        Erkak
                                    </label>
                                    <label className="flex items-center gap-2 text-slate-700">
                                        <input
                                            type="radio"
                                            name="teacher-gender"
                                            checked={form.gender === 'FEMALE'}
                                            onChange={() => setForm((prev) => ({ ...prev, gender: 'FEMALE' }))}
                                            className="h-4 w-4 accent-violet-500"
                                        />
                                        Ayol
                                    </label>
                                </div>
                            </DrawerField>

                            <DrawerField label="Surati">
                                <label className="rounded-2xl border-2 border-dashed border-slate-300 px-6 py-8 text-center cursor-pointer block hover:bg-slate-50 transition">
                                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-500">
                                        <UploadCloud size={24} />
                                    </div>
                                    <p className="text-[16px] text-violet-500">Click to upload <span className="text-slate-500">yoki yuklang</span></p>
                                    <p className="mt-1 text-xs text-slate-400">JPG yoki PNG (max. 800x800px)</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>

                                {form.photo && (
                                    <div className="mt-2 h-20 rounded-xl overflow-hidden border border-slate-200">
                                        <img src={form.photo} alt="Teacher" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </DrawerField>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="rounded-xl border border-slate-300 px-6 py-2.5 text-[18px] font-medium text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={saveTeacher}
                                disabled={saving}
                                className="rounded-xl bg-violet-600 px-6 py-2.5 text-[18px] font-medium text-white shadow-lg shadow-violet-200 disabled:opacity-70"
                            >
                                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
