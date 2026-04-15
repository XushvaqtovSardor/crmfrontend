import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  UserPlus,
  Users,
  GraduationCap,
  MoreHorizontal,
  Eye,
  RefreshCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';

const INITIAL_FORM = {
  name: '',
  teacherId: '',
  courseId: '',
  roomId: '',
  startDate: '',
  startTime: '09:00',
  weekDays: [],
};

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
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
  return [];
}

function getStudentCount(group) {
  if (typeof group?._count?.studentGroup === 'number') return group._count.studentGroup;
  if (Array.isArray(group?.studentGroup)) return group.studentGroup.length;
  return 0;
}

function formatDate(value) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleDateString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateEndDate(startDate, durationMonth) {
  if (!startDate || !durationMonth) return '--';
  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) return '--';
  parsed.setMonth(parsed.getMonth() + Number(durationMonth));
  return formatDate(parsed.toISOString());
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [tab, setTab] = useState('ACTIVE');
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [menuGroupId, setMenuGroupId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const [groupRes, teacherRes, courseRes, roomRes, studentRes] = await Promise.allSettled([
        api.get('/groups?page=1&limit=300'),
        api.get('/teachers?page=1&limit=300'),
        api.get('/courses?page=1&limit=300'),
        api.get('/rooms?page=1&limit=300'),
        api.get('/students?page=1&limit=300'),
      ]);

      if (groupRes.status === 'fulfilled') setGroups(normalizeList(groupRes.value.data));
      if (teacherRes.status === 'fulfilled') setTeachers(normalizeList(teacherRes.value.data));
      if (courseRes.status === 'fulfilled') setCourses(normalizeList(courseRes.value.data));
      if (roomRes.status === 'fulfilled') setRooms(normalizeList(roomRes.value.data));
      if (studentRes.status === 'fulfilled') setStudents(normalizeList(studentRes.value.data));

      if (
        groupRes.status === 'rejected'
        && teacherRes.status === 'rejected'
        && courseRes.status === 'rejected'
        && roomRes.status === 'rejected'
      ) {
        throw groupRes.reason;
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Ma'lumotlarni yuklashda xatolik"));
      setGroups([]);
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

    if (!user?.id) {
      setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        teacherId: Number(form.teacherId),
        courseId: Number(form.courseId),
        roomId: Number(form.roomId),
        userId: Number(user.id),
        startDate: new Date(form.startDate).toISOString(),
        startTime: form.startTime,
        weekDays: form.weekDays,
      };

      if (editId) {
        await api.patch(`/groups/${editId}`, payload);
      } else {
        await api.post('/groups', payload);
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

  const updateGroupStatus = async (group, status) => {
    if (!user?.id) {
      setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
      return;
    }

    const archive = status === 'INACTIVE';
    if (archive && !window.confirm("Guruhni arxivga o'tkazishni xohlaysizmi?")) return;

    setError('');
    setSaving(true);

    try {
      await api.patch(`/groups/${group.id}`, {
        status,
        userId: Number(user.id),
      });
      setMenuGroupId(null);
      await loadAll();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Holatni o\'zgartirishda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const addStudent = async () => {
    if (!selectedGroup || !studentId) return;

    if (!user?.id) {
      setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      await api.post(`/groups/${selectedGroup.id}/students`, {
        studentId: Number(studentId),
        userId: Number(user.id),
      });
      setStudentId('');
      setStudentSearch('');
      setShowStudentModal(false);
      await loadAll();
    } catch (e) {
      setError(getApiErrorMessage(e, "Talabani qo'shishda xatolik"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (group) => {
    setMenuGroupId(null);
    setEditId(group.id);
    setForm({
      name: group.name || '',
      teacherId: String(group.teacherId || ''),
      courseId: String(group.courseId || ''),
      roomId: String(group.roomId || ''),
      startDate: group.startDate?.split('T')[0] || '',
      startTime: group.startTime || '09:00',
      weekDays: group.weekDays || [],
    });
    setShowModal(true);
  };

  const openStudentModal = (group) => {
    setMenuGroupId(null);
    setSelectedGroup(group);
    setStudentId('');
    setStudentSearch('');
    setShowStudentModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(INITIAL_FORM);
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      weekDays: prev.weekDays.includes(day)
        ? prev.weekDays.filter((item) => item !== day)
        : [...prev.weekDays, day],
    }));
  };

  const activeGroups = useMemo(
    () => groups.filter((group) => group.status !== 'INACTIVE'),
    [groups],
  );

  const archivedGroups = useMemo(
    () => groups.filter((group) => group.status === 'INACTIVE'),
    [groups],
  );

  const visibleGroups = useMemo(
    () => (tab === 'ARCHIVE' ? archivedGroups : activeGroups),
    [tab, archivedGroups, activeGroups],
  );

  const studentsCount = useMemo(
    () => groups.reduce((sum, group) => sum + getStudentCount(group), 0),
    [groups],
  );

  const availableStudents = useMemo(() => {
    if (!selectedGroup) return [];

    const assigned = new Set((selectedGroup.studentGroup || []).map((item) => Number(item.studentId)));
    return students.filter((student) => {
      if (assigned.has(Number(student.id))) return false;
      return student.status !== 'INACTIVE';
    });
  }, [selectedGroup, students]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return availableStudents;

    return availableStudents.filter((student) => {
      const byName = String(student.fullName || '').toLowerCase().includes(query);
      const byEmail = String(student.email || '').toLowerCase().includes(query);
      return byName || byEmail;
    });
  }, [availableStudents, studentSearch]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Guruhlar</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="h-11 px-5 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition flex items-center gap-2"
        >
          <Plus size={16} /> Guruh qo'shish
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('ACTIVE')}
            className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ACTIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}
          >
            Guruhlar
          </button>
          <button
            type="button"
            onClick={() => setTab('ARCHIVE')}
            className={`h-9 px-4 rounded-xl text-sm font-semibold ${tab === 'ARCHIVE' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500'}`}
          >
            Arxiv
          </button>
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 flex items-center justify-center"
          title="Yangilash"
        >
          <RefreshCcw size={16} />
        </button>
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

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#e3e7f1] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-295">
            <thead>
              <tr className="border-b border-[#e9edf5] bg-[#fafbff]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Guruh</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Kurs</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Davomiyligi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Dars vaqti</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Kim qo'shgan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Xona</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">O'qituvchi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Talabalar</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500"> </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-violet-500" />
                  </td>
                </tr>
              ) : visibleGroups.length > 0 ? (
                visibleGroups.map((group) => {
                  const dayText = (group.weekDays || []).map((day) => DAY_LABELS[day] || day).join(', ');
                  const isActive = group.status !== 'INACTIVE';
                  const rowStudents = getStudentCount(group);

                  return (
                    <tr key={group.id} className="border-b border-[#f1f4fa] hover:bg-[#fcfdff] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateGroupStatus(group, isActive ? 'INACTIVE' : 'ACTIVE')}
                            className={`w-8 h-5 rounded-full relative transition ${isActive ? 'bg-violet-500' : 'bg-gray-300'}`}
                            disabled={saving}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${isActive ? 'left-3.5' : 'left-0.5'}`} />
                          </button>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {isActive ? 'ACTIVE' : 'ARXIV'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{group.name}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2.5 py-1 rounded-full border border-violet-200 text-violet-600 bg-violet-50">
                          {group.course?.name || '--'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">{group.course?.durationLesson || '--'} minut</p>
                        <p>{formatDate(group.startDate)} - {calculateEndDate(group.startDate, group.course?.durationMonth)}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">{group.startTime || '--:--'}</p>
                        <p>{dayText || '--'}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">{group.user?.fullName || '--'}</p>
                        <p>{formatDateTime(group.created_at)}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{group.room?.name || '--'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe4ef] px-2.5 py-1 text-xs text-gray-700">
                          <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 inline-flex items-center justify-center text-[10px]">
                            {group.teacher?.fullName?.charAt(0) || 'T'}
                          </span>
                          {group.teacher?.fullName || '--'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700">{rowStudents}</td>
                      <td className="py-3 px-4">
                        <div className="relative flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuGroupId((prev) => (prev === group.id ? null : group.id));
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {menuGroupId === group.id && (
                            <div
                              className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-[#e3e7f1] bg-white shadow-lg py-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuGroupId(null);
                                  navigate(`/groups/${group.id}`);
                                }}
                                className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye size={15} /> Ko'rish
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(group)}
                                className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit3 size={15} /> Tahrirlash
                              </button>
                              <button
                                type="button"
                                onClick={() => openStudentModal(group)}
                                className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <UserPlus size={15} /> Talaba qo'shish
                              </button>
                              {tab === 'ARCHIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => updateGroupStatus(group, 'ACTIVE')}
                                  className="w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <RefreshCcw size={15} /> Faollashtirish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateGroupStatus(group, 'INACTIVE')}
                                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={15} /> O'chirish (arxivlash)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-sm text-gray-400">
                    Guruhlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Tahrirlash' : 'Yangi guruh'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Inp label="Guruh nomi" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <Sel
                label="O'qituvchi"
                value={form.teacherId}
                onChange={(value) => setForm({ ...form, teacherId: value })}
                options={teachers.map((teacher) => ({ value: String(teacher.id), label: teacher.fullName }))}
              />
              <Sel
                label="Kurs"
                value={form.courseId}
                onChange={(value) => setForm({ ...form, courseId: value })}
                options={courses.map((course) => ({ value: String(course.id), label: course.name }))}
              />
              <Sel
                label="Xona"
                value={form.roomId}
                onChange={(value) => setForm({ ...form, roomId: value })}
                options={rooms.map((room) => ({ value: String(room.id), label: `${room.name} (${room.capacity} o'rin)` }))}
              />
              <Inp label="Boshlanish sanasi" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} type="date" />
              <Inp label="Boshlanish vaqti" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} type="time" />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hafta kunlari</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition ${form.weekDays.includes(day) ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition disabled:opacity-70"
              >
                {saving ? 'Saqlanmoqda...' : editId ? 'Saqlash' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStudentModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowStudentModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Talaba qo'shish</h3>
              <button type="button" onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Guruh: <strong>{selectedGroup.name}</strong>
            </p>

            <Inp
              label="Talaba qidirish"
              value={studentSearch}
              onChange={setStudentSearch}
              placeholder="Ism yoki email"
            />

            <Sel
              label="Talaba"
              value={studentId}
              onChange={setStudentId}
              options={filteredStudents.map((student) => ({
                value: String(student.id),
                label: `${student.fullName} (${student.email})`,
              }))}
            />

            {filteredStudents.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">Qo'shish mumkin bo'lgan talaba topilmadi</p>
            )}

            <button
              type="button"
              disabled={saving || !studentId}
              onClick={addStudent}
              className="w-full mt-4 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition disabled:opacity-70"
            >
              {saving ? "Qo'shilmoqda..." : "Qo'shish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
      />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
      >
        <option value="">Tanlang...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
