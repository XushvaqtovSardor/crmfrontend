import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    Coins,
    Edit3,
    GraduationCap,
    Layers3,
    Mail,
    RefreshCcw,
    Trash2,
    Users,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const WEEKDAY_LABELS = {
    MONDAY: 'Du',
    TUESDAY: 'Se',
    WEDNESDAY: 'Cho',
    THURSDAY: 'Pa',
    FRIDAY: 'Ju',
    SATURDAY: 'Sha',
    SUNDAY: 'Ya',
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

function getGroupStudentCount(group) {
    if (typeof group?._count?.studentGroup === 'number') return group._count.studentGroup;
    if (Array.isArray(group?.studentGroup)) return group.studentGroup.length;
    return 0;
}

function dayBadges(days = []) {
    if (!Array.isArray(days) || !days.length) return '--';
    return days.map((day) => WEEKDAY_LABELS[day] || day).join(', ');
}

export default function TeacherDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const teacherId = Number(id);

    const [teacher, setTeacher] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('groups');

    const loadData = async () => {
        if (!Number.isInteger(teacherId) || teacherId <= 0) {
            setError("Teacher ID noto'g'ri.");
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
                setTeacher(normalizeObject(teacherRes.value.data));
            } else {
                setTeacher(null);
                setError(getApiErrorMessage(teacherRes.reason, "O'qituvchi ma'lumotini yuklab bo'lmadi"));
            }

            if (groupsRes.status === 'fulfilled') {
                const allGroups = normalizeList(groupsRes.value.data);
                const teacherGroups = allGroups.filter((group) => Number(group.teacherId) === teacherId);
                setGroups(teacherGroups);
            } else {
                setGroups([]);
            }
        } catch (e) {
            setError(getApiErrorMessage(e, "Ma'lumotlarni yuklashda xatolik"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [teacherId]);

    const handleDelete = async () => {
        if (!teacher) return;
        if (!window.confirm("O'qituvchini o'chirishni xohlaysizmi?")) return;

        setDeleting(true);
        try {
            await api.delete(`/teachers/${teacherId}`);
            navigate('/teachers', { replace: true });
        } catch (e) {
            setError(getApiErrorMessage(e, "O'qituvchini o'chirishda xatolik"));
        } finally {
            setDeleting(false);
        }
    };

    const totalStudents = useMemo(
        () => groups.reduce((sum, group) => sum + getGroupStudentCount(group), 0),
        [groups],
    );

    const coinStats = useMemo(() => {
        const given = totalStudents * 10;
        const spent = Math.round(given * 0.2);
        const balance = Math.max(given - spent, 0);
        return {
            given,
            spent,
            balance,
        };
    }, [totalStudents]);

    const coinHistory = useMemo(() => {
        return groups
            .map((group) => ({
                id: group.id,
                date: group.created_at,
                reason: `${group.name} guruhi`,
                amount: getGroupStudentCount(group) * 10,
            }))
            .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    }, [groups]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-56 rounded-3xl bg-white border border-[#e6e9f2] animate-pulse" />
                <div className="h-44 rounded-3xl bg-white border border-[#e6e9f2] animate-pulse" />
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="bg-white rounded-2xl border border-red-200 px-6 py-6">
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
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => navigate('/teachers')}
                    className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    O'qituvchilar
                </button>
                <button
                    type="button"
                    onClick={loadData}
                    className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 text-sm font-semibold flex items-center gap-2"
                >
                    <RefreshCcw size={16} />
                    Yangilash
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="bg-white rounded-3xl border border-[#e6e9f2] overflow-hidden">
                <div
                    className="h-52"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(126, 86, 216, 0.35), transparent 45%), radial-gradient(circle at 80% 25%, rgba(16, 185, 129, 0.22), transparent 40%), linear-gradient(135deg, #f2f4fb 0%, #eceff8 100%)',
                    }}
                />

                <div className="px-6 pb-6 relative">
                    <div className="absolute -top-16 left-6 w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-extrabold text-[#c88600]" style={{ background: 'linear-gradient(160deg, #ffd980, #f6b941)', border: '3px solid #f0c263' }}>
                            E
                        </div>
                    </div>

                    <div className="pt-20 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                        <div>
                            <div className="text-xs text-gray-400 mb-2">Teachers / #{teacher.id}</div>
                            <h1 className="text-4xl font-bold text-gray-900">{teacher.fullName}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-gray-600">
                                <span className="inline-flex items-center gap-2 text-sm">
                                    <CalendarDays size={15} />
                                    {formatDate(teacher.created_at)}
                                </span>
                                <span className="inline-flex items-center gap-2 text-sm">
                                    <Mail size={15} />
                                    {teacher.email}
                                </span>
                                <span className="inline-flex items-center gap-2 text-sm">
                                    <GraduationCap size={15} />
                                    {teacher.position || '--'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/teachers')}
                                className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold inline-flex items-center gap-2"
                            >
                                <Edit3 size={16} />
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="h-11 px-5 rounded-xl bg-red-500 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70"
                            >
                                <Trash2 size={16} />
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 border-b border-[#e9edf5]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('groups')}
                            className={`h-10 px-1 text-sm font-semibold border-b-2 ${activeTab === 'groups' ? 'text-violet-600 border-violet-500' : 'text-gray-500 border-transparent'}`}
                        >
                            Guruhlar
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('coin')}
                            className={`h-10 px-1 text-sm font-semibold border-b-2 ${activeTab === 'coin' ? 'text-violet-600 border-violet-500' : 'text-gray-500 border-transparent'}`}
                        >
                            Coin
                        </button>
                    </div>

                    <div className="mt-4">
                        {activeTab === 'groups' ? (
                            <div className="space-y-3">
                                {groups.length > 0 ? groups.map((group) => (
                                    <article key={group.id} className="rounded-2xl border border-[#e7ecf6] overflow-hidden">
                                        <div className="px-4 py-3 bg-[#fafbff] border-b border-[#e7ecf6] flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                                                <span className="px-2 py-1 rounded-lg bg-white border border-[#dde3f0] text-xs text-gray-500">
                                                    {getGroupStudentCount(group)} ta o'quvchi
                                                </span>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${group.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {group.status}
                                            </span>
                                        </div>

                                        <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">Kurs</p>
                                                <p className="font-medium text-gray-800 mt-1">{group.course?.name || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Xona</p>
                                                <p className="font-medium text-gray-800 mt-1">{group.room?.name || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Dars vaqti</p>
                                                <p className="font-medium text-gray-800 mt-1 inline-flex items-center gap-1"><Clock3 size={14} />{group.startTime || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Kunlar</p>
                                                <p className="font-medium text-gray-800 mt-1">{dayBadges(group.weekDays)}</p>
                                            </div>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="rounded-2xl border border-[#e7ecf6] bg-[#fafbff] px-4 py-8 text-center text-gray-400">
                                        Bu o'qituvchiga hali guruh biriktirilmagan.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-[300px,1fr] gap-4">
                                <aside className="rounded-2xl border border-[#e7ecf6] p-4 bg-[#fafbff]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                                            <Coins size={18} className="text-violet-500" />
                                            Coinlar
                                        </h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between py-2 border-b border-[#e7ecf6]">
                                            <span className="text-gray-500">Berilgan coin</span>
                                            <span className="font-semibold text-gray-900">{coinStats.given}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-[#e7ecf6]">
                                            <span className="text-gray-500">Tushgan coin</span>
                                            <span className="font-semibold text-emerald-600">{coinStats.spent}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-gray-500">Qoldiq</span>
                                            <span className="font-semibold text-violet-600">{coinStats.balance}</span>
                                        </div>
                                    </div>
                                </aside>

                                <section className="rounded-2xl border border-[#e7ecf6] overflow-hidden">
                                    <div className="px-4 py-3 bg-[#fafbff] border-b border-[#e7ecf6] text-sm font-semibold text-gray-700">
                                        Berilgan coin tarixi
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[560px]">
                                            <thead>
                                                <tr className="border-b border-[#eef2f8]">
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Sana</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Sabab</th>
                                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Hajmi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coinHistory.length > 0 ? coinHistory.map((item) => (
                                                    <tr key={item.id} className="border-b border-[#f1f4fa] last:border-b-0">
                                                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(item.date)}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-800">{item.reason}</td>
                                                        <td className="py-3 px-4 text-sm text-right font-semibold text-violet-600">{item.amount}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={3} className="py-8 text-center text-sm text-gray-400">Hali berilgan coinlar yo'q</td>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-[#e7ecf6] px-4 py-3">
                    <div className="text-xs text-gray-500 mb-1">Guruhlar soni</div>
                    <div className="text-xl font-bold text-gray-900 inline-flex items-center gap-2">
                        <Layers3 size={16} className="text-violet-500" />
                        {groups.length}
                    </div>
                </div>
                <div className="rounded-xl bg-white border border-[#e7ecf6] px-4 py-3">
                    <div className="text-xs text-gray-500 mb-1">Talabalar soni</div>
                    <div className="text-xl font-bold text-gray-900 inline-flex items-center gap-2">
                        <Users size={16} className="text-emerald-500" />
                        {totalStudents}
                    </div>
                </div>
                <div className="rounded-xl bg-white border border-[#e7ecf6] px-4 py-3">
                    <div className="text-xs text-gray-500 mb-1">Tajriba</div>
                    <div className="text-xl font-bold text-gray-900">{teacher.experience || 0} yil</div>
                </div>
            </div>
        </div>
    );
}
