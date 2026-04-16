import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCcw, Target, TrendingUp } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { computeStudentCoins, computeStudentXP } from '../utils/studentPanel.js';

function gradeLabel(score) {
    if (score >= 90) return "A'lo";
    if (score >= 70) return 'Yaxshi';
    if (score >= 50) return 'Qoniqarli';
    return 'Qoniqarsiz';
}

function scoreClass(score) {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
}

export default function ProgressPage() {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/erp/student/progress');
            setProgress(response.data?.data ?? null);
        } catch (e) {
            setError(getApiErrorMessage(e, "Natijalarni yuklab bo'lmadi"));
            setProgress(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const averageScore = Number(progress?.averageScore) || 0;
    const xp = useMemo(() => computeStudentXP(progress), [progress]);
    const coins = useMemo(() => computeStudentCoins(progress), [progress]);

    const submissionCount = Number(progress?.submissionCount) || 0;
    const onTime = Number(progress?.onTime) || 0;
    const late = Number(progress?.late) || 0;
    const approved = Number(progress?.grading?.approved) || 0;
    const pending = Number(progress?.grading?.pending) || 0;
    const rejected = Number(progress?.grading?.rejected) || 0;

    const monitoringRows = [
        {
            id: 'class',
            title: 'Dars faolligi',
            subtitle: "Darsga qatnashuv va vazifalarni vaqtida topshirish",
            xp: onTime * 12,
            coins: onTime * 18,
            value: `${onTime} ta vaqtida topshirilgan`,
        },
        {
            id: 'homework',
            title: 'Uyga vazifa',
            subtitle: 'Topshiriqlar soni va kechikishlar',
            xp: submissionCount * 10 + late * 2,
            coins: submissionCount * 14,
            value: `${submissionCount} ta topshiriq`,
        },
        {
            id: 'exam',
            title: 'Tekshiruv natijalari',
            subtitle: "O'qituvchi tomonidan tekshirilgan ishlari",
            xp: approved * 14,
            coins: approved * 20,
            value: `${approved} ta tasdiqlangan`,
        },
        {
            id: 'moderation',
            title: 'Moderatsiya',
            subtitle: 'Rad etilgan va kutilayotgan ishlarga koeffitsiyent',
            xp: Math.max(pending * 4 - rejected * 9, 0),
            coins: Math.max(pending * 7 - rejected * 10, 0),
            value: `${pending} kutilmoqda / ${rejected} rad etilgan`,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-[34px] leading-none font-semibold text-gray-900">Mening natijalarim</h1>
                <button
                    type="button"
                    onClick={loadData}
                    className="h-10 rounded-xl border border-[#d6dbe4] bg-white px-4 text-sm font-semibold text-gray-700 inline-flex items-center gap-2"
                >
                    <RefreshCcw size={15} /> Yangilash
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl border border-[#dce1ea] bg-white py-24">
                    <Loader2 size={26} className="mx-auto animate-spin text-[#c07a37]" />
                </div>
            ) : (
                <>
                    <section className="rounded-2xl border border-[#dce1ea] bg-white p-5">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-sm text-gray-500">Umumiy ko'rsatkich</p>
                                <p className="text-4xl font-semibold text-gray-900 mt-1">{Math.round(averageScore)}%</p>
                                <span className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${scoreClass(averageScore)}`}>
                                    {gradeLabel(averageScore)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <MetricCard icon={<TrendingUp size={16} />} label="XP" value={xp} />
                                <MetricCard icon={<Target size={16} />} label="Kumush" value={coins} />
                            </div>
                        </div>

                        <div className="mt-4 h-3 rounded-full bg-[#eceff6] overflow-hidden">
                            <div className="h-full rounded-full bg-[#d48741]" style={{ width: `${Math.max(0, Math.min(100, Math.round(averageScore)))}%` }} />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#e8edf5] bg-[#f8f9fd]">
                            <h3 className="text-base font-semibold text-gray-800">Monitoring</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-190">
                                <thead>
                                    <tr className="border-b border-[#e8edf5] bg-white">
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Kategoriya</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Tavsif</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Holat</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">XP</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Kumush</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monitoringRows.map((row) => (
                                        <tr key={row.id} className="border-b border-[#eef2f8] last:border-b-0">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.title}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{row.subtitle}</td>
                                            <td className="py-3 px-4 text-sm text-gray-700">{row.value}</td>
                                            <td className="py-3 px-4 text-sm font-semibold text-[#b66f2f]">+{row.xp}</td>
                                            <td className="py-3 px-4 text-sm font-semibold text-[#b66f2f]">+{row.coins}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function MetricCard({ icon, label, value }) {
    return (
        <div className="rounded-xl border border-[#e2e7f1] bg-[#f9fbff] px-3 py-2 min-w-28">
            <p className="text-xs text-gray-500 inline-flex items-center gap-1">{icon} {label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
        </div>
    );
}
