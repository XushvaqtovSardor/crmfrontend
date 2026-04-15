import { useCallback, useEffect, useState } from 'react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Coins,
    Loader2,
    RefreshCcw,
    Wallet,
} from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

function toCurrency(value) {
    return `${Number(value || 0).toLocaleString('uz-UZ')} coin`;
}

function parsePayload(response) {
    return response?.data?.data ?? response?.data ?? null;
}

function TypeBadge({ type }) {
    if (type === 'CREDIT') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                <ArrowUpCircle size={13} />
                Kirim
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
            <ArrowDownCircle size={13} />
            Chiqim
        </span>
    );
}

export default function TeacherFinancePage() {
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const [profileResponse, historyResponse] = await Promise.all([
                api.get('/teachers/me/profile'),
                api.get(`/teachers/me/coin/history?page=${page}&limit=20`),
            ]);

            const profilePayload = parsePayload(profileResponse) || {};
            const historyPayload = parsePayload(historyResponse) || {};

            setProfile(profilePayload);
            setHistory(Array.isArray(historyPayload.data) ? historyPayload.data : []);
            setMeta({
                page: Number(historyPayload.page || 1),
                totalPages: Number(historyPayload.totalPages || 1),
                total: Number(historyPayload.total || 0),
            });
        } catch (e) {
            setError(getApiErrorMessage(e, "Moliyaviy ma'lumotlarni yuklab bo'lmadi"));
            setProfile(null);
            setHistory([]);
            setMeta({ page: 1, totalPages: 1, total: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(1);
    }, [load]);

    const summary = profile?.coin || {
        balance: 0,
        totalGiven: 0,
        totalSpent: 0,
        totalTransactions: 0,
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Moliyam</h1>
                <button
                    type="button"
                    onClick={() => load(meta.page)}
                    className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 inline-flex items-center justify-center"
                    title="Yangilash"
                >
                    <RefreshCcw size={15} />
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5">
                    <p className="text-sm text-gray-500">Joriy balans</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{toCurrency(summary.balance)}</p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5">
                    <p className="text-sm text-gray-500">Jami kirim</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{toCurrency(summary.totalGiven)}</p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5">
                    <p className="text-sm text-gray-500">Jami chiqim</p>
                    <p className="text-3xl font-bold text-red-500 mt-1">{toCurrency(summary.totalSpent)}</p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e6e9f2] p-5">
                    <p className="text-sm text-gray-500">Tranzaksiyalar</p>
                    <p className="text-3xl font-bold text-violet-600 mt-1">{summary.totalTransactions || meta.total}</p>
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-[#e6e9f2] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#eef2f9] flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Wallet size={18} className="text-violet-500" />
                        Coin tarixi
                    </h2>
                    <span className="text-sm text-gray-500">Jami: {meta.total}</span>
                </div>

                {loading ? (
                    <div className="py-14 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-violet-500" />
                    </div>
                ) : history.length > 0 ? (
                    <div className="divide-y divide-[#f1f4fa]">
                        {history.map((item) => (
                            <div key={item.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TypeBadge type={item.type} />
                                        <span className="text-sm text-gray-400">#{item.id}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.reason || 'Izoh kiritilmagan'}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {item.createdByUser?.fullName || 'System'} • {new Date(item.created_at).toLocaleString('uz-UZ')}
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className={`text-base font-bold ${item.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {item.type === 'CREDIT' ? '+' : '-'}{toCurrency(item.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Balans: {toCurrency(item.balanceAfter)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center text-gray-400">
                        <Coins size={42} className="mx-auto mb-2 text-gray-300" />
                        Tranzaksiyalar topilmadi
                    </div>
                )}

                <div className="px-5 py-3 border-t border-[#eef2f9] flex items-center justify-end gap-2">
                    <button
                        type="button"
                        disabled={loading || meta.page <= 1}
                        onClick={() => load(meta.page - 1)}
                        className="h-9 px-3 rounded-lg border border-[#dfe4ef] text-sm disabled:opacity-50"
                    >
                        Oldingi
                    </button>
                    <span className="text-sm text-gray-500">{meta.page} / {meta.totalPages}</span>
                    <button
                        type="button"
                        disabled={loading || meta.page >= meta.totalPages}
                        onClick={() => load(meta.page + 1)}
                        className="h-9 px-3 rounded-lg border border-[#dfe4ef] text-sm disabled:opacity-50"
                    >
                        Keyingi
                    </button>
                </div>
            </section>
        </div>
    );
}
