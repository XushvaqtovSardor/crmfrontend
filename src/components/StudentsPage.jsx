import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Coins, Edit3, Eye, FilterX, Loader2, Minus, Plus, RefreshCcw, Search, Trash2, Upload, UploadCloud, X, } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
const INITIAL_FORM = {
    fullName: '',
    email: '',
    password: '',
    birth_date: '',
    phone: '',
    gender: 'MALE',
    photoUrl: '',
    groupIds: [],
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
function normalizeObject(payload) {
    if (payload?.data?.data)
        return payload.data.data;
    if (payload?.data)
        return payload.data;
    return null;
}
function formatDate(value) {
    if (!value)
        return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return '--';
    return parsed.toLocaleDateString('uz-UZ');
}
function formatDateTime(value) {
    if (!value)
        return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return '--';
    return parsed.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function parseStudentMeta(photoValue) {
    if (typeof photoValue !== 'string' || !photoValue.trim()) {
        return {
            photoUrl: '',
            phone: '',
            gender: 'MALE',
        };
    }
    const raw = photoValue.trim();
    if (raw.startsWith('{')) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.type === 'student-meta-v1') {
                return {
                    photoUrl: String(parsed.photoUrl || ''),
                    phone: String(parsed.phone || ''),
                    gender: parsed.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
                };
            }
        }
        catch {
        }
    }
    return {
        photoUrl: raw,
        phone: '',
        gender: 'MALE',
    };
}
function buildStudentPhotoPayload(meta) {
    const photoUrl = String(meta.photoUrl || '').trim();
    const phone = String(meta.phone || '').trim();
    const gender = meta.gender === 'FEMALE' ? 'FEMALE' : 'MALE';
    if (photoUrl && !phone && gender === 'MALE') {
        return photoUrl;
    }
    if (!photoUrl && !phone && gender === 'MALE') {
        return '';
    }
    return JSON.stringify({
        type: 'student-meta-v1',
        photoUrl,
        phone,
        gender,
    });
}
function sortDirectionIcon(isActive, direction) {
    if (!isActive)
        return '↕';
    return direction === 'asc' ? '↑' : '↓';
}
export default function StudentsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [studentGroups, setStudentGroups] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('ACTIVE');
    const [search, setSearch] = useState('');
    const [phoneSearch, setPhoneSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [sortKey, setSortKey] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editId, setEditId] = useState(0);
    const [form, setForm] = useState(INITIAL_FORM);
    const [groupPickerOpen, setGroupPickerOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [coinAdjustments, setCoinAdjustments] = useState({});
    const resetForm = useCallback(() => {
        setEditId(0);
        setForm(INITIAL_FORM);
        setGroupPickerOpen(false);
        setShowPassword(false);
    }, []);
    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        resetForm();
    }, [resetForm]);
    const getStudentCoin = useCallback((student) => {
        const base = (Number(student?._count?.attendances) || 0) * 10;
        const adjustment = Number(coinAdjustments[student.id]) || 0;
        return Math.max(base + adjustment, 0);
    }, [coinAdjustments]);
    const openEdit = useCallback((student) => {
        const meta = parseStudentMeta(student.photo);
        const relatedGroups = studentGroups[Number(student.id)] || [];
        setEditId(Number(student.id));
        setForm({
            fullName: student.fullName || '',
            email: student.email || '',
            password: '',
            birth_date: student.birth_date ? String(student.birth_date).split('T')[0] : '',
            phone: meta.phone || '',
            gender: meta.gender || 'MALE',
            photoUrl: meta.photoUrl || '',
            groupIds: relatedGroups.map((group) => Number(group.id)),
        });
        setGroupPickerOpen(false);
        setDrawerOpen(true);
    }, [studentGroups]);
    const loadData = useCallback(async () => {
        setError('');
        setLoading(true);
        try {
            const [studentsRes, groupsRes] = await Promise.allSettled([
                api.get('/students?page=1&limit=300'),
                api.get('/groups?page=1&limit=300'),
            ]);
            if (studentsRes.status === 'fulfilled') {
                setStudents(normalizeList(studentsRes.value.data));
            }
            else {
                throw studentsRes.reason;
            }
            if (groupsRes.status === 'fulfilled') {
                const nextGroups = normalizeList(groupsRes.value.data);
                setGroups(nextGroups);
                const map = {};
                nextGroups.forEach((group) => {
                    const memberships = Array.isArray(group?.studentGroup) ? group.studentGroup : [];
                    memberships.forEach((membership) => {
                        const studentId = Number(membership?.studentId || membership?.student?.id);
                        if (!studentId)
                            return;
                        if (!map[studentId])
                            map[studentId] = [];
                        map[studentId].push({
                            id: Number(group.id),
                            name: group.name,
                            status: group.status,
                            courseName: group.course?.name || '',
                        });
                    });
                });
                setStudentGroups(map);
            }
            else {
                setGroups([]);
                setStudentGroups({});
            }
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Talabalar ma'lumotlarini yuklashda xatolik"));
            setStudents([]);
            setGroups([]);
            setStudentGroups({});
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadData();
    }, [loadData]);
    useEffect(() => {
        const editStudentId = Number(location.state?.editStudentId);
        if (!editStudentId || !students.length)
            return;
        const target = students.find((student) => Number(student.id) === editStudentId);
        if (target) {
            openEdit(target);
            navigate('/students', { replace: true, state: {} });
        }
    }, [location.state, navigate, openEdit, students]);
    const toggleSort = (nextSortKey) => {
        if (sortKey === nextSortKey) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortKey(nextSortKey);
        setSortDirection('asc');
    };
    const clearFilters = () => {
        setSearch('');
        setPhoneSearch('');
        setGroupFilter('');
        setSortKey('name');
        setSortDirection('asc');
    };
    const filteredStudents = useMemo(() => {
        const searchQuery = search.trim().toLowerCase();
        const phoneQuery = phoneSearch.trim().toLowerCase();
        const selectedGroupId = Number(groupFilter) || 0;
        let list = students.filter((student) => {
            if (tab === 'ARCHIVE') {
                return student.status === 'INACTIVE';
            }
            return student.status !== 'INACTIVE';
        });
        if (searchQuery) {
            list = list.filter((student) => {
                const byName = String(student.fullName || '').toLowerCase().includes(searchQuery);
                const byEmail = String(student.email || '').toLowerCase().includes(searchQuery);
                return byName || byEmail;
            });
        }
        if (phoneQuery) {
            list = list.filter((student) => String(parseStudentMeta(student.photo).phone || '').toLowerCase().includes(phoneQuery));
        }
        if (selectedGroupId) {
            list = list.filter((student) => {
                const relatedGroups = studentGroups[Number(student.id)] || [];
                return relatedGroups.some((group) => Number(group.id) === selectedGroupId);
            });
        }
        const sorted = [...list].sort((left, right) => {
            let leftValue = '';
            let rightValue = '';
            if (sortKey === 'name') {
                leftValue = String(left.fullName || '').toLowerCase();
                rightValue = String(right.fullName || '').toLowerCase();
            }
            if (sortKey === 'group') {
                leftValue = String((studentGroups[Number(left.id)] || [])[0]?.name || '').toLowerCase();
                rightValue = String((studentGroups[Number(right.id)] || [])[0]?.name || '').toLowerCase();
            }
            if (sortKey === 'coin') {
                leftValue = getStudentCoin(left);
                rightValue = getStudentCoin(right);
            }
            if (leftValue < rightValue)
                return sortDirection === 'asc' ? -1 : 1;
            if (leftValue > rightValue)
                return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [getStudentCoin, groupFilter, phoneSearch, search, sortDirection, sortKey, studentGroups, students, tab]);
    const activeGroupOptions = useMemo(() => groups.filter((group) => group.status !== 'INACTIVE'), [groups]);
    const toggleGroup = (groupId) => {
        const numericId = Number(groupId);
        setForm((prev) => {
            const exists = prev.groupIds.some((id) => Number(id) === numericId);
            return {
                ...prev,
                groupIds: exists
                    ? prev.groupIds.filter((id) => Number(id) !== numericId)
                    : [...prev.groupIds, numericId],
            };
        });
    };
    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({
                ...prev,
                photoUrl: String(reader.result || ''),
            }));
        };
        reader.readAsDataURL(file);
    };
    const openCreate = () => {
        resetForm();
        setDrawerOpen(true);
    };
    const removeStudent = async (studentId) => {
        if (!window.confirm("Talabani arxivga o'tkazishni xohlaysizmi?"))
            return;
        setError('');
        setLoading(true);
        try {
            await api.delete(`/students/${studentId}`);
            await loadData();
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Talabani arxivga o'tkazib bo'lmadi"));
        }
        finally {
            setLoading(false);
        }
    };
    const saveStudent = async () => {
        if (!form.fullName.trim() || !form.email.trim() || !form.birth_date) {
            setError("F.I.O, email va tug'ilgan sana maydonlari majburiy");
            return;
        }
        if (!editId && !form.password.trim()) {
            setError("Yangi talaba uchun parol kiritilishi shart");
            return;
        }
        const payload = {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            birth_date: new Date(form.birth_date).toISOString(),
            photo: buildStudentPhotoPayload({
                photoUrl: form.photoUrl,
                phone: form.phone,
                gender: form.gender,
            }),
            ...(form.password.trim() ? { password: form.password.trim() } : {}),
        };
        setSaving(true);
        setError('');
        try {
            let studentId = Number(editId);
            const prevGroupIds = editId
                ? (studentGroups[Number(editId)] || []).map((group) => Number(group.id))
                : [];
            if (editId) {
                await api.patch(`/students/${editId}`, payload);
            }
            else {
                const createPayload = {
                    ...payload,
                    password: form.password.trim(),
                    ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
                };
                const created = await api.post('/students', createPayload);
                studentId = Number(normalizeObject(created.data)?.id);
                if (!studentId) {
                    throw new Error('Yaratilgan talaba ID qaytmadi');
                }
            }
            const nextGroupIds = [...new Set(form.groupIds.map((id) => Number(id)).filter(Boolean))];
            if ((nextGroupIds.length > 0 || prevGroupIds.length > 0) && !user?.id) {
                throw new Error("Guruhga biriktirish uchun qayta login qiling");
            }
            const prevSet = new Set(prevGroupIds);
            const nextSet = new Set(nextGroupIds);
            const toAdd = nextGroupIds.filter((id) => !prevSet.has(id));
            const toRemove = prevGroupIds.filter((id) => !nextSet.has(id));
            const groupJobs = [
                ...toAdd.map((groupId) => api.post(`/groups/${groupId}/students`, {
                    studentId,
                    userId: Number(user.id),
                })),
                ...toRemove.map((groupId) => api.delete(`/groups/${groupId}/students/${studentId}`)),
            ];
            if (groupJobs.length) {
                const syncResult = await Promise.allSettled(groupJobs);
                const failedJobs = syncResult.filter((result) => result.status === 'rejected');
                if (failedJobs.length) {
                    throw new Error(`Guruh biriktirishda ${failedJobs.length} ta xatolik yuz berdi`);
                }
            }
            closeDrawer();
            await loadData();
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Talabani saqlashda xatolik"));
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <h1 className="text-5xl font-semibold text-gray-900">O'quvchilar</h1>

                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={openCreate} className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-violet-700 transition">
                        <Plus size={16}/> Talaba qo'shish
                    </button>

                    <button type="button" className="h-11 px-5 rounded-xl bg-violet-500 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-violet-600 transition">
                        <Upload size={16}/> Exceldan ma'lumot qo'shish
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-[#e2e8f4] bg-white p-3 space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setTab('ACTIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
                            Faol o'quvchilar
                        </button>
                        <button type="button" onClick={() => setTab('ARCHIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
                            Arxiv
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2 w-full xl:w-auto">
                        <div className="relative xl:w-48">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ism, familiya" className="w-full h-10 border border-[#dfe4ef] rounded-xl pl-9 pr-3 text-sm"/>
                        </div>

                        <input type="text" value={phoneSearch} onChange={(event) => setPhoneSearch(event.target.value)} placeholder="+998 ..." className="h-10 border border-[#dfe4ef] rounded-xl px-3 text-sm xl:w-40"/>

                        <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="h-10 border border-[#dfe4ef] rounded-xl px-3 text-sm xl:w-44">
                            <option value="">Barcha guruhlar</option>
                            {activeGroupOptions.map((group) => (<option key={group.id} value={group.id}>
                                    {group.name}
                                </option>))}
                        </select>

                        <button type="button" onClick={() => toggleSort('name')} className="h-10 border border-[#dfe4ef] rounded-xl px-3 text-sm text-gray-600 inline-flex items-center justify-center gap-1">
                            Ism {sortDirectionIcon(sortKey === 'name', sortDirection)}
                        </button>

                        <button type="button" onClick={() => toggleSort('group')} className="h-10 border border-[#dfe4ef] rounded-xl px-3 text-sm text-gray-600 inline-flex items-center justify-center gap-1">
                            Sinf {sortDirectionIcon(sortKey === 'group', sortDirection)}
                        </button>

                        <button type="button" onClick={() => toggleSort('coin')} className="h-10 border border-[#dfe4ef] rounded-xl px-3 text-sm text-gray-600 inline-flex items-center justify-center gap-1">
                            Coin {sortDirectionIcon(sortKey === 'coin', sortDirection)}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={clearFilters} className="h-9 px-3 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-medium inline-flex items-center gap-1">
                        <FilterX size={14}/> Tozalash
                    </button>

                    <button type="button" onClick={loadData} className="w-9 h-9 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 inline-flex items-center justify-center" title="Yangilash">
                        <RefreshCcw size={15}/>
                    </button>
                </div>
            </div>

            {error && (<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>)}

            <section className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-270">
                        <thead>
                            <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">#</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Nomi</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Guruh</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Telefon</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Tug'ilgan sanasi</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Yaratilgan sana</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Coin</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Amallar</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (<tr>
                                    <td colSpan={8} className="py-14 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto text-violet-500"/>
                                    </td>
                                </tr>) : filteredStudents.length > 0 ? (filteredStudents.map((student, index) => {
            const groupsForStudent = studentGroups[Number(student.id)] || [];
            const meta = parseStudentMeta(student.photo);
            const coinValue = getStudentCoin(student);
            return (<tr key={student.id} className="border-b border-[#eff3fa] hover:bg-[#fcfdff]">
                                            <td className="py-4 px-4 text-base text-gray-500">{index + 1}</td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center font-semibold text-sm overflow-hidden">
                                                        {meta.photoUrl ? (<img src={meta.photoUrl} alt={student.fullName} className="w-full h-full object-cover"/>) : (String(student.fullName || 'S').charAt(0).toUpperCase())}
                                                    </div>
                                                    <p className="text-[26px] leading-none font-medium text-[#27314f]">{student.fullName}</p>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-70">
                                                    {groupsForStudent.length > 0 ? (<>
                                                            {groupsForStudent.slice(0, 3).map((group) => (<span key={`${student.id}-${group.id}`} className="px-2 py-1 rounded-lg border border-[#e3e8f3] bg-white text-xs text-gray-600">
                                                                    {group.name}
                                                                </span>))}
                                                            {groupsForStudent.length > 3 && (<span className="px-2 py-1 rounded-lg border border-[#e3e8f3] bg-white text-xs text-gray-600">
                                                                    +{groupsForStudent.length - 3}
                                                                </span>)}
                                                        </>) : (<span className="text-sm text-gray-300">-</span>)}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 text-sm text-gray-700">{meta.phone || '--'}</td>
                                            <td className="py-4 px-4 text-sm text-gray-700">{formatDate(student.birth_date)}</td>

                                            <td className="py-4 px-4 text-sm text-gray-700">
                                                <p>{formatDateTime(student.created_at)}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">-</p>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                                        <Coins size={14}/> {coinValue}
                                                    </span>

                                                    <div className="inline-flex items-center gap-1">
                                                        <button type="button" onClick={() => setCoinAdjustments((prev) => ({
                    ...prev,
                    [student.id]: (Number(prev[student.id]) || 0) - 10,
                }))} className="w-7 h-7 rounded-lg border border-[#e1e7f2] text-red-500 hover:bg-red-50 inline-flex items-center justify-center">
                                                            <Minus size={13}/>
                                                        </button>
                                                        <button type="button" onClick={() => setCoinAdjustments((prev) => ({
                    ...prev,
                    [student.id]: (Number(prev[student.id]) || 0) + 10,
                }))} className="w-7 h-7 rounded-lg border border-[#e1e7f2] text-emerald-600 hover:bg-emerald-50 inline-flex items-center justify-center">
                                                            <Plus size={13}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button type="button" onClick={() => navigate(`/students/${student.id}`)} className="w-8 h-8 rounded-lg text-gray-500 border border-[#e1e7f2] hover:bg-gray-100 inline-flex items-center justify-center" title="Ko'rish">
                                                        <Eye size={14}/>
                                                    </button>
                                                    <button type="button" onClick={() => removeStudent(student.id)} className="w-8 h-8 rounded-lg text-red-500 border border-red-100 hover:bg-red-50 inline-flex items-center justify-center" title="Arxivga o'tkazish">
                                                        <Trash2 size={14}/>
                                                    </button>
                                                    <button type="button" onClick={() => openEdit(student)} className="w-8 h-8 rounded-lg text-gray-500 border border-[#e1e7f2] hover:bg-gray-100 inline-flex items-center justify-center" title="Tahrirlash">
                                                        <Edit3 size={14}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>);
        })) : (<tr>
                                    <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                                        Talabalar topilmadi
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </section>

            {drawerOpen && (<div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/35" onClick={closeDrawer}/>

                    <aside className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-[#e5e9f3] flex flex-col">
                        <div className="px-6 py-5 border-b border-[#e9edf5] flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-3xl font-semibold text-gray-900">Talabani tahrirlash</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Bu yerda siz talaba ma'lumotlarini tahrirlashingiz mumkin.
                                </p>
                            </div>
                            <button type="button" onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center">
                                <X size={18}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            <DrawerField label="Telefon raqam">
                                <input type="text" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+998 90 123 45 67" className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"/>
                            </DrawerField>

                            <DrawerField label="Mail">
                                <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="mail@example.com" className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"/>
                            </DrawerField>

                            <DrawerField label="Talaba FIO">
                                <input type="text" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="F.I.O" className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"/>
                            </DrawerField>

                            <DrawerField label="Tug'ilgan sana">
                                <input type="date" value={form.birth_date} onChange={(event) => setForm((prev) => ({ ...prev, birth_date: event.target.value }))} className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"/>
                            </DrawerField>

                            <DrawerField label="Jinsi">
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f4f6fb] p-2 border border-[#eef2f8]">
                                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, gender: 'MALE' }))} className={`h-9 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${form.gender === 'MALE' ? 'bg-white border border-[#dbe2ef] text-violet-600' : 'text-gray-500'}`}>
                                        <span className={`w-2.5 h-2.5 rounded-full ${form.gender === 'MALE' ? 'bg-violet-500' : 'bg-gray-300'}`}/>
                                        Erkak
                                    </button>

                                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, gender: 'FEMALE' }))} className={`h-9 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${form.gender === 'FEMALE' ? 'bg-white border border-[#dbe2ef] text-violet-600' : 'text-gray-500'}`}>
                                        <span className={`w-2.5 h-2.5 rounded-full ${form.gender === 'FEMALE' ? 'bg-violet-500' : 'bg-gray-300'}`}/>
                                        Ayol
                                    </button>
                                </div>
                            </DrawerField>

                            <DrawerField label="Guruhlar">
                                <div className="rounded-xl border border-[#dde3f0] p-3 bg-white">
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.groupIds.length > 0 ? (form.groupIds.map((groupId) => {
                const group = activeGroupOptions.find((item) => Number(item.id) === Number(groupId));
                if (!group)
                    return null;
                return (<button key={groupId} type="button" onClick={() => toggleGroup(groupId)} className="h-8 px-2 rounded-lg border border-[#e3e9f4] bg-[#fafbff] text-sm text-gray-700 inline-flex items-center gap-1">
                                                        {group.name}
                                                        <X size={13}/>
                                                    </button>);
            })) : (<span className="text-sm text-gray-400">Guruh tanlanmagan</span>)}
                                    </div>
                                </div>

                                <button type="button" onClick={() => setGroupPickerOpen((prev) => !prev)} className="mt-2 text-violet-600 text-sm font-semibold inline-flex items-center gap-1">
                                    <Plus size={15}/> Qo'shish
                                    <ChevronDown size={14} className={groupPickerOpen ? 'rotate-180 transition' : 'transition'}/>
                                </button>

                                {groupPickerOpen && (<div className="mt-2 rounded-xl border border-[#dde3f0] max-h-44 overflow-y-auto divide-y divide-[#eef2f8]">
                                        {activeGroupOptions.map((group) => {
                    const checked = form.groupIds.some((id) => Number(id) === Number(group.id));
                    return (<button key={group.id} type="button" onClick={() => toggleGroup(group.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-[#fafbff] inline-flex items-center justify-between">
                                                    <span className="text-gray-700">{group.name}</span>
                                                    <span className={`w-5 h-5 rounded-md border inline-flex items-center justify-center ${checked ? 'bg-violet-500 border-violet-500 text-white' : 'border-[#dce3f0] text-transparent'}`}>
                                                        <Check size={13}/>
                                                    </span>
                                                </button>);
                })}
                                    </div>)}
                            </DrawerField>

                            <DrawerField label="Parol (Yangilash uchun)">
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder={editId ? "Bo'sh qoldirilsa o'zgarmaydi" : 'Kamida 6 ta belgi'} className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 pr-10 text-sm"/>
                                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center" title="Parolni ko'rsatish">
                                        {showPassword ? <X size={14}/> : <Eye size={14}/>}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-400">
                                    Faqat parolni yangilash uchun kiriting. Bo'sh qoldirilsa, parol o'zgarmaydi.
                                </p>
                            </DrawerField>

                            <DrawerField label="Surati">
                                <label className="h-40 rounded-2xl border-2 border-dashed border-[#cfd7e6] flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:bg-[#fafbff] transition">
                                    <UploadCloud size={22} className="text-gray-400"/>
                                    <p className="text-sm text-violet-600 font-semibold">Click to upload</p>
                                    <p className="text-xs text-gray-400">JPG yoki PNG (max. 800x800px)</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                                </label>

                                {form.photoUrl && (<div className="mt-2 h-20 rounded-xl overflow-hidden border border-[#dde3f0]">
                                        <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover"/>
                                    </div>)}
                            </DrawerField>
                        </div>

                        <div className="border-t border-[#e9edf5] px-5 py-4 bg-white flex items-center justify-end gap-2">
                            <button type="button" onClick={closeDrawer} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold">
                                Bekor qilish
                            </button>

                            <button type="button" disabled={saving} onClick={saveStudent} className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70">
                                {saving && <Loader2 size={15} className="animate-spin"/>}
                                Saqlash
                            </button>
                        </div>
                    </aside>
                </div>)}
        </div>);
}
function DrawerField({ label, children }) {
    return (<div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            {children}
        </div>);
}
