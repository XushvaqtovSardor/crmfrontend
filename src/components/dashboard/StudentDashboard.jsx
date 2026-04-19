import { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Loader2,
    RefreshCcw,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';
import {
    computeStudentCoins,
    computeStudentLevel,
    computeStudentXP,
    formatTimeRange,
    toDateKey,
    WEEKDAY_INDEX,
} from '../../utils/studentPanel.js';

function pickPayload(response) {
    if (response?.data?.data !== undefined) return response.data.data;
    if (response?.data !== undefined) return response.data;
    return response;
}

function normalizeGroups(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

function monthLabel(date) {
    return date.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
}

function buildCalendarCells(currentMonth) {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstWeekday = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstWeekday);

    const cells = [];
    for (let i = 0; i < 42; i += 1) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        cells.push(day);
    }
    return cells;
}

function scoreLabel(score) {
    if (score >= 90) return "A'lo";
    if (score >= 70) return 'Yaxshi';
    if (score >= 50) return 'Qoniqarli';
    return 'Qoniqarsiz';
}

function sameDate(a, b) {
    return toDateKey(a) === toDateKey(b);
}

export default function StudentDashboard() {
    const { user } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [progress, setProgress] = useState(null);
    const [groups, setGroups] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [calendarMonth, setCalendarMonth] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [dashboardRes, progressRes, groupsRes] = await Promise.allSettled([
                api.get('/erp/student/dashboard'),
                api.get('/erp/student/progress'),
                api.get('/groups/my'),
            ]);

            if (dashboardRes.status === 'fulfilled') setDashboard(pickPayload(dashboardRes.value));
            if (progressRes.status === 'fulfilled') setProgress(pickPayload(progressRes.value));
            if (groupsRes.status === 'fulfilled') setGroups(normalizeGroups(groupsRes.value.data));

            if (
                dashboardRes.status === 'rejected'
                && progressRes.status === 'rejected'
                && groupsRes.status === 'rejected'
            ) {
                setError("Dashboard ma'lumotlarini yuklab bo'lmadi");
            }
        } catch (e) {
            setError(getApiErrorMessage(e, "Dashboard ma'lumotlarini yuklab bo'lmadi"));
            setDashboard(null);
            setProgress(null);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const homeworks = useMemo(() => (Array.isArray(dashboard?.homeworks) ? dashboard.homeworks : []), [dashboard]);

    const xp = useMemo(() => computeStudentXP(progress), [progress]);
    const coins = useMemo(() => computeStudentCoins(progress), [progress]);
    const levelState = useMemo(() => computeStudentLevel(xp), [xp]);

    const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

    const eventsByDate = useMemo(() => {
        const map = new Map();

        const putEvent = (dateKey, event) => {
            if (!dateKey) return;
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey).push(event);
        };

        const calendarRangeStart = new Date(calendarCells[0] || new Date());
        const calendarRangeEnd = new Date(calendarCells[calendarCells.length - 1] || new Date());

        for (let date = new Date(calendarRangeStart); date <= calendarRangeEnd; date.setDate(date.getDate() + 1)) {
            const weekday = date.getDay();

            groups.forEach((group) => {
                const weekDays = Array.isArray(group?.weekDays) ? group.weekDays : [];
                const matches = weekDays.some((day) => WEEKDAY_INDEX[day] === weekday);
                if (!matches) return;

                putEvent(toDateKey(date), {
                    id: `group-${group.id}-${toDateKey(date)}`,
                    type: 'lesson',
                    title: group?.name || `Guruh ${group.id}`,
                    subtitle: group?.course?.name || "Asosiy dars",
                    time: formatTimeRange(group?.startTime, Number(group?.course?.durationLesson) || 90),
                });
            });
        }

        homeworks.forEach((hw) => {
            if (!hw?.deadlineAt || hw?.submitted) return;
            const dateKey = toDateKey(hw.deadlineAt);
            putEvent(dateKey, {
                id: `hw-${hw.id}`,
                type: 'homework',
                title: hw.title || `Homework ${hw.id}`,
                subtitle: 'Uyga vazifa muddati',
                time: new Date(hw.deadlineAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
            });
        });

        return map;
    }, [calendarCells, groups, homeworks]);

    const selectedEvents = eventsByDate.get(selectedDate) || [];

    const averageScore = Number(progress?.averageScore) || 0;
    const pendingHomeworkCount = homeworks.filter((hw) => !hw.submitted).length;
    const submissions = Array.isArray(progress?.submissions) ? progress.submissions : [];
    const approvedCount = submissions.filter((submission) => submission?.status === 'APPROVED').length;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-900/35 bg-linear-to-r from-[#0f1713] via-[#16231b] to-[#242012] p-5">
                <div>
                    <h1 className="text-[36px] leading-none font-semibold text-white">Bosh sahifa</h1>
                    <p className="mt-1 text-sm text-slate-300">Salom, {user?.fullName || 'Student'}!</p>
                </div>

                <button
                    type="button"
                    onClick={loadData}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-800/40 bg-[#111913] px-4 text-sm font-semibold text-slate-200 hover:bg-[#18231c]"
                >
                    <RefreshCcw size={15} /> Yangilash
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-emerald-900/35 bg-[#101713] p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-sm text-slate-300">Kumushlar</p>
                        <h2 className="inline-flex items-center gap-2 text-3xl font-semibold text-amber-300">
                            <CircleDollarSign size={24} />
                            {coins}
                        </h2>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-slate-300">Level {levelState.level}</p>
                        <p className="text-base font-semibold text-white">XP {xp}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                        <span>Level progress</span>
                        <span>{levelState.inLevel} / 500 XP</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#1f2a23]">
                        <div className="h-full rounded-full bg-linear-to-r from-emerald-500 to-amber-400" style={{ width: `${levelState.progressPercent}%` }} />
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard
                    icon={<BookOpen size={17} />}
                    title="Topshiriqlar"
                    value={pendingHomeworkCount}
                    subtitle="Kutayotgan uyga vazifalar"
                />
                <InfoCard
                    icon={<TrendingUp size={17} />}
                    title="O'rtacha baho"
                    value={`${Math.round(averageScore)}%`}
                    subtitle={scoreLabel(averageScore)}
                />
                <InfoCard
                    icon={<Sparkles size={17} />}
                    title="Tasdiqlangan"
                    value={approvedCount}
                    subtitle="Qabul qilingan ishlar"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-4">
                <section className="space-y-4 rounded-2xl border border-emerald-900/35 bg-[#101713] p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-100">
                            <CalendarDays size={16} className="text-amber-300" />
                            Dars jadvali
                        </h3>

                        <div className="inline-flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-900/35 bg-[#141f19] text-slate-300"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <span className="min-w-40 text-center text-sm font-medium text-slate-200">{monthLabel(calendarMonth)}</span>
                            <button
                                type="button"
                                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-900/35 bg-[#141f19] text-slate-300"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-16">
                            <Loader2 size={24} className="mx-auto animate-spin text-[#c07a39]" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                                {['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'].map((day) => (
                                    <div key={day} className="py-1">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {calendarCells.map((dateValue) => {
                                    const dateKey = toDateKey(dateValue);
                                    const isToday = sameDate(dateValue, new Date());
                                    const isCurrentMonth = dateValue.getMonth() === calendarMonth.getMonth();
                                    const isSelected = selectedDate === dateKey;
                                    const hasEvent = (eventsByDate.get(dateKey) || []).length > 0;

                                    return (
                                        <button
                                            key={dateKey}
                                            type="button"
                                            onClick={() => setSelectedDate(dateKey)}
                                            className={`h-10 rounded-lg border text-sm ${isSelected
                                                ? 'border-amber-400/60 bg-[#2a1f12] text-amber-300'
                                                : isCurrentMonth
                                                    ? 'border-emerald-900/30 bg-[#121b16] text-slate-200'
                                                    : 'border-emerald-900/20 bg-[#0f1512] text-slate-600'} ${isToday ? 'font-semibold' : ''}`}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {dateValue.getDate()}
                                                {hasEvent ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                <section className="rounded-2xl border border-emerald-900/35 bg-[#101713] p-4">
                    <h3 className="text-base font-semibold text-slate-100">Tanlangan kundagi darslar</h3>
                    <p className="mt-1 text-xs text-slate-400">{selectedDate}</p>

                    <div className="mt-3 space-y-2 max-h-105 overflow-auto pr-1">
                        {selectedEvents.length > 0 ? selectedEvents.map((event) => (
                            <article
                                key={event.id}
                                className={`rounded-xl border px-3 py-2 ${event.type === 'homework' ? 'border-amber-400/25 bg-[#241d12]' : 'border-emerald-500/25 bg-[#15211a]'}`}
                            >
                                <p className="text-sm font-semibold text-slate-100">{event.title}</p>
                                <p className="mt-0.5 text-xs text-slate-400">{event.subtitle}</p>
                                <p className="mt-1 text-xs font-medium text-slate-200">{event.time}</p>
                            </article>
                        )) : (
                            <div className="rounded-xl border border-dashed border-emerald-900/30 bg-[#0f1512] py-8 text-center text-sm text-slate-400">
                                Bu kunda reja yo'q
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function InfoCard({ icon, title, value, subtitle }) {
    return (
        <article className="rounded-2xl border border-emerald-900/35 bg-linear-to-br from-[#101713] via-[#15211a] to-[#241f12] p-4 transition hover:-translate-y-0.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/15 text-amber-300">
                {icon}
            </span>
            <p className="mt-3 text-xs text-slate-400">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </article>
    );
}
