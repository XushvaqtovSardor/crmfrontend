import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, Coins, Edit3, ExternalLink, Mail, Phone, RefreshCcw, Trash2, User, } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
const DAY_LABELS = {
    MONDAY: 'Dushanba',
    TUESDAY: 'Seshanba',
    WEDNESDAY: 'Chorshanba',
    THURSDAY: 'Payshanba',
    FRIDAY: 'Juma',
    SATURDAY: 'Shanba',
    SUNDAY: 'Yakshanba',
};
function normalizeObject(payload) {
    if (payload?.data?.data)
        return payload.data.data;
    if (payload?.data)
        return payload.data;
    return null;
}
function parseStudentMeta(photoValue) {
    if (typeof photoValue !== 'string' || !photoValue.trim()) {
        return {
            photoUrl: '',
            phone: '',
            gender: 'MALE',
        };
    }
    const raw = photoValue.trim();
    if (raw.startsWith('{')) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.type === 'student-meta-v1') {
                return {
                    photoUrl: String(parsed.photoUrl || ''),
                    phone: String(parsed.phone || ''),
                    gender: parsed.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
                };
            }
        }
        catch {
        }
    }
    return {
        photoUrl: raw,
        phone: '',
        gender: 'MALE',
    };
}
function formatDate(value) {
    if (!value)
        return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return '--';
    return parsed.toLocaleDateString('uz-UZ');
}
function formatDateRange(startDate, monthLength = 3) {
    if (!startDate)
        return '--';
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime()))
        return '--';
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(monthLength || 3));
    return `${formatDate(start)} - ${formatDate(end)}`;
}
function scheduleLabel(group) {
    const days = Array.isArray(group?.weekDays) ? group.weekDays : [];
    if (!days.length)
        return '--';
    const dayText = days.map((day) => DAY_LABELS[day] || day).join(', ');
    const duration = group?.course?.durationLesson ? `${group.course.durationLesson} daqiqa` : '--';
    return `${dayText} • ${duration}`;
}
export default function StudentDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const studentId = Number(id);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [statusTab, setStatusTab] = useState('ACTIVE');
    const [leftTab, setLeftTab] = useState('info');
    const loadStudent = async () => {
        if (!Number.isInteger(studentId) || studentId <= 0) {
            setError("Talaba ID noto'g'ri");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/students/${studentId}`);
            setStudent(normalizeObject(response.data));
        }
        catch (e) {
            setStudent(null);
            setError(getApiErrorMessage(e, "Talaba ma'lumotlarini yuklashda xatolik"));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadStudent();
    }, [studentId]);
    const memberships = useMemo(() => (student?.studentGroups || []).filter((membership) => membership?.group), [student]);
    const tabCounts = useMemo(() => ({
        ACTIVE: memberships.filter((membership) => membership.group.status === 'ACTIVE').length,
        FREEZE: memberships.filter((membership) => membership.group.status === 'FREEZE').length,
        INACTIVE: memberships.filter((membership) => membership.group.status === 'INACTIVE').length,
    }), [memberships]);
    const visibleMemberships = useMemo(() => memberships.filter((membership) => membership.group.status === statusTab), [memberships, statusTab]);
    const coinStats = useMemo(() => {
        const attendances = student?.attendances || [];
        const presentCount = attendances.filter((item) => item.isPresent === true).length;
        const absentCount = attendances.filter((item) => item.isPresent === false).length;
        const earned = presentCount * 10;
        const spent = Math.round(earned * 0.25);
        return {
            presentCount,
            absentCount,
            earned,
            spent,
            balance: Math.max(earned - spent, 0),
        };
    }, [student]);
    const meta = useMemo(() => parseStudentMeta(student?.photo), [student?.photo]);
    const deleteStudent = async () => {
        if (!student)
            return;
        if (!window.confirm("Talabani arxivga o'tkazishni xohlaysizmi?"))
            return;
        setDeleting(true);
        try {
            await api.delete(`/students/${student.id}`);
            navigate('/students', { replace: true });
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Talabani arxivga o'tkazib bo'lmadi"));
        }
        finally {
            setDeleting(false);
        }
    };
    if (loading) {
        return (<div className="space-y-4">

            <div className="h-56 rounded-3xl border border-[#e6e9f2] bg-white animate-pulse" />

            <div className="h-60 rounded-3xl border border-[#e6e9f2] bg-white animate-pulse" />

        </div>);
    }
    if (!student) {
        return (<div className="bg-white rounded-2xl border border-red-200 px-6 py-6">

            <p className="text-red-600 font-medium">Talaba topilmadi yoki o'chirilgan.</p>

            <button type="button" onClick={() => navigate('/students')} className="mt-4 h-10 px-4 rounded-xl bg-violet-500 text-white text-sm font-semibold">

                Talabalar ro'yxatiga qaytish

            </button>

        </div>);
    }
    return (<div className="space-y-4">

        <div className="flex items-center justify-between gap-2">

            <button type="button" onClick={() => navigate('/students')} className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold inline-flex items-center gap-2">

                <ArrowLeft size={16} /> Talabalar

            </button>



            <button type="button" onClick={loadStudent} className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 text-sm font-semibold inline-flex items-center gap-2">

                <RefreshCcw size={16} /> Yangilash

            </button>

        </div>



        {error && (<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

            {error}

        </div>)}



        <section className="bg-white rounded-3xl border border-[#e6e9f2] overflow-hidden">

            <div className="h-56" style={{
                backgroundImage: 'radial-gradient(circle at 20% 25%, rgba(88, 131, 102, 0.35), transparent 40%), radial-gradient(circle at 80% 15%, rgba(109, 142, 113, 0.3), transparent 40%), linear-gradient(135deg, #d7e5d7 0%, #e9efe9 100%)',
            }} />



            <div className="px-6 pb-6 relative">

                <div className="absolute -top-16 left-6 w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">

                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl font-extrabold text-[#c88600]" style={{ background: 'linear-gradient(160deg, #ffd980, #f6b941)', border: '3px solid #f0c263' }}>

                        E

                    </div>

                </div>



                <div className="pt-20 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">

                    <div>

                        <div className="inline-flex items-center gap-2 text-sm text-gray-400 mb-2">

                            <User size={14} />

                            <span>Talabalar</span>

                            <ChevronRight size={14} />

                            <span>{student.fullName}</span>

                        </div>



                        <h1 className="text-4xl font-semibold text-gray-900">{student.fullName}</h1>

                    </div>



                    <div className="flex items-center gap-2">

                        <button type="button" onClick={() => navigate('/students', { state: { editStudentId: student.id } })} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold inline-flex items-center gap-2">

                            <Edit3 size={16} /> Edit

                        </button>

                        <button type="button" onClick={deleteStudent} disabled={deleting} className="h-11 px-5 rounded-xl bg-red-500 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70">

                            <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete'}

                        </button>

                    </div>

                </div>



                <div className="mt-5 flex flex-wrap items-center gap-5 border-b border-[#e9edf5]">

                    <button type="button" onClick={() => setStatusTab('ACTIVE')} className={`h-10 text-sm font-semibold border-b-2 ${statusTab === 'ACTIVE' ? 'text-violet-600 border-violet-500' : 'text-gray-500 border-transparent'}`}>

                        Faol ({tabCounts.ACTIVE})

                    </button>

                    <button type="button" onClick={() => setStatusTab('FREEZE')} className={`h-10 text-sm font-semibold border-b-2 ${statusTab === 'FREEZE' ? 'text-violet-600 border-violet-500' : 'text-gray-500 border-transparent'}`}>

                        Muzlatilgan ({tabCounts.FREEZE})

                    </button>

                    <button type="button" onClick={() => setStatusTab('INACTIVE')} className={`h-10 text-sm font-semibold border-b-2 ${statusTab === 'INACTIVE' ? 'text-violet-600 border-violet-500' : 'text-gray-500 border-transparent'}`}>

                        Arxiv ({tabCounts.INACTIVE})

                    </button>

                    <span className="h-10 text-sm font-semibold text-gray-500 inline-flex items-center">

                        Chegirmalar (100)

                    </span>

                </div>



                <div className="mt-4 grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-4">

                    <aside className="rounded-2xl border border-[#e7ecf6] bg-[#fafbff] p-4">

                        <div className="inline-flex items-center rounded-xl bg-[#eceff6] p-1">

                            <button type="button" onClick={() => setLeftTab('info')} className={`h-9 px-4 rounded-lg text-sm font-semibold ${leftTab === 'info' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>

                                Ma'lumotlari

                            </button>

                            <button type="button" onClick={() => setLeftTab('coin')} className={`h-9 px-4 rounded-lg text-sm font-semibold ${leftTab === 'coin' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>

                                Coin

                            </button>

                        </div>



                        {leftTab === 'info' ? (<div className="mt-4 rounded-xl border border-[#e3e9f4] bg-white p-4 space-y-3 text-sm">

                            <div className="text-base font-semibold text-gray-900">Talaba</div>

                            <p className="text-gray-700 inline-flex items-center gap-2"><CalendarDays size={14} /> {formatDate(student.birth_date)}</p>

                            <p className="text-gray-700 inline-flex items-center gap-2"><Phone size={14} /> {meta.phone || '--'}</p>

                            <p className="text-gray-700 inline-flex items-center gap-2"><Mail size={14} /> {student.email || '--'}</p>

                        </div>) : (<div className="mt-4 rounded-xl border border-[#e3e9f4] bg-white p-4 space-y-2 text-sm">

                            <div className="flex items-center justify-between">

                                <span className="text-gray-500">Berilgan coin</span>

                                <span className="font-semibold text-gray-900">{coinStats.earned}</span>

                            </div>

                            <div className="flex items-center justify-between">

                                <span className="text-gray-500">Yechilgan coin</span>

                                <span className="font-semibold text-red-500">{coinStats.spent}</span>

                            </div>

                            <div className="flex items-center justify-between">

                                <span className="text-gray-500">Qoldiq</span>

                                <span className="font-semibold text-emerald-600">{coinStats.balance}</span>

                            </div>

                            <div className="pt-2 border-t border-[#eef2f8] text-xs text-gray-400">

                                Bor: {coinStats.presentCount} | Yo'q: {coinStats.absentCount}

                            </div>

                        </div>)}

                    </aside>



                    <div className="space-y-3">

                        {visibleMemberships.length > 0 ? (visibleMemberships.map((membership) => {
                            const group = membership.group;
                            return (<article key={membership.id} className="rounded-2xl border border-[#e7ecf6] bg-white p-4">

                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-2xl font-medium text-gray-900">{group.name}</h3>

                                            <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold">

                                                {group.course?.name || 'course'}

                                            </span>

                                            <span className="px-2 py-1 rounded-full border border-[#dae2ef] text-xs text-gray-600">

                                                {formatDateRange(group.startDate, group.course?.durationMonth || 3)}

                                            </span>

                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${group.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : group.status === 'FREEZE' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>

                                                {group.status === 'ACTIVE' ? 'Faol' : group.status === 'FREEZE' ? 'Muzlatilgan' : 'Arxiv'}

                                            </span>

                                        </div>



                                        <p className="mt-2 text-violet-500 text-sm">

                                            {scheduleLabel(group)}

                                        </p>

                                    </div>



                                    <button type="button" onClick={() => navigate(`/groups/${group.id}`)} className="h-10 px-4 rounded-xl text-violet-600 text-sm font-semibold hover:bg-violet-50 inline-flex items-center gap-2">

                                        Guruhga o'tish

                                        <ExternalLink size={14} />

                                    </button>

                                </div>

                            </article>);
                        })) : (<div className="rounded-2xl border border-[#e7ecf6] bg-[#fafbff] px-4 py-10 text-center text-sm text-gray-400">

                            Tanlangan status bo'yicha guruh topilmadi.

                        </div>)}

                    </div>

                </div>

            </div>

        </section>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <div className="rounded-xl border border-[#e7ecf6] bg-white px-4 py-3">

                <p className="text-xs text-gray-500">Jami guruh</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">{memberships.length}</p>

            </div>

            <div className="rounded-xl border border-[#e7ecf6] bg-white px-4 py-3">

                <p className="text-xs text-gray-500">So'nggi yangilanish</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">{formatDate(student.updated_at)}</p>

            </div>

            <div className="rounded-xl border border-[#e7ecf6] bg-white px-4 py-3">

                <p className="text-xs text-gray-500">Coin</p>

                <p className="text-2xl font-bold text-violet-600 mt-1 inline-flex items-center gap-2">

                    <Coins size={18} /> {coinStats.balance}

                </p>

            </div>

        </div>

    </div>);
}
