import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCcw,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

function normalizeList(payload) {
  if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeObject(payload) {
  if (payload?.data?.data) return payload.data.data;
  if (payload?.data) return payload.data;
  return null;
}

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'no-date';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value || value === 'no-date') return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleDateString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(category) {
  if (category === 'accepted') return 'bg-emerald-50 text-emerald-700';
  if (category === 'returned') return 'bg-red-50 text-red-700';
  if (category === 'waiting') return 'bg-amber-50 text-amber-700';
  return 'bg-gray-100 text-gray-500';
}

function statusText(category) {
  if (category === 'accepted') return 'Qabul qilingan';
  if (category === 'returned') return 'Qaytarilgan';
  if (category === 'waiting') return 'Kutayotgan';
  return 'Bajarilmagan';
}

export default function HomeworksPage() {
  const { user } = useAuth();

  if (user?.role === 'TEACHER') return <TeacherHomeworks />;
  if (user?.role === 'STUDENT') return <StudentHomeworks />;
  return <p className="text-gray-500">Bu sahifaga ruxsat yo'q</p>;
}

function TeacherHomeworks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [groupDetails, setGroupDetails] = useState([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(0);

  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const [statusFilter, setStatusFilter] = useState('waiting');
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ score: '70', status: 'APPROVED', feedback: '' });
  const [savingReview, setSavingReview] = useState(false);

  const loadTeacherHomeworkData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const groupsRes = await api.get('/groups/my');
      const groups = normalizeList(groupsRes.data);

      const detailResults = await Promise.allSettled(
        groups.map((group) => api.get(`/groups/${group.id}`)),
      );

      const details = detailResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => normalizeObject(result.value.data))
        .filter(Boolean);

      setGroupDetails(details);
    } catch (e) {
      setError(getApiErrorMessage(e, "Uyga vazifalarni yuklab bo'lmadi"));
      setGroupDetails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeacherHomeworkData();
  }, [loadTeacherHomeworkData]);

  const homeworkCatalog = useMemo(() => {
    const rows = [];

    groupDetails.forEach((group) => {
      const members = Array.isArray(group.studentGroup) ? group.studentGroup : [];
      const students = members
        .map((membership) => membership.student)
        .filter(Boolean)
        .map((student) => ({
          id: student.id,
          fullName: student.fullName,
          email: student.email,
        }));

      const lessons = Array.isArray(group.lessons) ? group.lessons : [];
      lessons.forEach((lesson, lessonIndex) => {
        const homeworks = Array.isArray(lesson.homework) ? lesson.homework : [];

        homeworks.forEach((homework, homeworkIndex) => {
          rows.push({
            ...homework,
            groupId: group.id,
            groupName: group.name,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonOrder: lessonIndex + 1,
            homeworkOrder: homeworkIndex + 1,
            students,
          });
        });
      });
    });

    return rows.sort((left, right) => {
      const leftTime = new Date(left.deadlineAt || left.created_at || 0).getTime();
      const rightTime = new Date(right.deadlineAt || right.created_at || 0).getTime();
      return rightTime - leftTime;
    });
  }, [groupDetails]);

  const dayBuckets = useMemo(() => {
    const map = new Map();

    homeworkCatalog.forEach((homework) => {
      const key = toDateKey(homework.deadlineAt || homework.created_at);
      if (!map.has(key)) {
        map.set(key, {
          key,
          dateText: formatDate(key),
          homeworks: [],
        });
      }
      map.get(key).homeworks.push(homework);
    });

    return Array.from(map.values()).sort((left, right) => {
      if (left.key === 'no-date') return 1;
      if (right.key === 'no-date') return -1;
      return new Date(right.key).getTime() - new Date(left.key).getTime();
    });
  }, [homeworkCatalog]);

  const selectedDayBucket = useMemo(
    () => dayBuckets.find((bucket) => bucket.key === selectedDayKey) || null,
    [dayBuckets, selectedDayKey],
  );

  const selectedHomework = useMemo(() => {
    if (!selectedDayBucket) return null;
    return selectedDayBucket.homeworks.find((homework) => Number(homework.id) === Number(selectedHomeworkId)) || null;
  }, [selectedDayBucket, selectedHomeworkId]);

  useEffect(() => {
    if (!dayBuckets.length) {
      setSelectedDayKey('');
      setSelectedHomeworkId(0);
      return;
    }

    const hasDay = dayBuckets.some((bucket) => bucket.key === selectedDayKey);
    const effectiveDayKey = hasDay ? selectedDayKey : dayBuckets[0].key;

    if (effectiveDayKey !== selectedDayKey) {
      setSelectedDayKey(effectiveDayKey);
      return;
    }

    const day = dayBuckets.find((bucket) => bucket.key === effectiveDayKey);
    const hasHomework = day?.homeworks?.some((homework) => Number(homework.id) === Number(selectedHomeworkId));

    if (!hasHomework) {
      setSelectedHomeworkId(day?.homeworks?.[0]?.id || 0);
    }
  }, [dayBuckets, selectedDayKey, selectedHomeworkId]);

  const loadSubmissions = useCallback(async (homeworkId) => {
    if (!homeworkId) {
      setSubmissions([]);
      return;
    }

    setSubmissionsLoading(true);
    setError('');

    try {
      const res = await api.get(`/erp/teacher/homeworks/${homeworkId}/submissions`);
      setSubmissions(normalizeList(res.data));
    } catch (e) {
      setError(getApiErrorMessage(e, "Topshiriqlarni yuklab bo'lmadi"));
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions(selectedHomework?.id);
  }, [selectedHomework?.id, loadSubmissions]);

  const reviewRows = useMemo(() => {
    if (!selectedHomework) return [];

    const latestByStudent = new Map();
    submissions.forEach((submission) => {
      const studentId = Number(submission.studentId);
      if (!latestByStudent.has(studentId)) {
        latestByStudent.set(studentId, submission);
      }
    });

    return selectedHomework.students.map((student) => {
      const submission = latestByStudent.get(Number(student.id)) || null;
      const grade = submission?.latestGrade || null;

      let category = 'missed';
      if (grade?.status === 'APPROVED') category = 'accepted';
      else if (grade?.status === 'REJECTED') category = 'returned';
      else if (submission) category = 'waiting';

      return {
        student,
        submission,
        grade,
        category,
      };
    });
  }, [selectedHomework, submissions]);

  const reviewCounts = useMemo(() => {
    return reviewRows.reduce((acc, row) => {
      acc[row.category] += 1;
      return acc;
    }, {
      waiting: 0,
      returned: 0,
      accepted: 0,
      missed: 0,
    });
  }, [reviewRows]);

  const filteredRows = useMemo(() => {
    return reviewRows.filter((row) => row.category === statusFilter);
  }, [reviewRows, statusFilter]);

  const openReviewModal = (row) => {
    if (!row?.submission || !selectedHomework) return;

    setReviewTarget(row);
    setReviewForm({
      score: String(row.grade?.score ?? 70),
      status: row.grade?.status || 'APPROVED',
      feedback: row.submission.feedback || '',
    });
    setShowReview(true);
  };

  const submitReview = async () => {
    if (!reviewTarget || !selectedHomework) return;

    const score = Number(reviewForm.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setError('Ball 0 dan 100 gacha bolishi kerak');
      return;
    }

    setSavingReview(true);
    setError('');

    try {
      await api.post('/erp/teacher/homeworks/review', {
        homeworkId: Number(selectedHomework.id),
        studentId: Number(reviewTarget.student.id),
        score,
        status: reviewForm.status,
        feedback: reviewForm.feedback.trim() || undefined,
      });

      setShowReview(false);
      await loadSubmissions(selectedHomework.id);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Baholashda xatolik'));
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Uyga vazifalarni tekshirish</h1>
          <p className="mt-1 text-sm text-gray-500">Har bir kun alohida va har bir oquvchi uchun alohida baholash</p>
        </div>

        <button
          type="button"
          onClick={loadTeacherHomeworkData}
          className="h-10 rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm font-semibold text-gray-700 inline-flex items-center gap-2"
        >
          <RefreshCcw size={15} /> Yangilash
        </button>
      </div>

      <section className="rounded-2xl border border-[#e6ebf6] bg-white p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Kunlar boyicha</p>

        <div className="flex flex-wrap gap-2">
          {dayBuckets.length > 0 ? dayBuckets.map((bucket) => (
            <button
              key={bucket.key}
              type="button"
              onClick={() => setSelectedDayKey(bucket.key)}
              className={`h-10 rounded-xl px-4 text-sm font-semibold border transition ${selectedDayKey === bucket.key
                ? 'border-violet-400 bg-violet-50 text-violet-700'
                : 'border-[#dfe4ef] bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              {bucket.dateText} ({bucket.homeworks.length})
            </button>
          )) : (
            <p className="text-sm text-gray-400 py-4">Uyga vazifalar topilmadi</p>
          )}
        </div>
      </section>

      {selectedDayBucket && (
        <section className="rounded-2xl border border-[#e6ebf6] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e9edf5] flex flex-wrap gap-2">
            {selectedDayBucket.homeworks.map((homework, index) => (
              <button
                key={homework.id}
                type="button"
                onClick={() => setSelectedHomeworkId(homework.id)}
                className={`h-10 rounded-xl px-4 text-sm font-semibold border transition ${Number(selectedHomeworkId) === Number(homework.id)
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-[#dfe4ef] bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {index + 1}. {homework.title}
              </button>
            ))}
          </div>

          {selectedHomework ? (
            <>
              <div className="px-4 py-3 border-b border-[#eef2f8] bg-[#fafbff]">
                <p className="text-base font-semibold text-gray-900">{selectedHomework.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedHomework.groupName} • {selectedHomework.lessonTitle} • Deadline: {formatDateTime(selectedHomework.deadlineAt)}
                </p>
              </div>

              <div className="px-4 py-3 border-b border-[#eef2f8] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('waiting')}
                    className={`h-9 rounded-xl px-3 text-sm font-semibold ${statusFilter === 'waiting' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#f5f7fd] text-gray-500'}`}
                  >
                    Kutayotganlar {reviewCounts.waiting}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('returned')}
                    className={`h-9 rounded-xl px-3 text-sm font-semibold ${statusFilter === 'returned' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[#f5f7fd] text-gray-500'}`}
                  >
                    Qaytarilganlar {reviewCounts.returned}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('accepted')}
                    className={`h-9 rounded-xl px-3 text-sm font-semibold ${statusFilter === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#f5f7fd] text-gray-500'}`}
                  >
                    Qabul qilinganlar {reviewCounts.accepted}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('missed')}
                    className={`h-9 rounded-xl px-3 text-sm font-semibold ${statusFilter === 'missed' ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-[#f5f7fd] text-gray-500'}`}
                  >
                    Bajarilmagan {reviewCounts.missed}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => loadSubmissions(selectedHomework.id)}
                  className="h-9 rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm font-semibold text-gray-700 inline-flex items-center gap-2"
                >
                  <RefreshCcw size={14} /> Qayta yuklash
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-220">
                  <thead>
                    <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Oquvchi ismi</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Uyga vazifa jonatilgan vaqt</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Bahosi</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">Harakat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <Loader2 size={24} className="animate-spin mx-auto text-violet-500" />
                        </td>
                      </tr>
                    ) : filteredRows.length > 0 ? filteredRows.map((row) => (
                      <tr key={row.student.id} className="border-b border-[#f1f4fa] last:border-b-0">
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{row.student.fullName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(row.category)}`}>
                            {statusText(row.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(row.submission?.created_at)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {row.grade ? `${row.grade.score} ball` : '--'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {row.submission ? (
                            <button
                              type="button"
                              onClick={() => openReviewModal(row)}
                              className="h-8 rounded-lg border border-[#dfe4ef] px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              {row.grade ? 'Qayta baholash' : 'Baholash'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Topshirmagan</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-gray-400">Tanlangan filter boyicha oquvchi topilmadi</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">Tanlangan kunda vazifa topilmadi</div>
          )}
        </section>
      )}

      {showReview && reviewTarget && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShowReview(false)} />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Baholash</h3>
            <p className="text-sm text-gray-500 mb-4">{reviewTarget.student.fullName} • {selectedHomework.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ball (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reviewForm.score}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, score: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Holat</label>
                <select
                  value={reviewForm.status}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="APPROVED">Qabul qilish</option>
                  <option value="REJECTED">Qaytarish</option>
                  <option value="PENDING">Kutishga qoldirish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh</label>
                <textarea
                  rows={3}
                  value={reviewForm.feedback}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, feedback: event.target.value }))}
                  className="w-full rounded-xl border border-[#dfe4ef] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Talabaga fikr yozing..."
                />
              </div>

              <button
                type="button"
                onClick={submitReview}
                disabled={savingReview}
                className="h-11 w-full rounded-xl bg-violet-500 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-70"
              >
                {savingReview ? 'Saqlanmoqda...' : 'Bahoni saqlash'}
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

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/erp/student/dashboard');
      setDashboard(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mening vazifalarim</h1>

      <div className="space-y-3">
        {dashboard?.homeworks?.map((hw) => (
          <div key={hw.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition ${hw.submitted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100 hover:border-violet-200'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hw.submitted ? 'bg-emerald-100' : 'bg-violet-100'}`}>
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
