import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, Layers3, BookOpen, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, PieChart,
  Calendar, Clock, CheckCircle2, AlertTriangle, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';

function StatCard({ title, value, icon, color, trend, trendUp }) {
  const IconComponent = icon;
  const colorMap = {
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
          <IconComponent size={22} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
    </div>
  );
}

function ActivityItem({ title, desc, time, type }) {
  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${colors[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, financeRes] = await Promise.allSettled([
        api.get('/erp/superadmin/analytics'),
        api.get('/erp/finance/report'),
      ]);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data?.data);
      if (financeRes.status === 'fulfilled') setFinance(financeRes.value.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: "Jami o'qituvchilar", value: analytics?.totalTeachers || 0, icon: Users, color: 'violet', trend: '+12%', trendUp: true },
    { title: 'Jami talabalar', value: analytics?.totalStudents || 0, icon: GraduationCap, color: 'blue', trend: '+8%', trendUp: true },
    { title: 'Faol guruhlar', value: analytics?.totalGroups || 0, icon: Layers3, color: 'emerald', trend: '+5%', trendUp: true },
    { title: 'Jami kurslar', value: analytics?.totalCourses || 0, icon: BookOpen, color: 'amber' },
    { title: 'Topshiriqlar', value: analytics?.submissionStats?.total || 0, icon: CheckCircle2, color: 'indigo' },
    { title: 'Umumiy daromad', value: `${(finance?.totalRevenue || 0).toLocaleString()} so'm`, icon: DollarSign, color: 'emerald', trend: '+15%', trendUp: true },
  ];

  const recentActivities = [
    { title: "Yangi talaba ro'yxatdan o'tdi", desc: 'Islomov Sardor - Frontend N25 guruhiga', time: '5 min oldin', type: 'success' },
    { title: "To'lov qabul qilindi", desc: "1,200,000 so'm - Backend N12", time: '15 min oldin', type: 'info' },
    { title: "O'qituvchi dars yaratdi", desc: 'JavaScript asoslari - 15-dars', time: '30 min oldin', type: 'info' },
    { title: 'Vazifa muddati tugayapti', desc: 'React Hooks - 3 ta talaba topshirmagan', time: '1 soat oldin', type: 'warning' },
    { title: "Yangi guruh ochildi", desc: 'Python N8 - Boshlanuvchi daraja', time: '2 soat oldin', type: 'success' },
    { title: "To'lov kechiktirildi", desc: 'Karimov Jasur - 2 oy qarzdor', time: '3 soat oldin', type: 'error' },
  ];

  return (
    <div>
      
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Salom, {user?.fullName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">EduERP boshqaruv paneliga xush kelibsiz</p>
      </div>

      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <span className="font-medium">Oylik daromad</span>
              </div>
              <h3 className="text-3xl font-bold">{(finance?.totalRevenue || 0).toLocaleString()} so'm</h3>
              <p className="text-violet-200 text-sm mt-1">O'tgan oyga nisbatan +15%</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <span className="font-medium">To'lovlar</span>
              </div>
              <h3 className="text-3xl font-bold">{analytics?.totalStudents || 0} ta</h3>
              <p className="text-emerald-200 text-sm mt-1">Joriy oy uchun to'lovlar</p>
            </div>
          </div>

          
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kurslar bo'yicha daromad</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Kurs nomi</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Narxi</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Talabalar</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Daromad</th>
                  </tr>
                </thead>
                <tbody>
                  {finance?.courses?.length > 0 ? (
                    finance.courses.map((c, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{c.courseName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{Number(c.price).toLocaleString()} so'm</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{c.studentCount}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-emerald-600">{Number(c.revenue).toLocaleString()} so'm</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Ma'lumot topilmadi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          
          {analytics?.submissionStats && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Topshiriqlar statistikasi</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{analytics.submissionStats.total}</p>
                  <p className="text-xs text-blue-500 mt-1">Jami</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{analytics.submissionStats.approved}</p>
                  <p className="text-xs text-emerald-500 mt-1">Tasdiqlangan</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{analytics.submissionStats.pending}</p>
                  <p className="text-xs text-amber-500 mt-1">Kutilmoqda</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{analytics.submissionStats.rejected}</p>
                  <p className="text-xs text-red-500 mt-1">Rad etilgan</p>
                </div>
              </div>
            </div>
          )}
        </div>

        
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">So'nggi faoliyat</h3>
              <Activity size={18} className="text-gray-400" />
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivities.map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))}
            </div>
          </div>

          
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tezkor harakatlar</h3>
            <div className="space-y-2">
              {[
                { label: "Yangi o'qituvchi qo'shish", color: 'bg-violet-500' },
                { label: "Yangi guruh ochish", color: 'bg-blue-500' },
                { label: "To'lov qabul qilish", color: 'bg-emerald-500' },
                { label: 'Hisobot yuklab olish', color: 'bg-amber-500' },
              ].map((a, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-left"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${a.color}`} />
                  <span className="text-sm font-medium text-gray-700">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
