import { useAuth } from '../AuthContext.jsx';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const roleBadge = {
    SUPERADMIN: { label: 'Super Admin', color: 'bg-red-50 text-red-600' },
    ADMIN: { label: 'Admin', color: 'bg-blue-50 text-blue-600' },
    TEACHER: { label: "O'qituvchi", color: 'bg-emerald-50 text-emerald-600' },
    STUDENT: { label: 'Talaba', color: 'bg-violet-50 text-violet-600' },
  };

  const badge = roleBadge[user?.role] || { label: 'User', color: 'bg-gray-100 text-gray-500' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h1>

      <div className="max-w-2xl">
        
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Profil ma'lumotlari</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
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
                <p className="text-sm font-medium text-gray-800">{user?.role}</p>
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

        
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Tizim haqida</h3>
          <div className="space-y-2 text-sm text-gray-500">
            <p>🏫 <strong>EduERP</strong> - Ta'lim muassasasi boshqaruv tizimi</p>
            <p>📦 Versiya: 1.0.0</p>
            <p>⚡ NestJS + React + Prisma</p>
          </div>
        </div>
      </div>
    </div>
  );
}
