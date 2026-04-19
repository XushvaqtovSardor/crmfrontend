import { useEffect, useMemo, useState } from 'react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock,
    CreditCard,
    GraduationCap,
    Snowflake,
    Trash2,
    Users,
    Wallet,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const WEEKDAY_BY_INDEX = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const UZ_WEEKDAY_LABEL = {
    MONDAY: 'Dushanba',
    TUESDAY: 'Seshanba',
    WEDNESDAY: 'Chorshanba',
    THURSDAY: 'Payshanba',
    FRIDAY: 'Juma',
    SATURDAY: 'Shanba',
    SUNDAY: 'Yakshanba',
};

const SCHEDULE_FILTERS = {
    ODD: {
        label: 'Toq kunlar',
        weekDays: new Set(['MONDAY', 'WEDNESDAY', 'FRIDAY']),
    },
    EVEN: {
        label: 'Juft kunlar',
        weekDays: new Set(['TUESDAY', 'THURSDAY', 'SATURDAY']),
    },
    OTHER: {
        label: 'Boshqalar',
        weekDays: new Set(['SUNDAY']),
    },
};

const compactNumberFormatter = new Intl.NumberFormat('uz-UZ', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
});

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
    return `${asNumber(value).toLocaleString('uz-UZ')} so'm`;
}

function formatCompactNumber(value) {
    return compactNumberFormatter.format(asNumber(value));
}

function formatDateCard(date) {
    return {
        day: String(date.getDate()).padStart(2, '0'),
        monthShort: date.toLocaleDateString('uz-UZ', { month: 'short' }).toUpperCase(),
        monthYear: date.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' }),
        weekDay: UZ_WEEKDAY_LABEL[WEEKDAY_BY_INDEX[date.getDay()]],
    };
}

function extractGroupStudents(group) {
    if (typeof group?._count?.studentGroup === 'number') return group._count.studentGroup;
    if (Array.isArray(group?.studentGroup)) return group.studentGroup.length;
    return 0;
}

function resolveGroupFee(group, fallbackPerStudent) {
    const coursePrice = asNumber(group?.course?.price);
    const studentCount = extractGroupStudents(group);
    if (!coursePrice) return 0;
    if (studentCount > 0) return coursePrice * studentCount;
    return coursePrice * fallbackPerStudent;
}

function getScheduleChipWidth(name) {
    const length = String(name || '').length;
    if (length > 34) return 'min-w-[290px]';
    if (length > 24) return 'min-w-[240px]';
    if (length > 14) return 'min-w-[180px]';
    return 'min-w-[120px]';
}

function buildProfitPoints(values) {
    const max = Math.max(...values, 1);
    const minX = 8;
    const maxX = 600;
    const minY = 24;
    const maxY = 256;
    const stepX = (maxX - minX) / (values.length - 1 || 1);

    return values.map((value, index) => {
        const ratio = value / max;
        return {
            month: MONTH_LABELS[index],
            value,
            x: minX + index * stepX,
            y: maxY - ratio * (maxY - minY),
        };
    });
}

function StatCard({ title, value, icon: Icon }) {
    return (
        <div className="group rounded-3xl border border-emerald-900/40 bg-linear-to-br from-[#101713] via-[#15211a] to-[#242012] px-5 py-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-24px_rgba(0,0,0,0.75)]">
            <div className="mb-4 flex justify-center text-amber-300">
                <div className="rounded-2xl border border-amber-300/30 bg-black/20 p-2.5 transition group-hover:scale-105">
                    <Icon size={28} strokeWidth={1.8} />
                </div>
            </div>
            <p className="text-center text-[15px] text-slate-300">{title}</p>
            <p className="mt-3 text-center text-3xl font-semibold text-white">{value}</p>
        </div>
    );
}

function AccordionBlock({ title, open, onToggle, children }) {
    return (
        <section className="rounded-2xl border border-emerald-900/35 bg-[#0f1713] shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between bg-linear-to-r from-[#101913] to-[#181f15] px-6 py-5 text-left"
            >
                <h3 className="text-2xl leading-none font-semibold text-slate-100">{title}</h3>
                <ChevronDown className={cn('text-amber-300 transition-transform', open && 'rotate-180')} />
            </button>
            {open && <div className="px-6 pb-6">{children}</div>}
        </section>
    );
}

