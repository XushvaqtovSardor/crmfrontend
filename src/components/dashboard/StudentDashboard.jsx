import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  RefreshCcw,
  Send,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';

function pickPayload(response) {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response;
}

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colorMap = {
    violet: 'bg-violet-100 text-violet-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={22} />
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-[34px] leading-none font-bold text-gray-900 mt-2">{value}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

function getGradeMeta(score) {
  if (score >= 90) return { label: "A'lo", className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (score >= 70) return { label: 'Yaxshi', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (score >= 50) return { label: 'Qoniqarli', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Qoniqarsiz', className: 'bg-red-100 text-red-700 border-red-200' };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submitForm, setSubmitForm] = useState({ title: '', file: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashRes, progressRes] = await Promise.allSettled([
        api.get('/erp/student/dashboard'),
        api.get('/erp/student/progress'),
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(pickPayload(dashRes.value));
      if (progressRes.status === 'fulfilled') setProgress(pickPayload(progressRes.value));

      if (dashRes.status === 'rejected' && progressRes.status === 'rejected') {
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

  const homeworks = useMemo(() => (Array.isArray(dashboard?.homeworks) ? dashboard.homeworks : []), [dashboard]);
  const submissions = useMemo(() => (Array.isArray(progress?.submissions) ? progress.submissions : []), [progress]);

  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((submission) => submission.status === 'APPROVED').length;
  const avgScore = Number(progress?.averageScore) || 0;
  const progressPercent = homeworks.length ? Math.round((totalSubmissions / homeworks.length) * 100) : 0;
  const gradeMeta = getGradeMeta(avgScore);

  const stats = [
    { title: 'Berilgan vazifalar', value: homeworks.length, icon: ClipboardList, color: 'violet' },
    { title: 'Topshirilgan', value: totalSubmissions, icon: CheckCircle2, color: 'emerald' },
    { title: 'Tasdiqlangan', value: approvedCount, icon: Trophy, color: 'blue' },
    {
      title: "O'rtacha ball",
      value: `${Math.round(avgScore)}%`,
      icon: Target,
      color: 'amber',
      subtitle: "Barcha vazifalar bo'yicha",
    },
  ];

  const submitHomework = async () => {
    if (!selectedHomework) return;

    try {
      setSubmitting(true);
      setError('');
      await api.post('/erp/student/submissions', {
        homeworkId: selectedHomework.id,
        title: submitForm.title.trim() || selectedHomework.title,
        file: submitForm.file.trim() || undefined,
      });
      setShowSubmitModal(false);
      setSubmitForm({ title: '', file: '' });
      setSelectedHomework(null);
      await loadData();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Vazifani topshirishda xatolik yuz berdi'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !dashboard && !progress) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Salom, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-2">Talaba boshqaruv paneli</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-4xl lg:text-[48px] font-bold text-gray-900">Salom, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-2 text-lg">Talaba boshqaruv paneli</p>
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

      <div className="mb-6 rounded-2xl border border-[#e6e9f2] bg-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Sizning progressingiz</h2>
            <p className="text-sm text-gray-500 mt-1">Vazifalar bo'yicha umumiy holat va natijalar</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[34px] leading-none font-bold text-gray-900">{Math.round(avgScore)}%</p>
              <p className="text-xs text-gray-500 mt-1">O'rtacha ball</p>
            </div>
            <span className={`h-10 px-3 rounded-xl border text-sm font-semibold inline-flex items-center ${gradeMeta.className}`}>
              {gradeMeta.label}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Progress</span>
            <span>{totalSubmissions} / {homeworks.length} vazifa</span>
          </div>
          <div className="h-3 rounded-full bg-[#e7ebf5] overflow-hidden">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-[#e6e9f2] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eef2f9] flex items-center justify-between">
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList size={18} className="text-violet-500" />
              Berilgan vazifalar
            </h3>
          </div>

          <div className="p-6 space-y-3">
            {homeworks.length > 0 ? homeworks.map((homework) => {
              const isSubmitted = Boolean(homework.submitted);
              const isOverdue = homework.deadlineAt && new Date(homework.deadlineAt) < new Date() && !isSubmitted;

              return (
                <div
                  key={homework.id}
                  className={`rounded-xl border px-3.5 py-3 flex items-center gap-3 ${isSubmitted
                    ? 'bg-emerald-50 border-emerald-100'
                    : isOverdue
                      ? 'bg-red-50 border-red-100'
                      : 'bg-[#fafbff] border-[#ecf0f8]'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmitted
                    ? 'bg-emerald-100 text-emerald-600'
                    : isOverdue
                      ? 'bg-red-100 text-red-600'
                      : 'bg-violet-100 text-violet-600'
                    }`}>
                    {isSubmitted ? <CheckCircle2 size={17} /> : isOverdue ? <AlertTriangle size={17} /> : <FileText size={17} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{homework.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{homework.lesson?.title || '--'}</span>
                      {homework.deadlineAt && (
                        <span className={`text-xs inline-flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                          <CalendarDays size={12} />
                          {new Date(homework.deadlineAt).toLocaleDateString('uz-UZ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={() => { setSelectedHomework(homework); setShowSubmitModal(true); }}
                      className="h-9 px-3 rounded-lg bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-violet-600 transition"
                    >
                      <Send size={14} />
                      Topshirish
                    </button>
                  ) : (
                    <span className="h-8 px-3 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center">
                      Topshirilgan
                    </span>
                  )}
                </div>
              );
            }) : (
              <div className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] px-4 py-10 text-center">
                <Zap size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Hozircha vazifalar yo'q</p>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#eef2f9] flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-violet-500" />
                Natijalarim
              </h3>
            </div>

            <div className="p-6 space-y-3">
              {submissions.length > 0 ? submissions.slice(0, 5).map((submission) => (
                <div key={submission.id || submission.title} className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] p-3.5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${submission.score >= 70
                    ? 'bg-emerald-100 text-emerald-700'
                    : submission.score >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {submission.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{submission.title}</p>
                    <span className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full ${submission.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : submission.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {submission.status === 'APPROVED' ? 'Tasdiqlangan' : submission.status === 'REJECTED' ? 'Rad etilgan' : 'Kutilmoqda'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] px-4 py-8 text-center text-sm text-gray-400">
                  Natijalar yo'q.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6e9f2] bg-white p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Trophy size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Davom eting</h3>
            <p className="text-sm text-gray-500 mt-1">
              {avgScore >= 70
                ? "Ajoyib natijalar. Shu tempda davom eting."
                : "Har bir topshiriq sizni maqsadga yaqinlashtiradi."}
            </p>
          </section>
        </div>
      </div>

      {showSubmitModal && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-[#e6e9f2]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Vazifani topshirish</h3>
              <button type="button" onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>

            <div className="mb-4 p-3 bg-violet-50 rounded-xl border border-violet-100">
              <p className="text-sm font-semibold text-violet-700">{selectedHomework.title}</p>
              {selectedHomework.deadlineAt && (
                <p className="text-xs text-violet-600 mt-1">
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
                  onChange={(event) => setSubmitForm({ ...submitForm, title: event.target.value })}
                  placeholder="Topshiriq sarlavhasi"
                  className="w-full border border-[#dbe1f1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fayl (ixtiyoriy)</label>
                <input
                  type="text"
                  value={submitForm.file}
                  onChange={(event) => setSubmitForm({ ...submitForm, file: event.target.value })}
                  placeholder="Fayl URL yoki yo'li"
                  className="w-full border border-[#dbe1f1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={submitHomework}
                disabled={submitting}
                className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Send size={18} />
                {submitting ? 'Yuborilmoqda...' : 'Topshirish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
