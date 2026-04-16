import { useEffect, useMemo, useState } from 'react';
import { User, Mail, Shield, Calendar, Loader2, Save } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
import { isStaffRole, normalizeRole } from '../utils/roles.js';
import StudentSettingsPanel from './StudentSettingsPanel.jsx';
function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function buildInitialForm(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    photo: user?.photo || '',
    phone: user?.phone || '',
    birthDate: toDateInputValue(user?.birthDate),
    position: user?.position || '',
    address: user?.address || '',
    password: '',
  };
}
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (<label className="block">

    <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>

    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />

  </label>);
}
export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [initialForm, setInitialForm] = useState(() => buildInitialForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const role = normalizeRole(user?.role);
  const staffRole = isStaffRole(role);
  const teacherRole = role === 'TEACHER';
  const studentRole = role === 'STUDENT';
  useEffect(() => {
    const next = buildInitialForm(user);
    setForm(next);
    setInitialForm(next);
  }, [user]);
  const hasChanges = useMemo(() => (Object.keys(form).some((key) => form[key] !== initialForm[key])), [form, initialForm]);
  const onFieldChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };
  const saveProfile = async () => {
    setError('');
    setSuccess('');
    const payload = {};
    if (form.fullName.trim() && form.fullName !== initialForm.fullName) {
      payload.fullName = form.fullName.trim();
    }
    if (form.email.trim() && form.email !== initialForm.email) {
      payload.email = form.email.trim();
    }
    if (form.photo !== initialForm.photo) {
      payload.photo = form.photo.trim();
    }
    if (teacherRole && form.phone !== initialForm.phone) {
      payload.phone = form.phone.trim();
    }
    if ((teacherRole || studentRole) && form.birthDate !== initialForm.birthDate) {
      payload.birthDate = form.birthDate;
    }
    if ((teacherRole || staffRole) && form.position !== initialForm.position) {
      payload.position = form.position.trim();
    }
    if (staffRole && form.address !== initialForm.address) {
      payload.address = form.address.trim();
    }
    if (form.password.trim()) {
      payload.password = form.password.trim();
    }
    if (Object.keys(payload).length === 0) {
      setSuccess("Saqlash uchun o'zgarish topilmadi");
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch('/auth/me', payload);
      const nextUser = response?.data?.data?.user || response?.data?.user || null;
      if (nextUser) {
        updateProfile(nextUser);
      }
      const nextForm = {
        ...buildInitialForm(nextUser || user),
        password: '',
      };
      setInitialForm(nextForm);
      setForm(nextForm);
      setSuccess("Profil ma'lumotlari muvaffaqiyatli yangilandi");
    }
    catch (e) {
      setError(getApiErrorMessage(e, "Profilni saqlashda xatolik yuz berdi"));
    }
    finally {
      setSaving(false);
    }
  };
  const roleBadge = {
    SUPERADMIN: { label: 'Super Admin', color: 'bg-red-50 text-red-600' },
    ADMIN: { label: 'Admin', color: 'bg-blue-50 text-blue-600' },
    MANAGEMENT: { label: 'Management', color: 'bg-sky-50 text-sky-600' },
    ADMINSTRATOR: { label: 'Administrator', color: 'bg-cyan-50 text-cyan-600' },
    TEACHER: { label: "O'qituvchi", color: 'bg-emerald-50 text-emerald-600' },
    STUDENT: { label: 'Talaba', color: 'bg-violet-50 text-violet-600' },
  };
  const badge = roleBadge[role] || { label: 'User', color: 'bg-gray-100 text-gray-500' };
  if (studentRole) {
    return <StudentSettingsPanel />;
  }
  return (<div>

    <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h1>



    <div className="max-w-2xl">



      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">

        <h3 className="text-lg font-bold text-gray-900 mb-4">Profil ma'lumotlari</h3>

        <div className="flex items-center gap-4 mb-6">

          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">

            {user?.fullName?.charAt(0) || 'U'}

          </div>

          <div>

            <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>

            <span className={`text-xs font-medium px-3 py-1 rounded-full ${badge.color}`}>{badge.label}</span>

          </div>

        </div>



        <div className="space-y-4">

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

            <User size={18} className="text-gray-400" />

            <div>

              <p className="text-xs text-gray-400">To'liq ism</p>

              <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>

            </div>

          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

            <Mail size={18} className="text-gray-400" />

            <div>

              <p className="text-xs text-gray-400">Email</p>

              <p className="text-sm font-medium text-gray-800">{user?.email}</p>

            </div>

          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

            <Shield size={18} className="text-gray-400" />

            <div>

              <p className="text-xs text-gray-400">Rol</p>

              <p className="text-sm font-medium text-gray-800">{role}</p>

            </div>

          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

            <Calendar size={18} className="text-gray-400" />

            <div>

              <p className="text-xs text-gray-400">ID</p>

              <p className="text-sm font-medium text-gray-800">#{user?.id}</p>

            </div>

          </div>

        </div>

      </div>



      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">

        <h3 className="text-lg font-bold text-gray-900 mb-4">Profilni tahrirlash</h3>



        {error && (<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          {error}

        </div>)}



        {success && (<div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

          {success}

        </div>)}



        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Field label="To'liq ism" value={form.fullName} onChange={onFieldChange('fullName')} placeholder="To'liq ismingiz" />

          <Field label="Email" value={form.email} onChange={onFieldChange('email')} placeholder="Email manzilingiz" />



          <div className="md:col-span-2">

            <Field label="Profil rasmi (URL)" value={form.photo} onChange={onFieldChange('photo')} placeholder="https://..." />

          </div>



          {(teacherRole || staffRole) && (<Field label="Lavozim" value={form.position} onChange={onFieldChange('position')} placeholder="Lavozimingiz" />)}



          {teacherRole && (<Field label="Telefon" value={form.phone} onChange={onFieldChange('phone')} placeholder="+99890..." />)}



          {(teacherRole || studentRole) && (<Field label="Tug'ilgan sana" type="date" value={form.birthDate} onChange={onFieldChange('birthDate')} />)}



          {staffRole && (<div className="md:col-span-2">

            <Field label="Manzil" value={form.address} onChange={onFieldChange('address')} placeholder="Yashash manzili" />

          </div>)}



          <div className="md:col-span-2">

            <Field label="Yangi parol" type="password" value={form.password} onChange={onFieldChange('password')} placeholder="Kamida 6 ta belgi" />

          </div>

        </div>



        <div className="mt-5 flex justify-end">

          <button type="button" onClick={saveProfile} disabled={saving || !hasChanges} className="h-11 px-5 rounded-xl bg-violet-500 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60">

            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}

            Saqlash

          </button>

        </div>

      </div>





      <div className="bg-white rounded-2xl border border-gray-100 p-6">

        <h3 className="text-lg font-bold text-gray-900 mb-3">Tizim haqida</h3>

        <div className="space-y-2 text-sm text-gray-500">

          <p>🏫 <strong>EduERP</strong> - Ta'lim muassasasi boshqaruv tizimi</p>

          <p>📦 Versiya: 1.0.0</p>

          <p>⚡ NestJS + React + Prisma</p>

        </div>

      </div>

    </div>

  </div>);
}
