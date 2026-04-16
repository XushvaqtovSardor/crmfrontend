import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Banknote,
    Calendar,
    CreditCard,
    Eye,
    Loader2,
    MessageCircle,
    Pencil,
    Plus,
    RefreshCcw,
    RotateCcw,
    Search,
    Trash2,
    User,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const TAB_CONFIG = [
    { key: 'payments', label: "To'lovlar" },
    { key: 'debtor', label: 'Qarzdorlar' },
    { key: 'expenses', label: 'Xarajatlar' },
    { key: 'paymentMethods', label: "To'lov usullari" },
];

const TAB_ALIASES = {
    debtors: 'debtor',
    'payment-methods': 'paymentMethods',
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const STAFF_NAMES = ['Islombek Baxromov', 'Aziza Sobirova', 'System'];
const TEACHER_NAMES = ['Islom Baxromov', 'Madina Ergasheva', 'Umid Tojiyev'];
const GROUP_NAMES = ['SMM', 'IELTS', 'SAT', 'Math'];

const PAYMENT_METHOD_NAMES = ['CLICK', 'PAYME', 'NAQD', 'TERMINAL', 'VISA', 'UZUMBANK', 'UZCARD', 'BRB', "G'AZNA", 'UZUM', 'XAMKOR BANK1', 'HUMO'];

const INITIAL_EXPENSE_FORM = {
    title: '',
    recipient: '',
    amount: '',
    paymentMonth: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    category: '',
    comment: '',
};

function normalizeObject(payload) {
    if (payload?.data?.data) return payload.data.data;
    if (payload?.data) return payload.data;
    return null;
}

function normalizeTabKey(rawTab) {
    const value = String(rawTab || '').trim();
    if (!value) return 'payments';
    return TAB_ALIASES[value] || value;
}

function parseQueryInt(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.floor(parsed);
}

function toCurrency(value) {
    return `${Number(value || 0).toLocaleString('uz-UZ')} so'm`;
}

function toDateText(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    const day = String(date.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function toTimeText(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--';
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function buildPath(points) {
    if (!points.length) return '';
    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');
}

function buildChartModel(series, minValue, maxValue) {
    const width = 760;
    const height = 230;

    const points = series.map((value, index) => {
        const ratio = (value - minValue) / Math.max(maxValue - minValue, 1);
        const x = (index / Math.max(series.length - 1, 1)) * width;
        const y = height - ratio * height;
        return { x, y, value, label: MONTHS_SHORT[index] };
    });

    const linePath = buildPath(points);
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, index) => {
        const value = maxValue - ((maxValue - minValue) / tickCount) * index;
        const ratio = (value - minValue) / Math.max(maxValue - minValue, 1);
        const y = height - ratio * height;
        return { value, y };
    });

    return {
        width,
        height,
        points,
        linePath,
        areaPath,
        ticks,
    };
}

function buildPaymentRows(byCourse = []) {
    const fallbackCourses = [
        { courseName: 'IELTS', totalAmount: 1200000 },
        { courseName: 'SAT', totalAmount: 1400000 },
        { courseName: 'Math', totalAmount: 900000 },
        { courseName: 'SMM', totalAmount: 800000 },
    ];

    const pool = byCourse.length
        ? byCourse.map((item) => ({
            courseName: item.courseName || 'Kurs',
            totalAmount: Number(item.totalAmount || 700000),
        }))
        : fallbackCourses;

    const students = ['Lazizbek O', 'Javohir Y', 'Nodirbek S', 'Madina Q', 'Humoyun T', 'Nilufar P', 'Sardor B', 'Oybek A'];
    const methods = ['TERMINAL', 'Click', 'VISA', 'UZCARD', 'PAYME', 'NAQD'];
    const rows = [];

    let id = 1;
    for (let index = 0; index < Math.max(pool.length, 4); index += 1) {
        const course = pool[index % pool.length];

        for (let slot = 0; slot < 4; slot += 1) {
            const paidAt = new Date(2026, 3, 14 - Math.floor(id / 3), 16 - (id % 6), (id * 7) % 60);
            const amount = Math.max(100000, Math.round((course.totalAmount / 7) * (0.75 + slot * 0.16)));

            rows.push({
                id,
                paidAt,
                studentName: students[(id - 1) % students.length],
                amount,
                paymentMethod: methods[(id - 1) % methods.length],
                paidMonth: MONTHS_UZ[(paidAt.getMonth() + 1) % MONTHS_UZ.length],
                teacherName: TEACHER_NAMES[(id - 1) % TEACHER_NAMES.length],
                groupName: GROUP_NAMES[(id - 1) % GROUP_NAMES.length],
                staffName: STAFF_NAMES[(id - 1) % STAFF_NAMES.length],
                note: id % 4 === 0 ? "Qarz 400,000 so'mdan 500,000 so'mga oshirildi" : '-',
                courseName: course.courseName,
                source: 'System',
            });

            id += 1;
        }
    }

    return rows.sort((left, right) => right.paidAt.getTime() - left.paidAt.getTime());
}

function buildDebtorRows(paymentRows = []) {
    return paymentRows.slice(0, 26).map((row, index) => ({
        id: row.id,
        createdAt: row.paidAt,
        source: 'System',
        fullName: row.studentName,
        balance: index % 5 === 0 ? 0 : Math.round(row.amount * (0.8 + (index % 3) * 0.25)),
        group: row.groupName,
        course: row.courseName,
        staff: 'System',
        note: `${row.paidMonth} 2026: To'liq oy - 13 ta dars uchun`,
    }));
}

function seedExpenseRows() {
    return [
        {
            id: 1,
            date: '2026-04-09',
            title: 'bozorlik',
            description: 'sfd',
            category: 'Qarz',
            recipient: 'zavuch',
            paymentMethod: 'BRB',
            amount: 700000,
            staff: 'Islombek Baxromov',
            paymentMonth: 'Aprel',
        },
        {
            id: 2,
            date: '2026-02-20',
            title: 'Qarz',
            description: '-',
            category: 'Qarz',
            recipient: 'Eshmat',
            paymentMethod: 'VISA',
            amount: 1000000,
            staff: 'Islombek Baxromov',
            paymentMonth: 'Fevral',
        },
    ];
}

function seedPaymentMethods() {
    return PAYMENT_METHOD_NAMES.map((name, index) => ({
        id: index + 1,
        name,
        active: true,
    }));
}

function FilterField({ label, icon: Icon, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                {Icon && <Icon size={14} className="text-slate-500" />}
                {label}
            </span>
            {children}
        </label>
    );
}

export default function FinancePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { tab } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = useMemo(() => normalizeTabKey(tab), [tab]);

    const [finance, setFinance] = useState({ byCourse: [], totalAmount: 0, currency: 'UZS' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [paymentFromDate, setPaymentFromDate] = useState('');
    const [paymentToDate, setPaymentToDate] = useState('');
    const [paymentQuery, setPaymentQuery] = useState('');
    const [paymentMonth, setPaymentMonth] = useState('');
    const [paymentGroup, setPaymentGroup] = useState('');
    const [paymentCourse, setPaymentCourse] = useState('');
    const [paymentTeacher, setPaymentTeacher] = useState('');
    const [paymentStaff, setPaymentStaff] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    const [debtorQuery, setDebtorQuery] = useState('');
    const [debtorGroup, setDebtorGroup] = useState('');
    const [debtorMin, setDebtorMin] = useState('');
    const [debtorMax, setDebtorMax] = useState('');
    const [debtorFromDate, setDebtorFromDate] = useState('');
    const [debtorToDate, setDebtorToDate] = useState('');

    const [expenseFromDate, setExpenseFromDate] = useState('');
    const [expenseToDate, setExpenseToDate] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('Barchasi');
    const [expenseStaff, setExpenseStaff] = useState('Barchasi');
    const [expensePaymentMethod, setExpensePaymentMethod] = useState('Barchasi');
    const [expenseRecipientQuery, setExpenseRecipientQuery] = useState('');

    const [expenses, setExpenses] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState(['Qarz', 'Oylik', 'Transport', 'Kommunal']);
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState(INITIAL_EXPENSE_FORM);
    const [expenseFormError, setExpenseFormError] = useState('');

    const [paymentMethods, setPaymentMethods] = useState(() => seedPaymentMethods());
    const [methodModalOpen, setMethodModalOpen] = useState(false);
    const [methodName, setMethodName] = useState('');

    const page = parseQueryInt(searchParams.get('page'), 1);
    const limit = parseQueryInt(searchParams.get('limit'), 10);

    const setPagination = useCallback((nextPage, nextLimit = limit) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        params.set('limit', String(nextLimit));
        setSearchParams(params, { replace: true });
    }, [limit, searchParams, setSearchParams]);

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
        if (!tab) {
            navigate('/finance/payments?page=1&limit=10', { replace: true });
            return;
        }

        const normalized = normalizeTabKey(tab);
        if (normalized !== tab) {
            navigate(`/finance/${normalized}${location.search}`, { replace: true });
        }
    }, [location.search, navigate, tab]);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        let changed = false;

        if (!next.get('page')) {
            next.set('page', '1');
            changed = true;
        }

        if (!next.get('limit')) {
            next.set('limit', '10');
            changed = true;
        }

        if (changed) {
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (expenses.length > 0) return;
        setExpenses(seedExpenseRows());
    }, [expenses.length]);

    const paymentRows = useMemo(() => buildPaymentRows(finance.byCourse), [finance.byCourse]);
    const debtorRows = useMemo(() => buildDebtorRows(paymentRows), [paymentRows]);

    const paymentFilters = useMemo(() => {
        const groups = [...new Set(paymentRows.map((row) => row.groupName))];
        const courses = [...new Set(paymentRows.map((row) => row.courseName))];
        const teachers = [...new Set(paymentRows.map((row) => row.teacherName))];
        const staff = [...new Set(paymentRows.map((row) => row.staffName))];
        const methods = [...new Set(paymentRows.map((row) => row.paymentMethod))];

        return {
            groups,
            courses,
            teachers,
            staff,
            methods,
        };
    }, [paymentRows]);

    const filteredPayments = useMemo(() => {
        const query = paymentQuery.trim().toLowerCase();
        const fromTs = paymentFromDate ? new Date(`${paymentFromDate}T00:00:00`).getTime() : 0;
        const toTs = paymentToDate ? new Date(`${paymentToDate}T23:59:59`).getTime() : 0;

        return paymentRows.filter((row) => {
            const rowTime = row.paidAt.getTime();

            if (fromTs && rowTime < fromTs) return false;
            if (toTs && rowTime > toTs) return false;

            if (query) {
                const haystack = `${row.studentName} ${row.teacherName} ${row.staffName}`.toLowerCase();
                if (!haystack.includes(query)) return false;
            }

            if (paymentMonth && row.paidMonth !== paymentMonth) return false;
            if (paymentGroup && row.groupName !== paymentGroup) return false;
            if (paymentCourse && row.courseName !== paymentCourse) return false;
            if (paymentTeacher && row.teacherName !== paymentTeacher) return false;
            if (paymentStaff && row.staffName !== paymentStaff) return false;
            if (paymentMethod && row.paymentMethod !== paymentMethod) return false;

            return true;
        });
    }, [paymentCourse, paymentFromDate, paymentGroup, paymentMethod, paymentMonth, paymentQuery, paymentRows, paymentStaff, paymentTeacher, paymentToDate]);

    const paymentTotals = useMemo(() => {
        const total = paymentRows.reduce((sum, row) => sum + row.amount, 0);
        const filtered = filteredPayments.reduce((sum, row) => sum + row.amount, 0);
        return { total, filtered };
    }, [filteredPayments, paymentRows]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredPayments.length / limit)), [filteredPayments.length, limit]);
    const currentPage = Math.min(page, totalPages);

    useEffect(() => {
        if (currentPage !== page) {
            setPagination(currentPage, limit);
        }
    }, [currentPage, limit, page, setPagination]);

    const paginatedPayments = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return filteredPayments.slice(start, start + limit);
    }, [currentPage, filteredPayments, limit]);

    const filteredDebtors = useMemo(() => {
        const query = debtorQuery.trim().toLowerCase();
        const minValue = debtorMin ? Number(debtorMin) : 0;
        const maxValue = debtorMax ? Number(debtorMax) : 0;
        const fromTs = debtorFromDate ? new Date(`${debtorFromDate}T00:00:00`).getTime() : 0;
        const toTs = debtorToDate ? new Date(`${debtorToDate}T23:59:59`).getTime() : 0;

        return debtorRows.filter((row) => {
            const rowTs = row.createdAt.getTime();
            const balance = Number(row.balance || 0);

            if (query && !row.fullName.toLowerCase().includes(query)) return false;
            if (debtorGroup && row.group !== debtorGroup) return false;
            if (minValue && balance < minValue) return false;
            if (maxValue && balance > maxValue) return false;
            if (fromTs && rowTs < fromTs) return false;
            if (toTs && rowTs > toTs) return false;

            return true;
        });
    }, [debtorFromDate, debtorGroup, debtorMax, debtorMin, debtorQuery, debtorRows, debtorToDate]);

    const debtorTotals = useMemo(() => {
        const total = debtorRows.reduce((sum, row) => sum + Number(row.balance || 0), 0);
        const filtered = filteredDebtors.reduce((sum, row) => sum + Number(row.balance || 0), 0);
        return { total, filtered };
    }, [debtorRows, filteredDebtors]);

    const filteredExpenses = useMemo(() => {
        const query = expenseRecipientQuery.trim().toLowerCase();
        const fromTs = expenseFromDate ? new Date(`${expenseFromDate}T00:00:00`).getTime() : 0;
        const toTs = expenseToDate ? new Date(`${expenseToDate}T23:59:59`).getTime() : 0;

        return expenses.filter((row) => {
            const rowTs = new Date(row.date).getTime();
            if (fromTs && rowTs < fromTs) return false;
            if (toTs && rowTs > toTs) return false;
            if (expenseCategory !== 'Barchasi' && row.category !== expenseCategory) return false;
            if (expenseStaff !== 'Barchasi' && row.staff !== expenseStaff) return false;
            if (expensePaymentMethod !== 'Barchasi' && row.paymentMethod !== expensePaymentMethod) return false;
            if (query) {
                const haystack = `${row.title} ${row.recipient}`.toLowerCase();
                if (!haystack.includes(query)) return false;
            }
            return true;
        });
    }, [expenseCategory, expenseFromDate, expensePaymentMethod, expenseRecipientQuery, expenseStaff, expenseToDate, expenses]);

    const expenseTotals = useMemo(() => {
        const total = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
        const filtered = filteredExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
        return { total, filtered };
    }, [expenses, filteredExpenses]);

    const chartMeta = useMemo(() => {
        if (activeTab === 'debtor') {
            return {
                lineColor: '#ef4444',
                areaColor: 'rgba(239, 68, 68, 0.10)',
                tickSuffix: '',
                minValue: -100,
                maxValue: 0,
                series: [-20, -15, -10, -5, -8, -12, -18, -22, -28, -40, -75, -95],
            };
        }

        if (activeTab === 'expenses') {
            return {
                lineColor: '#a855f7',
                areaColor: 'rgba(168, 85, 247, 0.10)',
                tickSuffix: '',
                minValue: -100,
                maxValue: 0,
                series: [-20, -15, -10, -5, -8, -12, -18, -22, -28, -40, -75, -95],
            };
        }

        return {
            lineColor: '#38d3c4',
            areaColor: 'rgba(56, 211, 196, 0.12)',
            tickSuffix: ' mln',
            minValue: 0,
            maxValue: 100,
            series: [65, 72, 58, 56, 68, 62, 84, 90, 86, 75, 52, 60],
        };
    }, [activeTab]);

    const chartModel = useMemo(
        () => buildChartModel(chartMeta.series, chartMeta.minValue, chartMeta.maxValue),
        [chartMeta.maxValue, chartMeta.minValue, chartMeta.series],
    );

    const debtorGroupOptions = useMemo(() => [...new Set(debtorRows.map((row) => row.group))], [debtorRows]);

    const expenseStaffOptions = useMemo(() => ['Barchasi', ...new Set(expenses.map((row) => row.staff))], [expenses]);
    const expenseMethodOptions = useMemo(() => ['Barchasi', ...new Set(expenses.map((row) => row.paymentMethod))], [expenses]);
    const expenseCategoryOptions = useMemo(() => ['Barchasi', ...expenseCategories], [expenseCategories]);

    const addExpenseCategory = () => {
        const input = window.prompt('Toifa nomini kiriting');
        if (!input) return;
        const value = input.trim();
        if (!value) return;

        setExpenseCategories((prev) => {
            if (prev.includes(value)) return prev;
            return [...prev, value];
        });
    };

    const openExpenseModal = () => {
        setExpenseForm(INITIAL_EXPENSE_FORM);
        setExpenseFormError('');
        setExpenseModalOpen(true);
    };

    const closeExpenseModal = () => {
        setExpenseModalOpen(false);
        setExpenseFormError('');
    };

    const submitExpense = () => {
        const amount = Number(expenseForm.amount);
        if (!expenseForm.title.trim() || !expenseForm.recipient.trim() || !Number.isFinite(amount) || amount <= 0) {
            setExpenseFormError("Sarlavha, oluvchi va summa maydonlari majburiy");
            return;
        }

        if (!expenseForm.paymentMonth || !expenseForm.paymentMethod || !expenseForm.category) {
            setExpenseFormError("To'lov oyi, to'lov usuli va xarajat turi tanlanishi kerak");
            return;
        }

        setExpenses((prev) => ([
            {
                id: Date.now(),
                date: expenseForm.date,
                title: expenseForm.title.trim(),
                description: expenseForm.comment.trim() || '-',
                category: expenseForm.category,
                recipient: expenseForm.recipient.trim(),
                paymentMethod: expenseForm.paymentMethod,
                amount,
                staff: 'Islombek Baxromov',
                paymentMonth: expenseForm.paymentMonth,
            },
            ...prev,
        ]));

        setExpenseModalOpen(false);
        setExpenseForm(INITIAL_EXPENSE_FORM);
        setExpenseFormError('');
    };

    const clearPaymentFilters = () => {
        setPaymentFromDate('');
        setPaymentToDate('');
        setPaymentQuery('');
        setPaymentMonth('');
        setPaymentGroup('');
        setPaymentCourse('');
        setPaymentTeacher('');
        setPaymentStaff('');
        setPaymentMethod('');
        setPagination(1, limit);
    };

    const clearDebtorFilters = () => {
        setDebtorQuery('');
        setDebtorGroup('');
        setDebtorMin('');
        setDebtorMax('');
        setDebtorFromDate('');
        setDebtorToDate('');
    };

    const clearExpenseFilters = () => {
        setExpenseFromDate('');
        setExpenseToDate('');
        setExpenseCategory('Barchasi');
        setExpenseStaff('Barchasi');
        setExpensePaymentMethod('Barchasi');
        setExpenseRecipientQuery('');
    };

    const removeExpense = (id) => {
        if (!window.confirm("Xarajatni o'chirishni xohlaysizmi?")) return;
        setExpenses((prev) => prev.filter((row) => row.id !== id));
    };

    const togglePaymentMethod = (id) => {
        setPaymentMethods((prev) => prev.map((method) => (
            method.id === id ? { ...method, active: !method.active } : method
        )));
    };

    const removePaymentMethod = (id) => {
        if (!window.confirm("To'lov usulini o'chirishni xohlaysizmi?")) return;
        setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
    };

    const editPaymentMethod = (method) => {
        const next = window.prompt('Yangi nomni kiriting', method.name);
        if (!next) return;
        const trimmed = next.trim();
        if (!trimmed) return;
        setPaymentMethods((prev) => prev.map((item) => (
            item.id === method.id ? { ...item, name: trimmed } : item
        )));
    };

    const openMethodModal = () => {
        setMethodName('');
        setMethodModalOpen(true);
    };

    const saveNewMethod = () => {
        const name = methodName.trim();
        if (!name) return;

        setPaymentMethods((prev) => {
            if (prev.some((item) => item.name.toUpperCase() === name.toUpperCase())) {
                return prev;
            }

            return [
                ...prev,
                {
                    id: Date.now(),
                    name,
                    active: true,
                },
            ];
        });

        setMethodModalOpen(false);
    };

    const renderStatsCards = () => {
        if (activeTab === 'debtor') {
            return (
                <div className="space-y-3">
                    <div className="rounded-2xl border border-[#e6ebf5] bg-white p-6">
                        <p className="text-3xl font-medium text-slate-800">Jami qarz</p>
                        <p className="mt-2 text-5xl font-semibold text-red-600">{toCurrency(debtorTotals.total)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e6ebf5] bg-white p-6">
                        <p className="text-3xl font-medium text-slate-800">Filter bo'yicha jami</p>
                        <p className="mt-2 text-5xl font-semibold text-red-600">{toCurrency(debtorTotals.filtered)}</p>
                    </div>
                </div>
            );
        }

        if (activeTab === 'expenses') {
            return (
                <div className="space-y-3">
                    <div className="rounded-2xl border border-[#e6ebf5] bg-white p-6">
                        <p className="text-3xl font-medium text-slate-800">Umumiy xarajat</p>
                        <p className="mt-2 text-5xl font-semibold text-slate-900">{toCurrency(expenseTotals.total)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e6ebf5] bg-white p-6">
                        <p className="text-3xl font-medium text-slate-800">Filter bo'yicha umumiy xarajat</p>
                        <p className="mt-2 text-5xl font-semibold text-slate-900">{toCurrency(expenseTotals.filtered)}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="rounded-2xl border border-[#e6ebf5] bg-white p-6">
                    <p className="text-3xl font-medium text-slate-800">Umumiy daromad</p>
                    <p className="mt-2 text-5xl font-semibold text-teal-600">{toCurrency(paymentTotals.total)}</p>
                </div>
                <div className="rounded-2xl border border-[#e6ebf5] bg-white p-6">
                    <p className="text-3xl font-medium text-slate-800">Filter bo'yicha</p>
                    <p className="mt-2 text-5xl font-semibold text-teal-600">{toCurrency(paymentTotals.filtered)}</p>
                </div>
            </div>
        );
    };

    const renderChart = () => (
        <div className="rounded-2xl border border-[#e6ebf5] bg-white p-2 overflow-x-auto">
            <svg viewBox={`0 0 ${chartModel.width} ${chartModel.height + 36}`} className="w-full" style={{ minWidth: '720px' }}>
                {chartModel.ticks.map((tick) => (
                    <g key={String(tick.value)}>
                        <line
                            x1="0"
                            x2={chartModel.width}
                            y1={tick.y}
                            y2={tick.y}
                            stroke="#e8edf6"
                            strokeWidth="1"
                        />
                        <text x="0" y={tick.y - 4} fontSize="11" fill="#9ca3b5">
                            {Math.round(tick.value)}{chartMeta.tickSuffix}
                        </text>
                    </g>
                ))}

                <path d={chartModel.areaPath} fill={chartMeta.areaColor} />
                <path d={chartModel.linePath} fill="none" stroke={chartMeta.lineColor} strokeWidth="3" />

                {chartModel.points.map((point) => (
                    <g key={point.label}>
                        <circle cx={point.x} cy={point.y} r="4" fill={chartMeta.lineColor} stroke="#fff" strokeWidth="2" />
                        <text x={point.x} y={chartModel.height + 24} textAnchor="middle" fontSize="11" fill="#9ca3b5">
                            {point.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );

    const loadingBlock = (
        <section className="rounded-2xl border border-[#e2e8f4] bg-white p-10">
            <Loader2 size={25} className="mx-auto animate-spin text-violet-500" />
        </section>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-5xl font-semibold text-slate-900">Moliya</h1>

            <div className="flex flex-wrap items-center gap-4 border-b border-[#e9edf5]">
                {TAB_CONFIG.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => navigate(`/finance/${item.key}${location.search}`)}
                        className={`h-10 text-sm font-semibold border-b-2 transition ${activeTab === item.key ? 'text-violet-600 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading && loadingBlock}

            {!loading && activeTab !== 'paymentMethods' && (
                <section className="rounded-2xl border border-[#e2e8f4] bg-white p-3">
                    <div className="grid grid-cols-1 xl:grid-cols-[300px,1fr] gap-4 items-stretch">
                        {renderStatsCards()}
                        {renderChart()}
                    </div>
                </section>
            )}

            {!loading && activeTab === 'payments' && (
                <>
                    <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4 space-y-3">
                        <h2 className="text-4xl font-semibold text-slate-900">To'lovlar Filtrlari</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                            <FilterField label="Sanadan boshlab" icon={Calendar}>
                                <input
                                    type="date"
                                    value={paymentFromDate}
                                    onChange={(event) => setPaymentFromDate(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="Sanagacha" icon={Calendar}>
                                <input
                                    type="date"
                                    value={paymentToDate}
                                    onChange={(event) => setPaymentToDate(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="To'liq ism" icon={Search}>
                                <input
                                    type="text"
                                    value={paymentQuery}
                                    onChange={(event) => setPaymentQuery(event.target.value)}
                                    placeholder="Ism yoki telefon raqam bo'yicha qidirish"
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="To'lov qilingan oy" icon={Calendar}>
                                <select
                                    value={paymentMonth}
                                    onChange={(event) => setPaymentMonth(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                >
                                    <option value="">Barcha oylar</option>
                                    {MONTHS_UZ.map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </FilterField>

                            <FilterField label="Guruh" icon={Users}>
                                <select
                                    value={paymentGroup}
                                    onChange={(event) => setPaymentGroup(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                >
                                    <option value="">Barcha guruhlar</option>
                                    {paymentFilters.groups.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </FilterField>
                            <FilterField label="Kurs" icon={CreditCard}>
                                <select
                                    value={paymentCourse}
                                    onChange={(event) => setPaymentCourse(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                >
                                    <option value="">Barcha kurslar</option>
                                    {paymentFilters.courses.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </FilterField>
                            <FilterField label="O'qituvchi" icon={User}>
                                <select
                                    value={paymentTeacher}
                                    onChange={(event) => setPaymentTeacher(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                >
                                    <option value="">Barcha o'qituvchilar</option>
                                    {paymentFilters.teachers.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </FilterField>
                            <FilterField label="Xodim" icon={User}>
                                <select
                                    value={paymentStaff}
                                    onChange={(event) => setPaymentStaff(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                >
                                    <option value="">Barcha xodimlar</option>
                                    {paymentFilters.staff.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </FilterField>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                            <div className="w-full sm:max-w-xs">
                                <FilterField label="To'lov turi" icon={CreditCard}>
                                    <select
                                        value={paymentMethod}
                                        onChange={(event) => setPaymentMethod(event.target.value)}
                                        className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                    >
                                        <option value="">Barcha to'lov turlari</option>
                                        {paymentFilters.methods.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                </FilterField>
                            </div>
                            <button
                                type="button"
                                onClick={clearPaymentFilters}
                                className="h-10 rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm font-semibold text-slate-700"
                            >
                                Filtrlarni tozalash
                            </button>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-4xl font-semibold text-slate-900">To'lovlar</h2>
                            <p className="text-sm text-slate-500">Jami: {filteredPayments.length} ta | Sahifa: {currentPage}/{totalPages}</p>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-[#e5e9f3] bg-white">
                            <table className="w-full" style={{ minWidth: '1300px' }}>
                                <thead>
                                    <tr className="border-b border-[#edf1f8] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">To'lov sanasi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ism</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">So'm</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">To'lov usuli</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">To'lov qilingan oy</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">O'qituvchi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Guruh</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Xodim</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Izoh</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPayments.length > 0 ? paginatedPayments.map((row) => (
                                        <tr key={row.id} className="border-b border-[#f1f4fa] last:border-b-0">
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p className="font-medium text-slate-800">{toDateText(row.paidAt)}</p>
                                                <p>{toTimeText(row.paidAt)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-800">{row.studentName}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{toCurrency(row.amount)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{row.paymentMethod}</td>
                                            <td className="px-4 py-3 text-sm text-blue-600">{row.paidMonth}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{row.teacherName}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{row.groupName}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p>{row.staffName}</p>
                                                <p className="text-xs text-slate-400">{toDateText(row.paidAt)} {toTimeText(row.paidAt)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{row.note}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button type="button" className="text-red-500 hover:text-red-600">
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">To'lovlar topilmadi</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setPagination(Math.max(currentPage - 1, 1), limit)}
                                className="h-9 rounded-xl border border-[#dfe4ef] px-3 text-sm text-slate-600 disabled:opacity-50"
                            >
                                Oldingi
                            </button>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setPagination(Math.min(currentPage + 1, totalPages), limit)}
                                className="h-9 rounded-xl border border-[#dfe4ef] px-3 text-sm text-slate-600 disabled:opacity-50"
                            >
                                Keyingi
                            </button>
                        </div>
                    </section>
                </>
            )}

            {!loading && activeTab === 'debtor' && (
                <>
                    <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
                            <FilterField label="Qidiruv" icon={Search}>
                                <input
                                    value={debtorQuery}
                                    onChange={(event) => setDebtorQuery(event.target.value)}
                                    placeholder="Qidiruv"
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="Guruh bo'yicha" icon={Users}>
                                <select
                                    value={debtorGroup}
                                    onChange={(event) => setDebtorGroup(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                >
                                    <option value="">Barchasi</option>
                                    {debtorGroupOptions.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </FilterField>
                            <FilterField label="Qarz miqdori (dan)">
                                <input
                                    type="number"
                                    value={debtorMin}
                                    onChange={(event) => setDebtorMin(event.target.value)}
                                    placeholder="Min"
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="Qarz miqdori (gacha)">
                                <input
                                    type="number"
                                    value={debtorMax}
                                    onChange={(event) => setDebtorMax(event.target.value)}
                                    placeholder="Max"
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="Sanadan boshlab" icon={Calendar}>
                                <input
                                    type="date"
                                    value={debtorFromDate}
                                    onChange={(event) => setDebtorFromDate(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                            <FilterField label="Sana bo'yicha" icon={Calendar}>
                                <input
                                    type="date"
                                    value={debtorToDate}
                                    onChange={(event) => setDebtorToDate(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                />
                            </FilterField>
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={clearDebtorFilters}
                                className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm font-semibold text-slate-700"
                            >
                                Filtrlarni tozalash
                            </button>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full" style={{ minWidth: '1250px' }}>
                                <thead>
                                    <tr className="border-b border-[#edf1f8] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                                            <input type="checkbox" className="h-4 w-4 rounded border-[#d6dceb]" />
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Sana</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ism</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-red-500">Balansi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Guruh</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Xodim</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Izoh</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDebtors.length > 0 ? filteredDebtors.map((row) => (
                                        <tr key={row.id} className="border-b border-[#f1f4fa] last:border-b-0">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" className="h-4 w-4 rounded border-[#d6dceb]" />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{row.source}</td>
                                            <td className="px-4 py-3 text-sm text-slate-900">{row.fullName}</td>
                                            <td className="px-4 py-3 text-sm text-red-500 font-semibold">{row.balance > 0 ? `- ${toCurrency(row.balance)}` : '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                <p className="inline-flex rounded-lg bg-[#eef1f7] px-2 py-0.5 text-xs text-slate-700">guruh One</p>
                                                <p className="mt-1 text-xs text-slate-400">{row.course}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                <p className="inline-flex rounded-lg bg-[#eef1f7] px-2 py-0.5 text-xs text-slate-700">{row.staff}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{row.note}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                                                        <Eye size={15} />
                                                    </button>
                                                    <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                                                        <MessageCircle size={14} />
                                                    </button>
                                                    <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                                                        <Banknote size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Qarzdorlar topilmadi</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {!loading && activeTab === 'expenses' && (
                <>
                    <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4">
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr,220px] gap-3 items-start">
                            <div className="rounded-2xl bg-[#f6f8fd] p-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <FilterField label="Sana dan" icon={Calendar}>
                                        <input
                                            type="date"
                                            value={expenseFromDate}
                                            onChange={(event) => setExpenseFromDate(event.target.value)}
                                            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                        />
                                    </FilterField>
                                    <FilterField label="Sana gacha" icon={Calendar}>
                                        <input
                                            type="date"
                                            value={expenseToDate}
                                            onChange={(event) => setExpenseToDate(event.target.value)}
                                            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                        />
                                    </FilterField>
                                    <FilterField label="Xarajatlar toifasi">
                                        <select
                                            value={expenseCategory}
                                            onChange={(event) => setExpenseCategory(event.target.value)}
                                            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                        >
                                            {expenseCategoryOptions.map((item) => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </FilterField>
                                    <FilterField label="Hodim" icon={User}>
                                        <select
                                            value={expenseStaff}
                                            onChange={(event) => setExpenseStaff(event.target.value)}
                                            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                        >
                                            {expenseStaffOptions.map((item) => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </FilterField>
                                    <FilterField label="To'lov usuli" icon={CreditCard}>
                                        <select
                                            value={expensePaymentMethod}
                                            onChange={(event) => setExpensePaymentMethod(event.target.value)}
                                            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                        >
                                            {expenseMethodOptions.map((item) => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </FilterField>
                                    <FilterField label="Qabul qiluvchi" icon={Search}>
                                        <input
                                            value={expenseRecipientQuery}
                                            onChange={(event) => setExpenseRecipientQuery(event.target.value)}
                                            placeholder="Qidirish..."
                                            className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm"
                                        />
                                    </FilterField>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={openExpenseModal}
                                    className="h-10 w-full rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                                >
                                    <span className="inline-flex items-center gap-1.5"><Plus size={15} /> Xarajat qo'shish</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={addExpenseCategory}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm font-semibold text-slate-700"
                                >
                                    <span className="inline-flex items-center gap-1.5"><Plus size={15} /> Toifa</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={clearExpenseFilters}
                                    className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white px-4 text-sm font-semibold text-slate-700"
                                >
                                    <span className="inline-flex items-center gap-1.5"><RotateCcw size={15} /> Filtrlarni yangilash</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full" style={{ minWidth: '1300px' }}>
                                <thead>
                                    <tr className="border-b border-[#edf1f8] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">N</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Sana</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Xarajat nomi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Tavsif</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Kategoriya</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Qabul qiluvchi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">To'lov usuli</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Summa</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Hodim</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Harakatlar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length > 0 ? filteredExpenses.map((row, index) => (
                                        <tr key={row.id} className="border-b border-[#f1f4fa] last:border-b-0">
                                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{toDateText(row.date)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-800">{row.title}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{row.description}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{row.category}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eceff5] text-xs text-slate-600">{String(row.recipient || 'U').charAt(0).toUpperCase()}</span>
                                                    {row.recipient}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{row.paymentMethod}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{toCurrency(row.amount)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{row.staff}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" className="text-slate-500 hover:text-slate-700"><Eye size={15} /></button>
                                                    <button type="button" className="text-slate-500 hover:text-slate-700"><MessageCircle size={15} /></button>
                                                    <button type="button" onClick={() => removeExpense(row.id)} className="text-slate-500 hover:text-slate-700"><Trash2 size={15} /></button>
                                                    <button type="button" className="text-slate-500 hover:text-slate-700"><Pencil size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">Xarajatlar topilmadi</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {!loading && activeTab === 'paymentMethods' && (
                <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-5xl font-semibold text-slate-900">To'lov usullari</h2>
                            <p className="mt-1 text-sm text-slate-500">To'lov usullarini boshqarish va qo'shish</p>
                        </div>

                        <button
                            type="button"
                            onClick={openMethodModal}
                            className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                        >
                            <span className="inline-flex items-center gap-1.5"><Plus size={15} /> Yangi qo'shish</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {paymentMethods.map((method) => (
                            <article key={method.id} className="rounded-2xl border border-[#e4e9f3] bg-white px-4 py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-3xl font-medium text-slate-800">{method.name}</h3>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => editPaymentMethod(method)}
                                            className="text-slate-500 hover:text-slate-700"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => togglePaymentMethod(method.id)}
                                            className={`relative h-5 w-10 rounded-full transition ${method.active ? 'bg-violet-500' : 'bg-slate-300'}`}
                                            title="Status"
                                        >
                                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${method.active ? 'left-5' : 'left-0.5'}`} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => removePaymentMethod(method.id)}
                                            className="text-slate-500 hover:text-red-500"
                                            title="O'chirish"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${method.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {method.active ? 'Faol' : 'Nofaol'}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {expenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/30" onClick={closeExpenseModal} />

                    <div className="relative w-full max-w-130 rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-[#e5e9f3] px-5 py-4 flex items-start justify-between gap-2">
                            <div>
                                <h3 className="text-4xl font-semibold text-slate-900">Yangi xarajat qo'shish</h3>
                                <p className="mt-1 text-sm text-slate-500">Xarajat ma'lumotlarini kiriting</p>
                            </div>
                            <button type="button" onClick={closeExpenseModal} className="text-slate-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 p-5">
                            {expenseFormError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {expenseFormError}
                                </div>
                            )}

                            <FilterField label="Sarlavha *">
                                <input
                                    value={expenseForm.title}
                                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Xarajat nomini kiriting"
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                />
                            </FilterField>

                            <FilterField label="Oluvchi *">
                                <input
                                    value={expenseForm.recipient}
                                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, recipient: event.target.value }))}
                                    placeholder="Kim oldi?"
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                />
                            </FilterField>

                            <FilterField label="Summa *">
                                <input
                                    type="number"
                                    value={expenseForm.amount}
                                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                                    placeholder="Summani kiriting"
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                />
                            </FilterField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <FilterField label="Qaysi oyni to'lovidan *">
                                    <select
                                        value={expenseForm.paymentMonth}
                                        onChange={(event) => setExpenseForm((prev) => ({ ...prev, paymentMonth: event.target.value }))}
                                        className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                    >
                                        <option value="">Oyni tanlang</option>
                                        {MONTHS_UZ.map((month) => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </FilterField>

                                <FilterField label="Sana *" icon={Calendar}>
                                    <input
                                        type="date"
                                        value={expenseForm.date}
                                        onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))}
                                        className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                    />
                                </FilterField>

                                <FilterField label="To'lov usuli *">
                                    <select
                                        value={expenseForm.paymentMethod}
                                        onChange={(event) => setExpenseForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                                        className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                    >
                                        <option value="">To'lov usulini tanlang</option>
                                        {paymentMethods.map((method) => (
                                            <option key={method.id} value={method.name}>{method.name}</option>
                                        ))}
                                    </select>
                                </FilterField>

                                <FilterField label="Xarajat turi *">
                                    <select
                                        value={expenseForm.category}
                                        onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))}
                                        className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                                    >
                                        <option value="">Xarajat turini tanlang</option>
                                        {expenseCategories.map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </FilterField>
                            </div>

                            <FilterField label="Izoh (ixtiyoriy)">
                                <textarea
                                    value={expenseForm.comment}
                                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, comment: event.target.value }))}
                                    placeholder="Izoh qoldiring..."
                                    rows={3}
                                    className="w-full rounded-xl border border-[#dfe4ef] p-3 text-sm"
                                />
                            </FilterField>
                        </div>

                        <div className="border-t border-[#e5e9f3] px-5 py-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeExpenseModal}
                                className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={submitExpense}
                                className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {methodModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setMethodModalOpen(false)} />

                    <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                        <h3 className="text-3xl font-semibold text-slate-900">Yangi to'lov usuli</h3>
                        <p className="mt-1 text-sm text-slate-500">Nom kiriting</p>

                        <input
                            value={methodName}
                            onChange={(event) => setMethodName(event.target.value)}
                            placeholder="Masalan: HUMO"
                            className="mt-4 h-11 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"
                        />

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setMethodModalOpen(false)}
                                className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={saveNewMethod}
                                className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
