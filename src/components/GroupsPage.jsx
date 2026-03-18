import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit3, Trash2, X, Loader2, UserPlus, Users, GraduationCap } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = {
  name: '', teacherId: '', courseId: '', roomId: '',
  startDate: '', startTime: '09:00', weekDays: [],
};

function normalizeList(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [tab, setTab] = useState('ACTIVE');
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const DAY_LABELS = { MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Cho', THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sha', SUNDAY: 'Ya' };

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [g, t, c, r] = await Promise.allSettled([
        api.get('/groups?page=1&limit=100'),
        api.get('/teachers?page=1&limit=100'),
        api.get('/courses?page=1&limit=100'),
        api.get('/rooms?page=1&limit=100'),
      ]);
      if (g.status === 'fulfilled') setGroups(normalizeList(g.value.data));
      if (t.status === 'fulfilled') setTeachers(normalizeList(t.value.data));
      if (c.status === 'fulfilled') setCourses(normalizeList(c.value.data));
      if (r.status === 'fulfilled') setRooms(normalizeList(r.value.data));
    } catch (e) {
      setError(getApiErrorMessage(e, "Ma'lumotlarni yuklashda xatolik"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const save = async () => {
    if (!form.name.trim() || !form.teacherId || !form.courseId || !form.roomId || !form.startDate || !form.weekDays.length) {
      setError("Guruh yaratish uchun barcha maydonlarni to'ldiring");
      return;
    }

    setError('');
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        teacherId: Number(form.teacherId),
        courseId: Number(form.courseId),
        roomId: Number(form.roomId),
        startDate: new Date(form.startDate).toISOString(),
        startTime: form.startTime,
        weekDays: form.weekDays,
      };
      if (editId) {
        await api.patch(`/groups/${editId}`, data);
      } else {
        await api.post('/groups', data);
      }
      setShowModal(false);
      resetForm();
      await loadAll();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Saqlashda xatolik yuz berdi'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return;
    setError('');
    setLoading(true);
    try {
      await api.delete(`/groups/${id}`);
      await loadAll();
    }
    catch (e) {
      setError(getApiErrorMessage(e, "O'chirishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async () => {
    if (!selectedGroup || !studentId) return;
    setError('');
    setSaving(true);
    try {
      await api.post(`/groups/${selectedGroup.id}/students`, { studentId: Number(studentId) });
      setStudentId('');
      await loadAll();
    } catch (e) {
      setError(getApiErrorMessage(e, "Talabani qo'shishda xatolik"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (g) => {
    setEditId(g.id);
    setForm({
      name: g.name, teacherId: String(g.teacherId), courseId: String(g.courseId),
      roomId: String(g.roomId), startDate: g.startDate?.split('T')[0] || '',
      startTime: g.startTime || '09:00', weekDays: g.weekDays || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(INITIAL_FORM);
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      weekDays: prev.weekDays.includes(day) ? prev.weekDays.filter(d => d !== day) : [...prev.weekDays, day],
    }));
  };

  const activeGroups = useMemo(() => groups.filter((g) => g.status === 'ACTIVE'), [groups]);
  const archivedGroups = useMemo(() => groups.filter((g) => g.status === 'INACTIVE'), [groups]);
  const visibleGroups = useMemo(() => (tab === 'ARCHIVE' ? archivedGroups : activeGroups), [tab, archivedGroups, activeGroups]);
  const studentsCount = useMemo(() => groups.reduce((acc, g) => acc + (g.studentGroup?.length || 0), 0), [groups]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Guruhlar</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium text-sm hover:bg-violet-600 transition shadow-lg shadow-violet-200">
          <Plus size={18} /> Yangi guruh
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab('ACTIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}>Guruhlar</button>
        <button onClick={() => setTab('ARCHIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}>Arxiv</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e3e7f1] p-5">
          <Users className="text-gray-500 mb-3" size={24} />
          <p className="text-gray-500 text-sm">Jami guruhlar</p>
          <p className="text-5xl font-bold text-gray-900 mt-2">{groups.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e3e7f1] p-5">
          <UserPlus className="text-gray-500 mb-3" size={24} />
          <p className="text-gray-500 text-sm">O'qituvchilar</p>
          <p className="text-5xl font-bold text-gray-900 mt-2">{teachers.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e3e7f1] p-5">
          <GraduationCap className="text-gray-500 mb-3" size={24} />
          <p className="text-gray-500 text-sm">O'quvchilar</p>
          <p className="text-5xl font-bold text-gray-900 mt-2">{studentsCount}</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-32 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleGroups.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{g.name}</h3>
                  <p className="text-sm text-gray-500">{g.course?.name}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${g.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  {g.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">👨‍🏫 {g.teacher?.fullName || '—'}</p>
                <p className="text-sm text-gray-600">🏠 {g.room?.name || '—'}</p>
                <p className="text-sm text-gray-600">⏰ {g.startTime} • {g.weekDays?.map(d => DAY_LABELS[d]).join(', ')}</p>
                <p className="text-sm text-gray-600">👥 {g.studentGroup?.length || 0} ta talaba</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(g)} className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-1">
                  <Edit3 size={14} /> Tahrir
                </button>
                <button onClick={() => { setSelectedGroup(g); setShowStudentModal(true); }} className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition flex items-center justify-center gap-1">
                  <UserPlus size={14} /> Talaba
                </button>
                <button onClick={() => remove(g.id)} className="py-2 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {visibleGroups.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">Guruhlar topilmadi</div>
          )}
        </div>
      )}


      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Tahrirlash' : 'Yangi guruh'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Inp label="Guruh nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Sel label="O'qituvchi" value={form.teacherId} onChange={(v) => setForm({ ...form, teacherId: v })} options={teachers.map(t => ({ value: String(t.id), label: t.fullName }))} />
              <Sel label="Kurs" value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })} options={courses.map(c => ({ value: String(c.id), label: c.name }))} />
              <Sel label="Xona" value={form.roomId} onChange={(v) => setForm({ ...form, roomId: v })} options={rooms.map(r => ({ value: String(r.id), label: `${r.name} (${r.capacity} o'rin)` }))} />
              <Inp label="Boshlanish sanasi" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} type="date" />
              <Inp label="Boshlanish vaqti" value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} type="time" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hafta kunlari</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-2 rounded-xl text-xs font-medium transition ${form.weekDays.includes(d) ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={saving} onClick={save} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition disabled:opacity-70">
                {saving ? 'Saqlanmoqda...' : editId ? 'Saqlash' : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showStudentModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowStudentModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Talaba qo'shish</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Guruh: <strong>{selectedGroup.name}</strong></p>
            <Inp label="Talaba ID" value={studentId} onChange={setStudentId} type="number" />
            <button disabled={saving} onClick={addStudent} className="w-full mt-4 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition disabled:opacity-70">
              {saving ? 'Qo\'shilmoqda...' : "Qo'shish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition">
        <option value="">Tanlang...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
