import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, PieChart, BarChart3 } from 'lucide-react';
import api from '../api.js';

export default function FinancePage() {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/erp/finance/report');
      setFinance(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moliya hisoboti</h1>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="font-medium">Umumiy daromad</span>
          </div>
          <h3 className="text-3xl font-bold">{(finance?.totalRevenue || 0).toLocaleString()} so'm</h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="font-medium">Kurslar soni</span>
          </div>
          <h3 className="text-3xl font-bold">{finance?.courses?.length || 0}</h3>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <span className="font-medium">Jami talabalar</span>
          </div>
          <h3 className="text-3xl font-bold">{finance?.courses?.reduce((s, c) => s + c.studentCount, 0) || 0}</h3>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kurslar bo'yicha tafsilot</h3>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">#</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Kurs nomi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Narxi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Talabalar</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Daromad</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Ulushi</th>
                </tr>
              </thead>
              <tbody>
                {finance?.courses?.map((c, i) => {
                  const share = finance.totalRevenue > 0 ? (Number(c.revenue) / Number(finance.totalRevenue)) * 100 : 0;
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-sm text-gray-500">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-800">{c.courseName}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{Number(c.price).toLocaleString()} so'm</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-800">{c.studentCount} ta</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-emerald-600">{Number(c.revenue).toLocaleString()} so'm</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-violet-500 rounded-full h-2 transition-all" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-500 w-12">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!finance?.courses || finance.courses.length === 0) && (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Ma'lumot topilmadi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {finance?.courses?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Daromad taqsimoti</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {finance.courses.map((c, i) => {
              const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500'];
              const share = finance.totalRevenue > 0 ? (Number(c.revenue) / Number(finance.totalRevenue)) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.courseName}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{share.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
