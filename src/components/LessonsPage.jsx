import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileVideo2,
  GraduationCap,
  Link2,
  Loader2,
  Plus,
  RefreshCcw,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { getAttachmentLabel, parseAttachment, serializeAttachment } from '../utils/attachments.js';

const INITIAL_LESSON_FORM = { title: '' };
const INITIAL_VIDEO_FORM = { lessonId: '', fileName: '', link: '' };
const INITIAL_HOMEWORK_FORM = {
  lessonId: '',
  title: '',
  fileName: '',
  link: '',
  durationTime: '16',
  deadlineAt: '',
  maxAttempts: '1',
  allowLateSubmission: false,
};

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

function formatDate(value) {
  if (!value) return '--';
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

function sortByDateAsc(left, right, key = 'created_at') {
  const leftTime = new Date(left?.[key] || 0).getTime();
  const rightTime = new Date(right?.[key] || 0).getTime();
  return leftTime - rightTime;
}

export default function LessonsPage() {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetail, setGroupDetail] = useState(null);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingGroupDetail, setLoadingGroupDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('lessons');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);

  const [lessonForm, setLessonForm] = useState(INITIAL_LESSON_FORM);
  const [videoForm, setVideoForm] = useState(INITIAL_VIDEO_FORM);
  const [homeworkForm, setHomeworkForm] = useState(INITIAL_HOMEWORK_FORM);
  const videoInputRef = useRef(null);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    setError('');

    try {
      const res = await api.get('/groups/my');
      const list = normalizeList(res.data);
      setGroups(list);

      setSelectedGroupId((prev) => {
        if (prev && list.some((group) => String(group.id) === String(prev))) {
          return String(prev);
        }
        return list[0] ? String(list[0].id) : '';
      });
    } catch (e) {
      setError(getApiErrorMessage(e, "Guruhlarni yuklab bo'lmadi"));
      setGroups([]);
      setSelectedGroupId('');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadSelectedGroupDetail = useCallback(async (groupIdValue) => {
    if (!groupIdValue) {
      setGroupDetail(null);
      return;
    }

    setLoadingGroupDetail(true);
    setError('');

    try {
      const res = await api.get(`/groups/${groupIdValue}`);
      const detail = normalizeObject(res.data);
      setGroupDetail(detail);
    } catch (e) {
      setError(getApiErrorMessage(e, "Guruh darsliklarini yuklab bo'lmadi"));
      setGroupDetail(null);
    } finally {
      setLoadingGroupDetail(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadSelectedGroupDetail(selectedGroupId);
  }, [selectedGroupId, loadSelectedGroupDetail]);

  const lessons = useMemo(() => {
    const rows = Array.isArray(groupDetail?.lessons) ? groupDetail.lessons : [];
    return [...rows]
      .filter((lesson) => !String(lesson?.title || '').startsWith('__ATTENDANCE__'))
      .sort((left, right) => sortByDateAsc(left, right, 'created_at'));
  }, [groupDetail]);

  const homeworkRows = useMemo(() => {
    const rows = [];

    lessons.forEach((lesson, lessonIndex) => {
      const homeworkList = Array.isArray(lesson.homework) ? lesson.homework : [];

      homeworkList
        .slice()
        .sort((left, right) => sortByDateAsc(left, right, 'created_at'))
        .forEach((homework, index) => {
          rows.push({
            ...homework,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonOrder: lessonIndex + 1,
            orderInLesson: index + 1,
          });
        });
    });

    return rows.sort((left, right) => {
      const leftTime = new Date(left.deadlineAt || left.created_at || 0).getTime();
      const rightTime = new Date(right.deadlineAt || right.created_at || 0).getTime();
      return leftTime - rightTime;
    });
  }, [lessons]);

  const videoRows = useMemo(() => {
    const rows = [];

    lessons.forEach((lesson, lessonIndex) => {
      const videos = Array.isArray(lesson.lessonVideos) ? lesson.lessonVideos : [];

      videos
        .slice()
        .sort((left, right) => sortByDateAsc(left, right, 'created_at'))
        .forEach((video, index) => {
          rows.push({
            ...video,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonOrder: lessonIndex + 1,
            orderInLesson: index + 1,
          });
        });
    });

    return rows;
  }, [lessons]);

  const selectedGroupName = groupDetail?.name || groups.find((group) => String(group.id) === String(selectedGroupId))?.name || '--';

  const openPrimaryModal = () => {
    if (!selectedGroupId) return;

    if (activeTab === 'lessons') {
      setLessonForm(INITIAL_LESSON_FORM);
      setShowLessonModal(true);
      return;
    }

    if (activeTab === 'videos') {
      setVideoForm({
        lessonId: lessons[0] ? String(lessons[0].id) : '',
        file: '',
      });
      setShowVideoModal(true);
      return;
    }

    setHomeworkForm({
      ...INITIAL_HOMEWORK_FORM,
      lessonId: lessons[0] ? String(lessons[0].id) : '',
    });
    setShowHomeworkModal(true);
  };

  const createLesson = async () => {
    if (!selectedGroupId) {
      setError('Avval guruhni tanlang');
      return;
    }
    if (!lessonForm.title.trim()) {
      setError('Dars mavzusi majburiy');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/erp/teacher/lessons', {
        groupId: Number(selectedGroupId),
        title: lessonForm.title.trim(),
      });

      setShowLessonModal(false);
      setLessonForm(INITIAL_LESSON_FORM);
      await loadSelectedGroupDetail(selectedGroupId);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Dars yaratishda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const uploadVideo = async () => {
    if (!videoForm.lessonId) {
      setError('Qaysi darsga video biriktirishni tanlang');
      return;
    }
    if (!videoForm.file.trim()) {
      setError("Video URL yoki fayl nomini kiriting");
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/erp/teacher/videos', {
        lessonId: Number(videoForm.lessonId),
        file: videoForm.file.trim(),
      });

      setShowVideoModal(false);
      setVideoForm(INITIAL_VIDEO_FORM);
      await loadSelectedGroupDetail(selectedGroupId);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Video biriktirishda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const createHomework = async () => {
    if (!homeworkForm.lessonId) {
      setError('Qaysi dars uchun uyga vazifa ekanini tanlang');
      return;
    }
    if (!homeworkForm.title.trim()) {
      setError('Uyga vazifa mavzusi majburiy');
      return;
    }
    if (!homeworkForm.deadlineAt) {
      setError('Deadline majburiy');
      return;
    }

    const deadlineAt = new Date(homeworkForm.deadlineAt);
    if (Number.isNaN(deadlineAt.getTime())) {
      setError('Deadline noto`g`ri formatda');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/erp/teacher/homeworks', {
        lessonId: Number(homeworkForm.lessonId),
        title: homeworkForm.title.trim(),
        file: homeworkForm.file.trim() || undefined,
        durationTime: Number(homeworkForm.durationTime) || 16,
        deadlineAt: deadlineAt.toISOString(),
        maxAttempts: Number(homeworkForm.maxAttempts) || 1,
        allowLateSubmission: Boolean(homeworkForm.allowLateSubmission),
      });

      setShowHomeworkModal(false);
      setHomeworkForm(INITIAL_HOMEWORK_FORM);
      await loadSelectedGroupDetail(selectedGroupId);
    } catch (e) {
      setError(getApiErrorMessage(e, "Uyga vazifa yaratishda xatolik"));
    } finally {
      setSaving(false);
    }
  };

  const pickVideoFile = () => {
    videoInputRef.current?.click();
  };

  const onVideoFileSelected = (file) => {
    if (!file) return;
    setVideoForm((prev) => ({
      ...prev,
      file: file.name,
    }));
  };

  const primaryButtonLabel = activeTab === 'lessons'
    ? "Dars yaratish"
    : activeTab === 'videos'
      ? "Video biriktirish"
      : "Uyga vazifa qo'shish";

  if (loadingGroups) {
    return (
      <div className="flex justify-center py-14">
        <Loader2 size={34} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Guruh darsliklari</h1>
          <p className="mt-1 text-sm text-gray-500">Dars, video va uyga vazifalar ketma-ketligi</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            className="h-11 min-w-64 rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm text-gray-700 outline-none"
          >
            {groups.length > 0 ? groups.map((group) => (
              <option key={group.id} value={String(group.id)}>{group.name}</option>
            )) : <option value="">Guruh topilmadi</option>}
          </select>

          <button
            type="button"
            onClick={() => loadSelectedGroupDetail(selectedGroupId)}
            className="h-11 w-11 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 inline-flex items-center justify-center"
            title="Yangilash"
          >
            <RefreshCcw size={16} />
          </button>

          <button
            type="button"
            onClick={openPrimaryModal}
            disabled={!selectedGroupId || (activeTab !== 'lessons' && lessons.length === 0)}
            className="h-11 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60"
          >
            {primaryButtonLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e6ebf6] bg-white p-5">
          <div className="flex items-center justify-between">
            <BookOpen size={20} className="text-violet-500" />
            <span className="text-xs text-gray-400">{selectedGroupName}</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">Darslar</p>
          <p className="mt-1 text-4xl font-semibold text-gray-900">{lessons.length}</p>
        </div>

        <div className="rounded-2xl border border-[#e6ebf6] bg-white p-5">
          <div className="flex items-center justify-between">
            <GraduationCap size={20} className="text-emerald-500" />
            <span className="text-xs text-gray-400">Homework</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">Uyga vazifa</p>
          <p className="mt-1 text-4xl font-semibold text-gray-900">{homeworkRows.length}</p>
        </div>

        <div className="rounded-2xl border border-[#e6ebf6] bg-white p-5">
          <div className="flex items-center justify-between">
            <FileVideo2 size={20} className="text-blue-500" />
            <span className="text-xs text-gray-400">Video</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">Biriktirilgan video</p>
          <p className="mt-1 text-4xl font-semibold text-gray-900">{videoRows.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#e6ebf6] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e9edf5] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`h-9 px-4 rounded-xl text-sm font-semibold ${activeTab === 'lessons' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'bg-[#f5f7fd] text-gray-500'}`}
          >
            Darslar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('homeworks')}
            className={`h-9 px-4 rounded-xl text-sm font-semibold ${activeTab === 'homeworks' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'bg-[#f5f7fd] text-gray-500'}`}
          >
            Uyga vazifa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`h-9 px-4 rounded-xl text-sm font-semibold ${activeTab === 'videos' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'bg-[#f5f7fd] text-gray-500'}`}
          >
            Videolar
          </button>
        </div>

        {loadingGroupDetail ? (
          <div className="py-14 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'lessons' && (
              <table className="w-full min-w-220">
                <thead>
                  <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">#</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Dars mavzusi</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Yaratilgan</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Uyga vazifa</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Video</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">Harakat</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.length > 0 ? lessons.map((lesson, index) => (
                    <tr key={lesson.id} className="border-b border-[#f1f4fa] last:border-b-0">
                      <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{lesson.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(lesson.created_at)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{lesson._count?.homework ?? lesson.homework?.length ?? 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{lesson._count?.lessonVideos ?? lesson.lessonVideos?.length ?? 0}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoForm({ lessonId: String(lesson.id), file: '' });
                            setShowVideoModal(true);
                          }}
                          className="h-8 px-3 rounded-lg border border-[#dfe4ef] text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Video biriktirish
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-gray-400">Darslar hali yaratilmagan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'homeworks' && (
              <table className="w-full min-w-240">
                <thead>
                  <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">#</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Mavzu</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Dars</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Deadline</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Urinish</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Late</th>
                  </tr>
                </thead>
                <tbody>
                  {homeworkRows.length > 0 ? homeworkRows.map((homework, index) => (
                    <tr key={homework.id} className="border-b border-[#f1f4fa] last:border-b-0">
                      <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{homework.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{homework.lessonTitle}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDateTime(homework.deadlineAt)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{homework.maxAttempts}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{homework.allowLateSubmission ? 'Ruxsat' : 'Yoq'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-gray-400">Uyga vazifalar hali biriktirilmagan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'videos' && (
              <table className="w-full min-w-220">
                <thead>
                  <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">#</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Video nomi</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Dars</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Qoshilgan vaqti</th>
                  </tr>
                </thead>
                <tbody>
                  {videoRows.length > 0 ? videoRows.map((video, index) => (
                    <tr key={video.id} className="border-b border-[#f1f4fa] last:border-b-0">
                      <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">
                        <div className="inline-flex items-center gap-2">
                          <Video size={15} className="text-emerald-500" />
                          <span className="underline decoration-dotted underline-offset-2">{extractFileName(video.file)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{video.lessonTitle}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDateTime(video.created_at)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-gray-400">Videolar hali biriktirilmagan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShowLessonModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dars yaratish</h3>
              <button type="button" onClick={() => setShowLessonModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Guruh</label>
                <input
                  type="text"
                  readOnly
                  value={selectedGroupName}
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] bg-[#f8f9fe] px-4 text-sm text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dars mavzusi</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(event) => setLessonForm({ title: event.target.value })}
                  placeholder="Masalan: React Router amaliyoti"
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={createLesson}
                className="h-11 w-full rounded-xl bg-violet-500 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-70"
              >
                {saving ? 'Saqlanmoqda...' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShowVideoModal(false)} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Video biriktirish</h3>
              <button type="button" onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dars</label>
                <select
                  value={videoForm.lessonId}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, lessonId: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Darsni tanlang...</option>
                  {lessons.map((lesson, index) => (
                    <option key={lesson.id} value={String(lesson.id)}>
                      {index + 1}. {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={pickVideoFile}
                onDrop={(event) => {
                  event.preventDefault();
                  onVideoFileSelected(event.dataTransfer?.files?.[0]);
                }}
                onDragOver={(event) => event.preventDefault()}
                className="w-full rounded-2xl border border-dashed border-[#9ad8c7] bg-[#f7fffb] px-4 py-10 text-center"
              >
                <UploadCloud size={32} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-base font-medium text-gray-700">Videofaylni shu yerga tashlang yoki tanlang</p>
                <p className="mt-1 text-sm text-gray-500">Agar backendda upload yoq bo`lsa, fayl nomi saqlanadi</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) => onVideoFileSelected(event.target.files?.[0])}
                />
              </button>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video URL yoki fayl nomi</label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={videoForm.file}
                    onChange={(event) => setVideoForm((prev) => ({ ...prev, file: event.target.value }))}
                    placeholder="https://cdn.example.com/lesson.mp4"
                    className="h-11 w-full rounded-xl border border-[#dfe4ef] pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm font-semibold text-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={uploadVideo}
                  className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-70"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShowHomeworkModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yangi uyga vazifa yaratish</h3>
              <button type="button" onClick={() => setShowHomeworkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mavzu</label>
                <input
                  type="text"
                  value={homeworkForm.title}
                  onChange={(event) => setHomeworkForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Masalan: CRUD amaliyoti"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dars</label>
                <select
                  value={homeworkForm.lessonId}
                  onChange={(event) => setHomeworkForm((prev) => ({ ...prev, lessonId: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Darsni tanlang...</option>
                  {lessons.map((lesson, index) => (
                    <option key={lesson.id} value={String(lesson.id)}>
                      {index + 1}. {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Davomiylik (soat)</label>
                  <input
                    type="number"
                    min={1}
                    value={homeworkForm.durationTime}
                    onChange={(event) => setHomeworkForm((prev) => ({ ...prev, durationTime: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Maks urinish</label>
                  <input
                    type="number"
                    min={1}
                    value={homeworkForm.maxAttempts}
                    onChange={(event) => setHomeworkForm((prev) => ({ ...prev, maxAttempts: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deadline</label>
                <div className="relative">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={homeworkForm.deadlineAt}
                    onChange={(event) => setHomeworkForm((prev) => ({ ...prev, deadlineAt: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-[#dfe4ef] pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fayl URL (ixtiyoriy)</label>
                <input
                  type="text"
                  value={homeworkForm.file}
                  onChange={(event) => setHomeworkForm((prev) => ({ ...prev, file: event.target.value }))}
                  placeholder="https://cdn.example.com/homework.pdf"
                  className="h-11 w-full rounded-xl border border-[#dfe4ef] px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={homeworkForm.allowLateSubmission}
                  onChange={(event) => setHomeworkForm((prev) => ({ ...prev, allowLateSubmission: event.target.checked }))}
                  className="h-4 w-4 rounded accent-violet-500"
                />
                Deadline dan keyin topshirishga ruxsat berilsin
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHomeworkModal(false)}
                  className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm font-semibold text-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={createHomework}
                  className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-70"
                >
                  {saving ? 'Saqlanmoqda...' : 'Elon qilish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
