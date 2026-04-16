import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Edit3,
    Loader2,
    MapPin,
    Phone,
    Plus,
    RefreshCcw,
    Trash2,
    X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const CENTER_STORAGE_KEY = 'erp_selected_center';
const COURSE_CENTER_KEY = 'management_course_branch_map_v1';
const ROOM_CENTER_KEY = 'management_room_branch_map_v1';
const BRANCHES_KEY = 'management_branches_v1';
const CATEGORY_KEY = 'management_course_categories_v1';

const CENTER_OPTIONS = [
    'AICoder markazi',
    'Fizika va Matematika',
    '4-maktab',
    'Niner markazi',
    'SAT,IELTS,AP,CONSULTING centre',
    'IELTS full mock',
];

const MANAGEMENT_TABS = [
    { key: 'courses', label: 'Kurslar' },
    { key: 'rooms', label: 'Xonalar' },
    { key: 'branch', label: 'Filiallar' },
    { key: 'staff', label: 'Xodimlar' },
    { key: 'reasons', label: 'Sabablar' },
    { key: 'roles', label: 'Rollar' },
    { key: 'coin', label: 'Coin' },
    { key: 'broadcast', label: 'Xabar yuborish' },
    { key: 'audit', label: 'Tekshiruv' },
];

const DEFAULT_CATEGORIES = ['Web dasturlash', 'English', 'Xalqaro', '3D grafik dizayn'];

const INITIAL_COURSE_FORM = {
    name: '',
    description: '',
    durationLesson: '90',
    durationMonth: '3',
    price: '300000',
    center: CENTER_OPTIONS[0],
};

const INITIAL_ROOM_FORM = {
    name: '',
    capacity: '30',
    center: CENTER_OPTIONS[0],
};

const INITIAL_BRANCH_FORM = {
    name: '',
    phone: '',
    address: '',
};

function safeParse(value, fallback) {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function normalizeObject(payload) {
    if (payload?.data?.data) return payload.data.data;
    if (payload?.data) return payload.data;
    return null;
}

function asCurrency(value) {
    return `${Number(value || 0).toLocaleString('uz-UZ')} so'm`;
}

function seedBranches() {
    return [
        {
            id: 1,
            name: 'AICoder markazi',
            phone: '998995888898',
            address: 'Toshkent shahri Mirobod tumani',
            status: 'ACTIVE',
        },
        {
            id: 2,
            name: 'Fizika va Matematika',
            phone: '998934990621',
            address: 'Chilonzor 9-13',
            status: 'ACTIVE',
        },
        {
            id: 3,
            name: '4-maktab',
            phone: '998999999999',
            address: 'Qashqadaryo',
            status: 'ACTIVE',
        },
        {
            id: 4,
            name: 'Niner markazi',
            phone: '998900040225',
            address: 'Toshkent shahri, Chilonzor tumani',
            status: 'ACTIVE',
        },
        {
            id: 5,
            name: 'SAT,IELTS,AP,CONSULTING centre',
            phone: '998559384398',
            address: 'Qashqadaryo viloyat Shahrisabz',
            status: 'ACTIVE',
        },
        {
            id: 6,
            name: 'IELTS full mock',
            phone: '998974465789',
            address: 'Shahrisabz',
            status: 'ACTIVE',
        },
    ];
}

function getCourseName(course) {
    return course?.name || '--';
}

function getCourseDescription(course) {
    if (!course?.description) return "Izoh yo'q";

    const text = String(course.description);
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.descriptions?.uz === 'string' && parsed.descriptions.uz.trim()) {
            return parsed.descriptions.uz;
        }
        if (typeof parsed?.subtitle === 'string' && parsed.subtitle.trim()) {
            return parsed.subtitle;
        }
    } catch {
        return text;
    }

    return "Izoh yo'q";
}

function getCourseCenter(courseId, courseCenterMap) {
    return courseCenterMap[String(courseId)] || CENTER_OPTIONS[0];
}

