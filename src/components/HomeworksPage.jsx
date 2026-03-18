import { useState, useEffect } from 'react';
import { ClipboardList, Search, Eye, CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';

export default function HomeworksPage() {
  const { user } = useAuth();

  if (user?.role === 'TEACHER') return <TeacherHomeworks />;
  if (user?.role === 'STUDENT') return <StudentHomeworks />;
  return <p className="text-gray-500">Bu sahifaga ruxsat yo'q</p>;
}

function TeacherHomeworks() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [reviewForm, setReviewForm] = useState({ homeworkId: '', studentId: '', score: 70, status: 'APPROVED', feedback: '' });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/erp/teacher/dashboard');
      setDashboard(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadSubmissions = async (homeworkId) => {
    try {
      const res = await api.get(`/erp/teacher/homeworks/${homeworkId}/submissions`);
      setSubmissionsMap(prev => ({ ...prev, [homeworkId]: res.data?.data || [] }));
    } catch (e) { console.error(e); }
  };

  const submitReview = async () => {
    try {
      await api.post('/erp/teacher/homeworks/review', {
        homeworkId: Number(reviewForm.homeworkId),
        studentId: Number(reviewForm.studentId),
        score: Number(reviewForm.score),
        status: reviewForm.status,
        feedback: reviewForm.feedback || undefined,
      });
      setShowReview(false);
      loadSubmissions(reviewForm.homeworkId);
    } catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vazifalar boshqaruvi</h1>

      <div className="space-y-4">
        {dashboard?.recentHomeworks?.map((hw) => (
          <div key={hw.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">{hw.title}</h3>
                <p className="text-sm text-gray-500">
                  Max urinish: {hw.maxAttempts} •
                  {hw.deadlineAt ? ` Deadline: ${new Date(hw.deadlineAt).toLocaleDateString('uz-UZ')}` : ' Deadline belgilanmagan'}
                </p>
              </div>
              <button
                onClick={() => loadSubmissions(hw.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-600 rounded-xl text-sm font-medium hover:bg-violet-100 transition"
              >
                <Eye size={14} /> Topshiriqlarni ko'rish
              </button>
            </div>

            
            {submissionsMap[hw.id] && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Topshiriqlar ({submissionsMap[hw.id].length})</p>
                {submissionsMap[hw.id].length > 0 ? (
                  <div className="space-y-2">
                    {submissionsMap[hw.id].map((sub, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                          {sub.student?.fullName?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{sub.student?.fullName || `Student #${sub.studentId}`}</p>
                          <p className="text-xs text-gray-400">{sub.title} • Urinish #{sub.attemptNo}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${sub.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                          sub.status === 'MISSED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>{sub.status}</span>
                        <button
                          onClick={() => {
                            setReviewForm({ homeworkId: String(hw.id), studentId: String(sub.studentId), score: 70, status: 'APPROVED', feedback: '' });
                            setShowReview(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          Baholash
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Hali hech kim topshirmagan</p>
                )}
              </div>
            )}
          </div>
        ))}

        {(!dashboard?.recentHomeworks || dashboard.recentHomeworks.length === 0) && (
          <div className="text-center py-12 text-gray-400">Vazifalar topilmadi</div>
        )}
      </div>

      
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReview(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Baholash</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ball (0-100)</label>
                <input type="number" min={0} max={100} value={reviewForm.score} onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Holat</label>
                <select value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="APPROVED">Tasdiqlash</option>
                  <option value="REJECTED">Rad etish</option>
                  <option value="PENDING">Kutish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh</label>
                <textarea value={reviewForm.feedback} onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" placeholder="Talabaga izoh yozing..." />
              </div>
              <button onClick={submitReview} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition">
                Baholash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentHomeworks() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedHw, setSelectedHw] = useState(null);
  const [submitForm, setSubmitForm] = useState({ title: '', file: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/erp/student/dashboard');
      setDashboard(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!selectedHw) return;
    try {
      await api.post('/erp/student/submissions', {
        homeworkId: selectedHw.id,
        title: submitForm.title,
        file: submitForm.file || undefined,
      });
      setShowSubmit(false);
      setSubmitForm({ title: '', file: '' });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mening vazifalarim</h1>

      <div className="space-y-3">
        {dashboard?.homeworks?.map((hw) => (
          <div key={hw.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition ${hw.submitted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100 hover:border-violet-200'
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hw.submitted ? 'bg-emerald-100' : 'bg-violet-100'
              }`}>
              {hw.submitted ? <CheckCircle2 size={18} className="text-emerald-600" /> : <ClipboardList size={18} className="text-violet-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{hw.title}</p>
              <p className="text-xs text-gray-400">{hw.lesson?.title} {hw.deadlineAt ? `• ${new Date(hw.deadlineAt).toLocaleDateString('uz-UZ')}` : ''}</p>
            </div>
            {!hw.submitted && (
              <button onClick={() => { setSelectedHw(hw); setShowSubmit(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white rounded-xl text-xs font-medium hover:bg-violet-600 transition">
                <Send size={14} /> Topshirish
              </button>
            )}
          </div>
        ))}
        {(!dashboard?.homeworks || dashboard.homeworks.length === 0) && (
          <div className="text-center py-12 text-gray-400">Vazifalar topilmadi</div>
        )}
      </div>

      {showSubmit && selectedHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSubmit(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vazifani topshirish</h3>
            <p className="text-sm text-violet-600 font-medium mb-4">{selectedHw.title}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sarlavha</label>
                <input type="text" value={submitForm.title} onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fayl (ixtiyoriy)</label>
                <input type="text" value={submitForm.file} onChange={(e) => setSubmitForm({ ...submitForm, file: e.target.value })} placeholder="Fayl URL" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <button onClick={submit} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition">Topshirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
