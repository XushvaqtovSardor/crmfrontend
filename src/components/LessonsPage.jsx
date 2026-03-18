import { useState, useEffect } from 'react';
import { BookOpen, Plus, Video, Loader2, X } from 'lucide-react';
import api from '../api.js';

export default function LessonsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ groupId: '', title: '' });
  const [videoForm, setVideoForm] = useState({ lessonId: '', file: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/erp/teacher/dashboard');
      setDashboard(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createLesson = async () => {
    try {
      await api.post('/erp/teacher/lessons', {
        groupId: Number(lessonForm.groupId),
        title: lessonForm.title,
      });
      setShowModal(false);
      setLessonForm({ groupId: '', title: '' });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  const uploadVideo = async () => {
    try {
      await api.post('/erp/teacher/videos', {
        lessonId: Number(videoForm.lessonId),
        file: videoForm.file,
      });
      setShowVideoModal(false);
      setVideoForm({ lessonId: '', file: '' });
      alert('Video yuklandi!');
    } catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Darslar</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium text-sm hover:bg-violet-600 transition shadow-lg shadow-violet-200">
            <Plus size={18} /> Yangi dars
          </button>
          <button onClick={() => setShowVideoModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition">
            <Video size={18} /> Video yuklash
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-violet-600">{dashboard?.lessonCount || 0}</p>
            <p className="text-sm text-violet-500">Jami darslar</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{dashboard?.groupCount || 0}</p>
            <p className="text-sm text-blue-500">Guruhlar</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-3">So'nggi darslar</h3>
        <div className="space-y-2">
          {dashboard?.recentHomeworks?.length > 0 ? (
            <p className="text-sm text-gray-500">Darslar dashboard orqali ko'rsatiladi. Dars ochish uchun yuqoridagi tugmani bosing.</p>
          ) : (
            <div className="text-center py-8">
              <BookOpen size={40} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Dars yaratish uchun "Yangi dars" tugmasini bosing</p>
            </div>
          )}
        </div>
      </div>

      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Yangi dars yaratish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Guruh ID</label>
                <input type="number" value={lessonForm.groupId} onChange={(e) => setLessonForm({ ...lessonForm, groupId: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dars mavzusi</label>
                <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <button onClick={createLesson} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition">Yaratish</button>
            </div>
          </div>
        </div>
      )}

      
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowVideoModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Video yuklash</h3>
              <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dars ID</label>
                <input type="number" value={videoForm.lessonId} onChange={(e) => setVideoForm({ ...videoForm, lessonId: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video URL/Fayl</label>
                <input type="text" value={videoForm.file} onChange={(e) => setVideoForm({ ...videoForm, file: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <button onClick={uploadVideo} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition">Yuklash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
