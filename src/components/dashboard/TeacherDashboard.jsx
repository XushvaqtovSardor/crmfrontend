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
        primary: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        accent: 'border border-amber-400/35 bg-amber-500/20 text-amber-200',
        success: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        warning: 'border border-amber-400/35 bg-amber-500/20 text-amber-200',
    };

    return (
        <div className="group rounded-2xl border border-emerald-900/35 bg-linear-to-br from-[#101713] via-[#15211a] to-[#251f12] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-24px_rgba(0,0,0,0.75)]">
            <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
                <Icon size={22} />
            </div>
            <p className="text-sm font-medium text-slate-300">{title}</p>
            <h3 className="mt-2 text-3xl leading-none font-bold text-white">{value}</h3>
        </div>
    );
}

function Panel({ title, icon: Icon, children, right }) {
    return (
        <section className="rounded-2xl border border-emerald-900/35 bg-[#0f1713] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-emerald-900/30 bg-linear-to-r from-[#101913] to-[#181f15] px-6 py-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100 lg:text-xl">
                    <Icon size={18} className="text-amber-300" />
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
        primary: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30',
        accent: 'bg-amber-500 text-[#1a1407] hover:bg-amber-400 shadow-amber-900/20',
        success: 'bg-[#1f9d63] text-white hover:bg-[#25b872] shadow-emerald-900/30',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition shadow ${toneMap[tone]}`}
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
        { title: 'Guruhlarim', value: dashboard?.groupCount || groups.length || 0, icon: Layers3, color: 'primary' },
        { title: 'Darslarim', value: dashboard?.lessonCount || 0, icon: BookOpen, color: 'accent' },
        { title: 'Vazifalar', value: dashboard?.homeworkCount || 0, icon: ClipboardList, color: 'success' },
        { title: 'Tekshirish kerak', value: dashboard?.pendingReviews || 0, icon: AlertTriangle, color: 'warning' },
    ]), [dashboard, groups.length]);

    const upcomingDeadlines = Array.isArray(dashboard?.upcomingDeadlines) ? dashboard.upcomingDeadlines : [];
    const recentHomeworks = Array.isArray(dashboard?.recentHomeworks) ? dashboard.recentHomeworks : [];

    if (loading && !dashboard && groups.length === 0) {
        return (
            <div>
                <div className="mb-6 rounded-3xl border border-emerald-900/35 bg-linear-to-r from-[#0f1713] via-[#16231b] to-[#242012] p-6">
                    <h1 className="text-3xl font-bold text-white">Salom, {user?.fullName}!</h1>
                    <p className="mt-2 text-slate-300">Teacher paneli: guruh tanlang va dars jarayonini boshqaring</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-emerald-900/35 bg-[#101713] p-5 animate-pulse">
                            <div className="mb-3 h-12 w-12 rounded-xl bg-[#1d2922]" />
                            <div className="mb-2 h-3 w-24 rounded bg-[#1d2922]" />
                            <div className="h-8 w-16 rounded bg-[#1d2922]" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-emerald-900/35 bg-linear-to-r from-[#0f1713] via-[#16231b] to-[#242012] p-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white lg:text-4xl">Salom, {user?.fullName}!</h1>
                    <p className="mt-2 text-slate-300">Avval guruhni tanlang, keyin dars va uyga vazifani ketma-ket boshqaring</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="flex h-10 items-center gap-2 rounded-xl border border-emerald-800/40 bg-[#111913] px-4 text-sm font-semibold text-slate-200 hover:bg-[#17231c]"
                    >
                        <RefreshCcw size={16} />
                        Yangilash
                    </button>
                    <ActionButton tone="primary" onClick={() => navigate('/lessons?tab=lessons&create=1')} icon={Plus}>Dars yaratish</ActionButton>
                    <ActionButton tone="accent" onClick={() => navigate('/lessons?tab=videos&create=1')} icon={Upload}>Video biriktirish</ActionButton>
                    <ActionButton tone="success" onClick={() => navigate('/homeworks')} icon={ClipboardList}>Vazifalarni tekshirish</ActionButton>
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
                            <div key={group.id} className="rounded-xl border border-emerald-900/30 bg-[#141f19] p-4 transition hover:border-emerald-700/40">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-100">{group.name}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Talabalar: {getStudentCount(group)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=lessons`)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                                    >
                                        Guruhga kirish
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=lessons&create=1`)}
                                        className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
                                    >
                                        Dars qo'shish
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/lessons?groupId=${group.id}&tab=videos&create=1`)}
                                        className="h-9 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-[#1a1407] hover:bg-amber-400"
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
                                        className="h-9 rounded-lg border border-emerald-900/40 bg-[#101713] px-3 text-xs font-semibold text-slate-200 hover:bg-[#17231c]"
                                    >
                                        Holat va baholash
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-emerald-900/30 bg-[#141f19] px-4 py-6 text-center text-sm text-slate-400">
                                Sizga biriktirilgan guruh topilmadi.
                            </div>
                        )}
                    </div>
                </Panel>

                <Panel title="Yaqinlashayotgan deadlinelar" icon={Clock3}>
                    <div className="space-y-3">
                        {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-[#241d12] p-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                                    <AlertTriangle size={17} className="text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                                    <p className="truncate text-xs text-slate-400">Dars: {item.lesson?.title || '--'}</p>
                                </div>
                                <span className="whitespace-nowrap text-xs font-semibold text-amber-300">
                                    {item.deadlineAt ? new Date(item.deadlineAt).toLocaleDateString('uz-UZ') : '--'}
                                </span>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-emerald-500/25 bg-[#132018] px-4 py-6 text-center text-sm font-medium text-emerald-300">
                                Hozircha deadline yo'q.
                            </div>
                        )}
                    </div>
                </Panel>
            </div>

            <Panel title="So'nggi vazifalar" icon={FileText}>
                <div className="space-y-3">
                    {recentHomeworks.length > 0 ? recentHomeworks.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-emerald-900/30 bg-[#141f19] p-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                                <FileText size={17} className="text-emerald-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                                <p className="truncate text-xs text-slate-400">
                                    Max urinish: {item.maxAttempts || 1} | {item.allowLateSubmission ? 'Kech topshirish bor' : 'Kech topshirish yoq'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.isCompleted ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 size={12} /> Yakunlangan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-300">
                                        <AlertTriangle size={12} /> Jarayonda
                                    </span>
                                )}
                                <span className="whitespace-nowrap text-xs text-slate-400">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : '--'}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="rounded-xl border border-emerald-900/30 bg-[#141f19] px-4 py-6 text-center text-sm text-slate-400">
                            Vazifalar topilmadi.
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
