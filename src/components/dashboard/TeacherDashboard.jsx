import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    FileText,
    Layers3,
    Plus,
    RefreshCcw,
    Upload,
    Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';

function pickPayload(response) {
    if (response?.data?.data !== undefined) return response.data.data;
    if (response?.data !== undefined) return response.data;
    return response;
}

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function getStudentCount(group) {
    const members = Array.isArray(group?.studentGroup) ? group.studentGroup : [];
    return members.filter((member) => member?.student || member?.studentId).length;
}

function StatCard({ title, value, icon: Icon, color }) {
    const colorMap = {
        violet: 'bg-violet-100 text-violet-600',
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
    };

    return (
        <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5 hover:shadow-md transition-all">
            <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
                <Icon size={22} />
            </div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h3 className="text-3xl leading-none font-bold text-gray-900 mt-2">{value}</h3>
        </div>
    );
}

function Panel({ title, icon: Icon, children, right }) {
    return (
        <section className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#eef2f9] flex items-center justify-between gap-3">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Icon size={18} className="text-violet-500" />
                    {title}
                </h3>
                {right}
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

function ActionButton({ onClick, icon: Icon, children, tone }) {
    const toneMap = {
        violet: 'bg-violet-500 hover:bg-violet-600 shadow-violet-200',
        blue: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
        emerald: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-10 px-4 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 transition shadow ${toneMap[tone]}`}
        >
            <Icon size={16} />
            {children}
        </button>
    );
}

export default function TeacherDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboard = async () => {
        setLoading(true);
        setError('');

        try {
            const [dashboardRes, groupsRes] = await Promise.all([
                api.get('/erp/teacher/dashboard'),
                api.get('/groups/my'),
            ]);

            setDashboard(pickPayload(dashboardRes));
            setGroups(normalizeList(groupsRes.data));
        } catch (e) {
            setError(getApiErrorMessage(e, "Dashboard ma'lumotlarini yuklashda xatolik"));
            setDashboard(null);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const stats = useMemo(() => ([
        { title: 'Guruhlarim', value: dashboard?.groupCount || groups.length || 0, icon: Layers3, color: 'violet' },
        { title: 'Darslarim', value: dashboard?.lessonCount || 0, icon: BookOpen, color: 'blue' },
        { title: 'Vazifalar', value: dashboard?.homeworkCount || 0, icon: ClipboardList, color: 'emerald' },
        { title: 'Tekshirish kerak', value: dashboard?.pendingReviews || 0, icon: AlertTriangle, color: 'amber' },
    ]), [dashboard, groups.length]);

    const upcomingDeadlines = Array.isArray(dashboard?.upcomingDeadlines) ? dashboard.upcomingDeadlines : [];
    const recentHomeworks = Array.isArray(dashboard?.recentHomeworks) ? dashboard.recentHomeworks : [];

    if (loading && !dashboard && groups.length === 0) {
        return (
            <div>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Salom, {user?.fullName}!</h1>
                    <p className="text-gray-500 mt-2">Teacher paneli: guruh tanlang va dars jarayonini boshqaring</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
                            <div className="h-8 bg-gray-100 rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Salom, {user?.fullName}!</h1>
                    <p className="text-gray-500 mt-2">Avval guruhni tanlang, keyin dars va uyga vazifani ketma-ket boshqaring</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="h-10 px-4 rounded-xl border border-[#dbe1f1] bg-white text-gray-600 text-sm font-semibold flex items-center gap-2 hover:bg-gray-50"
                    >
                        <RefreshCcw size={16} />
                        Yangilash
                    </button>
                    <ActionButton tone="violet" onClick={() => navigate('/lessons?tab=lessons&create=1')} icon={Plus}>Dars yaratish</ActionButton>
                    <ActionButton tone="blue" onClick={() => navigate('/lessons?tab=videos&create=1')} icon={Upload}>Video biriktirish</ActionButton>
                    <ActionButton tone="emerald" onClick={() => navigate('/homeworks')} icon={ClipboardList}>Vazifalarni tekshirish</ActionButton>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                <Panel title="Mening guruhlarim" icon={Users}>
                    <div className="space-y-3 max-h-115 overflow-auto pr-1">
                        {groups.length > 0 ? groups.map((group) => (
                            <div key={group.id} className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Talabalar: {getStudentCount(group)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=lessons`)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                                    >
                                        Guruhga kirish
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=lessons&create=1`)}
                                        className="h-9 rounded-lg bg-violet-500 px-3 text-xs font-semibold text-white hover:bg-violet-600"
                                    >
                                        Dars qo'shish
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=videos&create=1`)}
                                        className="h-9 rounded-lg bg-blue-500 px-3 text-xs font-semibold text-white hover:bg-blue-600"
                                    >
                                        Video/Fayl
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=homeworks&create=1`)}
                                        className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600"
                                    >
                                        Uyga vazifa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/homeworks?groupId=${group.id}`)}
                                        className="h-9 rounded-lg border border-[#d7deee] bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Holat va baholash
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] px-4 py-6 text-center text-gray-400 text-sm">
                                Sizga biriktirilgan guruh topilmadi.
                            </div>
                        )}
                    </div>
                </Panel>

                <Panel title="Yaqinlashayotgan deadlinelar" icon={Clock3}>
                    <div className="space-y-3">
                        {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((item) => (
                            <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3.5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={17} className="text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                                    <p className="text-xs text-gray-500 truncate">Dars: {item.lesson?.title || '--'}</p>
                                </div>
                                <span className="text-xs text-amber-700 font-semibold whitespace-nowrap">
                                    {item.deadlineAt ? new Date(item.deadlineAt).toLocaleDateString('uz-UZ') : '--'}
                                </span>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center text-emerald-700 text-sm font-medium">
                                Hozircha deadline yo'q.
                            </div>
                        )}
                    </div>
                </Panel>
            </div>

            <Panel title="So'nggi vazifalar" icon={FileText}>
                <div className="space-y-3">
                    {recentHomeworks.length > 0 ? recentHomeworks.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] p-3.5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                <FileText size={17} className="text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    Max urinish: {item.maxAttempts || 1} | {item.allowLateSubmission ? 'Kech topshirish bor' : 'Kech topshirish yoq'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.isCompleted ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 size={12} /> Yakunlangan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                                        <AlertTriangle size={12} /> Jarayonda
                                    </span>
                                )}
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : '--'}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] px-4 py-6 text-center text-gray-400 text-sm">
                            Vazifalar topilmadi.
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
