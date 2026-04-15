import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Layers3,
  RefreshCcw,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return `${asNumber(value).toLocaleString('uz-UZ')} so'm`;
}

function pickPayload(response) {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response;
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
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <h3 className="text-2xl lg:text-[30px] leading-tight font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-3">
          {right}
          <ChevronDown className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} size={20} />
        </div>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </section>
  );
}

function StatusTile({ title, value, icon: Icon, tone }) {
  const toneMap = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <Icon size={16} />
      </div>
      <p className="mt-2 text-3xl font-bold leading-none">{value}</p>
    </div>
  );
}

function CourseRevenueChart({ rows, totalRevenue }) {
  return (
    <div className="rounded-2xl border border-[#edf0f7] p-4 bg-[#fafbff]">
      <div className="space-y-3">
        {rows.slice(0, 8).map((row) => {
          const share = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
          return (
            <div key={row.courseName}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="font-medium text-gray-700 truncate pr-3">{row.courseName}</span>
                <span className="text-gray-500">{share.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#e7ebf5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityItem({ title, value, desc, tone }) {
  const toneMap = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    violet: 'bg-violet-500',
  };

  return (
    <div className="py-3 flex items-start gap-3">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${toneMap[tone] || 'bg-slate-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{value}</p>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({
    submissions: true,
    finance: true,
    activity: true,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [analyticsRes, financeRes] = await Promise.allSettled([
        api.get('/erp/superadmin/analytics'),
        api.get('/erp/finance/report'),
      ]);

      const analyticsData = analyticsRes.status === 'fulfilled'
        ? pickPayload(analyticsRes.value)
        : null;

      const financeDataFromEndpoint = financeRes.status === 'fulfilled'
        ? pickPayload(financeRes.value)
        : null;

      const financeData = financeDataFromEndpoint || analyticsData?.finance || null;

      setAnalytics(analyticsData);
      setFinance(financeData);

      if (analyticsRes.status === 'rejected' && financeRes.status === 'rejected') {
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

  const courseRows = useMemo(() => {
    if (Array.isArray(finance?.byCourse)) {
      return finance.byCourse
        .map((course) => ({
          courseName: course.courseName || `Kurs #${course.courseId}`,
          studentCount: null,
          price: null,
          revenue: asNumber(course.totalAmount),
        }))
        .sort((left, right) => right.revenue - left.revenue);
    }

    if (Array.isArray(finance?.courses)) {
      return finance.courses
        .map((course) => ({
          courseName: course.courseName || course.name || 'Noma\'lum kurs',
          studentCount: asNumber(course.studentCount),
          price: asNumber(course.price),
          revenue: asNumber(course.revenue),
        }))
        .sort((left, right) => right.revenue - left.revenue);
    }

    return [];
  }, [finance]);

  const totalRevenue = useMemo(() => {
    const directValue = asNumber(finance?.totalAmount ?? finance?.totalRevenue);
    if (directValue > 0) return directValue;
    return courseRows.reduce((sum, row) => sum + row.revenue, 0);
  }, [courseRows, finance]);

  const submissionStats = useMemo(() => {
    const result = {
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0,
    };

    const raw = analytics?.submissionStats;

    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        const status = String(item?.status || '').toUpperCase();
        const count = asNumber(item?._count?.status ?? item?.count ?? item?.total);
        result.total += count;

        if (status.includes('APPROV')) result.approved += count;
        else if (status.includes('REJECT')) result.rejected += count;
        else result.pending += count;
      });

      return result;
    }

    if (raw && typeof raw === 'object') {
      result.approved = asNumber(raw.approved);
      result.pending = asNumber(raw.pending);
      result.rejected = asNumber(raw.rejected);
      result.total = asNumber(raw.total);

      if (result.total === 0) {
        result.total = result.approved + result.pending + result.rejected;
      }
    }

    return result;
  }, [analytics]);

  const teachersCount = asNumber(analytics?.users?.teachers ?? analytics?.totalTeachers);
  const studentsCount = asNumber(analytics?.users?.students ?? analytics?.totalStudents);
  const groupsCount = asNumber(analytics?.activeGroups ?? analytics?.totalGroups);
  const coursesCount = courseRows.length || asNumber(finance?.courses?.length ?? analytics?.totalCourses);

  const submissionRate = submissionStats.total > 0
    ? Math.round((submissionStats.approved / submissionStats.total) * 100)
    : 0;

  const stats = [
    { title: "Faol o'qituvchilar", value: teachersCount, icon: Users, color: 'violet' },
    { title: 'Faol talabalar', value: studentsCount, icon: GraduationCap, color: 'blue' },
    { title: 'Faol guruhlar', value: groupsCount, icon: Layers3, color: 'emerald' },
    { title: 'Kurslar soni', value: coursesCount, icon: BookOpen, color: 'amber' },
    { title: 'Topshiriqlar', value: submissionStats.total, icon: CheckCircle2, color: 'indigo' },
    { title: 'Umumiy daromad', value: formatCurrency(totalRevenue), icon: Wallet, color: 'emerald' },
  ];

  const activityItems = [
    {
      title: "Platformadagi o'qituvchilar",
      value: `${teachersCount} ta`,
      desc: 'Hozirda faol dars berayotgan ustozlar soni',
      tone: 'violet',
    },
    {
      title: 'Faol o\'quvchilar',
      value: `${studentsCount} ta`,
      desc: 'Joriy davrda faol qatnashayotgan talabalar',
      tone: 'blue',
    },
    {
      title: 'Tekshirish kutilayotganlar',
      value: `${submissionStats.pending} ta`,
      desc: 'Teacher review jarayonida turgan topshiriqlar',
      tone: 'amber',
    },
    {
      title: 'Rad etilgan topshiriqlar',
      value: `${submissionStats.rejected} ta`,
      desc: 'Qayta topshirish talab qiladigan ishlar',
      tone: 'red',
    },
  ];

  const toggleSection = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Salom, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-2">EduCoin platformasiga xush kelibsiz!</p>
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
            <div key={idx} className="h-90 rounded-2xl border border-gray-100 bg-white animate-pulse" />
          ))}
        </div>

        <div className="h-65 rounded-2xl border border-gray-100 bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-4xl lg:text-[48px] font-bold text-gray-900">Salom, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-2 text-lg">EduCoin platformasidagi umumiy ko'rsatkichlar</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <AccordionCard
          title="Topshiriqlar holati"
          open={expanded.submissions}
          onToggle={() => toggleSection('submissions')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <StatusTile title="Tasdiqlangan" value={submissionStats.approved} icon={CheckCircle2} tone="emerald" />
            <StatusTile title="Kutilayotgan" value={submissionStats.pending} icon={Clock3} tone="amber" />
            <StatusTile title="Rad etilgan" value={submissionStats.rejected} icon={XCircle} tone="red" />
            <StatusTile title="Jami" value={submissionStats.total} icon={AlertTriangle} tone="slate" />
          </div>

          <div className="rounded-2xl border border-[#edf0f7] p-4 bg-[#fafbff]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-600">Tasdiqlash ko'rsatkichi</p>
              <p className="text-sm font-semibold text-emerald-600">{submissionRate}%</p>
            </div>
            <div className="mt-2.5 h-3 rounded-full bg-[#e7ebf5] overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${submissionRate}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl border border-[#e8edf7] bg-white px-3 py-2">
                <p className="text-xs text-gray-500">Tasdiqlangan</p>
                <p className="text-base font-semibold text-emerald-600">{submissionStats.approved}</p>
              </div>
              <div className="rounded-xl border border-[#e8edf7] bg-white px-3 py-2">
                <p className="text-xs text-gray-500">Kutilmoqda</p>
                <p className="text-base font-semibold text-amber-600">{submissionStats.pending}</p>
              </div>
              <div className="rounded-xl border border-[#e8edf7] bg-white px-3 py-2">
                <p className="text-xs text-gray-500">Rad etilgan</p>
                <p className="text-base font-semibold text-red-600">{submissionStats.rejected}</p>
              </div>
            </div>
          </div>
        </AccordionCard>

        <AccordionCard
          title="Kurslar bo'yicha daromad"
          open={expanded.finance}
          onToggle={() => toggleSection('finance')}
          right={<span className="text-sm font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</span>}
        >
          {courseRows.length > 0 ? (
            <>
              <CourseRevenueChart rows={courseRows} totalRevenue={totalRevenue} />

              <div className="mt-4 rounded-2xl border border-[#edf0f7] overflow-x-auto">
                <table className="w-full min-w-130">
                  <thead className="bg-[#f8fbff]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Kurs</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">O'quvchi</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Narx</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Daromad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseRows.map((row) => (
                      <tr key={`${row.courseName}-${row.revenue}`} className="border-t border-[#eef2f9]">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.courseName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {row.studentCount === null ? '-' : `${row.studentCount} ta`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {row.price === null ? '-' : formatCurrency(row.price)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-[#edf0f7] p-8 bg-[#fafbff] text-center text-gray-400 text-sm">
              Moliyaviy ma'lumot topilmadi.
            </div>
          )}
        </AccordionCard>
      </div>

      <AccordionCard
        title="Platforma holati"
        open={expanded.activity}
        onToggle={() => toggleSection('activity')}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr,1fr] gap-4">
          <div className="rounded-2xl border border-[#edf0f7] p-4 bg-[#fafbff]">
            <div className="flex items-center gap-2 text-gray-800 mb-2">
              <Activity size={16} className="text-violet-500" />
              <span className="text-lg font-semibold">So'nggi ko'rsatkichlar</span>
            </div>

            <div className="divide-y divide-[#ebeff7]">
              {activityItems.map((item) => (
                <ActivityItem key={item.title} {...item} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#edf0f7] p-4 bg-[#fafbff]">
            <div className="flex items-center gap-2 text-gray-800 mb-3">
              <BarChart3 size={16} className="text-violet-500" />
              <span className="text-lg font-semibold">Qisqa xulosa</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-[#e8edf7] bg-white p-3">
                <p className="text-sm text-gray-500">Yakunlangan topshiriqlar</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{submissionStats.approved} ta</p>
              </div>
              <div className="rounded-xl border border-[#e8edf7] bg-white p-3">
                <p className="text-sm text-gray-500">Aktiv auditoriya</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{studentsCount + teachersCount} ta</p>
              </div>
              <div className="rounded-xl border border-[#e8edf7] bg-white p-3">
                <p className="text-sm text-gray-500">Daromad o'sishi trendi</p>
                <p className="text-xl font-bold text-violet-600 mt-1 flex items-center gap-1">
                  <TrendingUp size={18} />
                  Barqaror
                </p>
              </div>
            </div>
          </div>
        </div>
      </AccordionCard>
    </div>
  );
}
