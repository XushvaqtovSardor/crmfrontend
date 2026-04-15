import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Coins, Loader2, MoreVertical, Plus, RefreshCcw, Search, Trash2, Upload, UploadCloud, X, } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
const GIFT_META_TYPE = 'gift-v1';
const ROLE_OPTIONS = ['TEACHER', 'STUDENT', 'SCHOOL_STUDENT'];
const LANGUAGE_TABS = [
    { key: 'uz', label: 'Uzbekcha' },
    { key: 'ru', label: 'Русский' },
    { key: 'en', label: 'English' },
];
const BRANCH_OPTIONS = [
    'AICoder markazi',
    'Fizika va Matematika',
    '4-maktab',
    'Niner markazi',
    'SAT,IELTS,AP,CONSULTING centre',
    'IELTS full mock centre',
    'IELTS full mock',
];
const INITIAL_FORM = {
    names: {
        uz: '',
        ru: '',
        en: '',
    },
    descriptions: {
        uz: '',
        ru: '',
        en: '',
    },
    price: '',
    quantity: '1',
    categories: [],
    roles: [],
    branches: [],
    image: '',
    stock: '1',
};
function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data))
        return payload.data.data.data;
    if (Array.isArray(payload?.data?.data))
        return payload.data.data;
    if (Array.isArray(payload?.data))
        return payload.data;
    return [];
}
function parseGiftMeta(description, fallback = {}) {
    if (typeof description !== 'string' || !description.trim()) {
        return {
            names: {
                uz: fallback.name || '',
                ru: '',
                en: '',
            },
            descriptions: {
                uz: '',
                ru: '',
                en: '',
            },
            image: '',
            categories: [],
            roles: [],
            branches: [],
            stock: Number(fallback.durationLesson) > 0 ? Number(fallback.durationLesson) : 1,
            subtitle: '',
            soldCount: 0,
        };
    }
    try {
        const parsed = JSON.parse(description);
        if (parsed?.type !== GIFT_META_TYPE) {
            return {
                names: {
                    uz: fallback.name || '',
                    ru: '',
                    en: '',
                },
                descriptions: {
                    uz: description,
                    ru: '',
                    en: '',
                },
                image: '',
                categories: [],
                roles: [],
                branches: [],
                stock: Number(fallback.durationLesson) > 0 ? Number(fallback.durationLesson) : 1,
                subtitle: '',
                soldCount: 0,
            };
        }
        return {
            names: {
                uz: String(parsed?.names?.uz || fallback.name || ''),
                ru: String(parsed?.names?.ru || ''),
                en: String(parsed?.names?.en || ''),
            },
            descriptions: {
                uz: String(parsed?.descriptions?.uz || ''),
                ru: String(parsed?.descriptions?.ru || ''),
                en: String(parsed?.descriptions?.en || ''),
            },
            image: String(parsed?.image || ''),
            categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
            roles: Array.isArray(parsed?.roles) ? parsed.roles : [],
            branches: Array.isArray(parsed?.branches) ? parsed.branches : [],
            stock: Number(parsed?.stock) > 0 ? Number(parsed.stock) : Number(fallback.durationLesson) || 1,
            subtitle: String(parsed?.subtitle || ''),
            soldCount: Number(parsed?.soldCount || 0),
        };
    }
    catch {
        return {
            names: {
                uz: fallback.name || '',
                ru: '',
                en: '',
            },
            descriptions: {
                uz: description,
                ru: '',
                en: '',
            },
            image: '',
            categories: [],
            roles: [],
            branches: [],
            stock: Number(fallback.durationLesson) > 0 ? Number(fallback.durationLesson) : 1,
            subtitle: '',
            soldCount: 0,
        };
    }
}
function buildGiftDescription(meta) {
    return JSON.stringify({
        type: GIFT_META_TYPE,
        names: meta.names,
        descriptions: meta.descriptions,
        image: meta.image,
        categories: meta.categories,
        roles: meta.roles,
        branches: meta.branches,
        stock: meta.stock,
        subtitle: meta.subtitle,
        soldCount: meta.soldCount,
    });
}
function giftLabel(meta) {
    return meta.names.uz || meta.names.ru || meta.names.en || 'Sovg\'a';
}
function coinLabel(price) {
    return `${Number(price || 0).toLocaleString('uz-UZ')} coin`;
}
export default function CoursesPage() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editId, setEditId] = useState(0);
    const [activeLanguage, setActiveLanguage] = useState('uz');
    const [activeTab, setActiveTab] = useState('teacher');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categoryInput, setCategoryInput] = useState('');
    const [form, setForm] = useState(INITIAL_FORM);
    const [formError, setFormError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/courses?page=1&limit=300');
            const rows = normalizeList(response.data);
            const mapped = rows.map((item) => {
                const meta = parseGiftMeta(item.description, item);
                return {
                    ...item,
                    giftMeta: meta,
                };
            });
            setGifts(mapped);
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Sovg'alarni yuklashda xatolik"));
            setGifts([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    const categoryStats = useMemo(() => {
        const source = gifts.filter((gift) => gift.status !== 'INACTIVE');
        const counter = new Map();
        source.forEach((gift) => {
            const categories = gift.giftMeta.categories.length ? gift.giftMeta.categories : ['Boshqalar'];
            categories.forEach((category) => {
                const key = String(category).trim();
                if (!key)
                    return;
                counter.set(key, (counter.get(key) || 0) + 1);
            });
        });
        return Array.from(counter.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [gifts]);
    const categories = useMemo(() => ['all', ...categoryStats.map((item) => item.name)], [categoryStats]);
    const tabCounters = useMemo(() => {
        const active = gifts.filter((gift) => gift.status !== 'INACTIVE');
        return {
            teacher: active.filter((gift) => gift.giftMeta.roles.includes('TEACHER')).length,
            student: active.filter((gift) => gift.giftMeta.roles.includes('STUDENT') || gift.giftMeta.roles.includes('SCHOOL_STUDENT')).length,
            purchases: active.filter((gift) => gift.giftMeta.soldCount > 0).length,
            archive: gifts.filter((gift) => gift.status === 'INACTIVE').length,
        };
    }, [gifts]);
    const filteredGifts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return gifts.filter((gift) => {
            const label = giftLabel(gift.giftMeta).toLowerCase();
            const subtitle = String(gift.giftMeta.subtitle || '').toLowerCase();
            const categoriesText = gift.giftMeta.categories.join(' ').toLowerCase();
            if (query && !label.includes(query) && !subtitle.includes(query) && !categoriesText.includes(query)) {
                return false;
            }
            if (selectedCategory !== 'all' && !gift.giftMeta.categories.includes(selectedCategory)) {
                return false;
            }
            if (activeTab === 'archive')
                return gift.status === 'INACTIVE';
            if (gift.status === 'INACTIVE')
                return false;
            if (activeTab === 'teacher')
                return gift.giftMeta.roles.includes('TEACHER');
            if (activeTab === 'student')
                return gift.giftMeta.roles.includes('STUDENT') || gift.giftMeta.roles.includes('SCHOOL_STUDENT');
            if (activeTab === 'purchases')
                return gift.giftMeta.soldCount > 0;
            return true;
        });
    }, [activeTab, gifts, search, selectedCategory]);
    const openCreate = () => {
        setEditId(0);
        setForm(INITIAL_FORM);
        setActiveLanguage('uz');
        setFormError('');
        setDrawerOpen(true);
    };
    const openEdit = (gift) => {
        setEditId(Number(gift.id));
        setForm({
            names: {
                uz: gift.giftMeta.names.uz || '',
                ru: gift.giftMeta.names.ru || '',
                en: gift.giftMeta.names.en || '',
            },
            descriptions: {
                uz: gift.giftMeta.descriptions.uz || '',
                ru: gift.giftMeta.descriptions.ru || '',
                en: gift.giftMeta.descriptions.en || '',
            },
            price: String(gift.price || ''),
            quantity: String(gift.durationLesson || 1),
            categories: gift.giftMeta.categories,
            roles: gift.giftMeta.roles,
            branches: gift.giftMeta.branches,
            image: gift.giftMeta.image,
            stock: String(gift.giftMeta.stock || gift.durationLesson || 1),
        });
        setActiveLanguage('uz');
        setFormError('');
        setDrawerOpen(true);
    };
    const closeDrawer = () => {
        if (saving)
            return;
        setDrawerOpen(false);
        setFormError('');
    };
    const toggleCategory = (category) => {
        setForm((prev) => {
            const exists = prev.categories.includes(category);
            return {
                ...prev,
                categories: exists
                    ? prev.categories.filter((item) => item !== category)
                    : [...prev.categories, category],
            };
        });
    };
    const toggleRole = (role) => {
        setForm((prev) => {
            const exists = prev.roles.includes(role);
            return {
                ...prev,
                roles: exists ? prev.roles.filter((item) => item !== role) : [...prev.roles, role],
            };
        });
    };
    const toggleBranch = (branch) => {
        setForm((prev) => {
            const exists = prev.branches.includes(branch);
            return {
                ...prev,
                branches: exists ? prev.branches.filter((item) => item !== branch) : [...prev.branches, branch],
            };
        });
    };
    const addCategoryFromInput = () => {
        const value = categoryInput.trim();
        if (!value)
            return;
        setForm((prev) => {
            if (prev.categories.includes(value))
                return prev;
            return {
                ...prev,
                categories: [...prev.categories, value],
            };
        });
        setCategoryInput('');
    };
    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({
                ...prev,
                image: String(reader.result || ''),
            }));
        };
        reader.readAsDataURL(file);
    };
    const saveGift = async () => {
        const displayName = form.names.uz.trim() || form.names.ru.trim() || form.names.en.trim();
        const price = Number(form.price);
        const quantity = Number(form.quantity || '1');
        const stock = Number(form.stock || form.quantity || '1');
        if (!displayName) {
            setFormError('Hech bo\'lmaganda bitta tilda nom kiriting');
            return;
        }
        if (!Number.isFinite(price) || price < 0) {
            setFormError('Narx noto\'g\'ri');
            return;
        }
        if (!Number.isFinite(quantity) || quantity < 1) {
            setFormError('Sovg\'alar soni kamida 1 bo\'lishi kerak');
            return;
        }
        if (!form.roles.length) {
            setFormError('Hech bo\'lmaganda bitta rol tanlang');
            return;
        }
        if (!form.branches.length) {
            setFormError('Hech bo\'lmaganda bitta filial tanlang');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            const payload = {
                name: displayName,
                durationMonth: 1,
                durationLesson: Math.max(1, Math.floor(quantity)),
                price,
                description: buildGiftDescription({
                    names: form.names,
                    descriptions: form.descriptions,
                    image: form.image,
                    categories: form.categories,
                    roles: form.roles,
                    branches: form.branches,
                    stock: Math.max(1, Math.floor(stock)),
                    subtitle: form.descriptions.uz || form.descriptions.ru || form.descriptions.en || '',
                    soldCount: 0,
                }),
            };
            if (editId) {
                await api.patch(`/courses/${editId}`, payload);
            }
            else {
                await api.post('/courses', payload);
            }
            setDrawerOpen(false);
            await load();
        }
        catch (e) {
            setFormError(getApiErrorMessage(e, "Sovg'ani saqlab bo'lmadi"));
        }
        finally {
            setSaving(false);
        }
    };
    const archiveGift = async (gift) => {
        if (!window.confirm(`${giftLabel(gift.giftMeta)} sovg'asini arxivga o'tkazishni xohlaysizmi?`))
            return;
        setLoading(true);
        setError('');
        try {
            await api.delete(`/courses/${gift.id}`);
            await load();
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Sovg'ani arxivga o'tkazib bo'lmadi"));
            setLoading(false);
        }
    };
    return (<div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <h1 className="text-5xl font-semibold text-gray-900">Sovg'alar</h1>
                <button type="button" onClick={openCreate} className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-violet-700">
                    <Plus size={16}/> Sovg'a qo'shish
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setActiveTab('teacher')} className={`h-9 px-3 rounded-xl text-sm font-medium ${activeTab === 'teacher' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-600'}`}>
                    O'qituvchi <span className="ml-1 text-violet-500">{tabCounters.teacher}</span>
                </button>
                <button type="button" onClick={() => setActiveTab('student')} className={`h-9 px-3 rounded-xl text-sm font-medium ${activeTab === 'student' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-600'}`}>
                    O'quvchi <span className="ml-1 text-violet-500">{tabCounters.student}</span>
                </button>
                <button type="button" onClick={() => setActiveTab('purchases')} className={`h-9 px-3 rounded-xl text-sm font-medium ${activeTab === 'purchases' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-600'}`}>
                    Xaridlar ro'yxati <span className="ml-1 text-violet-500">{tabCounters.purchases}</span>
                </button>
                <button type="button" onClick={() => setActiveTab('archive')} className={`h-9 px-3 rounded-xl text-sm font-medium ${activeTab === 'archive' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-600'}`}>
                    Arxiv <span className="ml-1 text-violet-500">{tabCounters.archive}</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
                <button type="button" onClick={load} className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 inline-flex items-center justify-center">
                    <RefreshCcw size={15}/>
                </button>
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="h-10 w-full rounded-xl border border-[#dfe4ef] pl-9 pr-3 text-sm"/>
                </div>
            </div>

            {error && (<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>)}

            <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-4">
                <aside className="rounded-2xl border border-[#e2e8f4] bg-white p-3 h-fit">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Kategoriyalar</h3>

                    <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                        {categories.map((category) => (<button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`w-full h-10 px-3 rounded-xl text-sm flex items-center justify-between ${selectedCategory === category ? 'bg-violet-50 text-violet-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <span>{category === 'all' ? 'Barchasi' : category}</span>
                                {category !== 'all' && (<span className="text-xs text-gray-400">
                                        {categoryStats.find((item) => item.name === category)?.count || 0}
                                    </span>)}
                            </button>))}
                    </div>

                    <div className="mt-3 border-t border-[#eef2f8] pt-3 space-y-2">
                        <input type="text" value={categoryInput} onChange={(event) => setCategoryInput(event.target.value)} placeholder="Kategoriya qo'shish" className="h-10 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm"/>
                        <button type="button" onClick={addCategoryFromInput} className="w-full h-10 rounded-xl text-sm font-semibold text-violet-600 border border-violet-200 bg-violet-50">
                            Kategoriya qo'shish
                        </button>
                    </div>
                </aside>

                <section>
                    {loading ? (<div className="rounded-2xl border border-[#e2e8f4] bg-white p-8 text-center">
                            <Loader2 size={26} className="animate-spin mx-auto text-violet-500"/>
                        </div>) : filteredGifts.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                            {filteredGifts.map((gift) => (<article key={gift.id} className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
                                    <div className="h-36 bg-[#f7f9ff] relative">
                                        {gift.giftMeta.image ? (<img src={gift.giftMeta.image} alt={giftLabel(gift.giftMeta)} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">E</div>)}

                                        <div className="absolute right-2 top-2 flex items-center gap-1">
                                            <button type="button" onClick={() => openEdit(gift)} className="w-8 h-8 rounded-full bg-white/90 text-gray-500 inline-flex items-center justify-center" title="Tahrirlash">
                                                <MoreVertical size={14}/>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <h4 className="text-2xl font-medium text-gray-900 truncate">{giftLabel(gift.giftMeta)}</h4>
                                        <p className="text-xs text-gray-400 mt-1 truncate">{gift.giftMeta.subtitle || gift.giftMeta.descriptions.uz || '-'}</p>

                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-xl font-semibold text-gray-800 inline-flex items-center gap-1">
                                                <Coins size={14} className="text-amber-500"/> {coinLabel(gift.price)}
                                            </p>
                                            <p className="text-sm text-gray-400">{gift.giftMeta.stock || gift.durationLesson || 0} dona</p>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1">
                                                {gift.giftMeta.categories.slice(0, 2).map((category) => (<span key={category} className="px-2 py-1 rounded-lg bg-[#f5f7fd] text-[11px] text-gray-600">
                                                        {category}
                                                    </span>))}
                                            </div>

                                            <button type="button" onClick={() => archiveGift(gift)} className="w-8 h-8 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 inline-flex items-center justify-center" title="Arxivga o'tkazish">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                </article>))}
                        </div>) : (<div className="rounded-2xl border border-[#e2e8f4] bg-white p-8 text-center text-sm text-gray-400">
                            Tanlangan filtr bo'yicha sovg'alar topilmadi.
                        </div>)}
                </section>
            </div>

            {drawerOpen && (<div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/35" onClick={closeDrawer}/>

                    <aside className="relative w-full max-w-md h-full bg-white border-l border-[#e5e9f3] shadow-2xl flex flex-col">
                        <div className="px-6 py-5 border-b border-[#e9edf5] flex items-start justify-between">
                            <div>
                                <h3 className="text-4xl font-semibold text-gray-900">Sovg'a qo'shish</h3>
                                <p className="text-sm text-gray-500 mt-1">Bu yerda siz yangi sovg'a qo'shishingiz mumkin.</p>
                            </div>
                            <button type="button" onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center">
                                <X size={18}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            <div className="inline-flex rounded-xl bg-[#f4f6fb] p-1">
                                {LANGUAGE_TABS.map((tab) => (<button key={tab.key} type="button" onClick={() => setActiveLanguage(tab.key)} className={`h-9 px-4 rounded-lg text-sm font-medium ${activeLanguage === tab.key ? 'bg-white border border-[#dce3f0] text-gray-900' : 'text-gray-500'}`}>
                                        {tab.label}
                                    </button>))}
                            </div>

                            <Field label="Nomi">
                                <input type="text" value={form.names[activeLanguage]} onChange={(event) => setForm((prev) => ({
                ...prev,
                names: {
                    ...prev.names,
                    [activeLanguage]: event.target.value,
                },
            }))} placeholder="Ma'lumotni kiriting" className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"/>
                            </Field>

                            <Field label="Ta'rif">
                                <textarea value={form.descriptions[activeLanguage]} onChange={(event) => setForm((prev) => ({
                ...prev,
                descriptions: {
                    ...prev.descriptions,
                    [activeLanguage]: event.target.value,
                },
            }))} rows={3} placeholder="Ta'rifni kiriting..." className="w-full rounded-xl border border-[#dde3f0] px-3 py-2 text-sm resize-none"/>
                            </Field>

                            <Field label="Narxi">
                                <div className="relative">
                                    <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"/>
                                    <input type="number" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="coin narhini kiriting" className="w-full h-11 rounded-xl border border-[#dde3f0] pl-9 pr-3 text-sm"/>
                                </div>
                            </Field>

                            <Field label="Sovg'alar soni">
                                <input type="number" min={1} value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value, stock: event.target.value }))} placeholder="Sonini kiriting" className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"/>
                            </Field>

                            <Field label="Kategoriyalar *">
                                <div className="rounded-xl border border-[#dde3f0] p-3 max-h-40 overflow-y-auto space-y-2">
                                    {categoryStats.length > 0 ? categoryStats.map((item) => (<CheckRow key={item.name} label={item.name} checked={form.categories.includes(item.name)} onClick={() => toggleCategory(item.name)}/>)) : (<p className="text-sm text-gray-400">Kategoriya yo'q</p>)}
                                </div>
                            </Field>

                            <Field label="Rollar *" right="tanlash">
                                <div className="rounded-xl border border-[#dde3f0] p-3 space-y-2">
                                    {ROLE_OPTIONS.map((role) => (<CheckRow key={role} label={role} checked={form.roles.includes(role)} onClick={() => toggleRole(role)}/>))}
                                </div>
                                {!form.roles.length && (<p className="mt-1 text-sm text-red-500">Hech bo'lmaganda bitta rol tanlang</p>)}
                            </Field>

                            <Field label="Filiallar *">
                                <div className="rounded-xl border border-[#dde3f0] p-3 max-h-44 overflow-y-auto space-y-2">
                                    {BRANCH_OPTIONS.map((branch) => (<CheckRow key={branch} label={branch} checked={form.branches.includes(branch)} onClick={() => toggleBranch(branch)}/>))}
                                </div>
                            </Field>

                            <Field label="Surati">
                                <label className="h-36 rounded-2xl border-2 border-dashed border-[#cfd7e6] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#fafbff]">
                                    <UploadCloud size={22} className="text-gray-400"/>
                                    <p className="text-sm text-violet-600 font-semibold">Click to upload</p>
                                    <p className="text-xs text-gray-400">or drag and drop</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                                </label>
                                {form.image && (<div className="mt-2 rounded-xl border border-[#dde3f0] overflow-hidden">
                                        <img src={form.image} alt="Gift preview" className="w-full h-24 object-cover"/>
                                    </div>)}
                            </Field>

                            {formError && (<div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {formError}
                                </div>)}
                        </div>

                        <div className="border-t border-[#e9edf5] px-5 py-4 bg-white flex items-center justify-end gap-2">
                            <button type="button" onClick={closeDrawer} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold">
                                Bekor qilish
                            </button>

                            <button type="button" disabled={saving} onClick={saveGift} className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70">
                                {saving && <Loader2 size={15} className="animate-spin"/>}
                                Saqlash
                            </button>
                        </div>
                    </aside>
                </div>)}
        </div>);
}
function Field({ label, children, right = '' }) {
    return (<div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">{label}</label>
                {right ? <span className="text-sm text-violet-600">{right}</span> : null}
            </div>
            {children}
        </div>);
}
function CheckRow({ label, checked, onClick }) {
    return (<button type="button" onClick={onClick} className="w-full h-9 px-2 rounded-lg hover:bg-[#f7f9ff] text-left flex items-center gap-2">
            <span className={`w-5 h-5 rounded-md border inline-flex items-center justify-center ${checked ? 'bg-violet-500 border-violet-500 text-white' : 'border-[#d5dceb] text-transparent'}`}>
                <Check size={13}/>
            </span>
            <span className="text-sm text-gray-700">{label}</span>
        </button>);
}
