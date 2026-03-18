import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, Layers3, Snowflake, Archive, AlertTriangle, Wallet, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';

function StatCard({ title, value, icon, color }) {
  const IconComponent = icon;
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
        <IconComponent size={22} />
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-[38px] leading-none font-bold text-gray-900 mt-2">{value}</h3>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, groupsRes, teachersRes] = await Promise.allSettled([
        api.get('/students?page=1&limit=100'),
        api.get('/groups?page=1&limit=100'),
        api.get('/teachers?page=1&limit=100'),
      ]);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data?.data?.data || []);
      if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.data?.data?.data || []);
      if (teachersRes.status === 'fulfilled') setTeachers(teachersRes.value.data?.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeStudents = students.filter(s => s.status === 'ACTIVE');
  const freezeStudents = students.filter(s => s.status === 'FREEZE');
  const inactiveStudents = students.filter(s => s.status === 'INACTIVE');
  const activeGroups = groups.filter(g => g.status === 'ACTIVE');
  const debtorsCount = Math.max(0, students.length - activeStudents.length);

  const stats = [
    { title: 'Faol talabalar', value: activeStudents.length, icon: GraduationCap, color: 'violet' },
    { title: 'Guruhlar', value: activeGroups.length, icon: Layers3, color: 'blue' },
    { title: 'Joriy oy to\'lovlar', value: 0, icon: Wallet, color: 'emerald' },
    { title: 'Qarzdorlar', value: debtorsCount, icon: AlertTriangle, color: 'amber' },
    { title: 'Muzlatilganlar', value: freezeStudents.length, icon: Snowflake, color: 'indigo' },
    { title: 'Arxivdagilar', value: inactiveStudents.length, icon: Archive, color: 'red' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Salom, {user?.fullName}!
          </h1>
          <p className="text-gray-500 mt-2">EduCoin platformasiga xush kelibsiz!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {loading
          ? [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))
          : stats.map((s, i) => <StatCard key={i} {...s} />)
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-3xl font-semibold text-gray-900">Joriy oy uchun to'lovlar</h3>
            <ChevronDown className="text-gray-500" size={18} />
          </div>
          <div className="rounded-2xl border border-[#edf0f7] p-4 bg-[#fafbff]">
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">To'lash kerak bo'lgan summa</span><span className="font-semibold text-gray-800">58,750,000 so'm</span></div>
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">To'langan summa</span><span className="font-semibold text-emerald-600">3,550,000 so'm</span></div>
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Qolgan qarzi</span><span className="font-semibold text-rose-500">55,200,000 so'm</span></div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-flex items-center justify-center h-28 w-28 rounded-full border-[14px] border-rose-500 text-3xl font-bold text-gray-800">6%</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-3xl font-semibold text-gray-900">Yillik Foyda</h3>
            <ChevronDown className="text-gray-500" size={18} />
          </div>
          <div className="h-64 rounded-2xl bg-[#fafbff] border border-[#edf0f7] p-3 flex items-end gap-2">
            {[12, 88, 42, 12, 8, 6, 6, 7, 6, 6, 5, 5].map((v, i) => (
              <div key={i} className="flex-1 rounded-t-xl bg-emerald-500/80" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm px-6 py-5 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Dars jadvali</h3>
        <ChevronDown className="text-gray-500" size={18} />
      </div>
    </div>
  );
}
