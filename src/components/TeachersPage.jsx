import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, X, Loader2, Upload, Download, RefreshCcw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = { fullName: '', email: '', password: '', position: '', experience: 1 };

function normalizeList(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('ACTIVE');
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/teachers?page=1&limit=100');
      setTeachers(normalizeList(res.data));
    } catch (e) {
      setError(getApiErrorMessage(e, "O'qituvchilarni yuklashda xatolik"));
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const searchTeachers = async () => {
    const query = search.trim();
    if (!query) {
      load();
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.get(`/teachers/search?query=${encodeURIComponent(query)}`);
      setTeachers(normalizeList(res.data));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Qidiruvda xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.position.trim()) {
      setError("Ism, email va lavozim maydonlari to'ldirilishi shart");
      return;
    }

    setError('');
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        position: form.position.trim(),
        experience: Number(form.experience) || 1,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editId) {
        await api.patch(`/teachers/${editId}`, payload);
      } else {
        await api.post('/teachers', payload);
      }
      setShowModal(false);
      resetForm();
      await load();
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
      await api.delete(`/teachers/${id}`);
      await load();
    }
    catch (e) {
      setError(getApiErrorMessage(e, "O'chirishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({ fullName: t.fullName, email: t.email, password: '', position: t.position, experience: t.experience });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(INITIAL_FORM);
  };

  const filteredTeachers = useMemo(
    () => teachers.filter((t) => (tab === 'ARCHIVE' ? t.status === 'INACTIVE' : t.status !== 'INACTIVE')),
    [teachers, tab],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">O'qituvchilar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 text-sm font-semibold flex items-center gap-2"><Download size={16} /> Export</button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="h-10 px-4 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition flex items-center gap-2">
            <Plus size={16} /> O'qituvchi qo'shish
          </button>
          <button className="h-10 px-4 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition flex items-center gap-2"><Upload size={16} /> Exceldan yuklash</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('ACTIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}>Faol o'qituvchilar</button>
          <button onClick={() => setTab('ARCHIVE')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}>Arxiv</button>
        </div>
        <button onClick={load} className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 flex items-center justify-center">
          <RefreshCcw size={16} />
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}


      <div className="bg-white rounded-2xl border border-[#e3e7f1] p-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchTeachers()} placeholder="Ism yoki email bo'yicha qidirish..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <button onClick={searchTeachers} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition">
            Qidirish
          </button>
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Lavozim</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Tajriba</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Holat</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-violet-500" /></td></tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((t, i) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                          {t.fullName?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{t.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{t.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{t.position}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{t.experience} yil</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : t.status === 'FREEZE' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/teachers/${t.id}`)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition"><Eye size={14} /></button>
                        <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition"><Edit3 size={14} /></button>
                        <button onClick={() => remove(t.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">O'qituvchilar topilmadi</td></tr>
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
              <h3 className="text-lg font-bold text-gray-900">{editId ? "Tahrirlash" : "Yangi o'qituvchi"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Input label="To'liq ism" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              {!editId && <Input label="Parol" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />}
              <Input label="Lavozim" value={form.position} onChange={(v) => setForm({ ...form, position: v })} />
              <Input label="Tajriba (yil)" value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} type="number" />
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

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
    </div>
  );
}
