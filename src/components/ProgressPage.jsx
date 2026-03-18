import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, BarChart3, Loader2 } from 'lucide-react';
import api from '../api.js';

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/erp/student/progress');
      setProgress(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;

  const avgScore = progress?.averageScore || 0;
  const submissions = progress?.submissions || [];
  const grades = progress?.grades || [];

  const getGradeInfo = (score) => {
    if (score >= 90) return { label: "A'lo", color: 'text-emerald-600 bg-emerald-50', bar: 'bg-emerald-500' };
    if (score >= 70) return { label: 'Yaxshi', color: 'text-blue-600 bg-blue-50', bar: 'bg-blue-500' };
    if (score >= 50) return { label: "Qoniqarli", color: 'text-amber-600 bg-amber-50', bar: 'bg-amber-500' };
    return { label: "Qoniqarsiz", color: 'text-red-600 bg-red-50', bar: 'bg-red-500' };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mening natijalarim</h1>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white">
          <Target size={24} className="mb-2" />
          <p className="text-sm text-violet-200">O'rtacha ball</p>
          <h3 className="text-4xl font-bold mt-1">{Math.round(avgScore)}%</h3>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${getGradeInfo(avgScore).color}`}>
            {getGradeInfo(avgScore).label}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <Award size={24} className="text-emerald-500 mb-2" />
          <p className="text-sm text-gray-500">Jami topshiriqlar</p>
          <h3 className="text-4xl font-bold text-gray-900 mt-1">{submissions.length}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <TrendingUp size={24} className="text-blue-500 mb-2" />
          <p className="text-sm text-gray-500">Baholar</p>
          <h3 className="text-4xl font-bold text-gray-900 mt-1">{grades.length}</h3>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Topshiriqlar tarixi</h3>
        <div className="space-y-3">
          {submissions.length > 0 ? submissions.map((s, i) => {
            const gi = getGradeInfo(s.score || 0);
            return (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gi.color}`}>
                  <span className="text-lg font-bold">{s.score || '—'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400">
                    {s.status === 'COMPLETED' ? '✅ Bajarildi' : s.status === 'MISSED' ? '❌ O\'tkazib yuborildi' : '⏳ Kechiktirildi'}
                    {s.feedback && ` • ${s.feedback}`}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('uz-UZ')}</span>
              </div>
            );
          }) : (
            <p className="text-center text-gray-400 py-8 text-sm">Topshiriqlar topilmadi</p>
          )}
        </div>
      </div>

      
      {grades.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Baholar</h3>
          <div className="space-y-3">
            {grades.map((g, i) => {
              const gi = getGradeInfo(g.score);
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-8">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{g.title}</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                      <div className={`${gi.bar} rounded-full h-2`} style={{ width: `${g.score}%` }} />
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-xl ${gi.color}`}>
                    {g.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
