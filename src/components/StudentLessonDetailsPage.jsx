import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Paperclip, Play, SendHorizontal } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

function formatDate(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

function normalizeDashboardHomework(data) {
    if (Array.isArray(data?.homeworks)) return data.homeworks;
    if (Array.isArray(data?.data?.homeworks)) return data.data.homeworks;
    return [];
}

export default function StudentLessonDetailsPage() {
    const { groupId, lessonId } = useParams();
    const navigate = useNavigate();

    const fileRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [group, setGroup] = useState(null);
    const [dashboardHomeworks, setDashboardHomeworks] = useState([]);

    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState('');

    const loadData = async () => {
        if (!groupId || !lessonId) return;

        setLoading(true);
        setError('');

        try {
            const [groupRes, dashboardRes] = await Promise.all([
                api.get(`/groups/${groupId}`),
                api.get('/erp/student/dashboard'),
            ]);

            setGroup(groupRes.data?.data ?? null);
            setDashboardHomeworks(normalizeDashboardHomework(dashboardRes.data?.data));
        } catch (e) {
            setError(getApiErrorMessage(e, "Dars ma'lumotlarini yuklab bo'lmadi"));
            setGroup(null);
            setDashboardHomeworks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [groupId, lessonId]);

    const lessons = useMemo(() => {
        const list = Array.isArray(group?.lessons) ? [...group.lessons] : [];
        return list.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    }, [group]);

    const lesson = useMemo(() => {
        return lessons.find((item) => String(item.id) === String(lessonId));
    }, [lessons, lessonId]);

    const homework = useMemo(() => {
        const list = Array.isArray(lesson?.homework) ? lesson.homework : [];
        return list[0] || null;
    }, [lesson]);

    const homeworkState = useMemo(() => {
        if (!homework) return null;
        const row = dashboardHomeworks.find((item) => item.id === homework.id);
        return row || null;
    }, [dashboardHomeworks, homework]);

    const handleAttach = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAttachment(file.name);
    };

    const handleSubmitHomework = async () => {
        if (!homework || submitting) return;

        setSubmitting(true);
        setError('');

        try {
            await api.post('/erp/student/submissions', {
                homeworkId: homework.id,
                title: message.trim() || homework.title || `Homework ${homework.id}`,
                file: attachment || undefined,
            });

            setMessage('');
            setAttachment('');
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, "Uyga vazifani yuborib bo'lmadi"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl border border-[#dce1ea] bg-white py-24">
                    <Loader2 size={26} className="mx-auto animate-spin text-[#bc7532]" />
                </div>
            ) : !lesson ? (
                <div className="rounded-2xl border border-[#dce1ea] bg-white px-4 py-14 text-center text-sm text-gray-500">
                    Dars topilmadi
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-4">
                    <section className="space-y-4">
                        <div className="rounded-2xl border border-[#dce1ea] bg-white p-4">
                            <h1 className="text-[30px] leading-none font-semibold text-gray-900">{lesson.title || `Dars ${lesson.id}`}</h1>
                            <p className="text-sm text-gray-500 mt-2">Sana: {formatDate(lesson.created_at || lesson.createdAt)}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Array.isArray(lesson.lessonVideos) ? lesson.lessonVideos : []).map((video, index) => (
                                <article key={video.id} className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                                    <div className="h-44 bg-linear-to-br from-[#dbe4ff] via-[#eff3ff] to-[#f7f9ff] flex items-center justify-center">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#6d7ba7]">
                                            <Play size={20} />
                                        </span>
                                    </div>
                                    <div className="px-4 py-3">
                                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{video.title || `Video ${index + 1}`}</p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{video.file || 'Video fayl'}</p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {!Array.isArray(lesson.lessonVideos) || lesson.lessonVideos.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#d7dce6] bg-white px-4 py-8 text-sm text-gray-500 text-center">
                                Bu darsga video biriktirilmagan
                            </div>
                        ) : null}

                        <section className="rounded-2xl border border-[#dce1ea] bg-white p-4 space-y-3">
                            <h2 className="text-lg font-semibold text-gray-900">Uyga vazifa</h2>

                            {!homework ? (
                                <p className="text-sm text-gray-500">Bu dars uchun uyga vazifa biriktirilmagan</p>
                            ) : (
                                <>
                                    <div className="rounded-xl border border-[#e7ecf5] bg-[#fafbfd] px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{homework.title || `Homework ${homework.id}`}</p>
                                            <p className="text-xs text-gray-500 mt-1">Deadline: {formatDate(homework.deadlineAt)}</p>
                                        </div>
                                        {homeworkState?.submitted ? (
                                            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Topshirilgan</span>
                                        ) : (
                                            <span className="rounded-lg bg-[#fff2e1] px-2.5 py-1 text-xs font-semibold text-[#b36a28]">Jarayonda</span>
                                        )}
                                    </div>

                                    <label className="rounded-xl border border-[#dce1ea] bg-white px-3 py-2">
                                        <textarea
                                            rows={4}
                                            value={message}
                                            onChange={(event) => setMessage(event.target.value)}
                                            placeholder="Izoh yoki javob yozing..."
                                            className="w-full resize-none bg-transparent text-sm text-gray-700 outline-none"
                                        />
                                    </label>

                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileRef.current?.click()}
                                                className="h-9 rounded-lg border border-[#dce1ea] bg-white px-3 text-sm text-gray-700 inline-flex items-center gap-2"
                                            >
                                                <Paperclip size={15} /> Fayl biriktirish
                                            </button>
                                            <input
                                                ref={fileRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleAttach}
                                            />
                                            {attachment && <span className="text-xs text-gray-500">{attachment}</span>}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSubmitHomework}
                                            disabled={submitting}
                                            className="h-9 rounded-lg bg-[#d48a42] px-4 text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-60"
                                        >
                                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
                                            Yuborish
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>
                    </section>

                    <aside className="rounded-2xl border border-[#dce1ea] bg-white p-3 space-y-2 self-start">
                        <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Darslar ro'yxati</h3>
                        {lessons.map((item) => {
                            const active = String(item.id) === String(lessonId);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => navigate(`/my-groups/${groupId}/lessons/${item.id}`)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left ${active ? 'border-[#d58d45] bg-[#fff2e2]' : 'border-[#e7ebf3] bg-white'}`}
                                >
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title || `Dars ${item.id}`}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at || item.createdAt)}</p>
                                </button>
                            );
                        })}
                    </aside>
                </div>
            )}
        </div>
    );
}
