import { useState, useEffect } from 'react';
import {
  Layers3, BookOpen, Video, ClipboardList, CheckCircle2,
  Clock, AlertTriangle, Plus, Eye, FileText, Star,
  Upload, Send, Users, Calendar,
} from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import api from '../../api.js';

function StatCard({ title, value, icon, color }) {
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
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ groupId: '', title: '' });
  const [videoForm, setVideoForm] = useState({ lessonId: '', file: '' });
  const [homeworkForm, setHomeworkForm] = useState({
    lessonId: '', title: '', file: '', durationTime: 16,
    deadlineAt: '', maxAttempts: 1, allowLateSubmission: false,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/erp/teacher/dashboard');
      setDashboard(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async () => {
    try {
      await api.post('/erp/teacher/lessons', {
        groupId: Number(lessonForm.groupId),
        title: lessonForm.title,
      });
      setShowLessonModal(false);
      setLessonForm({ groupId: '', title: '' });
      loadDashboard();
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    }
  };

  const uploadVideo = async () => {
    try {
      await api.post('/erp/teacher/videos', {
        lessonId: Number(videoForm.lessonId),
        file: videoForm.file,
      });
      setShowVideoModal(false);
      setVideoForm({ lessonId: '', file: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    }
  };

  const assignHomework = async () => {
    try {
      await api.post('/erp/teacher/homeworks', {
        lessonId: Number(homeworkForm.lessonId),
        title: homeworkForm.title,
        file: homeworkForm.file || undefined,
        durationTime: Number(homeworkForm.durationTime),
        deadlineAt: homeworkForm.deadlineAt ? new Date(homeworkForm.deadlineAt).toISOString() : undefined,
        maxAttempts: Number(homeworkForm.maxAttempts),
        allowLateSubmission: homeworkForm.allowLateSubmission,
      });
      setShowHomeworkModal(false);
      setHomeworkForm({ lessonId: '', title: '', file: '', durationTime: 16, deadlineAt: '', maxAttempts: 1, allowLateSubmission: false });
      loadDashboard();
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    }
  };

  const stats = [
    { title: 'Guruhlarim', value: dashboard?.groupCount || 0, icon: Layers3, color: 'violet' },
    { title: 'Darslarim', value: dashboard?.lessonCount || 0, icon: BookOpen, color: 'blue' },
    { title: 'Vazifalar', value: dashboard?.homeworkCount || 0, icon: ClipboardList, color: 'emerald' },
    { title: 'Tekshirish kerak', value: dashboard?.pendingReviews || 0, icon: AlertTriangle, color: 'amber' },
  ];

  return (
    <div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Salom, {user?.fullName}! 👨‍🏫
          </h1>
          <p className="text-gray-500 mt-1">O'qituvchi boshqaruv paneli</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowLessonModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium text-sm hover:bg-violet-600 transition shadow-lg shadow-violet-200"
          >
            <Plus size={18} /> Dars yaratish
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition"
          >
            <Upload size={18} /> Video yuklash
          </button>
          <button
            onClick={() => setShowHomeworkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 transition"
          >
            <ClipboardList size={18} /> Vazifa berish
          </button>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Yaqinlashayotgan deadlinelar</h3>
            <Clock size={18} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboard?.upcomingDeadlines?.length > 0 ? (
              dashboard.upcomingDeadlines.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{d.title}</p>
                    <p className="text-xs text-gray-500">Dars: {d.lesson?.title}</p>
                  </div>
                  <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                    {new Date(d.deadlineAt).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 size={40} className="text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Hozircha deadline yo'q 🎉</p>
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">So'nggi vazifalar</h3>
            <FileText size={18} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboard?.recentHomeworks?.length > 0 ? (
              dashboard.recentHomeworks.map((h, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{h.title}</p>
                    <p className="text-xs text-gray-400">
                      Max urinish: {h.maxAttempts} • {h.allowLateSubmission ? 'Kech ruxsat' : 'Kech ruxsat yo\'q'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(h.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">Vazifalar topilmadi</p>
            )}
          </div>
        </div>
      </div>

      

      
      {showLessonModal && (
        <Modal title="Yangi dars yaratish" onClose={() => setShowLessonModal(false)}>
          <div className="space-y-4">
            <InputField label="Guruh ID" value={lessonForm.groupId} onChange={(v) => setLessonForm({ ...lessonForm, groupId: v })} placeholder="Guruh raqami" />
            <InputField label="Dars mavzusi" value={lessonForm.title} onChange={(v) => setLessonForm({ ...lessonForm, title: v })} placeholder="Mavzuni kiriting" />
            <button onClick={createLesson} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition">
              Yaratish
            </button>
          </div>
        </Modal>
      )}

      
      {showVideoModal && (
        <Modal title="Video yuklash" onClose={() => setShowVideoModal(false)}>
          <div className="space-y-4">
            <InputField label="Dars ID" value={videoForm.lessonId} onChange={(v) => setVideoForm({ ...videoForm, lessonId: v })} placeholder="Dars raqami" />
            <InputField label="Video fayl/URL" value={videoForm.file} onChange={(v) => setVideoForm({ ...videoForm, file: v })} placeholder="URL yoki fayl yo'li" />
            <button onClick={uploadVideo} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition">
              Yuklash
            </button>
          </div>
        </Modal>
      )}

      
      {showHomeworkModal && (
        <Modal title="Vazifa biriktirish" onClose={() => setShowHomeworkModal(false)}>
          <div className="space-y-4">
            <InputField label="Dars ID" value={homeworkForm.lessonId} onChange={(v) => setHomeworkForm({ ...homeworkForm, lessonId: v })} placeholder="Dars raqami" />
            <InputField label="Sarlavha" value={homeworkForm.title} onChange={(v) => setHomeworkForm({ ...homeworkForm, title: v })} placeholder="Vazifa sarlavhasi" />
            <InputField label="Fayl (ixtiyoriy)" value={homeworkForm.file} onChange={(v) => setHomeworkForm({ ...homeworkForm, file: v })} placeholder="Fayl URL" />
            <InputField label="Davomiylik (soat)" value={homeworkForm.durationTime} onChange={(v) => setHomeworkForm({ ...homeworkForm, durationTime: v })} type="number" />
            <InputField label="Deadline" value={homeworkForm.deadlineAt} onChange={(v) => setHomeworkForm({ ...homeworkForm, deadlineAt: v })} type="datetime-local" />
            <InputField label="Max urinishlar" value={homeworkForm.maxAttempts} onChange={(v) => setHomeworkForm({ ...homeworkForm, maxAttempts: v })} type="number" />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={homeworkForm.allowLateSubmission}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, allowLateSubmission: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-sm font-medium text-gray-700">Kech topshirishga ruxsat</span>
            </label>
            <button onClick={assignHomework} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition">
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
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />
    </div>
  );
}
