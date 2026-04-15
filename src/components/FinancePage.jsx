import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Calendar,
    CreditCard,
    Loader2,
    RefreshCcw,
    Search,
    User,
    Users,
    Wallet,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TAB_CONFIG = [
    { key: 'payments', label: "To'lovlar" },
    { key: 'debtors', label: 'Qarzdorlar' },
    { key: 'expenses', label: 'Xarajatlar' },
    { key: 'payment-methods', label: "To'lov usullari" },
];

function normalizeObject(payload) {
    if (payload?.data?.data) return payload.data.data;
    if (payload?.data) return payload.data;
    return null;
}

function toCurrency(value) {
    return `${Number(value || 0).toLocaleString('uz-UZ')} so'm`;
}

function getTrendSeries(totalAmount) {
    const base = Number(totalAmount || 0) / 12;
    const factors = [0.72, 0.8, 0.66, 0.63, 0.75, 0.7, 0.95, 1, 0.96, 0.84, 0.6, 0.68];

    return factors.map((factor, index) => ({
        month: MONTHS[index],
        value: Math.round(base * factor),
    }));
}

function buildChartPath(points, width, height) {
    if (!points.length) return '';

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const minValue = Math.min(...points.map((point) => point.value), 0);
    const delta = Math.max(maxValue - minValue, 1);

    return points
        .map((point, index) => {
            const x = (index / Math.max(points.length - 1, 1)) * width;
            const y = height - ((point.value - minValue) / delta) * height;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

function buildPaymentRows(byCourse = []) {
    return byCourse.map((item, index) => ({
        id: item.courseId,
        fullName: `${item.courseName} to'lovi`,
        phone: '--',
        group: 'Barcha guruhlar',
        course: item.courseName,
        teacher: '--',
        staff: 'Islombek Baxromov',
        month: MONTHS[index % MONTHS.length],
        paymentType: index % 2 === 0 ? 'Naqd' : 'Karta',
        amount: Number(item.totalAmount || 0),
    }));
}

function Input({ icon: Icon, placeholder, value, onChange, type = 'text' }) {
    return (
        <div className="relative">
            <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white pl-9 pr-3 text-sm"
            />
        </div>
    );
}

function Select({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    );
}

export default function FinancePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [finance, setFinance] = useState({ byCourse: [], totalAmount: 0, currency: 'UZS' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [personQuery, setPersonQuery] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');
    const [staffFilter, setStaffFilter] = useState('');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('');

    const activeTab = useMemo(() => {
        const value = String(params.tab || '').trim();
        if (TAB_CONFIG.some((tab) => tab.key === value)) return value;
        return 'payments';
    }, [params.tab]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/erp/finance/report');
            const payload = normalizeObject(response.data) || {};
            setFinance({
                byCourse: Array.isArray(payload.byCourse) ? payload.byCourse : [],
                totalAmount: Number(payload.totalAmount || 0),
                currency: payload.currency || 'UZS',
            });
        } catch (e) {
            setError(getApiErrorMessage(e, "Moliya ma'lumotlarini yuklab bo'lmadi"));
            setFinance({ byCourse: [], totalAmount: 0, currency: 'UZS' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (params.tab) return;
        navigate('/finance/payments', { replace: true });
    }, [navigate, params.tab]);

    const trend = useMemo(() => getTrendSeries(finance.totalAmount), [finance.totalAmount]);

    const chartGeometry = useMemo(() => {
        const width = 760;
        const height = 230;
        const linePath = buildChartPath(trend, width, height);
        const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

        const maxValue = Math.max(...trend.map((item) => item.value), 1);
        const minValue = Math.min(...trend.map((item) => item.value), 0);
        const delta = Math.max(maxValue - minValue, 1);

        const points = trend.map((item, index) => {
            const x = (index / Math.max(trend.length - 1, 1)) * width;
            const y = height - ((item.value - minValue) / delta) * height;
            return { ...item, x, y };
        });

        return { width, height, linePath, areaPath, points };
    }, [trend]);

    const paymentRows = useMemo(() => buildPaymentRows(finance.byCourse), [finance.byCourse]);

    const filteredPayments = useMemo(() => {
        const query = personQuery.trim().toLowerCase();

        return paymentRows.filter((row) => {
            if (query) {
                const haystack = `${row.fullName} ${row.phone}`.toLowerCase();
                if (!haystack.includes(query)) return false;
            }

            if (monthFilter && row.month !== monthFilter) return false;
            if (groupFilter && row.group !== groupFilter) return false;
            if (courseFilter && row.course !== courseFilter) return false;
            if (teacherFilter && row.teacher !== teacherFilter) return false;
            if (staffFilter && row.staff !== staffFilter) return false;
            if (paymentTypeFilter && row.paymentType !== paymentTypeFilter) return false;

            return true;
        });
    }, [courseFilter, groupFilter, monthFilter, paymentRows, paymentTypeFilter, personQuery, staffFilter, teacherFilter]);

    const filteredTotal = useMemo(
        () => filteredPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        [filteredPayments],
    );

    const monthOptions = useMemo(
        () => [{ value: '', label: 'Barcha oylar' }, ...MONTHS.map((month) => ({ value: month, label: month }))],
        [],
    );

    const selectOptions = useMemo(() => {
        const groups = [...new Set(paymentRows.map((row) => row.group))];
        const courses = [...new Set(paymentRows.map((row) => row.course))];
        const teachers = [...new Set(paymentRows.map((row) => row.teacher))];
        const staff = [...new Set(paymentRows.map((row) => row.staff))];
        const paymentTypes = [...new Set(paymentRows.map((row) => row.paymentType))];

        return {
            groups: [{ value: '', label: 'Barcha guruhlar' }, ...groups.map((item) => ({ value: item, label: item }))],
            courses: [{ value: '', label: 'Barcha kurslar' }, ...courses.map((item) => ({ value: item, label: item }))],
            teachers: [{ value: '', label: "Barcha o'qituvchilar" }, ...teachers.map((item) => ({ value: item, label: item }))],
            staff: [{ value: '', label: 'Barcha xodimlar' }, ...staff.map((item) => ({ value: item, label: item }))],
            paymentTypes: [{ value: '', label: "To'lov turi" }, ...paymentTypes.map((item) => ({ value: item, label: item }))],
        };
    }, [paymentRows]);

    const debtorRows = useMemo(
        () => finance.byCourse.map((item, index) => ({
            id: item.courseId,
            fullName: `${item.courseName} bo'yicha qarzdor`,
            group: 'Barcha guruhlar',
            debt: Math.round(Number(item.totalAmount || 0) * 0.15),
            dueDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-25`,
        })),
        [finance.byCourse],
    );

    const expenseRows = useMemo(() => {
        const total = Number(finance.totalAmount || 0);
        return [
            { id: 1, title: 'Ijara va kommunal', amount: Math.round(total * 0.22) },
            { id: 2, title: 'Xodimlar maoshi', amount: Math.round(total * 0.3) },
            { id: 3, title: 'Marketing', amount: Math.round(total * 0.08) },
            { id: 4, title: 'Servis xarajatlari', amount: Math.round(total * 0.05) },
        ];
    }, [finance.totalAmount]);

    const paymentMethodRows = useMemo(() => {
        const total = Number(finance.totalAmount || 0);
        const items = [
            { name: 'Naqd', amount: Math.round(total * 0.45), color: 'bg-violet-500' },
            { name: 'Karta', amount: Math.round(total * 0.4), color: 'bg-emerald-500' },
            { name: 'Bank o\'tkazma', amount: Math.max(total - Math.round(total * 0.85), 0), color: 'bg-amber-500' },
        ];

        return items.map((item) => ({
            ...item,
            percent: total > 0 ? (item.amount / total) * 100 : 0,
        }));
    }, [finance.totalAmount]);

    const clearFilters = () => {
        setFromDate('');
        setToDate('');
        setPersonQuery('');
        setMonthFilter('');
        setGroupFilter('');
        setCourseFilter('');
        setTeacherFilter('');
        setStaffFilter('');
        setPaymentTypeFilter('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-5xl font-semibold text-gray-900">Moliya</h1>
                <button
                    type="button"
                    onClick={load}
                    className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 inline-flex items-center justify-center"
                    title="Yangilash"
                >
                    <RefreshCcw size={15} />
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-[#e9edf5]">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => navigate(`/finance/${tab.key}${location.search || ''}`)}
                        className={`h-10 text-sm font-semibold border-b-2 ${activeTab === tab.key ? 'text-violet-600 border-violet-500' : 'text-gray-500 border-transparent'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-[#e2e8f4] bg-white p-3">
                {loading ? (
                    <div className="h-72 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-violet-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-[300px,1fr] gap-4 items-stretch">
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-[#e6ebf5] bg-[#fafcff] p-4">
                                <p className="text-3xl font-medium text-gray-800">Umumiy daromad</p>
                                <p className="text-5xl font-semibold text-teal-600 mt-2">{toCurrency(finance.totalAmount)}</p>
                            </div>
                            <div className="rounded-2xl border border-[#e6ebf5] bg-[#fafcff] p-4">
                                <p className="text-3xl font-medium text-gray-800">Filter bo'yicha</p>
                                <p className="text-5xl font-semibold text-teal-600 mt-2">{toCurrency(filteredTotal)}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#e6ebf5] bg-white p-2 overflow-x-auto">
                            <svg viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height + 36}`} className="w-full" style={{ minWidth: '720px' }}>
                                <path d={chartGeometry.areaPath} fill="rgba(83, 214, 197, 0.16)" />
                                <path d={chartGeometry.linePath} fill="none" stroke="#53d6c5" strokeWidth="3" />

                                {chartGeometry.points.map((point) => (
                                    <g key={point.month}>
                                        <circle cx={point.x} cy={point.y} r="4" fill="#53d6c5" stroke="#fff" strokeWidth="2" />
                                        <text x={point.x} y={chartGeometry.height + 24} textAnchor="middle" fontSize="11" fill="#9ca3b5">
                                            {point.month}
                                        </text>
                                    </g>
                                ))}
                            </svg>
                        </div>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4 space-y-3">
                <h2 className="text-4xl font-semibold text-gray-900">To'lovlar Filtrlari</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                    <Input icon={Calendar} type="date" placeholder="Sanadan boshlab" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                    <Input icon={Calendar} type="date" placeholder="Sanagacha" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                    <Input icon={Search} placeholder="Ism yoki telefon" value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} />
                    <Select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} options={monthOptions} />

                    <Select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} options={selectOptions.groups} />
                    <Select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} options={selectOptions.courses} />
                    <Select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} options={selectOptions.teachers} />
                    <Select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} options={selectOptions.staff} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="w-full md:max-w-xs">
                        <Select value={paymentTypeFilter} onChange={(event) => setPaymentTypeFilter(event.target.value)} options={selectOptions.paymentTypes} />
                    </div>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-sm font-semibold text-gray-700"
                    >
                        Tozalash
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
                {activeTab === 'payments' && (
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: '960px' }}>
                            <thead>
                                <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">To'lov</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Guruh</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Kurs</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Xodim</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Oy</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">To'lov turi</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Miqdor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center">
                                            <Loader2 size={24} className="animate-spin mx-auto text-violet-500" />
                                        </td>
                                    </tr>
                                ) : filteredPayments.length > 0 ? (
                                    filteredPayments.map((row) => (
                                        <tr key={row.id} className="border-b border-[#f1f4fa]">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-800">{row.fullName}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{row.group}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{row.course}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{row.staff}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{row.month}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{row.paymentType}</td>
                                            <td className="py-3 px-4 text-right text-sm font-semibold text-emerald-600">{toCurrency(row.amount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center text-sm text-gray-400">To'lovlar topilmadi</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'debtors' && (
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: '760px' }}>
                            <thead>
                                <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Qarzdor</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Guruh</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Muddat</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Qarz</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debtorRows.map((row) => (
                                    <tr key={row.id} className="border-b border-[#f1f4fa]">
                                        <td className="py-3 px-4 text-sm text-gray-700 inline-flex items-center gap-2"><Users size={14} /> {row.fullName}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{row.group}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{row.dueDate}</td>
                                        <td className="py-3 px-4 text-right text-sm font-semibold text-red-500">{toCurrency(row.debt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
                        {expenseRows.map((row) => (
                            <article key={row.id} className="rounded-2xl border border-[#e6ebf5] bg-white p-4">
                                <p className="text-sm text-gray-500">Xarajat</p>
                                <h3 className="text-2xl font-semibold text-gray-900 mt-1">{row.title}</h3>
                                <p className="text-xl font-semibold text-amber-600 mt-3 inline-flex items-center gap-2">
                                    <Wallet size={15} /> {toCurrency(row.amount)}
                                </p>
                            </article>
                        ))}
                    </div>
                )}

                {activeTab === 'payment-methods' && (
                    <div className="p-4 space-y-3">
                        {paymentMethodRows.map((row) => (
                            <article key={row.name} className="rounded-2xl border border-[#e6ebf5] bg-white p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <p className="font-semibold text-gray-800 inline-flex items-center gap-2"><CreditCard size={14} /> {row.name}</p>
                                    <p className="text-gray-500">{row.percent.toFixed(1)}%</p>
                                </div>
                                <p className="text-xl font-semibold text-gray-900 mt-1">{toCurrency(row.amount)}</p>
                                <div className="mt-2 h-2 rounded-full bg-[#edf1f8] overflow-hidden">
                                    <div className={`${row.color} h-full`} style={{ width: `${row.percent.toFixed(1)}%` }} />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