function getRoomCenter(roomId, roomCenterMap) {
    return roomCenterMap[String(roomId)] || CENTER_OPTIONS[0];
}

function SectionChip({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-8 rounded-xl px-3 text-sm transition ${active
                ? 'bg-white border border-[#dfe4ef] text-violet-600'
                : 'bg-[#edf0f6] text-slate-600 hover:bg-[#e7ebf4]'}`}
        >
            {children}
        </button>
    );
}

function ManagementCard({ title, children, action }) {
    return (
        <section className="rounded-2xl border border-[#dee4f0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-3xl leading-none font-medium text-slate-900">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

export default function ManagementPage() {
    const navigate = useNavigate();
    const { tab } = useParams();

    const activeTab = useMemo(() => {
        if (MANAGEMENT_TABS.some((item) => item.key === tab)) return tab;
        return 'courses';
    }, [tab]);

    const [selectedCenter, setSelectedCenter] = useState(() => {
        if (typeof window === 'undefined') return CENTER_OPTIONS[0];
        const saved = window.localStorage.getItem(CENTER_STORAGE_KEY);
        return saved && CENTER_OPTIONS.includes(saved) ? saved : CENTER_OPTIONS[0];
    });

    const [courseCenterMap, setCourseCenterMap] = useState(() => {
        if (typeof window === 'undefined') return {};
        return safeParse(window.localStorage.getItem(COURSE_CENTER_KEY) || '{}', {});
    });

    const [roomCenterMap, setRoomCenterMap] = useState(() => {
        if (typeof window === 'undefined') return {};
        return safeParse(window.localStorage.getItem(ROOM_CENTER_KEY) || '{}', {});
    });

    const [branches, setBranches] = useState(() => {
        if (typeof window === 'undefined') return seedBranches();
        const cached = safeParse(window.localStorage.getItem(BRANCHES_KEY) || '[]', []);
        if (Array.isArray(cached) && cached.length > 0) return cached;
        return seedBranches();
    });

    const [categories, setCategories] = useState(() => {
        if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
        const cached = safeParse(window.localStorage.getItem(CATEGORY_KEY) || '[]', []);
        if (Array.isArray(cached) && cached.length > 0) return cached;
        return DEFAULT_CATEGORIES;
    });

    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [courseScope, setCourseScope] = useState('ACTIVE');
    const [branchScope, setBranchScope] = useState('ACTIVE');

    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(0);
    const [courseForm, setCourseForm] = useState(INITIAL_COURSE_FORM);

    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState(0);
    const [roomForm, setRoomForm] = useState(INITIAL_ROOM_FORM);

    const [branchDrawerOpen, setBranchDrawerOpen] = useState(false);
    const [editingBranchId, setEditingBranchId] = useState(0);
    const [branchForm, setBranchForm] = useState(INITIAL_BRANCH_FORM);

    useEffect(() => {
        if (!tab) {
            navigate('/management/courses', { replace: true });
        }
    }, [navigate, tab]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(COURSE_CENTER_KEY, JSON.stringify(courseCenterMap));
    }, [courseCenterMap]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(ROOM_CENTER_KEY, JSON.stringify(roomCenterMap));
    }, [roomCenterMap]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
    }, [branches]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
    }, [categories]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [coursesRes, roomsRes] = await Promise.allSettled([
                api.get('/courses?page=1&limit=300'),
                api.get('/rooms?page=1&limit=300'),
            ]);

            if (coursesRes.status === 'fulfilled') {
                setCourses(normalizeList(coursesRes.value.data));
            } else {
                setCourses([]);
            }

            if (roomsRes.status === 'fulfilled') {
                setRooms(normalizeList(roomsRes.value.data));
            } else {
                setRooms([]);
            }

            if (coursesRes.status === 'rejected' && roomsRes.status === 'rejected') {
                throw coursesRes.reason;
            }
        } catch (e) {
            setError(getApiErrorMessage(e, "Ma'lumotlarni yuklashda xatolik"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const activeCourses = useMemo(() => (
        courses
            .filter((course) => courseScope === 'ARCHIVE' ? course.status === 'INACTIVE' : course.status !== 'INACTIVE')
            .filter((course) => getCourseCenter(course.id, courseCenterMap) === selectedCenter)
    ), [courses, courseCenterMap, courseScope, selectedCenter]);

    const activeRooms = useMemo(() => (
        rooms
            .filter((room) => room.status !== 'INACTIVE')
            .filter((room) => getRoomCenter(room.id, roomCenterMap) === selectedCenter)
    ), [rooms, roomCenterMap, selectedCenter]);

    const scopedBranches = useMemo(() => {
        if (branchScope === 'ARCHIVE') return branches.filter((branch) => branch.status === 'INACTIVE');
        return branches.filter((branch) => branch.status !== 'INACTIVE');
    }, [branches, branchScope]);

    const openCourseCreate = () => {
        setEditingCourseId(0);
        setCourseForm({ ...INITIAL_COURSE_FORM, center: selectedCenter });
        setCourseModalOpen(true);
    };

    const openCourseEdit = (course) => {
        setEditingCourseId(Number(course.id));
        setCourseForm({
            name: course.name || '',
            description: getCourseDescription(course),
            durationLesson: String(course.durationLesson || 90),
            durationMonth: String(course.durationMonth || 3),
            price: String(course.price || 0),
            center: getCourseCenter(course.id, courseCenterMap),
        });
        setCourseModalOpen(true);
    };

    const saveCourse = async () => {
        if (!courseForm.name.trim()) {
            setError('Kurs nomi majburiy');
            return;
        }

        const durationLesson = Number(courseForm.durationLesson);
        const durationMonth = Number(courseForm.durationMonth);
        const price = Number(courseForm.price);

        if (!Number.isFinite(durationLesson) || durationLesson <= 0 || !Number.isFinite(durationMonth) || durationMonth <= 0 || !Number.isFinite(price) || price < 0) {
            setError("Kurs maydonlarini to'g'ri kiriting");
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                name: courseForm.name.trim(),
                description: courseForm.description.trim(),
                durationLesson,
                durationMonth,
                price,
            };

            let courseId = editingCourseId;

            if (editingCourseId) {
                await api.patch(`/courses/${editingCourseId}`, payload);
            } else {
                const response = await api.post('/courses', payload);
                const created = normalizeObject(response.data);
                courseId = Number(created?.id || 0);
            }

            if (courseId > 0) {
                setCourseCenterMap((prev) => ({
                    ...prev,
                    [String(courseId)]: courseForm.center,
                }));
            }

            setCourseModalOpen(false);
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Kursni saqlashda xatolik'));
        } finally {
            setSaving(false);
        }
    };

    const archiveCourse = async (course) => {
        const message = courseScope === 'ARCHIVE'
            ? `${course.name} kursini qayta faollashtirishni xohlaysizmi?`
            : `${course.name} kursini arxivga o'tkazishni xohlaysizmi?`;

        if (!window.confirm(message)) return;

        setSaving(true);
        setError('');

        try {
            if (courseScope === 'ARCHIVE') {
                await api.patch(`/courses/${course.id}`, { status: 'ACTIVE' });
            } else {
                await api.delete(`/courses/${course.id}`);
            }
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Kurs holatini yangilab bo\'lmadi'));
        } finally {
            setSaving(false);
        }
    };

    const openRoomCreate = () => {
        setEditingRoomId(0);
        setRoomForm({ ...INITIAL_ROOM_FORM, center: selectedCenter });
        setRoomModalOpen(true);
    };

    const openRoomEdit = (room) => {
        setEditingRoomId(Number(room.id));
        setRoomForm({
            name: room.name || '',
            capacity: String(room.capacity || 30),
            center: getRoomCenter(room.id, roomCenterMap),
        });
        setRoomModalOpen(true);
    };

    const saveRoom = async () => {
        if (!roomForm.name.trim()) {
            setError('Xona nomi majburiy');
            return;
        }

        const capacity = Number(roomForm.capacity);
        if (!Number.isFinite(capacity) || capacity <= 0) {
            setError('Sig\'im noto\'g\'ri');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                name: roomForm.name.trim(),
                capacity,
            };

            let roomId = editingRoomId;

            if (editingRoomId) {
                await api.patch(`/rooms/${editingRoomId}`, payload);
            } else {
                const response = await api.post('/rooms', payload);
                const created = normalizeObject(response.data);
                roomId = Number(created?.id || 0);
            }

            if (roomId > 0) {
                setRoomCenterMap((prev) => ({
                    ...prev,
                    [String(roomId)]: roomForm.center,
                }));
            }

            setRoomModalOpen(false);
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, 'Xonani saqlashda xatolik'));
        } finally {
            setSaving(false);
        }
    };

    const deleteRoom = async (room) => {
        if (!window.confirm(`${room.name} xonasini o'chirishni xohlaysizmi?`)) return;

        setSaving(true);
        setError('');

        try {
            await api.delete(`/rooms/${room.id}`);
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, "Xonani o'chirib bo'lmadi"));
        } finally {
            setSaving(false);
        }
    };

    const addCategory = () => {
        const value = window.prompt('Yangi kategoriya nomi');
        if (!value) return;
        const trimmed = value.trim();
        if (!trimmed) return;
        setCategories((prev) => {
            if (prev.includes(trimmed)) return prev;
            return [...prev, trimmed];
        });
    };

    const editCategory = (category, index) => {
        const value = window.prompt('Kategoriya nomini tahrirlang', category);
        if (!value) return;
        const trimmed = value.trim();
        if (!trimmed) return;
        setCategories((prev) => prev.map((item, idx) => (idx === index ? trimmed : item)));
    };

    const removeCategory = (index) => {
        setCategories((prev) => prev.filter((_, idx) => idx !== index));
    };

    const openBranchCreate = () => {
        setEditingBranchId(0);
        setBranchForm(INITIAL_BRANCH_FORM);
        setBranchDrawerOpen(true);
    };

    const openBranchEdit = (branch) => {
        setEditingBranchId(Number(branch.id));
        setBranchForm({
            name: branch.name || '',
            phone: branch.phone || '',
            address: branch.address || '',
        });
        setBranchDrawerOpen(true);
    };

    const saveBranch = () => {
        if (!branchForm.name.trim() || !branchForm.phone.trim() || !branchForm.address.trim()) {
            setError('Filial nomi, telefon va manzil majburiy');
            return;
        }

        setError('');

        if (editingBranchId) {
            setBranches((prev) => prev.map((branch) => {
                if (Number(branch.id) !== editingBranchId) return branch;
                return {
                    ...branch,
                    name: branchForm.name.trim(),
                    phone: branchForm.phone.trim(),
                    address: branchForm.address.trim(),
                };
            }));
        } else {
            setBranches((prev) => ([
                ...prev,
                {
                    id: Date.now(),
                    name: branchForm.name.trim(),
                    phone: branchForm.phone.trim(),
                    address: branchForm.address.trim(),
                    status: 'ACTIVE',
                },
            ]));
        }

        setBranchDrawerOpen(false);
    };

    const archiveBranch = (branch) => {
        if (branch.status === 'INACTIVE') {
            setBranches((prev) => prev.map((item) => (
                Number(item.id) === Number(branch.id) ? { ...item, status: 'ACTIVE' } : item
            )));
            return;
        }

        if (!window.confirm(`${branch.name} filialini arxivga o'tkazishni xohlaysizmi?`)) return;
        setBranches((prev) => prev.map((item) => (
            Number(item.id) === Number(branch.id) ? { ...item, status: 'INACTIVE' } : item
        )));
    };

    const renderCenterRow = (
        <div className="mb-4 flex flex-wrap gap-2">
            {CENTER_OPTIONS.map((center) => (
                <SectionChip
                    key={center}
                    active={selectedCenter === center}
                    onClick={() => setSelectedCenter(center)}
                >
                    {center}
                </SectionChip>
            ))}
        </div>
    );

    const renderCourses = (
        <div className="space-y-4">
            <ManagementCard
                title="Kurslar"
                action={(
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe4ef] text-slate-500"
                            title="Yangilash"
                        >
                            <RefreshCcw size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={openCourseCreate}
                            className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                        >
                            <span className="inline-flex items-center gap-1.5"><Plus size={15} /> Kurs qo'shish</span>
                        </button>
                    </div>
                )}
            >
                <div className="mb-4 flex flex-wrap gap-2">
                    {renderCenterRow}
                    <SectionChip
                        active={courseScope === 'ARCHIVE'}
                        onClick={() => setCourseScope((prev) => (prev === 'ARCHIVE' ? 'ACTIVE' : 'ARCHIVE'))}
                    >
                        Arxiv
                    </SectionChip>
                </div>

                {loading ? (
                    <div className="py-10 text-center">
                        <Loader2 size={22} className="mx-auto animate-spin text-violet-500" />
                    </div>
                ) : activeCourses.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {activeCourses.map((course) => (
                            <article key={course.id} className="rounded-2xl border border-[#e5e9f2] bg-[#f9fbff] p-4">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-xl leading-tight font-semibold text-slate-800">{getCourseName(course)}</h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{getCourseDescription(course)}</p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => archiveCourse(course)}
                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${courseScope === 'ARCHIVE' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                                            title={courseScope === 'ARCHIVE' ? 'Faollashtirish' : 'Arxivga yuborish'}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openCourseEdit(course)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                                            title="Tahrirlash"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-sm">
                                    <span className="rounded-xl border border-[#cfd6e5] bg-white px-2.5 py-1 text-slate-600">{course.durationLesson || 0} min</span>
                                    <span className="rounded-xl border border-[#cfd6e5] bg-white px-2.5 py-1 text-slate-600">{course.durationMonth || 0} oy</span>
                                    <span className="rounded-xl border border-[#cfd6e5] bg-white px-2.5 py-1 text-slate-600">{asCurrency(course.price)}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="py-8 text-center text-slate-500">Tanlangan filialda kurslar yo'q</p>
                )}
            </ManagementCard>

            <ManagementCard
                title="Kurs kategoriyalari"
                action={(
                    <button
                        type="button"
                        onClick={addCategory}
                        className="h-9 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white"
                    >
                        <span className="inline-flex items-center gap-1.5"><Plus size={14} /> Yangi qo'shish</span>
                    </button>
                )}
            >
                <div className="overflow-x-auto rounded-2xl border border-[#e4e9f3] bg-white">
                    <table className="w-full min-w-180">
                        <thead>
                            <tr className="border-b border-[#edf1f8] text-left">
                                <th className="px-5 py-3 text-sm font-semibold text-slate-800">#</th>
                                <th className="px-5 py-3 text-sm font-semibold text-slate-800">Nomi</th>
                                <th className="px-5 py-3 text-right text-sm font-semibold text-slate-800">Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category, index) => (
                                <tr key={category + index} className="border-b border-[#f2f5fa] last:border-b-0">
                                    <td className="px-5 py-3 text-slate-700">{index + 1}</td>
                                    <td className="px-5 py-3 text-slate-700">{category}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editCategory(category, index)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe4ef] text-slate-600"
                                                title="Tahrirlash"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeCategory(index)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white"
                                                title="O'chirish"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ManagementCard>
        </div>
    );

    const renderRooms = (
        <ManagementCard
            title="Xonalar"
            action={(
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadData}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe4ef] text-slate-500"
                        title="Yangilash"
                    >
                        <RefreshCcw size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={openRoomCreate}
                        className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                    >
                        <span className="inline-flex items-center gap-1.5"><Plus size={15} /> Xonani qo'shish</span>
                    </button>
                </div>
            )}
        >
            {renderCenterRow}

            {loading ? (
                <div className="py-10 text-center">
                    <Loader2 size={22} className="mx-auto animate-spin text-violet-500" />
                </div>
            ) : activeRooms.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeRooms.map((room) => (
                        <article key={room.id} className="rounded-2xl border border-[#e5e9f2] bg-[#f9fbff] p-4">
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <h3 className="text-xl leading-tight font-semibold text-slate-800">{room.name}</h3>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => deleteRoom(room)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openRoomEdit(room)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                                        title="Tahrirlash"
                                    >
                                        <Edit3 size={15} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-slate-600">Sig'imi: <span className="font-semibold">{room.capacity}</span></div>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="py-8 text-center text-slate-500">Ushbu filialda xonalar yo'q</p>
            )}
        </ManagementCard>
    );

    const renderBranches = (
        <ManagementCard
            title="Filiallar"
            action={(
                <button
                    type="button"
                    onClick={openBranchCreate}
                    className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                >
                    <span className="inline-flex items-center gap-1.5"><Plus size={15} /> Filial qo'shish</span>
                </button>
            )}
        >
            <div className="mb-4 flex items-center gap-2">
                <SectionChip active={branchScope === 'ACTIVE'} onClick={() => setBranchScope('ACTIVE')}>
                    Faol
                </SectionChip>
                <SectionChip active={branchScope === 'ARCHIVE'} onClick={() => setBranchScope('ARCHIVE')}>
                    Arxiv
                </SectionChip>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {scopedBranches.map((branch) => (
                    <article key={branch.id} className="rounded-2xl border border-[#e5e9f2] bg-[#f9fbff] p-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <h3 className="text-xl leading-tight font-semibold text-slate-800">{branch.name}</h3>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => archiveBranch(branch)}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${branchScope === 'ARCHIVE' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                                    title={branchScope === 'ARCHIVE' ? 'Faollashtirish' : 'Arxivga yuborish'}
                                >
                                    <Trash2 size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openBranchEdit(branch)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                                    title="Tahrirlash"
                                >
                                    <Edit3 size={15} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            <p className="inline-flex items-start gap-2">
                                <Phone size={14} className="mt-0.5 text-slate-400" />
                                <span>{branch.phone}</span>
                            </p>
                            <p className="inline-flex items-start gap-2">
                                <MapPin size={14} className="mt-0.5 text-slate-400" />
                                <span>{branch.address}</span>
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </ManagementCard>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-5xl font-semibold text-slate-900">Boshqarish</h1>

            <div className="flex flex-wrap items-center gap-4 border-b border-[#dfe4ef] pb-1">
                {MANAGEMENT_TABS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => navigate(`/management/${item.key}`)}
                        className={`h-9 border-b-2 text-[17px] transition ${activeTab === item.key
                            ? 'border-violet-500 text-violet-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'}`}
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

            {activeTab === 'courses' && renderCourses}
            {activeTab === 'rooms' && renderRooms}
            {activeTab === 'branch' && renderBranches}

            {!['courses', 'rooms', 'branch'].includes(activeTab) && (
                <ManagementCard
                    title={MANAGEMENT_TABS.find((item) => item.key === activeTab)?.label || "Bo'lim"}
                    action={(
                        <button
                            type="button"
                            onClick={loadData}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe4ef] text-slate-500"
                            title="Yangilash"
                        >
                            <RefreshCcw size={15} />
                        </button>
                    )}
                >
                    <p className="py-10 text-center text-slate-500">Bu bo'lim keyingi bosqichda to'liq ulanadi.</p>
                </ManagementCard>
            )}

            {courseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setCourseModalOpen(false)} />
                    <div className="relative w-full max-w-130 rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between gap-2">
                            <h3 className="text-2xl font-semibold text-slate-900">
                                {editingCourseId ? 'Kursni tahrirlash' : 'Yangi kurs'}
                            </h3>
                            <button type="button" onClick={() => !saving && setCourseModalOpen(false)} className="text-slate-500">
                                <X size={19} />
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Nomi</span>
                                <input
                                    value={courseForm.name}
                                    onChange={(event) => setCourseForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Filial</span>
                                <select
                                    value={courseForm.center}
                                    onChange={(event) => setCourseForm((prev) => ({ ...prev, center: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                >
                                    {CENTER_OPTIONS.map((center) => (
                                        <option key={center} value={center}>{center}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Dars davomiyligi (min)</span>
                                <input
                                    type="number"
                                    value={courseForm.durationLesson}
                                    onChange={(event) => setCourseForm((prev) => ({ ...prev, durationLesson: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Davomiyligi (oy)</span>
                                <input
                                    type="number"
                                    value={courseForm.durationMonth}
                                    onChange={(event) => setCourseForm((prev) => ({ ...prev, durationMonth: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                                <span>Narx (so'm)</span>
                                <input
                                    type="number"
                                    value={courseForm.price}
                                    onChange={(event) => setCourseForm((prev) => ({ ...prev, price: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                                <span>Izoh</span>
                                <textarea
                                    value={courseForm.description}
                                    onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                                    rows={3}
                                    className="w-full rounded-xl border border-[#dfe4ef] p-3"
                                />
                            </label>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => !saving && setCourseModalOpen(false)}
                                className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={saveCourse}
                                disabled={saving}
                                className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-70"
                            >
                                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {roomModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setRoomModalOpen(false)} />
                    <div className="relative w-full max-w-110 rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between gap-2">
                            <h3 className="text-2xl font-semibold text-slate-900">
                                {editingRoomId ? 'Xonani tahrirlash' : 'Yangi xona'}
                            </h3>
                            <button type="button" onClick={() => !saving && setRoomModalOpen(false)} className="text-slate-500">
                                <X size={19} />
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Nomi</span>
                                <input
                                    value={roomForm.name}
                                    onChange={(event) => setRoomForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Sig'im</span>
                                <input
                                    type="number"
                                    value={roomForm.capacity}
                                    onChange={(event) => setRoomForm((prev) => ({ ...prev, capacity: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="space-y-1 text-sm text-slate-600">
                                <span>Filial</span>
                                <select
                                    value={roomForm.center}
                                    onChange={(event) => setRoomForm((prev) => ({ ...prev, center: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                >
                                    {CENTER_OPTIONS.map((center) => (
                                        <option key={center} value={center}>{center}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => !saving && setRoomModalOpen(false)}
                                className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={saveRoom}
                                disabled={saving}
                                className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-70"
                            >
                                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {branchDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/25" onClick={() => setBranchDrawerOpen(false)} />
                    <aside className="relative h-full w-full max-w-95 border-l border-[#dfe4ef] bg-white shadow-2xl">
                        <div className="border-b border-[#e5e9f2] px-5 py-5 flex items-center justify-between">
                            <h3 className="text-3xl leading-none font-semibold text-slate-900">Filialni tahrirlash</h3>
                            <button type="button" onClick={() => setBranchDrawerOpen(false)} className="text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <label className="block text-sm text-slate-600">
                                <span className="mb-1.5 block">Nomi <span className="text-red-500">*</span></span>
                                <input
                                    value={branchForm.name}
                                    onChange={(event) => setBranchForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="block text-sm text-slate-600">
                                <span className="mb-1.5 block">Telefon raqam <span className="text-red-500">*</span></span>
                                <input
                                    value={branchForm.phone}
                                    onChange={(event) => setBranchForm((prev) => ({ ...prev, phone: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>

                            <label className="block text-sm text-slate-600">
                                <span className="mb-1.5 block">Manzil <span className="text-red-500">*</span></span>
                                <input
                                    value={branchForm.address}
                                    onChange={(event) => setBranchForm((prev) => ({ ...prev, address: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-[#dfe4ef] px-3"
                                />
                            </label>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 border-t border-[#e5e9f2] px-5 py-4 flex items-center justify-end gap-3 bg-white">
                            <button
                                type="button"
                                onClick={() => setBranchDrawerOpen(false)}
                                className="h-10 rounded-xl border border-[#dfe4ef] px-4 text-sm text-slate-700"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={saveBranch}
                                className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
                            >
                                Saqlash
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
