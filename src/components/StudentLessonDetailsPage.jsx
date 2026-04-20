import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Paperclip, SendHorizontal } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { getAttachmentLabel, parseAttachment, serializeAttachment } from '../utils/attachments.js';

const API_ORIGIN = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/$/, '');

function resolveAssetUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) {
        return raw;
    }

    const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
    return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
}

function isPlayableVideoLink(link) {
    const source = String(link || '').trim().split('?')[0].toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v|mkv|avi)$/.test(source);
}

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
    const videoRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState(null);

    const [group, setGroup] = useState(null);
    const [dashboardHomeworks, setDashboardHomeworks] = useState([]);

    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState('');
    const [attachmentLink, setAttachmentLink] = useState('');

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
        const row = dashboardHomeworks.find((item) => String(item.id) === String(homework.id));
        return row || null;
    }, [dashboardHomeworks, homework]);

    const videoRows = useMemo(() => {
        const rows = Array.isArray(lesson?.lessonVideos) ? lesson.lessonVideos : [];

        return rows.map((video, index) => {
            const attachmentInfo = parseAttachment(video.file);
            const resolvedLink = resolveAssetUrl(attachmentInfo.link);

            return {
                ...video,
                title: video.title || `${index + 1}-video`,
                label: getAttachmentLabel(video.file),
                link: resolvedLink,
                hasPlayableLink: Boolean(resolvedLink && isPlayableVideoLink(resolvedLink)),
            };
        });
    }, [lesson]);

    const playableVideos = useMemo(
        () => videoRows.filter((row) => row.hasPlayableLink),
        [videoRows],
    );

    const nonVideoAttachments = useMemo(
        () => videoRows.filter((row) => !row.hasPlayableLink),
        [videoRows],
    );

    const activeVideo = useMemo(() => {
        if (playableVideos.length === 0) {
            return null;
        }

        const matched = playableVideos.find((row) => String(row.id) === String(activeVideoId));
        return matched || playableVideos[0];
    }, [playableVideos, activeVideoId]);

    const homeworkAttachment = useMemo(() => {
        const attachmentInfo = parseAttachment(homework?.file);
        return {
            ...attachmentInfo,
            label: getAttachmentLabel(homework?.file),
            link: resolveAssetUrl(attachmentInfo.link),
        };
    }, [homework]);

    useEffect(() => {
        if (!playableVideos.length) {
            setActiveVideoId(null);
            return;
        }

        const hasActive = playableVideos.some((row) => String(row.id) === String(activeVideoId));
        if (!hasActive) {
            setActiveVideoId(playableVideos[0].id);
        }
    }, [playableVideos, activeVideoId]);

    const openVideo = (videoId) => {
        if (String(videoId) === String(activeVideoId)) {
            return;
        }

        setActiveVideoId(videoId);

        window.requestAnimationFrame(() => {
            if (!videoRef.current) return;

            videoRef.current.play().catch(() => {
                // Browser autoplay policy may block direct play after source switch.
            });
        });
    };

    const handleAttach = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAttachment(file.name);
    };

    const handleSubmitHomework = async () => {
        if (!homework || submitting) return;

        const packedAttachment = serializeAttachment({
            fileName: attachment,
            link: attachmentLink,
        });

        setSubmitting(true);
        setError('');

        try {
            await api.post('/erp/student/submissions', {
                homeworkId: homework.id,
                title: message.trim() || homework.title || `Homework ${homework.id}`,
                file: packedAttachment || undefined,
            });

            setMessage('');
            setAttachment('');
            setAttachmentLink('');
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

                        {activeVideo ? (
                            <section className="rounded-2xl border border-[#dce1ea] bg-white p-3 sm:p-4 space-y-3">
                                <div className="overflow-hidden rounded-2xl border border-[#e4e9f3] bg-black">
                                    <video
                                        key={activeVideo.id}
                                        ref={videoRef}
                                        controls
                                        preload="metadata"
                                        src={activeVideo.link}
                                        className="aspect-video w-full"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{activeVideo.title}</p>
                                        <p className="text-xs text-gray-500">{activeVideo.label}</p>
                                        {activeVideo.link && (
                                            <a
                                                href={activeVideo.link}
                                                download={activeVideo.label || undefined}
                                                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#a65f23]"
                                            >
                                                Faylni yuklab olish <Download size={12} />
                                            </a>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">Video avtomatik ko'rsatilmoqda</span>
                                </div>
                            </section>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-[#d7dce6] bg-white px-4 py-8 text-sm text-gray-500 text-center">
                                Bu darsga oynatiladigan video biriktirilmagan
                            </div>
                        )}

                        {videoRows.length > 0 && (
                            <section className="rounded-2xl border border-[#dce1ea] bg-white p-3 sm:p-4">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3">Dars materiallari</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {videoRows.map((video) => {
                                        const isActive = String(video.id) === String(activeVideo?.id);

                                        return (
                                            <article
                                                key={video.id}
                                                onClick={video.hasPlayableLink ? () => openVideo(video.id) : undefined}
                                                className={`rounded-xl border p-3 ${isActive ? 'border-[#d58d45] bg-[#fff8ef]' : 'border-[#e2e7f1] bg-white'} ${video.hasPlayableLink ? 'cursor-pointer hover:border-[#d5dee9]' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{video.title}</p>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{video.label}</p>
                                                    </div>
                                                    <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${video.hasPlayableLink ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {video.hasPlayableLink ? 'VIDEO' : 'FAYL'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center gap-2">
                                                    {video.hasPlayableLink ? (
                                                        <span className="text-xs text-gray-500">
                                                            {isActive ? "Tanlangan video" : "Ko'rish uchun kartani bosing"}
                                                        </span>
                                                    ) : null}

                                                    {video.link && (
                                                        <a
                                                            href={video.link}
                                                            download={video.label || undefined}
                                                            onClick={(event) => event.stopPropagation()}
                                                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#dce2ec] bg-white px-3 text-xs font-semibold text-[#a65f23]"
                                                        >
                                                            Yuklab olish <Download size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {(nonVideoAttachments.length > 0 || homeworkAttachment.fileName || homeworkAttachment.link) && (
                            <section className="rounded-2xl border border-[#dce1ea] bg-white p-4 space-y-2">
                                <h2 className="text-base font-semibold text-gray-900">Biriktirilgan fayllar</h2>

                                <div className="space-y-2">
                                    {nonVideoAttachments.map((item) => (
                                        <div key={`lesson-file-${item.id}`} className="rounded-xl border border-[#e5eaf4] bg-[#fbfcff] px-3 py-2 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dars materiali</p>
                                                <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                                            </div>
                                            {item.link ? (
                                                <a
                                                    href={item.link}
                                                    download={item.label || undefined}
                                                    className="text-xs font-semibold text-[#a65f23] inline-flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    Yuklab olish <Download size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">Link mavjud emas</span>
                                            )}
                                        </div>
                                    ))}

                                    {(homeworkAttachment.fileName || homeworkAttachment.link) && (
                                        <div className="rounded-xl border border-[#e5eaf4] bg-[#fbfcff] px-3 py-2 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Uyga vazifa fayli</p>
                                                <p className="text-sm font-medium text-gray-800 truncate">{homeworkAttachment.label}</p>
                                            </div>
                                            {homeworkAttachment.link ? (
                                                <a
                                                    href={homeworkAttachment.link}
                                                    download={homeworkAttachment.label || undefined}
                                                    className="text-xs font-semibold text-[#a65f23] inline-flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    Yuklab olish <Download size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">Link mavjud emas</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

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
                                            {(homeworkAttachment.fileName || homeworkAttachment.link) && (
                                                <div className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
                                                    <span>{homeworkAttachment.label}</span>
                                                    {homeworkAttachment.link && (
                                                        <a
                                                            href={homeworkAttachment.link}
                                                            download={homeworkAttachment.label || undefined}
                                                            className="text-[#a86429] inline-flex items-center"
                                                        >
                                                            <Download size={13} />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
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

                                        <label className="min-w-56 rounded-lg border border-[#dce1ea] bg-white px-3 py-1.5">
                                            <input
                                                type="text"
                                                value={attachmentLink}
                                                onChange={(event) => setAttachmentLink(event.target.value)}
                                                placeholder="Ish linki (ixtiyoriy)"
                                                className="w-full bg-transparent text-sm text-gray-700 outline-none"
                                            />
                                        </label>

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
