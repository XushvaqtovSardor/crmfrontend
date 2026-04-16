import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { computeStudentCoins } from '../utils/studentPanel.js';

const PRODUCTS = [
    {
        id: 1,
        name: 'Apple EarPods 3.5',
        category: 'Aksessuar',
        price: 300,
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 2,
        name: 'Nautica Voyage EDT',
        category: 'Parfyumeriya',
        price: 890,
        image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 3,
        name: 'Echo Dot 4 (Smart Speaker)',
        category: 'Elektronika',
        price: 1300,
        image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 4,
        name: 'Mikado MD-911 (Sichqoncha)',
        category: 'Aksessuar',
        price: 490,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 5,
        name: 'Bluetooth Speaker XT-12',
        category: 'Elektronika',
        price: 999,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 6,
        name: 'CRM termos stakan',
        category: 'Souvenir',
        price: 220,
        image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=600&q=80',
    },
];

const CATEGORIES = ['Barchasi', 'Aksessuar', 'Parfyumeriya', 'Elektronika', 'Souvenir'];

const BOUGHT_STORAGE_KEY = 'crm_student_shop_bought';

function formatCoins(value) {
    const amount = Number(value) || 0;
    return `${new Intl.NumberFormat('uz-UZ').format(amount)} kumush`;
}

export default function StudentShopPage() {
    const [activeTab, setActiveTab] = useState('market');
    const [category, setCategory] = useState('Barchasi');
    const [search, setSearch] = useState('');
    const [onlyAffordable, setOnlyAffordable] = useState(false);
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [coins, setCoins] = useState(0);
    const [error, setError] = useState('');
    const [boughtIds, setBoughtIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(BOUGHT_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const loadCoins = async () => {
            setError('');
            try {
                const progressRes = await api.get('/erp/student/progress');
                setCoins(computeStudentCoins(progressRes.data?.data));
            } catch (e) {
                setCoins(0);
                setError(getApiErrorMessage(e, "Do'kon ma'lumotlarini yuklab bo'lmadi"));
            }
        };

        loadCoins();
    }, []);

    useEffect(() => {
        localStorage.setItem(BOUGHT_STORAGE_KEY, JSON.stringify(boughtIds));
    }, [boughtIds]);

    const visibleProducts = useMemo(() => {
        const min = priceMin === '' ? null : Number(priceMin);
        const max = priceMax === '' ? null : Number(priceMax);

        return PRODUCTS.filter((item) => {
            if (activeTab === 'bought' && !boughtIds.includes(item.id)) return false;
            if (category !== 'Barchasi' && item.category !== category) return false;
            if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (min != null && Number.isFinite(min) && item.price < min) return false;
            if (max != null && Number.isFinite(max) && item.price > max) return false;
            if (onlyAffordable && item.price > coins) return false;
            return true;
        });
    }, [activeTab, boughtIds, category, search, priceMin, priceMax, onlyAffordable, coins]);

    const handleBuy = (productId, price) => {
        if (price > coins) return;
        if (boughtIds.includes(productId)) return;

        setCoins((prev) => Math.max(prev - price, 0));
        setBoughtIds((prev) => [...prev, productId]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[34px] leading-none font-semibold text-gray-900">Do'kon</h1>
                    <p className="text-sm text-gray-500 mt-1">Kumushlaringiz evaziga mahsulotlar oling</p>
                </div>

                <div className="rounded-xl border border-[#f0d2ad] bg-[#fff7ed] px-4 py-2">
                    <p className="text-xs text-[#b1682a]">Kumushingiz</p>
                    <p className="text-lg font-semibold text-[#9d581d]">{formatCoins(coins)}</p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-[#dce1ea] bg-white p-4 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setActiveTab('market')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold border ${activeTab === 'market' ? 'border-[#d28a47] bg-[#fff3e7] text-[#ad6728]' : 'border-[#dde2ec] text-gray-600'}`}
                    >
                        Sotuvda
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('bought')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold border ${activeTab === 'bought' ? 'border-[#d28a47] bg-[#fff3e7] text-[#ad6728]' : 'border-[#dde2ec] text-gray-600'}`}
                    >
                        Sotib olganlar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <label className="rounded-xl border border-[#dde3ed] bg-[#fafbfd] px-3 py-2 inline-flex items-center gap-2">
                        <SlidersHorizontal size={15} className="text-gray-500" />
                        <select
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className="w-full bg-transparent text-sm text-gray-700 outline-none"
                        >
                            {CATEGORIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </label>

                    <label className="rounded-xl border border-[#dde3ed] bg-[#fafbfd] px-3 py-2">
                        <input
                            type="number"
                            value={priceMin}
                            onChange={(event) => setPriceMin(event.target.value)}
                            placeholder="Min"
                            className="w-full bg-transparent text-sm text-gray-700 outline-none"
                        />
                    </label>

                    <label className="rounded-xl border border-[#dde3ed] bg-[#fafbfd] px-3 py-2">
                        <input
                            type="number"
                            value={priceMax}
                            onChange={(event) => setPriceMax(event.target.value)}
                            placeholder="Max"
                            className="w-full bg-transparent text-sm text-gray-700 outline-none"
                        />
                    </label>

                    <label className="rounded-xl border border-[#dde3ed] bg-[#fafbfd] px-3 py-2 inline-flex items-center gap-2">
                        <Search size={15} className="text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Qidirish"
                            className="w-full bg-transparent text-sm text-gray-700 outline-none"
                        />
                    </label>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={onlyAffordable}
                        onChange={(event) => setOnlyAffordable(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#c07a38]"
                    />
                    Kumushlarim yetadiganlarini ko'rsat
                </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleProducts.map((item) => {
                    const canBuy = coins >= item.price;
                    const isBought = boughtIds.includes(item.id);

                    return (
                        <article key={item.id} className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                            <div className="h-40 bg-[#f2f4f9] overflow-hidden">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            </div>

                            <div className="p-4">
                                <p className="text-xs text-gray-500">{item.category}</p>
                                <h3 className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2 min-h-10">{item.name}</h3>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[#ad6728]">{formatCoins(item.price)}</p>
                                    {isBought ? (
                                        <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Sotib olindi</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleBuy(item.id, item.price)}
                                            disabled={!canBuy || activeTab === 'bought'}
                                            className="rounded-lg bg-[#d88f45] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                        >
                                            Sotib olish
                                        </button>
                                    )}
                                </div>
                                {!isBought && (
                                    <p className={`mt-2 text-xs ${canBuy ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {canBuy ? "Kumushingiz yetarli" : "Kumushingiz yetarli emas"}
                                    </p>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {!visibleProducts.length && (
                <div className="rounded-xl border border-[#dce1ea] bg-white px-4 py-14 text-center text-sm text-gray-500">
                    Tanlangan filterlar bo'yicha mahsulot topilmadi
                </div>
            )}
        </div>
    );
}