function RingChart({ percent = 0 }) {
    const clamped = Math.max(0, Math.min(100, percent));
    const angle = `${clamped * 3.6}deg`;

    return (
        <div className="flex items-center justify-center">
            <div
                className="relative grid h-48 w-48 place-items-center rounded-full"
                style={{
                    background: `conic-gradient(#22c55e 0 ${angle}, #f0b429 ${angle} 360deg)`,
                }}
            >
                <div className="grid h-32 w-32 place-items-center rounded-full border border-emerald-900/35 bg-[#0f1713] text-4xl font-semibold text-white">
                    {clamped}%
                </div>
            </div>
        </div>
    );
}

function PaymentSection({
    totalDueAmount,
    paidAmount,
    debtAmount,
    studentsToPay,
    paidStudentsCount,
    remainingStudentsCount,
    paymentPercent,
}) {
    return (
        <div>
            <div className="mb-6 flex items-center gap-2 text-[15px] font-medium text-slate-300">
                <span>💰</span>
                <span>Hajmi</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                <div className="space-y-6">
                    <div className="rounded-3xl border border-emerald-900/25 bg-[#151f19] p-5">
                        <div className="mb-4 flex justify-between gap-4 text-[18px] font-medium text-slate-100">
                            <span>To'lash kerak bo'lgan summa</span>
                            <span>{formatCurrency(totalDueAmount)}</span>
                        </div>
                        <div className="space-y-3 border-t border-emerald-900/30 pt-4 text-[16px]">
                            <div className="flex justify-between">
                                <span className="text-slate-400">To'langan summa</span>
                                <span className="font-medium text-emerald-500">{formatCurrency(paidAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Qolgan qarzi</span>
                                <span className="font-medium text-amber-300">{formatCurrency(debtAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-4 flex items-center gap-2 text-[15px] font-medium text-slate-300">
                            <span>🧑🏻‍🎓</span>
                            <span>Soni</span>
                        </div>
                        <div className="rounded-3xl border border-emerald-900/25 bg-[#151f19] p-5">
                            <div className="mb-4 flex justify-between gap-4 text-[18px] font-medium text-slate-100">
                                <span>To'lash kerak bo'lgan o'quvchilar</span>
                                <span>{studentsToPay}</span>
                            </div>
                            <div className="space-y-3 border-t border-emerald-900/30 pt-4 text-[16px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">To'lagan o'quvchilar</span>
                                    <span className="font-medium text-emerald-500">{paidStudentsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Qolgan o'quvchilar</span>
                                    <span className="font-medium text-amber-300">{remainingStudentsCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <RingChart percent={paymentPercent} />
            </div>
        </div>
    );
}

function ProfitSection({ values, year, yearOptions, onYearChange, paidAmount, debtAmount }) {
    const points = useMemo(() => buildProfitPoints(values), [values]);

    const pathData = useMemo(
        () => points.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
        [points],
    );

    const maxValue = Math.max(...values, 1);
    const axisLabels = [1, 0.75, 0.5, 0.25, 0].map((ratio) => Math.round(maxValue * ratio));

    const nowMonth = new Date().getMonth();
    const highlightedIndex = values.some((value) => value > 0)
        ? (values[nowMonth] > 0 ? nowMonth : values.findIndex((value) => value > 0))
        : nowMonth;
    const highlightedMonth = MONTH_LABELS[highlightedIndex];
    const highlightedValue = values[highlightedIndex] || 0;

    return (
        <div>
            <div className="mb-4">
                <select
                    value={year}
                    onChange={(event) => onYearChange(Number(event.target.value))}
                    className="h-10 min-w-32 rounded-2xl border border-emerald-900/35 bg-[#141f19] px-4 text-sm text-slate-200 shadow-sm"
                >
                    {yearOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>

            <div className="relative h-80 overflow-hidden rounded-2xl border border-emerald-900/25 bg-[#111913]">
                <div className="absolute left-0 top-0 flex h-full flex-col justify-between py-6 text-sm text-slate-500">
                    {axisLabels.map((value, idx) => (
                        <span key={`${value}-${idx}`}>{formatCompactNumber(value)}</span>
                    ))}
                </div>

                <svg viewBox="0 0 620 290" className="ml-12 h-full w-[calc(100%-3rem)]">
                    <path d={pathData} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
                    {points.map((point) => (
                        <g key={point.month}>
                            <circle cx={point.x} cy={point.y} r="6" fill="#111913" stroke="#f0b429" strokeWidth="4" />
                            <title>{`${point.month} ${year}: ${formatCurrency(point.value)}`}</title>
                        </g>
                    ))}
                </svg>

                <div className="absolute bottom-1 left-12 right-1 flex justify-between px-1 text-sm text-slate-500">
                    {points.map((point) => (
                        <span key={`${point.month}-axis`}>{point.month}</span>
                    ))}
                </div>

                <div className="hidden lg:block absolute left-50 top-22 w-65 rounded-3xl border border-amber-400/20 bg-[#111913]/95 p-5 shadow-xl shadow-black/30">
                    <p className="mb-4 text-[26px] font-semibold text-white">{highlightedMonth} {year}</p>
                    <div className="mb-3 border-t border-emerald-900/35 pt-4 text-[18px]">
                        <span className="text-slate-400">To'langan summa </span>
                        <span className="font-semibold text-emerald-400">{formatCurrency(highlightedValue || paidAmount)}</span>
                    </div>
                    <div className="text-[18px]">
                        <span className="text-slate-400">Qolgan qarz: </span>
                        <span className="font-semibold text-amber-300">{formatCurrency(debtAmount)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScheduleSection({ scheduleRows, scheduleFilter, setScheduleFilter, scheduleDateCard, shiftDate }) {
    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-emerald-900/35 bg-[#111913] px-4 py-2 text-center">
                        <div className="text-sm text-slate-400">{scheduleDateCard.monthShort}</div>
                        <div className="text-4xl font-semibold text-amber-300">{scheduleDateCard.day}</div>
                    </div>
                    <div>
                        <div className="text-2xl font-semibold capitalize text-slate-100">{scheduleDateCard.monthYear}</div>
                        <div className="text-slate-400">{scheduleDateCard.weekDay}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex rounded-2xl bg-[#171f19] p-1">
                        {Object.entries(SCHEDULE_FILTERS).map(([key, meta]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setScheduleFilter(key)}
                                className={cn(
                                    'rounded-xl px-4 py-2 transition',
                                    scheduleFilter === key
                                        ? 'bg-[#0d1410] text-amber-300 shadow-sm shadow-black/20'
                                        : 'text-slate-300 hover:text-slate-100',
                                )}
                            >
                                {meta.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => shiftDate(-1)}
                        className="grid h-11 w-11 place-items-center rounded-2xl text-slate-300 hover:bg-[#1a241d]"
                    >
                        <ChevronLeft />
                    </button>
                    <button
                        type="button"
                        onClick={() => shiftDate(0, true)}
                        className="rounded-2xl border border-emerald-900/40 bg-[#111913] px-5 py-2.5 text-slate-100 hover:bg-[#18231c]"
                    >
                        Bugun
                    </button>
                    <button
                        type="button"
                        onClick={() => shiftDate(1)}
                        className="grid h-11 w-11 place-items-center rounded-2xl text-slate-300 hover:bg-[#1a241d]"
                    >
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <div className="mb-4 border-b border-emerald-900/30 pb-4 text-slate-300">
                Tanlangan kun turi: <span className="font-medium text-amber-300">{SCHEDULE_FILTERS[scheduleFilter].label}</span>
            </div>

            <div className="space-y-0">
                {scheduleRows.length > 0 ? (
                    scheduleRows.map((row) => (
                        <div key={row.roomName} className="grid min-h-18 grid-cols-[70px_1fr] border-b border-emerald-900/20">
                            <div className="flex items-center text-[18px] text-slate-200">{row.roomName}</div>
                            <div className="flex flex-wrap items-center gap-3 py-2">
                                {row.groups.map((group) => (
                                    <div key={group.id} className={cn('rounded-2xl bg-linear-to-r from-emerald-600 to-amber-500 px-3 py-3 text-white shadow-sm shadow-black/20 transition hover:scale-[1.02]', getScheduleChipWidth(group.name))}>
                                        <div className="text-[14px] font-medium leading-tight">{group.name}</div>
                                        <div className="mt-1 flex items-center gap-1 text-xs text-emerald-50">
                                            <Clock size={12} />
                                            <span>{group.startTime || '--:--'}</span>
                                            <span>•</span>
                                            <span>{group.course?.name || 'Kurs'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-emerald-900/30 bg-[#111913] py-10 text-center text-sm text-slate-400">
                        Tanlangan jadval uchun guruhlar topilmadi.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState({
        payments: false,
        profit: false,
        schedule: false,
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [scheduleFilter, setScheduleFilter] = useState('ODD');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const loadData = async () => {
        setError('');
        setLoading(true);

        try {
            const [studentsRes, groupsRes, teachersRes] = await Promise.allSettled([
                api.get('/students?page=1&limit=300'),
                api.get('/groups?page=1&limit=300'),
                api.get('/teachers?page=1&limit=300'),
            ]);

            if (studentsRes.status === 'fulfilled') {
                setStudents(normalizeList(studentsRes.value.data));
            }

            if (groupsRes.status === 'fulfilled') {
                setGroups(normalizeList(groupsRes.value.data));
            }

            if (teachersRes.status === 'fulfilled') {
                setTeachers(normalizeList(teachersRes.value.data));
            }

            if (
                studentsRes.status === 'rejected'
                && groupsRes.status === 'rejected'
                && teachersRes.status === 'rejected'
            ) {
                setError("Dashboard ma'lumotlarini yuklashda xatolik yuz berdi");
            }
        } catch (e) {
            setError(getApiErrorMessage(e, "Dashboard ma'lumotlarini yuklashda xatolik yuz berdi"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeStudents = useMemo(() => students.filter((student) => student.status === 'ACTIVE'), [students]);
    const freezeStudents = useMemo(() => students.filter((student) => student.status === 'FREEZE'), [students]);
    const inactiveStudents = useMemo(() => students.filter((student) => student.status === 'INACTIVE'), [students]);
    const activeGroups = useMemo(() => groups.filter((group) => group.status === 'ACTIVE'), [groups]);

    const studentsToPay = students.length;
    const paidStudentsCount = activeStudents.length;
    const debtorsCount = Math.max(studentsToPay - paidStudentsCount, 0);
    const remainingStudentsCount = Math.max(studentsToPay - paidStudentsCount, 0);
    const avgStudentPerGroup = Math.max(1, Math.round((students.length || 1) / Math.max(activeGroups.length, 1)));

    const totalDueAmount = useMemo(() => {
        const resolved = activeGroups.reduce((sum, group) => {
            return sum + resolveGroupFee(group, avgStudentPerGroup);
        }, 0);

        if (resolved > 0) return resolved;

        const priceCandidates = activeGroups
            .map((group) => asNumber(group?.course?.price))
            .filter((price) => price > 0);

        const avgPrice = priceCandidates.length
            ? priceCandidates.reduce((sum, price) => sum + price, 0) / priceCandidates.length
            : 850000;

        return avgPrice * Math.max(students.length, 1);
    }, [activeGroups, avgStudentPerGroup, students.length]);

    const paymentPercent = studentsToPay > 0 ? Math.round((paidStudentsCount / studentsToPay) * 100) : 0;
    const paidAmount = Math.round(totalDueAmount * (paymentPercent / 100));
    const debtAmount = Math.max(totalDueAmount - paidAmount, 0);

    const stats = [
        { title: 'Faol talabalar', value: activeStudents.length, icon: GraduationCap },
        { title: 'Guruhlar', value: activeGroups.length, icon: Users },
        { title: "Joriy oy to'lovlar", value: paidStudentsCount, icon: CreditCard },
        { title: 'Qarzdorlar', value: debtorsCount, icon: CircleAlert },
        { title: 'Muzlatilganlar', value: freezeStudents.length, icon: Snowflake },
        { title: 'Arxivdagilar', value: inactiveStudents.length, icon: Trash2 },
    ];

    const yearOptions = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        groups.forEach((group) => {
            const parsed = new Date(group.startDate);
            if (!Number.isNaN(parsed.getTime())) years.add(parsed.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [groups]);

    const monthlyProfit = useMemo(() => {
        const values = Array(12).fill(0);

        activeGroups.forEach((group) => {
            const startDate = new Date(group.startDate);
            if (Number.isNaN(startDate.getTime())) return;
            if (startDate.getFullYear() !== selectedYear) return;

            values[startDate.getMonth()] += resolveGroupFee(group, avgStudentPerGroup);
        });

        if (values.every((value) => value === 0)) {
            values[new Date().getMonth()] = paidAmount;
        }

        return values;
    }, [activeGroups, avgStudentPerGroup, paidAmount, selectedYear]);

    const scheduleRows = useMemo(() => {
        const selectedFilter = SCHEDULE_FILTERS[scheduleFilter];
        if (!selectedFilter) return [];

        const filteredGroups = activeGroups
            .filter((group) => {
                const days = Array.isArray(group.weekDays) ? group.weekDays : [];
                return days.some((day) => selectedFilter.weekDays.has(day));
            })
            .sort((left, right) => String(left.startTime).localeCompare(String(right.startTime)));

        const byRoom = new Map();

        filteredGroups.forEach((group) => {
            const roomName = group?.room?.name || `Xona ${group.roomId || '-'}`;
            const roomGroups = byRoom.get(roomName) || [];
            roomGroups.push(group);
            byRoom.set(roomName, roomGroups);
        });

        return Array.from(byRoom.entries())
            .map(([roomName, roomGroups]) => ({ roomName, groups: roomGroups }))
            .sort((left, right) => left.roomName.localeCompare(right.roomName));
    }, [activeGroups, scheduleFilter]);

    const scheduleDateCard = formatDateCard(selectedDate);

    const shiftDate = (days, toToday = false) => {
        if (toToday) {
            setSelectedDate(new Date());
            return;
        }

        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + days);
        setSelectedDate(nextDate);
    };

    const toggleSection = (section) => {
        setExpanded((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    if (loading) {
        return (
            <div className="space-y-5">
                <div className="rounded-3xl border border-emerald-900/35 bg-linear-to-r from-[#0f1713] via-[#16231b] to-[#242012] p-6">
                    <h1 className="text-3xl font-semibold text-white md:text-4xl">Salom, {user?.fullName || 'Foydalanuvchi'}!</h1>
                    <p className="mt-2 text-base text-slate-300">EduCoin platformasiga xush kelibsiz!</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className="h-42.5 rounded-3xl border border-emerald-900/30 bg-[#101713] animate-pulse" />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="h-30 rounded-2xl border border-emerald-900/30 bg-[#101713] animate-pulse" />
                    <div className="h-30 rounded-2xl border border-emerald-900/30 bg-[#101713] animate-pulse" />
                </div>

                <div className="h-30 rounded-2xl border border-emerald-900/30 bg-[#101713] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-900/35 bg-linear-to-r from-[#0f1713] via-[#16231b] to-[#242012] p-6">
                <h1 className="text-3xl font-semibold text-white md:text-4xl">Salom, {user?.fullName || 'Foydalanuvchi'}!</h1>
                <p className="mt-2 text-base text-slate-300">EduCoin platformasiga xush kelibsiz!</p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                {stats.map((item) => (
                    <StatCard key={item.title} {...item} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.08fr_1fr]">
                <AccordionBlock
                    title="Joriy oy uchun to'lovlar"
                    open={expanded.payments}
                    onToggle={() => toggleSection('payments')}
                >
                    <PaymentSection
                        totalDueAmount={totalDueAmount}
                        paidAmount={paidAmount}
                        debtAmount={debtAmount}
                        studentsToPay={studentsToPay}
                        paidStudentsCount={paidStudentsCount}
                        remainingStudentsCount={remainingStudentsCount}
                        paymentPercent={paymentPercent}
                    />
                </AccordionBlock>

                <AccordionBlock
                    title="Yillik Foyda"
                    open={expanded.profit}
                    onToggle={() => toggleSection('profit')}
                >
                    <ProfitSection
                        values={monthlyProfit}
                        year={selectedYear}
                        yearOptions={yearOptions}
                        onYearChange={setSelectedYear}
                        paidAmount={paidAmount}
                        debtAmount={debtAmount}
                    />
                </AccordionBlock>
            </div>

            <AccordionBlock
                title="Dars jadvali"
                open={expanded.schedule}
                onToggle={() => toggleSection('schedule')}
            >
                <ScheduleSection
                    scheduleRows={scheduleRows}
                    scheduleFilter={scheduleFilter}
                    setScheduleFilter={setScheduleFilter}
                    scheduleDateCard={scheduleDateCard}
                    shiftDate={shiftDate}
                />
            </AccordionBlock>
        </div>
    );
}
