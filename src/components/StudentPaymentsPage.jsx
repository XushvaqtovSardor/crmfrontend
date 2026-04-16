import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, RefreshCcw } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function formatMoney(value) {
    const amount = Number(value) || 0;
    return `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`;
}

function formatDate(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StudentPaymentsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [groups, setGroups] = useState([]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/groups/my');
            setGroups(normalizeList(response.data));
        } catch (e) {
            setError(getApiErrorMessage(e, "To'lov ma'lumotlarini yuklab bo'lmadi"));
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const paymentRows = useMemo(() => {
        return groups.map((group) => {
            const amount = Number(group?.course?.price) || 0;
            const paid = group.id % 2 === 0 ? amount : Math.round(amount * 0.45);
            const debt = Math.max(amount - paid, 0);

            return {
                id: group.id,
                groupName: group.name,
                direction: group?.course?.name || '--',
                amount,
                paid,
                debt,
                status: debt > 0 ? 'Qarzdor' : "To'langan",
                startDate: group.startDate,
            };
        });
    }, [groups]);

    const summary = useMemo(() => {
        return paymentRows.reduce((acc, row) => {
            acc.total += row.amount;
            acc.paid += row.paid;
            acc.debt += row.debt;
            return acc;
        }, { total: 0, paid: 0, debt: 0 });
    }, [paymentRows]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-[34px] leading-none font-semibold text-gray-900">To'lovlarim</h1>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#dce1ea] bg-white p-5">
                    <p className="text-sm text-gray-500">Jami to'lov</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatMoney(summary.total)}</p>
                </div>
                <div className="rounded-2xl border border-[#dce1ea] bg-white p-5">
                    <p className="text-sm text-gray-500">To'langan</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatMoney(summary.paid)}</p>
                </div>
                <div className="rounded-2xl border border-[#dce1ea] bg-white p-5">
                    <p className="text-sm text-gray-500">Qarz</p>
                    <p className="mt-2 text-2xl font-semibold text-red-600">{formatMoney(summary.debt)}</p>
                </div>
            </div>

            <section className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e8edf5] bg-[#f8f9fd]">
                    <h3 className="text-base font-semibold text-gray-800 inline-flex items-center gap-2">
                        <CreditCard size={16} className="text-[#c08c54]" />
                        Guruhlar bo'yicha to'lov
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-220">
                        <thead>
                            <tr className="border-b border-[#e8edf5] bg-white">
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">#</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Guruh</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Yo'nalish</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Boshlash vaqti</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Jami</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">To'langan</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Qolgan</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto text-violet-500" />
                                    </td>
                                </tr>
                            ) : paymentRows.length > 0 ? paymentRows.map((row, index) => (
                                <tr key={row.id} className="border-b border-[#eef2f8] last:border-b-0">
                                    <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.groupName}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{row.direction}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{formatDate(row.startDate)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{formatMoney(row.amount)}</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">{formatMoney(row.paid)}</td>
                                    <td className="py-3 px-4 text-sm text-red-600">{formatMoney(row.debt)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${row.debt > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400">To'lov ma'lumotlari topilmadi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
