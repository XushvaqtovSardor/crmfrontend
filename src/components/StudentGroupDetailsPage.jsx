import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const FILTER_OPTIONS = [
    { value: 'ALL', label: 'Barchasi' },
    { value: 'ACCEPTED', label: 'Qabul qilingan' },
    { value: 'MISSED', label: 'Bajarilmagan' },
    { value: 'NOT_ASSIGNED', label: 'Berilmagan' },
];

function formatDate(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusToClass(status) {
    if (status === 'ACCEPTED') return 'bg-emerald-100 text-emerald-700';
    if (status === 'MISSED') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
}

function isExamLesson(lesson) {
    const title = String(lesson?.title || '').toLowerCase();
    return title.includes('imtihon') || title.includes('exam') || title.includes('sinov');
}

function normalizeLessonStatus(lesson, dashboardByHomeworkId) {
    const homeworkList = Array.isArray(lesson?.homework) ? lesson.homework : [];

    if (!homeworkList.length) {
        return { code: 'NOT_ASSIGNED', label: 'Berilmagan', deadline: null };
    }

    let submittedCount = 0;
    let overdueUnsubmitted = false;
    let nearestDeadline = null;

    homeworkList.forEach((hw) => {
        const dashboardHomework = dashboardByHomeworkId.get(hw.id);
        if (dashboardHomework?.submitted) {
            submittedCount += 1;
        }

        if (hw.deadlineAt) {
            const deadline = new Date(hw.deadlineAt);
            if (!Number.isNaN(deadline.getTime())) {
                if (!nearestDeadline || deadline < nearestDeadline) {
                    nearestDeadline = deadline;
                }

                if (!dashboardHomework?.submitted && deadline < new Date()) {
                    overdueUnsubmitted = true;
                }
            }
        }
    });

    if (submittedCount === homeworkList.length) {
        return { code: 'ACCEPTED', label: 'Qabul qilingan', deadline: nearestDeadline };
    }

    if (overdueUnsubmitted) {
        return { code: 'MISSED', label: 'Bajarilmagan', deadline: nearestDeadline };
    }

    return { code: 'NOT_ASSIGNED', label: 'Berilmagan', deadline: nearestDeadline };
}

function normalizeDashboardHomework(data) {
    if (Array.isArray(data?.homeworks)) return data.homeworks;
    if (Array.isArray(data?.data?.homeworks)) return data.data.homeworks;
    return [];
}

export default function StudentGroupDetailsPage() {
    const navigate = useNavigate();
    const { groupId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [group, setGroup] = useState(null);
    const [dashboardHomeworks, setDashboardHomeworks] = useState([]);

    const loadData = async () => {
        if (!groupId) return;

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
            setError(getApiErrorMessage(e, "Guruh ma'lumotlarini yuklab bo'lmadi"));
            setGroup(null);
            setDashboardHomeworks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [groupId]);

    const lessonRows = useMemo(() => {
        const lessons = Array.isArray(group?.lessons) ? [...group.lessons] : [];
        const dashboardByHomeworkId = new Map(dashboardHomeworks.map((hw) => [hw.id, hw]));

        return lessons
            .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
            .map((lesson) => {
                const status = normalizeLessonStatus(lesson, dashboardByHomeworkId);

                return {
                    id: lesson.id,
                    title: lesson.title,
                    createdAt: lesson.created_at || lesson.createdAt,
                    videoCount: Array.isArray(lesson.lessonVideos) ? lesson.lessonVideos.length : 0,
                    status,
                    isExam: isExamLesson(lesson),
                };
            });
    }, [group, dashboardHomeworks]);

    const filteredRows = useMemo(() => {
        if (filter === 'ALL') return lessonRows;
        return lessonRows.filter((row) => row.status.code === filter);
    }, [lessonRows, filter]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[32px] leading-none font-semibold text-gray-900">{group?.name || 'Guruh tafsilotlari'}</h1>
                    <p className="text-sm text-gray-500 mt-1">Darslar, videolar va uy vazifa holatlari</p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="h-10 rounded-xl border border-[#d6dbe4] bg-white px-3 text-sm text-gray-700"
                    >
                        {FILTER_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={loadData}
                        className="h-10 rounded-xl border border-[#d6dbe4] bg-white px-4 text-sm font-semibold text-gray-700 inline-flex items-center gap-2"
                    >
                        <RefreshCcw size={15} /> Yangilash
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-240">
                        <thead>
                            <tr className="border-b border-[#e8edf5] bg-[#f8f9fd]">
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Sana</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Dars mavzusi</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Video</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Uy vazifa statusi</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Deadline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-14 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto text-[#b97331]" />
                                    </td>
                                </tr>
                            ) : filteredRows.length > 0 ? filteredRows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => navigate(`/my-groups/${groupId}/lessons/${row.id}`)}
                                    className="border-b border-[#eef2f8] last:border-b-0 hover:bg-[#faf6f0] cursor-pointer"
                                >
                                    <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.title || `Dars #${row.id}`}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        {row.isExam ? (
                                            <span className="inline-flex rounded-lg bg-[#fff2e3] px-2.5 py-1 text-xs font-semibold text-[#bb702c]">Imtihon</span>
                                        ) : (
                                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[#d6dbe4] px-2 text-xs font-semibold text-gray-700">
                                                {row.videoCount}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${statusToClass(row.status.code)}`}>
                                            {row.status.label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{formatDate(row.status.deadline)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-sm text-gray-400">Darslar topilmadi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
