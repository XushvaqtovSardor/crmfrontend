import { useEffect, useMemo, useState } from 'react';
import { Medal, Loader2 } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { computeStudentXP } from '../utils/studentPanel.js';

const SCOPE_OPTIONS = [
    { value: 'group', label: "Guruhim bo'yicha" },
    { value: 'branch', label: "Filial bo'yicha" },
    { value: 'all', label: 'Barcha filiallar bo\'yicha' },
];

const PERIOD_OPTIONS = [
    { value: 'week', label: 'Haftalik' },
    { value: 'month', label: 'Oylik' },
    { value: 'quarter', label: '3 oylik' },
];

function getTopStudents(seedXp) {
    return [
        { id: 1, name: 'Azizbek Qodirov', group: 'Frontend 38', xp: 2034 },
        { id: 2, name: 'Mohina Sattorova', group: 'Frontend 38', xp: 1950 },
        { id: 3, name: 'Shahboz Tursunov', group: 'Frontend 38', xp: 1914 },
        { id: 4, name: 'Diyorbek Rahmatov', group: 'Frontend 37', xp: 1820 },
        { id: 5, name: 'Dilafruz Axmedova', group: 'Frontend 37', xp: 1777 },
        { id: 6, name: 'Ibrohim Yunusov', group: 'Frontend 38', xp: 1710 },
        { id: 7, name: 'Sardor Ergashov', group: 'Frontend 36', xp: 1662 },
        { id: 8, name: 'Mubina Kamolova', group: 'Frontend 36', xp: 1640 },
        { id: 9, name: 'Zarnigor Abdullaeva', group: 'Frontend 35', xp: 1603 },
        { id: 10, name: 'Firdavs Haydarov', group: 'Frontend 35', xp: 1544 },
        { id: 11, name: 'Javohir Xolmatov', group: 'Frontend 34', xp: 1488 },
        { id: 12, name: 'Nafisa Xudoyberdieva', group: 'Frontend 34', xp: 1442 },
        { id: 13, name: 'Temurbek Hamidov', group: 'Frontend 33', xp: 1398 },
        { id: 14, name: 'Sevinch Xasanova', group: 'Frontend 33', xp: 1352 },
        { id: 15, name: 'Kamron Ismoilov', group: 'Frontend 32', xp: 1310 },
        { id: 16, name: 'Shohsanam Mirzayeva', group: 'Frontend 32', xp: 1270 },
        { id: 17, name: 'Anvarbek Jo\'rayev', group: 'Frontend 31', xp: 1238 },
        { id: 18, name: 'Gulrux Toxirova', group: 'Frontend 31', xp: 1199 },
        { id: 19, name: 'Akmal Ikromov', group: 'Frontend 30', xp: 1158 },
        { id: 20, name: 'Sitora Rasulova', group: 'Frontend 30', xp: 1122 },
        { id: 21, name: "Siz", group: 'Mening guruhim', xp: seedXp || 980, isMe: true },
    ];
}

export default function StudentRatingPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scope, setScope] = useState('group');
    const [period, setPeriod] = useState('week');
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');

            try {
                const progressRes = await api.get('/erp/student/progress');
                setProgress(progressRes.data?.data ?? null);
            } catch (e) {
                setError(getApiErrorMessage(e, "Reyting ma'lumotlarini yuklab bo'lmadi"));
                setProgress(null);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const myXp = useMemo(() => computeStudentXP(progress), [progress]);
    const rows = useMemo(() => {
        const data = getTopStudents(myXp);

        if (scope === 'group') return data.slice(0, 12);
        if (scope === 'branch') return data.slice(0, 18);
        return data;
    }, [myXp, scope]);

    return (
        <div className="space-y-4">
            <h1 className="text-[34px] leading-none font-semibold text-gray-900">Reyting</h1>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
                <aside className="rounded-2xl border border-[#dce1ea] bg-white p-4 space-y-4 self-start">
                    <section>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ko'rinish</p>
                        <div className="mt-2 space-y-2">
                            {SCOPE_OPTIONS.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setScope(item.value)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium ${scope === item.value ? 'border-[#d28a47] bg-[#fff3e7] text-[#ae6420]' : 'border-[#e5e9f2] text-gray-600'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Davr</p>
                        <div className="mt-2 space-y-2">
                            {PERIOD_OPTIONS.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setPeriod(item.value)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium ${period === item.value ? 'border-[#d28a47] bg-[#fff3e7] text-[#ae6420]' : 'border-[#e5e9f2] text-gray-600'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <div className="rounded-xl border border-[#f2dfc9] bg-[#fff8f0] px-3 py-2">
                        <p className="text-xs text-[#ad6b30]">Mening XP</p>
                        <p className="text-xl font-semibold text-[#8f4f17]">{myXp}</p>
                    </div>
                </aside>

                <section className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e8edf5] bg-[#f8f9fd]">
                        <h3 className="text-base font-semibold text-gray-800 inline-flex items-center gap-2">
                            <Medal size={16} className="text-[#cf8a3b]" />
                            Eng yaxshi o'quvchilar
                        </h3>
                    </div>

                    {loading ? (
                        <div className="py-20">
                            <Loader2 size={26} className="mx-auto animate-spin text-[#c57f36]" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-180">
                                <thead>
                                    <tr className="border-b border-[#e8edf5] bg-white">
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">#</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">F.I.O</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Guruh</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">XP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            className={`border-b border-[#eef2f8] last:border-b-0 ${row.isMe ? 'bg-[#fff8ee]' : ''}`}
                                        >
                                            <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.name}</td>
                                            <td className="py-3 px-4 text-sm text-gray-700">{row.group}</td>
                                            <td className="py-3 px-4 text-sm font-semibold text-[#b56d2b]">{row.xp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
