import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Layers3, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { normalizeRole } from '../utils/roles.js';

const DAY_LABELS = {
    MONDAY: 'Du',
    TUESDAY: 'Se',
    WEDNESDAY: 'Cho',
    THURSDAY: 'Pa',
    FRIDAY: 'Ju',
    SATURDAY: 'Sha',
    SUNDAY: 'Ya',
};

function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

function getGroupStudentCount(group) {
    if (typeof group?._count?.studentGroup === 'number') return group._count.studentGroup;
    if (Array.isArray(group?.studentGroup)) return group.studentGroup.length;
    return 0;
}

function formatDate(value) {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return parsed.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyGroupsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('ACTIVE');

    const studentRole = normalizeRole(user?.role) === 'STUDENT';

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/groups/my');
            setGroups(normalizeList(response.data));
        } catch (e) {
            setError(getApiErrorMessage(e, "Guruhlarni yuklab bo'lmadi"));
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.id]);

    const filteredGroups = useMemo(() => {
        if (!studentRole) return groups;
        if (activeTab === 'ALL') return groups;
        return groups.filter((group) => String(group?.status || '').toUpperCase() === activeTab);
    }, [groups, studentRole, activeTab]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 size={30} className="animate-spin text-[#c07a37]" />
            </div>
        );
    }

    if (!studentRole) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Mening guruhlarim</h1>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {groups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {groups.map((group) => (
                            <article key={group.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                        {group.name?.charAt(0)}
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {group.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h3>
                                <p className="text-sm text-violet-500 font-medium mb-3">{group.course?.name}</p>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <span>{group.startTime} • {group.weekDays?.map((day) => DAY_LABELS[day]).join(', ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span>Boshlangan: {formatDate(group.startDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-gray-400" />
                                        <span>{getGroupStudentCount(group)} ta talaba</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Layers3 size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400">Guruhlar topilmadi</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-[34px] leading-none font-semibold text-gray-900">Guruhlarim</h1>
                <div className="inline-flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('ACTIVE')}
                        className={`h-9 rounded-lg border px-3 text-sm font-semibold ${activeTab === 'ACTIVE' ? 'border-[#d38b45] bg-[#fff3e6] text-[#ad6628]' : 'border-[#dce1ea] bg-white text-gray-600'}`}
                    >
                        Aktiv
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ARCHIVED')}
                        className={`h-9 rounded-lg border px-3 text-sm font-semibold ${activeTab === 'ARCHIVED' ? 'border-[#d38b45] bg-[#fff3e6] text-[#ad6628]' : 'border-[#dce1ea] bg-white text-gray-600'}`}
                    >
                        Arxiv
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ALL')}
                        className={`h-9 rounded-lg border px-3 text-sm font-semibold ${activeTab === 'ALL' ? 'border-[#d38b45] bg-[#fff3e6] text-[#ad6628]' : 'border-[#dce1ea] bg-white text-gray-600'}`}
                    >
                        Barchasi
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-[#dce1ea] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-210">
                        <thead>
                            <tr className="border-b border-[#e8edf5] bg-[#f8f9fd]">
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">#</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Guruh nomi</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Yo'nalish</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">O'qituvchi</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Dars vaqti</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGroups.length > 0 ? filteredGroups.map((group, index) => (
                                <tr
                                    key={group.id}
                                    onClick={() => navigate(`/my-groups/${group.id}`)}
                                    className="border-b border-[#eef2f8] last:border-b-0 hover:bg-[#faf6f0] cursor-pointer"
                                >
                                    <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{group.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{group.course?.name || '--'}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{group.teacher?.fullName || '--'}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{group.startTime || '--'} • {group.weekDays?.map((day) => DAY_LABELS[day]).join(', ') || '--'}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${String(group.status).toUpperCase() === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {group.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">Guruhlar topilmadi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
