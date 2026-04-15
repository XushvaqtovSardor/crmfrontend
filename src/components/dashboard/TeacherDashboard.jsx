import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Layers3,
  Plus,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';
import { getApiErrorMessage } from '../../utils/http.js';

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

function Panel({ title, icon: Icon, children, right }) {
  return (
    <section className="bg-white rounded-2xl border border-[#e6e9f2] shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-[#eef2f9] flex items-center justify-between gap-3">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Icon size={18} className="text-violet-500" />
          {title}
        </h3>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ActionButton({ onClick, icon: Icon, children, tone }) {
  const toneMap = {
    violet: 'bg-violet-500 hover:bg-violet-600 shadow-violet-200',
    blue: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-4 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 transition shadow ${toneMap[tone]}`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ groupId: '', title: '' });
  const [videoForm, setVideoForm] = useState({ lessonId: '', file: '' });
  const [homeworkForm, setHomeworkForm] = useState({
    lessonId: '',
    title: '',
    file: '',
    durationTime: 16,
    deadlineAt: '',
    maxAttempts: 1,
    allowLateSubmission: false,
  });

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/erp/teacher/dashboard');
      setDashboard(pickPayload(response));
    } catch (e) {
      setError(getApiErrorMessage(e, "Dashboard ma'lumotlarini yuklashda xatolik"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const createLesson = async () => {
    if (!lessonForm.groupId || !lessonForm.title.trim()) {
      setError('Guruh ID va dars mavzusi majburiy.');
      return;
    }

    try {
      setError('');
      await api.post('/erp/teacher/lessons', {
        groupId: Number(lessonForm.groupId),
        title: lessonForm.title.trim(),
      });
      setShowLessonModal(false);
      setLessonForm({ groupId: '', title: '' });
      await loadDashboard();
    } catch (e) {
      setError(getApiErrorMessage(e, "Dars yaratishda xatolik yuz berdi"));
    }
  };

  const uploadVideo = async () => {
    if (!videoForm.lessonId || !videoForm.file.trim()) {
      setError('Dars ID va video maydoni majburiy.');
      return;
    }

    try {
      setError('');
      await api.post('/erp/teacher/videos', {
        lessonId: Number(videoForm.lessonId),
        file: videoForm.file.trim(),
      });
      setShowVideoModal(false);
      setVideoForm({ lessonId: '', file: '' });
    } catch (e) {
      setError(getApiErrorMessage(e, 'Video yuklashda xatolik yuz berdi'));
    }
  };

  const assignHomework = async () => {
    if (!homeworkForm.lessonId || !homeworkForm.title.trim()) {
      setError('Dars ID va vazifa sarlavhasi majburiy.');
      return;
    }

    try {
      setError('');
      await api.post('/erp/teacher/homeworks', {
        lessonId: Number(homeworkForm.lessonId),
        title: homeworkForm.title.trim(),
        file: homeworkForm.file.trim() || undefined,
        durationTime: Number(homeworkForm.durationTime),
        deadlineAt: homeworkForm.deadlineAt ? new Date(homeworkForm.deadlineAt).toISOString() : undefined,
        maxAttempts: Number(homeworkForm.maxAttempts),
        allowLateSubmission: homeworkForm.allowLateSubmission,
      });
      setShowHomeworkModal(false);
      setHomeworkForm({
        lessonId: '',
        title: '',
        file: '',
        durationTime: 16,
        deadlineAt: '',
        maxAttempts: 1,
        allowLateSubmission: false,
      });
      await loadDashboard();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Vazifa biriktirishda xatolik yuz berdi'));
    }
  };

  const stats = [
    { title: 'Guruhlarim', value: dashboard?.groupCount || 0, icon: Layers3, color: 'violet' },
    { title: 'Darslarim', value: dashboard?.lessonCount || 0, icon: BookOpen, color: 'blue' },
    { title: 'Vazifalar', value: dashboard?.homeworkCount || 0, icon: ClipboardList, color: 'emerald' },
    { title: 'Tekshirish kerak', value: dashboard?.pendingReviews || 0, icon: AlertTriangle, color: 'amber' },
  ];

  const upcomingDeadlines = Array.isArray(dashboard?.upcomingDeadlines) ? dashboard.upcomingDeadlines : [];
  const recentHomeworks = Array.isArray(dashboard?.recentHomeworks) ? dashboard.recentHomeworks : [];

  if (loading && !dashboard) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Salom, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-2">O'qituvchi boshqaruv paneli</p>
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
          <p className="text-gray-500 mt-2 text-lg">O'qituvchi boshqaruv paneli</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadDashboard}
            className="h-10 px-4 rounded-xl border border-[#dbe1f1] bg-white text-gray-600 text-sm font-semibold flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Yangilash
          </button>
          <ActionButton tone="violet" onClick={() => setShowLessonModal(true)} icon={Plus}>Dars yaratish</ActionButton>
          <ActionButton tone="blue" onClick={() => setShowVideoModal(true)} icon={Upload}>Video yuklash</ActionButton>
          <ActionButton tone="emerald" onClick={() => setShowHomeworkModal(true)} icon={ClipboardList}>Vazifa berish</ActionButton>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Yaqinlashayotgan deadlinelar" icon={Clock3}>
          <div className="space-y-3">
            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={17} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">Dars: {item.lesson?.title || '--'}</p>
                </div>
                <span className="text-xs text-amber-700 font-semibold whitespace-nowrap">
                  {item.deadlineAt ? new Date(item.deadlineAt).toLocaleDateString('uz-UZ') : '--'}
                </span>
              </div>
            )) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center text-emerald-700 text-sm font-medium">
                Hozircha deadline yo'q.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="So'nggi vazifalar" icon={FileText}>
          <div className="space-y-3">
            {recentHomeworks.length > 0 ? recentHomeworks.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <FileText size={17} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Max urinish: {item.maxAttempts || 1} | {item.allowLateSubmission ? 'Kech topshirish bor' : 'Kech topshirish yo\'q'}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : '--'}
                </span>
              </div>
            )) : (
              <div className="rounded-xl border border-[#ecf0f8] bg-[#fafbff] px-4 py-6 text-center text-gray-400 text-sm">
                Vazifalar topilmadi.
              </div>
            )}
          </div>
        </Panel>
      </div>

      {showLessonModal && (
        <Modal title="Yangi dars yaratish" onClose={() => setShowLessonModal(false)}>
          <div className="space-y-4">
            <InputField
              label="Guruh ID"
              value={lessonForm.groupId}
              onChange={(v) => setLessonForm({ ...lessonForm, groupId: v })}
              placeholder="Guruh raqami"
            />
            <InputField
              label="Dars mavzusi"
              value={lessonForm.title}
              onChange={(v) => setLessonForm({ ...lessonForm, title: v })}
              placeholder="Mavzuni kiriting"
            />
            <button type="button" onClick={createLesson} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition">
              Yaratish
            </button>
          </div>
        </Modal>
      )}

      {showVideoModal && (
        <Modal title="Video yuklash" onClose={() => setShowVideoModal(false)}>
          <div className="space-y-4">
            <InputField
              label="Dars ID"
              value={videoForm.lessonId}
              onChange={(v) => setVideoForm({ ...videoForm, lessonId: v })}
              placeholder="Dars raqami"
            />
            <InputField
              label="Video fayl yoki URL"
              value={videoForm.file}
              onChange={(v) => setVideoForm({ ...videoForm, file: v })}
              placeholder="URL yoki fayl yo'li"
            />
            <button type="button" onClick={uploadVideo} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition">
              Yuklash
            </button>
          </div>
        </Modal>
      )}

      {showHomeworkModal && (
        <Modal title="Vazifa biriktirish" onClose={() => setShowHomeworkModal(false)}>
          <div className="space-y-4">
            <InputField
              label="Dars ID"
              value={homeworkForm.lessonId}
              onChange={(v) => setHomeworkForm({ ...homeworkForm, lessonId: v })}
              placeholder="Dars raqami"
            />
            <InputField
              label="Sarlavha"
              value={homeworkForm.title}
              onChange={(v) => setHomeworkForm({ ...homeworkForm, title: v })}
              placeholder="Vazifa sarlavhasi"
            />
            <InputField
              label="Fayl (ixtiyoriy)"
              value={homeworkForm.file}
              onChange={(v) => setHomeworkForm({ ...homeworkForm, file: v })}
              placeholder="Fayl URL"
            />
            <InputField
              label="Davomiylik (soat)"
              value={homeworkForm.durationTime}
              onChange={(v) => setHomeworkForm({ ...homeworkForm, durationTime: v })}
              type="number"
            />
            <InputField
              label="Deadline"
              value={homeworkForm.deadlineAt}
              onChange={(v) => setHomeworkForm({ ...homeworkForm, deadlineAt: v })}
              type="datetime-local"
            />
            <InputField
              label="Max urinishlar"
              value={homeworkForm.maxAttempts}
              onChange={(v) => setHomeworkForm({ ...homeworkForm, maxAttempts: v })}
              type="number"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={homeworkForm.allowLateSubmission}
                onChange={(event) => setHomeworkForm({ ...homeworkForm, allowLateSubmission: event.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-sm font-medium text-gray-700">Kech topshirishga ruxsat</span>
            </label>
            <button type="button" onClick={assignHomework} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition">
              Vazifa biriktirish
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-[#e6e9f2]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#dbe1f1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />
    </div>
  );
}
