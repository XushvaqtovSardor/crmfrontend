import { useState, useEffect } from 'react';
import { Layers3, Users, Clock, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const DAY_LABELS = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Cho', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sha', SUNDAY: 'Ya' };

function getGroupStudentCount(group) {
  if (typeof group?._count?.studentGroup === 'number') return group._count.studentGroup;
  if (Array.isArray(group?.studentGroup)) return group.studentGroup.length;
  return 0;
}

async function fetchGroups(user) {
  if (!user?.id) {
    return [];
  }

  const res = await api.get('/groups/my');
  return res.data?.data || [];
}

export default function MyGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadGroups = async () => {
      setLoading(true);
      setError('');
      try {
        const nextGroups = await fetchGroups(user);
        if (active) setGroups(nextGroups);
      } catch (e) {
        if (active) setError(getApiErrorMessage(e, 'Guruhlarni yuklab bo\'lmadi'));
        if (active) setGroups([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGroups();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-violet-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {user?.role === 'TEACHER' ? 'Mening guruhlarim' : 'Mening guruhlarim'}
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {g.name?.charAt(0)}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${g.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>{g.status}</span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{g.name}</h3>
              <p className="text-sm text-violet-500 font-medium mb-3">{g.course?.name}</p>

              <div className="space-y-2 text-sm text-gray-600">
                {user?.role !== 'TEACHER' && g.teacher && (
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <span>O'qituvchi: {g.teacher.fullName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{g.startTime} • {g.weekDays?.map(d => DAY_LABELS[d]).join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Boshlangan: {g.startDate ? new Date(g.startDate).toLocaleDateString('uz-UZ') : '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span>{getGroupStudentCount(g)} ta talaba</span>
                </div>
              </div>
            </div>
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
