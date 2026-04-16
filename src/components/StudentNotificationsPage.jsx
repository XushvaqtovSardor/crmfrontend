import { useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, RefreshCcw } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function formatDateTime(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function StudentNotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [dashboard, setDashboard] = useState(null);
    const [progress, setProgress] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [dashboardRes, progressRes] = await Promise.all([
                api.get('/erp/student/dashboard'),
                api.get('/erp/student/progress'),
            ]);

            setDashboard(dashboardRes.data?.data ?? null);
            setProgress(progressRes.data?.data ?? null);
        } catch (e) {
            setError(getApiErrorMessage(e, "Bildirishnomalarni yuklab bo'lmadi"));
            setDashboard(null);
            setProgress(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const notifications = useMemo(() => {
        const list = [];
        const now = Date.now();
        const homeworks = normalizeList({ data: dashboard?.homeworks ?? [] });
        const submissions = normalizeList({ data: progress?.submissions ?? [] });

        homeworks.forEach((item) => {
            const deadline = item?.deadlineAt ? new Date(item.deadlineAt) : null;
            const deadlineMs = deadline?.getTime();

            if (!item?.submitted && Number.isFinite(deadlineMs)) {
                const diffHours = Math.round((deadlineMs - now) / (1000 * 60 * 60));
                if (diffHours <= 72) {
                    list.push({
                        id: `hw-deadline-${item.id}`,
                        type: 'UNREAD',
                        title: "Uyga vazifa muddati yaqinlashmoqda",
                        body: `${item.title || 'Uyga vazifa'} topshirig'ini vaqtida yuboring`,
                        createdAt: item.deadlineAt,
                    });
                }
            }

            if (item?.submitted) {
                list.push({
                    id: `hw-submitted-${item.id}`,
                    type: 'READ',
                    title: "Topshiriq yuborildi",
                    body: `${item.title || 'Uyga vazifa'} muvaffaqiyatli yuborildi`,
                    createdAt: item.updatedAt || item.createdAt,
                });
            }
        });

        submissions.forEach((item) => {
            if (item?.score != null) {
                list.push({
                    id: `submission-score-${item.id}`,
                    type: 'UNREAD',
                    title: 'Natija e\'lon qilindi',
                    body: `${item.title || 'Uyga vazifa'} bo'yicha baho: ${item.score}`,
                    createdAt: item.reviewedAt || item.createdAt,
                });
            }
        });

        if (!list.length) {
            list.push({
                id: 'placeholder',
                type: 'READ',
                title: "Hozircha yangi bildirishnoma yo'q",
                body: "Yangi yangiliklar paydo bo'lsa shu yerda ko'rasiz",
                createdAt: new Date().toISOString(),
            });
        }

        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [dashboard, progress]);

    const filteredList = useMemo(() => {
        if (filter === 'UNREAD') {
            return notifications.filter((item) => item.type === 'UNREAD');
        }
        return notifications;
    }, [notifications, filter]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[34px] leading-none font-semibold text-gray-900">Bildirishnomalar</h1>
                    <p className="text-sm text-gray-500 mt-1">Muhim xabarlar va eslatmalar</p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="h-10 rounded-xl border border-[#d6dbe4] bg-white px-3 text-sm text-gray-700"
                    >
                        <option value="ALL">Barchasi</option>
                        <option value="UNREAD">O'qilmaganlar</option>
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

            <section className="space-y-3">
                {loading ? (
                    <div className="rounded-2xl border border-[#dce1ea] bg-white py-16">
                        <Loader2 size={26} className="mx-auto animate-spin text-[#d68f44]" />
                    </div>
                ) : filteredList.map((item) => (
                    <article
                        key={item.id}
                        className={`rounded-2xl border bg-white p-4 ${item.type === 'UNREAD' ? 'border-[#f4c08a]' : 'border-[#e2e6ef]'}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.type === 'UNREAD' ? 'bg-[#fff3e6] text-[#c8792f]' : 'bg-[#f0f3f8] text-gray-500'}`}>
                                <Bell size={16} />
                            </span>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(item.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                            </div>
                        </div>
                    </article>
                ))}
            </section>
        </div>
    );
}
