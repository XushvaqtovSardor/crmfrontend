import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, X, Loader2, Upload, Download, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = {
  fullName: '',
  email: '',
  password: '',
  position: '',
  experience: 1,
  phone: '',
  birth_date: '',
};

function normalizeList(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeDateInput(value) {
  if (!value) return '';
  const raw = String(value);
  if (raw.includes('T')) return raw.split('T')[0];
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function statusBadge(status) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-600';
  if (status === 'FREEZE') return 'bg-blue-50 text-blue-600';
  return 'bg-gray-100 text-gray-500';
}

export default function TeachersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('ACTIVE');
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const resetForm = useCallback(() => {
    setEditId(null);
    setForm(INITIAL_FORM);
    setShowPassword(false);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreate = useCallback(() => {
    resetForm();
    setDrawerOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((teacher) => {
    setEditId(teacher.id);
    setForm({
      fullName: teacher.fullName || '',
      email: teacher.email || '',
      password: '',
      position: teacher.position || '',
      experience: Number(teacher.experience) || 1,
      phone: teacher.phone || '',
      birth_date: normalizeDateInput(teacher.birth_date),
    });
    setShowPassword(false);
    setDrawerOpen(true);
  }, []);

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

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    openCreate();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    setSearchParams(nextParams, { replace: true });
  }, [openCreate, searchParams, setSearchParams]);

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
    if (!editId && !form.password.trim()) {
      setError('Yangi o\'qituvchi uchun parol kiritilishi shart');
      return;
    }

    const parsedExperience = Number(form.experience);
    if (!Number.isFinite(parsedExperience) || parsedExperience < 0) {
      setError('Tajriba yili noto\'g\'ri kiritilgan');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        position: form.position.trim(),
        experience: Math.floor(parsedExperience),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.birth_date ? { birth_date: new Date(form.birth_date).toISOString() } : {}),
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };

      if (editId) {
        await api.patch(`/teachers/${editId}`, payload);
      } else {
        await api.post('/teachers', payload);
      }

      closeDrawer();
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Saqlashda xatolik yuz berdi'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("O'qituvchini arxivga o'tkazishni xohlaysizmi?")) return;
    setError('');
    setLoading(true);
    try {
      await api.delete(`/teachers/${id}`);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "O'chirishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(
    () => teachers.filter((teacher) => (tab === 'ARCHIVE' ? teacher.status === 'INACTIVE' : teacher.status !== 'INACTIVE')),
    [teachers, tab],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-5xl font-semibold text-gray-900">O'qituvchilar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-600 text-sm font-semibold inline-flex items-center gap-2">
            <Download size={16} /> Export
          </button>
          <button type="button" onClick={openCreate} className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-violet-700 transition">
            <Plus size={16} /> O'qituvchi qo'shish
          </button>
          <button type="button" className="h-11 px-5 rounded-xl bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-emerald-600 transition">
            <Upload size={16} /> Exceldan yuklash
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8f4] bg-white p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('ACTIVE')}
              className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Faol o'qituvchilar
            </button>
            <button
              type="button"
              onClick={() => setTab('ARCHIVE')}
              className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Arxiv
            </button>
          </div>

          <button
            type="button"
            onClick={load}
            className="w-9 h-9 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 inline-flex items-center justify-center"
            title="Yangilash"
          >
            <RefreshCcw size={15} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && searchTeachers()}
              placeholder="Ism yoki email bo'yicha qidirish..."
              className="w-full h-10 border border-[#dfe4ef] rounded-xl pl-10 pr-4 text-sm"
            />
          </div>
          <button type="button" onClick={searchTeachers} className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
            Qidirish
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <section className="rounded-2xl border border-[#e2e8f4] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220">
            <thead>
              <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ism</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Telefon</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Lavozim</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Tajriba</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Holat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-violet-500" />
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className="border-b border-[#eff3fa] hover:bg-[#fcfdff] transition">
                    <td className="py-4 px-4 text-base text-gray-500">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {teacher.fullName?.charAt(0) || 'T'}
                        </div>
                        <span className="text-xl font-medium text-[#27314f] leading-none">{teacher.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">{teacher.email}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{teacher.phone || '--'}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{teacher.position || '--'}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{Number(teacher.experience) || 0} yil</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(teacher.status)}`}>
                        {teacher.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/teachers/${teacher.id}`)}
                          className="w-8 h-8 rounded-lg text-gray-500 border border-[#e1e7f2] hover:bg-gray-100 inline-flex items-center justify-center"
                          title="Ko'rish"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(teacher)}
                          className="w-8 h-8 rounded-lg text-gray-500 border border-[#e1e7f2] hover:bg-gray-100 inline-flex items-center justify-center"
                          title="Tahrirlash"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(teacher.id)}
                          className="w-8 h-8 rounded-lg text-red-500 border border-red-100 hover:bg-red-50 inline-flex items-center justify-center"
                          title="Arxivga o'tkazish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                    O'qituvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/35" onClick={closeDrawer} />

          <aside className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-[#e5e9f3] flex flex-col">
            <div className="px-6 py-5 border-b border-[#e9edf5] flex items-start justify-between gap-3">
              <div>
                <h3 className="text-3xl font-semibold text-gray-900">
                  {editId ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editId ? "Bu yerda o'qituvchi ma'lumotlarini tahrirlashingiz mumkin." : "Bu yerda yangi o'qituvchi qo'shishingiz mumkin."}
                </p>
              </div>
              <button type="button" onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <DrawerField label="To'liq ism">
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="F.I.O"
                  className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"
                />
              </DrawerField>

              <DrawerField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="mail@example.com"
                  className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"
                />
              </DrawerField>

              <DrawerField label="Telefon raqam">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"
                />
              </DrawerField>

              <DrawerField label="Lavozim">
                <input
                  type="text"
                  value={form.position}
                  onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                  placeholder="Frontend Mentor"
                  className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"
                />
              </DrawerField>

              <DrawerField label="Tajriba (yil)">
                <input
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"
                />
              </DrawerField>

              <DrawerField label="Tug'ilgan sana">
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, birth_date: event.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 text-sm"
                />
              </DrawerField>

              <DrawerField label={editId ? "Parol (yangilash uchun)" : 'Parol'}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder={editId ? "Bo'sh qoldirilsa o'zgarmaydi" : 'Kamida 6 ta belgi'}
                    className="w-full h-11 rounded-xl border border-[#dde3f0] px-3 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center"
                    title="Parolni ko'rsatish"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {editId ? "Bo'sh qoldirilsa, parol o'zgarmaydi." : 'Yangi o\'qituvchi uchun parol majburiy.'}
                </p>
              </DrawerField>
            </div>

            <div className="border-t border-[#e9edf5] px-5 py-4 bg-white flex items-center justify-end gap-2">
              <button type="button" onClick={closeDrawer} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold">
                Bekor qilish
              </button>

              <button type="button" disabled={saving} onClick={save} className="h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-70">
                {saving && <Loader2 size={15} className="animate-spin" />}
                Saqlash
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function DrawerField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}
