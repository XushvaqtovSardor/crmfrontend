import { useMemo, useState } from 'react';
import { CirclePlus } from 'lucide-react';

const DURATION_OPTIONS = [1, 3, 6, 9, 12];

const PLAN_ITEMS = [
    {
        id: 'demo',
        title: 'demo',
        studentRange: '1-100 o\'quvchi',
        basePrice: 100,
        description: 'string',
    },
    {
        id: 'sadassda',
        title: 'Sadasdsa',
        studentRange: '1-100 o\'quvchi',
        basePrice: 13,
        description: 'dsadsa',
    },
    {
        id: 'ishladimi',
        title: 'Ishladimi',
        studentRange: '1-100 o\'quvchi',
        basePrice: 44,
        description: 'sasa',
    },
    {
        id: 'ustoss',
        title: 'Ustoss',
        studentRange: '1-100 o\'quvchi',
        basePrice: 52,
        description: 'starter',
    },
    {
        id: 'yaxshi',
        title: 'yaxshi',
        studentRange: '1-100 o\'quvchi',
        basePrice: 111,
        description: 'popular',
    },
    {
        id: 'plam',
        title: 'Plam',
        studentRange: '1-100 o\'quvchi',
        basePrice: 39,
        description: 'standard',
    },
];

function toCurrency(value) {
    return `${Number(value || 0).toLocaleString('uz-UZ')} so'm`;
}

export default function BillingPlansPage() {
    const [duration, setDuration] = useState(1);

    const plans = useMemo(
        () => PLAN_ITEMS.map((item) => ({
            ...item,
            duration,
            price: Number(item.basePrice || 0) * duration,
        })),
        [duration],
    );

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-5xl font-semibold text-slate-900">Oylik tariflar</h1>
                <p className="mt-1 text-slate-500">Kerakli tarifni tanlang va to'lov qiling. EduCoin bilan ta'lim markazingizni rivojlantiring.</p>
            </div>

            <section className="rounded-2xl border border-[#e2e8f4] bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex rounded-xl border border-[#e2e8f4] bg-[#f7f9fc] p-1">
                        {DURATION_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setDuration(option)}
                                className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${duration === option
                                    ? 'bg-white border border-[#d8deea] text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {option} oy
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8deea] bg-white px-4 text-sm font-semibold text-slate-600"
                    >
                        <CirclePlus size={15} className="text-violet-500" />
                        Promokod
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <article key={plan.id} className="rounded-2xl border border-[#e2e8f4] bg-white p-5">
                            <p className="text-3xl font-semibold text-slate-900">{plan.title}</p>
                            <p className="mt-2 text-sm text-slate-500">{plan.studentRange}</p>
                            <p className="mt-2 text-5xl font-bold text-slate-900">{toCurrency(plan.price)}</p>
                            <p className="mt-1 text-sm text-slate-500">{duration} oy</p>
                            <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

                            <div className="mt-4 space-y-2">
                                <button type="button" className="h-11 w-full rounded-xl bg-violet-500 text-sm font-semibold text-white">
                                    Uzaytirish
                                </button>
                                <button type="button" className="h-11 w-full rounded-xl border border-[#d8deea] bg-white text-sm font-semibold text-slate-700">
                                    Savdo bo'yicha suhbat
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
