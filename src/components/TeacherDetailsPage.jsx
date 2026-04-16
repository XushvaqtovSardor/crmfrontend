import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Coins,
    Edit3,
    Home,
    Mail,
    Minus,
    Phone,
    Plus,
    RefreshCcw,
    Trash2,
    X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = {
    fullName: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    gender: 'FEMALE',
};

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function normalizeObject(payload) {
    if (payload?.data?.data) return payload.data.data;
    if (payload?.data) return payload.data;
    return null;
}

function asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('uz-UZ');
}

function formatDateTime(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function normalizeDateInput(value) {
    if (!value) return '';
    const text = String(value);
    if (text.includes('T')) return text.split('T')[0];
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
}

function getGroupStudentCount(group) {
    if (typeof group?._count?.studentGroup === 'number') return group._count.studentGroup;
    if (Array.isArray(group?.studentGroup)) return group.studentGroup.length;
    return 0;
}

function DrawerField({ label, required = false, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function buildCoinRows(groups) {
    return groups
        .map((group) => ({
            id: group.id,
            student: '--',
            date: group.created_at,
            reason: `${group.name} guruhi`,
            amount: getGroupStudentCount(group) * 10,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function TeacherDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const teacherId = Number(id);

    const [teacher, setTeacher] = useState(null);
    const [groups, setGroups] = useState([]);
    const [groupMembers, setGroupMembers] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});

    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [coinLoading, setCoinLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('groups');
    const [coinTab, setCoinTab] = useState('given');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [form, setForm] = useState(INITIAL_FORM);
    const [error, setError] = useState('');

    const hydrateTeacherForm = useCallback((data) => {
        if (!data) {
            setForm(INITIAL_FORM);
            return;
        }

        setForm({
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            birth_date: normalizeDateInput(data.birth_date),
            password: '',
            gender: 'FEMALE',
        });
    }, []);

    const loadData = useCallback(async () => {
        if (!Number.isInteger(teacherId) || teacherId <= 0) {
            setError("Teacher ID noto'g'ri");
            setLoading(false);
            return;
        }

        setError('');
        setLoading(true);

        try {
            const [teacherRes, groupsRes] = await Promise.allSettled([
                api.get(`/teachers/${teacherId}`),
                api.get('/groups?page=1&limit=300'),
            ]);

            if (teacherRes.status === 'fulfilled') {
                const teacherData = normalizeObject(teacherRes.value.data);
                setTeacher(teacherData);
                hydrateTeacherForm(teacherData);
            } else {
                setTeacher(null);
                setError(getApiErrorMessage(teacherRes.reason, "O'qituvchi ma'lumotini yuklab bo'lmadi"));
            }

            if (groupsRes.status === 'fulfilled') {
                const allGroups = normalizeList(groupsRes.value.data);
                const ownGroups = allGroups.filter((group) => Number(group.teacherId) === teacherId);
                setGroups(ownGroups);
            } else {
                setGroups([]);
            }
        } catch (e) {
            setError(getApiErrorMessage(e, "Ma'lumotlarni yuklashda xatolik"));
            setTeacher(null);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, [teacherId, hydrateTeacherForm]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleGroup = async (group) => {
        const idValue = Number(group.id);

        setExpandedGroups((prev) => ({
            ...prev,
            [idValue]: !prev[idValue],
        }));

        if (groupMembers[idValue]) {
            return;
        }

        try {
            const res = await api.get(`/groups/${idValue}`);
            const detail = normalizeObject(res.data);
            setGroupMembers((prev) => ({
                ...prev,
                [idValue]: Array.isArray(detail?.studentGroup) ? detail.studentGroup : [],
            }));
        } catch {
            setGroupMembers((prev) => ({
                ...prev,
                [idValue]: Array.isArray(group.studentGroup) ? group.studentGroup : [],
            }));
        }
    };

    const openEditDrawer = () => {
        hydrateTeacherForm(teacher);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        hydrateTeacherForm(teacher);
    };

    const saveTeacher = async () => {
        if (!teacher) return;

        if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.birth_date) {
            setError("Telefon, email, FIO va tug'ilgan sana majburiy");
            return;
        }

        setError('');
        setSaving(true);

        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                birth_date: new Date(form.birth_date).toISOString(),
                ...(form.password.trim() ? { password: form.password.trim() } : {}),
            };

            await api.patch(`/teachers/${teacherId}`, payload);
            setDrawerOpen(false);
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, "O'qituvchini saqlashda xatolik"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!teacher) return;
        if (!window.confirm("O'qituvchini arxivga o'tkazishni xohlaysizmi?")) return;

        setDeleting(true);
        setError('');

        try {
            await api.delete(`/teachers/${teacherId}`);
            navigate('/teachers', { replace: true });
        } catch (e) {
            setError(getApiErrorMessage(e, "O'qituvchini o'chirishda xatolik"));
        } finally {
            setDeleting(false);
        }
    };

    const adjustCoin = async (operation) => {
        setCoinLoading(true);
        setError('');

        try {
            await api.post(`/teachers/${teacherId}/coin/adjust`, {
                operation,
                amount: 10,
            });
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Coinni yangilashda xatolik'));
        } finally {
            setCoinLoading(false);
        }
    };

    const coinRows = useMemo(() => buildCoinRows(groups), [groups]);

    const totalGiven = useMemo(() => coinRows.reduce((sum, row) => sum + asNumber(row.amount), 0), [coinRows]);
    const totalBalance = asNumber(teacher?.coinBalance);
    const totalSpent = Math.max(totalGiven - totalBalance, 0);

    const visibleCoinRows = useMemo(() => {
        if (coinTab === 'given') return coinRows;
        return [];
    }, [coinRows, coinTab]);

    const groupsSummary = useMemo(() => {
        if (!groups.length) return '';
        return groups.map((group) => group.name).filter(Boolean).join(', ');
    }, [groups]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-64 rounded-3xl border border-[#e6e9f2] bg-white animate-pulse" />
                <div className="h-40 rounded-3xl border border-[#e6e9f2] bg-white animate-pulse" />
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-6">
                <p className="text-red-600 font-medium">O'qituvchi topilmadi yoki o'chirib yuborilgan.</p>
                <button
                    type="button"
                    onClick={() => navigate('/teachers')}
                    className="mt-4 h-10 px-4 rounded-xl bg-violet-500 text-white text-sm font-semibold"
                >
                    Ro'yxatga qaytish
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="rounded-3xl border border-[#e6e9f2] bg-white overflow-hidden">
                <div
                    className="h-52"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1463320898484-cdee8141c787?auto=format&fit=crop&w=1800&q=80')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                <div className="px-6 pb-6 relative">
                    <div className="absolute -top-16 left-6 w-30 h-30 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                        <div className="w-22 h-22 rounded-full flex items-center justify-center text-4xl font-extrabold text-[#c88600]" style={{ background: 'linear-gradient(160deg, #ffd980, #f6b941)', border: '3px solid #f0c263' }}>
                            E
                        </div>
                    </div>

                    <div className="pt-18 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                        <div>
                            <div className="text-xs text-slate-400 inline-flex items-center gap-2">
                                <Home size={13} />
                                <ChevronRight size={13} />
                                <span>Teachers</span>
                                <ChevronRight size={13} />
                                <span className="text-slate-500">{teacher.fullName}</span>
                            </div>

                            <h1 className="mt-2 text-5xl font-semibold text-slate-900">{teacher.fullName}</h1>

                            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
                                <span className="inline-flex items-center gap-2 text-sm">
                                    <CalendarDays size={16} />
                                    {formatDate(teacher.birth_date)}
                                </span>
                                <span className="inline-flex items-center gap-2 text-sm">
                                    <Phone size={16} />
                                    {teacher.phone || '--'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={openEditDrawer}
                                className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-slate-700 text-sm font-semibold inline-flex items-center gap-2"
                            >
                                Edit
                                <Edit3 size={16} />
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="h-11 px-5 rounded-xl bg-red-500 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70"
                            >
                                Delete
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-7 flex items-center gap-4 border-b border-[#e9edf5]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('groups')}
                            className={`h-10 px-1 text-sm font-semibold border-b-2 ${activeTab === 'groups' ? 'text-violet-600 border-violet-500' : 'text-slate-500 border-transparent'}`}
                        >
                            Guruhlar
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('coin')}
                            className={`h-10 px-1 text-sm font-semibold border-b-2 ${activeTab === 'coin' ? 'text-violet-600 border-violet-500' : 'text-slate-500 border-transparent'}`}
                        >
                            Coin
                        </button>
                    </div>

                    <div className="mt-4">
                        {activeTab === 'groups' ? (
                            <div className="space-y-3">
                                {groups.length > 0 ? groups.map((group) => {
                                    const expanded = Boolean(expandedGroups[group.id]);
                                    const members = groupMembers[group.id] || group.studentGroup || [];

                                    return (
                                        <article key={group.id} className="rounded-2xl border border-[#e7ecf6] overflow-hidden">
                                            <div className="px-4 py-3 bg-white border-b border-[#edf1f8] flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="text-3xl leading-none font-medium text-slate-900">{group.name}</h3>
                                                    <span className="px-2 py-1 rounded-lg border border-[#dbe2f0] text-xs text-slate-600 bg-[#fafbff]">
                                                        {getGroupStudentCount(group)} ta o'quvchi
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/groups/${group.id}`)}
                                                        className="px-2.5 py-1 rounded-lg border border-[#dbe2f0] text-xs text-slate-600 bg-[#fafbff] hover:bg-white"
                                                    >
                                                        Guruhni ko'rish
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(group)}
                                                    className="text-slate-500 hover:text-slate-700"
                                                >
                                                    <ChevronDown className={`transition-transform ${expanded ? 'rotate-180' : ''}`} size={18} />
                                                </button>
                                            </div>

                                            {expanded && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full min-w-300">
                                                        <thead>
                                                            <tr className="border-b border-[#edf1f8] bg-[#fafbff]">
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Ism</th>
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Telefon</th>
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Email</th>
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">To'lov</th>
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Coin</th>
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Tug'ilgan sana</th>
                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Yaratilgan sana</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {members.length > 0 ? members.map((membership) => {
                                                                const student = membership.student || membership;
                                                                const fullName = student?.fullName || '--';
                                                                return (
                                                                    <tr key={`${group.id}-${membership.id || student?.id || fullName}`} className="border-b border-[#f1f4fa]">
                                                                        <td className="py-3 px-4 text-sm text-slate-800">{fullName}</td>
                                                                        <td className="py-3 px-4 text-sm text-slate-600">{student?.phone || '--'}</td>
                                                                        <td className="py-3 px-4 text-sm text-slate-600">{student?.email || '--'}</td>
                                                                        <td className="py-3 px-4 text-sm text-slate-700">0</td>
                                                                        <td className="py-3 px-4 text-sm text-slate-700">coin {asNumber(student?.coinBalance)}</td>
                                                                        <td className="py-3 px-4 text-sm text-slate-600">{formatDate(student?.birth_date)}</td>
                                                                        <td className="py-3 px-4 text-sm text-slate-600">{formatDateTime(membership?.created_at || student?.created_at)}</td>
                                                                    </tr>
                                                                );
                                                            }) : (
                                                                <tr>
                                                                    <td colSpan={7} className="py-8 text-center text-sm text-slate-400">Bu guruhda talabalar yo'q</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </article>
                                    );
                                }) : (
                                    <div className="rounded-2xl border border-[#e7ecf6] bg-[#fafbff] px-4 py-8 text-center text-slate-400">
                                        Bu o'qituvchiga hali guruh biriktirilmagan.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-[300px,1fr] gap-4">
                                <aside className="rounded-2xl border border-[#e7ecf6] p-4 bg-[#fafbff]">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-xl font-semibold text-slate-900 inline-flex items-center gap-2">
                                            <Coins size={19} className="text-amber-500" />
                                            Coinlar hajmi
                                        </h3>
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                disabled={coinLoading}
                                                onClick={() => adjustCoin('DECREMENT')}
                                                className="w-8 h-8 rounded-lg border border-[#dfe4ef] bg-white text-red-500 hover:bg-red-50 inline-flex items-center justify-center disabled:opacity-60"
                                            >
                                                <Minus size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={coinLoading}
                                                onClick={() => adjustCoin('INCREMENT')}
                                                className="w-8 h-8 rounded-lg border border-[#dfe4ef] bg-white text-emerald-600 hover:bg-emerald-50 inline-flex items-center justify-center disabled:opacity-60"
                                            >
                                                <Plus size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between py-2 border-b border-[#e7ecf6]">
                                            <span className="text-slate-500">Berilgan coin</span>
                                            <span className="font-semibold text-slate-900">{totalGiven}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-[#e7ecf6]">
                                            <span className="text-slate-500">Tushgan coin</span>
                                            <span className="font-semibold text-emerald-600">{totalBalance}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500">Sarflangan coin</span>
                                            <span className="font-semibold text-violet-600">{totalSpent}</span>
                                        </div>
                                    </div>
                                </aside>

                                <section className="rounded-2xl border border-[#e7ecf6] overflow-hidden">
                                    <div className="px-4 py-3 bg-[#fafbff] border-b border-[#e7ecf6] flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setCoinTab('given')}
                                                className={`h-8 px-1 text-sm font-semibold border-b-2 ${coinTab === 'given' ? 'text-violet-600 border-violet-500' : 'text-slate-500 border-transparent'}`}
                                            >
                                                Berilgan coin
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCoinTab('received')}
                                                className={`h-8 px-1 text-sm font-semibold border-b-2 ${coinTab === 'received' ? 'text-violet-600 border-violet-500' : 'text-slate-500 border-transparent'}`}
                                            >
                                                Tushgan coin
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCoinTab('spend')}
                                                className={`h-8 px-1 text-sm font-semibold border-b-2 ${coinTab === 'spend' ? 'text-violet-600 border-violet-500' : 'text-slate-500 border-transparent'}`}
                                            >
                                                Xaridlar tarixi
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={loadData}
                                            title="Yangilash"
                                            className="text-slate-500 hover:text-slate-700"
                                        >
                                            <RefreshCcw size={16} />
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-190">
                                            <thead>
                                                <tr className="border-b border-[#eef2f8]">
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Talaba</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Sana</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Sabab</th>
                                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Hajmi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibleCoinRows.length > 0 ? visibleCoinRows.map((item) => (
                                                    <tr key={item.id} className="border-b border-[#f1f4fa] last:border-b-0">
                                                        <td className="py-3 px-4 text-sm text-slate-700">{item.student}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{formatDate(item.date)}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-700">{item.reason}</td>
                                                        <td className="py-3 px-4 text-sm text-right font-semibold text-violet-600">{item.amount}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                                                            {coinTab === 'given' ? "Hali berilgan coinlar yo'q" : coinTab === 'received' ? "Hali tushgan coinlar yo'q" : "Hali xaridlar yo'q"}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/25" onClick={closeDrawer} />

                    <aside className="relative h-full w-full max-w-105 border-l border-slate-200 bg-white shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-3xl leading-none font-semibold text-slate-900">O'qituvchini yangilash</h2>
                                <p className="mt-2 text-sm text-slate-500">Bu yerda siz o'qituvchini yangilashingiz mumkin.</p>
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
                                    placeholder="Ism Familiya"
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

                            <DrawerField label="Parol">
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                    placeholder="Ma'lumotni kiriting"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none placeholder:text-slate-400 focus:border-violet-400"
                                />
                            </DrawerField>

                            <DrawerField label="Guruhlar">
                                <input
                                    type="text"
                                    readOnly
                                    value={groupsSummary || '--'}
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-600 bg-slate-50"
                                />
                                <button type="button" className="mt-2 text-violet-500 text-sm font-medium">
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
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={saveTeacher}
                                disabled={saving}
                                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-200 disabled:opacity-70"
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
