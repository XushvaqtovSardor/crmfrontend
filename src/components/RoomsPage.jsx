import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Loader2, DoorOpen, Users } from 'lucide-react';
import api from '../api.js';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: 30 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/rooms?page=1&limit=100');
      const payload = res.data?.data ?? res.data;
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setRooms(rows);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    try {
      const data = { name: form.name, capacity: Number(form.capacity) };
      if (editId) await api.patch(`/rooms/${editId}`, data);
      else await api.post('/rooms', data);
      setShowModal(false);
      resetForm();
      load();
    } catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  const remove = async (id) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return;
    try { await api.delete(`/rooms/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ name: r.name, capacity: r.capacity });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: '', capacity: 30 });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Xonalar</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium text-sm hover:bg-violet-600 transition shadow-lg shadow-violet-200">
          <Plus size={18} /> Yangi xona
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-100 rounded-xl mb-3" />
              <div className="h-5 bg-gray-100 rounded w-24 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <DoorOpen size={22} className="text-indigo-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100"><Edit3 size={14} /></button>
                  <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{r.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={14} />
                <span>{r.capacity} o'rinli</span>
              </div>
              <span className={`mt-3 inline-block text-xs font-medium px-2.5 py-1 rounded-full ${r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {r.status}
              </span>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">Xonalar topilmadi</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Tahrirlash' : 'Yangi xona'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xona nomi</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sig'imi</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
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
