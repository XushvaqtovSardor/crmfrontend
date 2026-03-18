import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, X, Loader2, Upload, RefreshCcw } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = { fullName: '', email: '', password: '', birth_date: '' };

function normalizeList(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchStudents(statusFilter) {
  const query = statusFilter ? `&status=${statusFilter}` : '';
  const res = await api.get(`/students?page=1&limit=100${query}`);
  return normalizeList(res.data);
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const loadStudents = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const nextStudents = await fetchStudents(statusFilter);
      setStudents(nextStudents);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Talabalarni yuklashda xatolik'));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const searchStudents = async () => {
    const query = search.trim();
    if (!query) {
      loadStudents();
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.get(`/students/search?query=${encodeURIComponent(query)}`);
      setStudents(normalizeList(res.data));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Qidiruvda xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.birth_date) {
      setError("Ism, email va tug'ilgan sana maydonlari to'ldirilishi shart");
      return;
    }

    setError('');
    setSaving(true);
    try {
      const data = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        birth_date: new Date(form.birth_date).toISOString(),
        ...(form.password ? { password: form.password } : {}),
      };
      if (editId) {
        await api.patch(`/students/${editId}`, data);
      } else {
        data.password = form.password;
        await api.post('/students', data);
      }
      await loadStudents();
      setShowModal(false);
      resetForm();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Saqlashda xatolik yuz berdi'));
    }
    finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return;
    setError('');
    setLoading(true);
    try {
      await api.delete(`/students/${id}`);
      await loadStudents();
    }
    catch (e) {
      setError(getApiErrorMessage(e, "O'chirishda xatolik yuz berdi"));
    }
    finally { setLoading(false); }
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({ fullName: s.fullName, email: s.email, password: '', birth_date: s.birth_date?.split('T')[0] || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(INITIAL_FORM);
  };

  const filteredStudents = useMemo(
    () => students.filter((s) => (tab === 'ARCHIVE' ? s.status === 'INACTIVE' : s.status !== 'INACTIVE')),
    [students, tab],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Talabalar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { resetForm(); setShowModal(true); }} className="h-10 px-4 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition flex items-center gap-2">
            <Plus size={16} /> Talaba qo'shish
          </button>
          <button className="h-10 px-4 bg-violet-100 text-violet-700 rounded-xl font-semibold text-sm hover:bg-violet-200 transition flex items-center gap-2"><Upload size={16} /> Exceldan ma'lumot qo'shish</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('ACTIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}>Faol o'quvchilar</button>
          <button onClick={() => setTab('ARCHIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}>Arxiv</button>
        </div>
        <button onClick={searchStudents} className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 flex items-center justify-center">
          <RefreshCcw size={16} />
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}


      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchStudents()} placeholder="Ism yoki email bo'yicha qidirish..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
            <option value="">Barcha holat</option>
            <option value="ACTIVE">Faol</option>
            <option value="FREEZE">Muzlatilgan</option>
            <option value="INACTIVE">Nofaol</option>
          </select>
          <button onClick={searchStudents} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition">Qidirish</button>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">#</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Ism</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Tug'ilgan sana</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Holat</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-violet-500" /></td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">{s.fullName?.charAt(0)}</div>
                        <span className="text-sm font-medium text-gray-800">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.birth_date ? new Date(s.birth_date).toLocaleDateString('uz-UZ') : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : s.status === 'FREEZE' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition"><Edit3 size={14} /></button>
                        <button onClick={() => remove(s.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Talabalar topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Tahrirlash' : 'Yangi talaba'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Inp label="To'liq ism" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
              <Inp label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              {!editId && <Inp label="Parol" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />}
              <Inp label="Tug'ilgan sana" value={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} type="date" />
              <button disabled={saving} onClick={save} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition disabled:opacity-70">
                {saving ? 'Saqlanmoqda...' : editId ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
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
