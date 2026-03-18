import { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, CheckCircle2, Clock, AlertTriangle,
  Send, Trophy, TrendingUp, BarChart3, FileText, Star,
  Calendar, Target, Award, Zap,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';

function StatCard({ title, value, icon, color, subtitle }) {
  const IconComponent = icon;
  const colorMap = {
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
      <div className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        <IconComponent size={22} />
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submitForm, setSubmitForm] = useState({ title: '', file: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, progressRes] = await Promise.allSettled([
        api.get('/erp/student/dashboard'),
        api.get('/erp/student/progress'),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data?.data);
      if (progressRes.status === 'fulfilled') setProgress(progressRes.value.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitHomework = async () => {
    if (!selectedHomework) return;
    try {
      await api.post('/erp/student/submissions', {
        homeworkId: selectedHomework.id,
        title: submitForm.title,
        file: submitForm.file || undefined,
      });
      setShowSubmitModal(false);
      setSubmitForm({ title: '', file: '' });
      setSelectedHomework(null);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    }
  };

  const totalSubmissions = progress?.submissions?.length || 0;
  const approvedCount = progress?.submissions?.filter(s => s.status === 'APPROVED')?.length || 0;
  const avgScore = progress?.averageScore || 0;

  const stats = [
    { title: 'Berilgan vazifalar', value: dashboard?.homeworks?.length || 0, icon: ClipboardList, color: 'violet' },
    { title: 'Topshirilgan', value: totalSubmissions, icon: CheckCircle2, color: 'emerald' },
    { title: 'Tasdiqlangan', value: approvedCount, icon: Trophy, color: 'blue' },
    { title: "O'rtacha ball", value: `${Math.round(avgScore)}%`, icon: Target, color: 'amber', subtitle: 'Barcha vazifalar bo\'yicha' },
  ];
  const getGrade = (score) => {
    if (score >= 90) return { label: "A'lo", color: 'text-emerald-600 bg-emerald-50', emoji: '🏆' };
    if (score >= 70) return { label: 'Yaxshi', color: 'text-blue-600 bg-blue-50', emoji: '⭐' };
    if (score >= 50) return { label: "Qoniqarli", color: 'text-amber-600 bg-amber-50', emoji: '📚' };
    return { label: "Qoniqarsiz", color: 'text-red-600 bg-red-50', emoji: '📖' };
  };

  const grade = getGrade(avgScore);

  return (
    <div>
      
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Salom, {user?.fullName}! 🎓
        </h1>
        <p className="text-gray-500 mt-1">Talaba boshqaruv paneli</p>
      </div>

      
      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Sizning progressingiz</h2>
            <p className="text-violet-200 text-sm">Davom eting, siz yaxshi yo'ldasiz!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{Math.round(avgScore)}%</p>
              <p className="text-xs text-violet-200">O'rtacha ball</p>
            </div>
            <div className={`px-4 py-2 rounded-xl ${grade.color} text-sm font-bold`}>
              {grade.emoji} {grade.label}
            </div>
          </div>
        </div>

        
        <div className="mt-4">
          <div className="flex justify-between text-xs text-violet-200 mb-1">
            <span>Progress</span>
            <span>{totalSubmissions} / {dashboard?.homeworks?.length || 0} vazifa</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${dashboard?.homeworks?.length ? (totalSubmissions / dashboard.homeworks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))
          : stats.map((s, i) => <StatCard key={i} {...s} />)
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Berilgan vazifalar</h3>
            <ClipboardList size={18} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboard?.homeworks?.length > 0 ? (
              dashboard.homeworks.map((hw) => {
                const isSubmitted = hw.submitted;
                const isOverdue = hw.deadlineAt && new Date(hw.deadlineAt) < new Date() && !isSubmitted;

                return (
                  <div key={hw.id} className={`flex items-center gap-3 p-4 rounded-xl border transition ${isSubmitted ? 'bg-emerald-50 border-emerald-100' :
                    isOverdue ? 'bg-red-50 border-red-100' :
                      'bg-white border-gray-100 hover:border-violet-200'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmitted ? 'bg-emerald-100' : isOverdue ? 'bg-red-100' : 'bg-violet-100'
                      }`}>
                      {isSubmitted ? <CheckCircle2 size={18} className="text-emerald-600" /> :
                        isOverdue ? <AlertTriangle size={18} className="text-red-600" /> :
                          <FileText size={18} className="text-violet-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{hw.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{hw.lesson?.title}</span>
                        {hw.deadlineAt && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                              <Calendar size={10} className="inline mr-1" />
                              {new Date(hw.deadlineAt).toLocaleDateString('uz-UZ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!isSubmitted && (
                      <button
                        onClick={() => { setSelectedHomework(hw); setShowSubmitModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white rounded-lg text-xs font-medium hover:bg-violet-600 transition shrink-0"
                      >
                        <Send size={14} /> Topshirish
                      </button>
                    )}
                    {isSubmitted && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg">
                        ✓ Topshirilgan
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Zap size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Hozircha vazifalar yo'q</p>
              </div>
            )}
          </div>
        </div>

        
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Natijalarim</h3>
              <Award size={18} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {progress?.submissions?.length > 0 ? (
                progress.submissions.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.score >= 70 ? 'bg-emerald-50' : s.score >= 50 ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                      <span className={`text-sm font-bold ${s.score >= 70 ? 'text-emerald-600' : s.score >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>{s.score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                        s.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                        {s.status === 'APPROVED' ? 'Tasdiqlangan' :
                          s.status === 'REJECTED' ? 'Rad etilgan' : 'Kutilmoqda'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">Natijalar yo'q</p>
              )}
            </div>
          </div>

          
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
            <Trophy size={32} className="mb-3" />
            <h3 className="text-lg font-bold mb-1">Davom eting!</h3>
            <p className="text-amber-100 text-sm">
              {avgScore >= 70
                ? "Ajoyib natijalar! Shu yo'lda davom eting 🔥"
                : "Har bir urinish sizni maqsadga yaqinlashtiradi 💪"}
            </p>
          </div>
        </div>
      </div>

      
      {showSubmitModal && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Vazifani topshirish</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="mb-4 p-3 bg-violet-50 rounded-xl">
              <p className="text-sm font-medium text-violet-700">{selectedHomework.title}</p>
              {selectedHomework.deadlineAt && (
                <p className="text-xs text-violet-500 mt-1">
                  Deadline: {new Date(selectedHomework.deadlineAt).toLocaleString('uz-UZ')}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topshiriq nomi</label>
                <input
                  type="text"
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                  placeholder="Topshiriq sarlavhasi"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fayl (ixtiyoriy)</label>
                <input
                  type="text"
                  value={submitForm.file}
                  onChange={(e) => setSubmitForm({ ...submitForm, file: e.target.value })}
                  placeholder="Fayl URL yoki yo'li"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>
              <button
                onClick={submitHomework}
                className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition flex items-center justify-center gap-2"
              >
                <Send size={18} /> Topshirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
