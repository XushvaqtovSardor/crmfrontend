import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers3,
  RefreshCcw,
  Snowflake,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';

const MONTH_LABELS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
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

const compactNumberFormatter = new Intl.NumberFormat('uz-UZ', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

function formatCompactNumber(value) {
  return compactNumberFormatter.format(asNumber(value));
}

function formatDateCard(date) {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    monthShort: date.toLocaleDateString('uz-UZ', { month: 'short' }),
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

function buildChartPoints(values, width, height, padding) {
  const max = Math.max(...values, 1);
  const left = padding?.left ?? 28;
  const right = padding?.right ?? left;
  const top = padding?.top ?? 28;
  const bottom = padding?.bottom ?? top;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  return values.map((value, index) => {
    const x = left + (index / (values.length - 1 || 1)) * innerWidth;
    const y = height - bottom - (value / max) * innerHeight;
    return { x, y, value };
  });
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    violet: 'bg-violet-100 text-violet-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={22} />
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-[34px] leading-none font-bold text-gray-900 mt-2">{value}</h3>
    </div>
  );
}

function AccordionCard({ title, open, onToggle, right, children }) {
  return (
    <section className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm overflow-hidden">
      <div className="w-full px-6 py-5 flex items-center justify-between text-left gap-3">
        <button type="button" onClick={onToggle} className="flex-1 text-left">
          <h3 className="text-2xl lg:text-[30px] leading-tight font-semibold text-gray-900">{title}</h3>
        </button>

        <div className="flex items-center gap-3">
          {right && <div onClick={(event) => event.stopPropagation()}>{right}</div>}

          <button
            type="button"
            onClick={onToggle}
            className="p-1 -m-1 rounded-md hover:bg-gray-100"
            aria-label={`${title} bo'limini ${open ? 'yopish' : 'ochish'}`}
          >
            <ChevronDown
              className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
              size={20}
            />
          </button>
        </div>
      </div>
      {open && <div className="px-6 pb-6">{children}</div>}
    </section>
  );
}

function PaymentRing({ percent }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const paidLength = (clamped / 100) * circumference;

  return (
    <div className="relative w-[210px] h-[210px]">
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        <circle cx="90" cy="90" r={radius} stroke="#f1f5f9" strokeWidth="16" fill="none" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#ef4444"
          strokeWidth="16"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#16a34a"
          strokeWidth="16"
          fill="none"
          strokeDasharray={`${paidLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[44px] font-bold text-gray-800">{clamped}%</span>
      </div>
    </div>
  );
}

function ProfitLineChart({ values, year }) {
  const width = 760;
  const height = 260;
  const chartPadding = {
    left: 82,
    right: 24,
    top: 20,
    bottom: 34,
  };
  const points = buildChartPoints(values, width, height, chartPadding);
  const maxValue = Math.max(...values, 1);
  const axisHeight = height - chartPadding.top - chartPadding.bottom;

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${width - chartPadding.right} ${height - chartPadding.bottom} L ${chartPadding.left} ${height - chartPadding.bottom} Z`;

  return (
    <div className="rounded-2xl border border-[#edf0f7] bg-[#fbfcff] p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px] h-[260px]">
        {[0, 1, 2, 3].map((line) => {
          const y = chartPadding.top + (line * axisHeight) / 3;
          const value = Math.round(maxValue - (line * maxValue) / 3);
          return (
            <g key={line}>
              <line
                x1={chartPadding.left}
                x2={width - chartPadding.right}
                y1={y}
                y2={y}
                stroke="#e9edf7"
                strokeWidth="1"
              />
              <text x={chartPadding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#94a3b8">
                {formatCompactNumber(value)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#profitFill)" />
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />

        {points.map((point, idx) => (
          <g key={MONTH_LABELS[idx]}>
            <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#22c55e" strokeWidth="3" />
            <title>{`${MONTH_LABELS[idx]} ${year}: ${formatCurrency(point.value)}`}</title>
          </g>
        ))}

        {points.map((point, idx) => (
          <text
            key={`${MONTH_LABELS[idx]}-label`}
            x={point.x}
            y={height - 6}
            textAnchor="middle"
            fontSize="13"
            fill="#94a3b8"
          >
            {MONTH_LABELS[idx]}
          </text>
        ))}

        <defs>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function StatRows({ icon, title, rows }) {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-[#edf0f7] p-4 bg-[#fafbff]">
      <div className="flex items-center gap-2 mb-3 text-gray-800">
        <Icon size={16} className="text-violet-500" />
        <span className="text-lg font-semibold">{title}</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-[#eef2f7] pb-2.5 last:border-b-0 last:pb-0">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className={`text-base font-semibold ${row.color || 'text-gray-800'}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleFilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-4 rounded-xl text-sm font-semibold transition ${active
        ? 'bg-white text-violet-600 border border-[#dbe1f1] shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
        }`}
    >
      {children}
    </button>
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
    payments: true,
    profit: true,
    schedule: true,
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

  const debtorsCount = Math.max(0, students.length - activeStudents.length);
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

  const paidStudentsCount = activeStudents.length;
  const studentsToPay = students.length;
  const remainingStudentsCount = Math.max(studentsToPay - paidStudentsCount, 0);
  const paidRatio = studentsToPay > 0 ? paidStudentsCount / studentsToPay : 0;

  const paidAmount = Math.round(totalDueAmount * paidRatio);
  const debtAmount = Math.max(totalDueAmount - paidAmount, 0);
  const paymentPercent = totalDueAmount > 0 ? Math.round((paidAmount / totalDueAmount) * 100) : 0;

  const stats = [
    { title: 'Faol talabalar', value: activeStudents.length, icon: GraduationCap, color: 'violet' },
    { title: 'Guruhlar', value: activeGroups.length, icon: Layers3, color: 'blue' },
    { title: "Joriy oy to'lovlar", value: paidStudentsCount, icon: Wallet, color: 'emerald' },
    { title: 'Qarzdorlar', value: debtorsCount, icon: AlertTriangle, color: 'amber' },
    { title: 'Muzlatilganlar', value: freezeStudents.length, icon: Snowflake, color: 'indigo' },
    { title: 'Arxivdagilar', value: inactiveStudents.length, icon: Archive, color: 'red' },
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

  const currentMonthProfit = monthlyProfit[new Date().getMonth()] || 0;
  const annualProfit = monthlyProfit.reduce((sum, value) => sum + value, 0);

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
      const current = byRoom.get(roomName) || [];
      current.push(group);
      byRoom.set(roomName, current);
    });

    return Array.from(byRoom.entries())
      .map(([roomName, roomGroups]) => ({ roomName, groups: roomGroups }))
      .sort((left, right) => left.roomName.localeCompare(right.roomName));
  }, [activeGroups, scheduleFilter]);

  const scheduleDateCard = formatDateCard(selectedDate);

  const toggleSection = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const shiftDate = (days) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate);
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Salom, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-2">CRM platformasiga xush kelibsiz!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="h-[360px] rounded-2xl border border-gray-100 bg-white animate-pulse" />
          ))}
        </div>

        <div className="h-[260px] rounded-2xl border border-gray-100 bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-4xl lg:text-[48px] font-bold text-gray-900">
            Salom, {user?.fullName}!
          </h1>
          <p className="text-gray-500 mt-2 text-lg">CRM platformasiga xush kelibsiz!</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="h-10 px-4 rounded-xl border border-[#dbe1f1] bg-white text-gray-600 text-sm font-semibold flex items-center gap-2 hover:bg-gray-50"
        >
          <RefreshCcw size={16} />
          Yangilash
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 items-start gap-4 mb-4">
        <AccordionCard
          title="Joriy oy uchun to'lovlar"
          open={expanded.payments}
          onToggle={() => toggleSection('payments')}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-5 items-center">
            <div className="space-y-4">
              <StatRows
                icon={Wallet}
                title="Hajmi"
                rows={[
                  { label: "To'lash kerak bo'lgan summa", value: formatCurrency(totalDueAmount) },
                  { label: "To'langan summa", value: formatCurrency(paidAmount), color: 'text-emerald-600' },
                  { label: 'Qolgan qarz', value: formatCurrency(debtAmount), color: 'text-red-500' },
                ]}
              />

              <StatRows
                icon={Users}
                title="Soni"
                rows={[
                  { label: "To'lash kerak bo'lgan o'quvchilar", value: studentsToPay },
                  { label: "To'lagan o'quvchilar", value: paidStudentsCount, color: 'text-emerald-600' },
                  { label: "Qolgan o'quvchilar", value: remainingStudentsCount, color: 'text-red-500' },
                ]}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <PaymentRing percent={paymentPercent} />
              <p className="text-sm text-gray-500">To'lov bajarilishi</p>
            </div>
          </div>
        </AccordionCard>

        <AccordionCard
          title="Yillik Foyda"
          open={expanded.profit}
          onToggle={() => toggleSection('profit')}
          right={(
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-10 px-3 rounded-xl border border-[#dbe1f1] bg-white text-sm text-gray-700"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        >
          <ProfitLineChart values={monthlyProfit} year={selectedYear} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl bg-[#f8fbff] border border-[#e8eef9] p-4">
              <p className="text-sm text-gray-500">Joriy oy</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(currentMonthProfit)}</p>
            </div>
            <div className="rounded-xl bg-[#f8fbff] border border-[#e8eef9] p-4">
              <p className="text-sm text-gray-500">Yillik jami</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(annualProfit)}</p>
            </div>
            <div className="rounded-xl bg-[#f8fbff] border border-[#e8eef9] p-4">
              <p className="text-sm text-gray-500">Faol guruhlar</p>
              <p className="text-lg font-bold text-violet-600 mt-1">{activeGroups.length} ta</p>
            </div>
          </div>
        </AccordionCard>
      </div>

      <AccordionCard
        title="Dars jadvali"
        open={expanded.schedule}
        onToggle={() => toggleSection('schedule')}
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-[#dbe1f1] bg-[#f8fbff] px-3 py-2 text-center min-w-[56px]">
              <p className="text-[10px] uppercase text-gray-500">{scheduleDateCard.monthShort}</p>
              <p className="text-xl font-bold text-violet-600">{scheduleDateCard.day}</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 capitalize">{scheduleDateCard.monthYear}</p>
              <p className="text-sm text-gray-500">{scheduleDateCard.weekDay}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl bg-[#f3f5fb] p-1">
              {Object.entries(SCHEDULE_FILTERS).map(([key, meta]) => (
                <ScheduleFilterButton
                  key={key}
                  active={scheduleFilter === key}
                  onClick={() => setScheduleFilter(key)}
                >
                  {meta.label}
                </ScheduleFilterButton>
              ))}
            </div>

            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="w-9 h-9 rounded-xl border border-[#dbe1f1] bg-white text-gray-500 flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="h-9 px-4 rounded-xl border border-[#dbe1f1] bg-white text-sm font-medium"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="w-9 h-9 rounded-xl border border-[#dbe1f1] bg-white text-gray-500 flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8edf7] overflow-hidden">
          <div className="px-4 py-3 bg-[#f8fbff] border-b border-[#e8edf7] text-sm text-gray-700">
            Tanlangan kun turi: <span className="font-semibold text-violet-600">{SCHEDULE_FILTERS[scheduleFilter].label}</span>
          </div>

          {scheduleRows.length > 0 ? (
            scheduleRows.map((row) => (
              <div key={row.roomName} className="grid grid-cols-[130px,1fr] border-b border-[#eef2f9] last:border-b-0">
                <div className="px-4 py-4 bg-[#fbfcff] text-sm font-medium text-gray-600 border-r border-[#eef2f9]">
                  {row.roomName}
                </div>

                <div className="px-3 py-3 flex flex-wrap gap-2">
                  {row.groups.map((group, index) => {
                    const chipVariant = index % 3;
                    const chipClass = chipVariant === 1
                      ? 'bg-slate-900 text-white'
                      : chipVariant === 2
                        ? 'bg-violet-500 text-white'
                        : 'bg-violet-700 text-white';

                    return (
                      <div key={group.id} className={`rounded-lg px-3 py-2 min-w-[150px] shadow-sm ${chipClass}`}>
                        <p className="text-sm font-semibold leading-tight truncate">{group.name}</p>
                        <p className="text-xs opacity-90 mt-0.5 truncate">{group.course?.name || 'Kurs'}</p>
                        <div className="mt-1 flex items-center gap-1 text-[11px] opacity-90">
                          <Clock size={12} />
                          <span>{group.startTime || '--:--'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-gray-400 text-sm">
              Tanlangan jadval turi uchun darslar topilmadi.
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#e8edf7] bg-[#fbfcff] p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <CalendarDays size={14} />
              Sana
            </div>
            <p className="text-lg font-semibold text-gray-900 capitalize">{scheduleDateCard.monthYear}</p>
          </div>
          <div className="rounded-xl border border-[#e8edf7] bg-[#fbfcff] p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Layers3 size={14} />
              Ko'rsatilgan guruhlar
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {scheduleRows.reduce((sum, row) => sum + row.groups.length, 0)} ta
            </p>
          </div>
          <div className="rounded-xl border border-[#e8edf7] bg-[#fbfcff] p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <TrendingUp size={14} />
              Faol o'qituvchilar
            </div>
            <p className="text-lg font-semibold text-gray-900">{teachers.filter((teacher) => teacher.status === 'ACTIVE').length} ta</p>
          </div>
        </div>
      </AccordionCard>
    </div>
  );
}
