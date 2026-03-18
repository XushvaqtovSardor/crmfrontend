import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import api from '../api.js';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', durationMonth: 3, durationLesson: 48, price: '', description: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/courses?page=1&limit=100');
      setCourses(res.data?.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    try {
      const data = {
        name: form.name,
        durationMonth: Number(form.durationMonth),
        durationLesson: Number(form.durationLesson),
        price: Number(form.price),
        description: form.description || undefined,
      };
      if (editId) await api.patch(`/courses/${editId}`, data);
      else await api.post('/courses', data);
      setShowModal(false);
      resetForm();
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return;
    try { await api.delete(`/courses/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name, durationMonth: c.durationMonth, durationLesson: c.durationLesson,
      price: String(c.price), description: c.description || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: '', durationMonth: 3, durationLesson: 48, price: '', description: '' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Kurslar</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium text-sm hover:bg-violet-600 transition shadow-lg shadow-violet-200">
          <Plus size={18} /> Yangi kurs
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-32 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
              </div>
              {c.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">Davomiylik</p>
                  <p className="text-sm font-bold text-gray-800">{c.durationMonth} oy</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">Darslar</p>
                  <p className="text-sm font-bold text-gray-800">{c.durationLesson} ta</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-violet-600">{Number(c.price).toLocaleString()} so'm</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100"><Edit3 size={14} /></button>
                  <button onClick={() => remove(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">Kurslar topilmadi</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Tahrirlash' : 'Yangi kurs'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Inp label="Kurs nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Inp label="Davomiyligi (oy)" value={form.durationMonth} onChange={(v) => setForm({ ...form, durationMonth: v })} type="number" />
              <Inp label="Darslar soni" value={form.durationLesson} onChange={(v) => setForm({ ...form, durationLesson: v })} type="number" />
              <Inp label="Narxi (so'm)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <button onClick={save} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition">
                {editId ? 'Saqlash' : "Yaratish"}
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
