import { useState } from 'react';
import { Home, Users, GraduationCap, Layers3, BookOpen, DoorOpen, Wallet, Gift, Settings, Bell, Moon, Sun, Search, LogOut, Menu, X, ChevronDown, CalendarDays, Plus, ChevronLeft, ChevronRight, PlayCircle, } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { normalizeRole } from '../utils/roles.js';
const SIDEBAR_ITEMS = {
    SUPERADMIN: [
        { name: 'Asosiy', icon: Home, path: '/dashboard' },
        { name: "O'qituvchilar", icon: Users, path: '/teachers' },
        { name: 'Guruhlar', icon: Layers3, path: '/groups' },
        { name: 'Talabalar', icon: GraduationCap, path: '/students' },
        { name: 'Kurslar', icon: BookOpen, path: '/courses' },
        { name: 'Xonalar', icon: DoorOpen, path: '/rooms' },
        { name: "Sovg'alar", icon: Gift, path: '/gifts' },
        { name: 'Moliya', icon: Wallet, path: '/finance' },
        { name: 'Boshqarish', icon: Settings, path: '/settings' },
    ],
    ADMIN: [
        { name: 'Asosiy', icon: Home, path: '/dashboard' },
        { name: "O'qituvchilar", icon: Users, path: '/teachers' },
        { name: 'Guruhlar', icon: Layers3, path: '/groups' },
        { name: 'Talabalar', icon: GraduationCap, path: '/students' },
        { name: 'Kurslar', icon: BookOpen, path: '/courses' },
        { name: 'Xonalar', icon: DoorOpen, path: '/rooms' },
        { name: "Sovg'alar", icon: Gift, path: '/gifts' },
        { name: 'Moliya', icon: Wallet, path: '/finance' },
        { name: 'Boshqarish', icon: Settings, path: '/settings' },
    ],
    MANAGEMENT: [
        { name: 'Asosiy', icon: Home, path: '/dashboard' },
        { name: "O'qituvchilar", icon: Users, path: '/teachers' },
        { name: 'Guruhlar', icon: Layers3, path: '/groups' },
        { name: 'Talabalar', icon: GraduationCap, path: '/students' },
        { name: 'Kurslar', icon: BookOpen, path: '/courses' },
        { name: 'Xonalar', icon: DoorOpen, path: '/rooms' },
        { name: "Sovg'alar", icon: Gift, path: '/gifts' },
        { name: 'Moliya', icon: Wallet, path: '/finance' },
        { name: 'Boshqarish', icon: Settings, path: '/settings' },
    ],
    ADMINSTRATOR: [
        { name: 'Asosiy', icon: Home, path: '/dashboard' },
        { name: "O'qituvchilar", icon: Users, path: '/teachers' },
        { name: 'Guruhlar', icon: Layers3, path: '/groups' },
        { name: 'Talabalar', icon: GraduationCap, path: '/students' },
        { name: 'Kurslar', icon: BookOpen, path: '/courses' },
        { name: 'Xonalar', icon: DoorOpen, path: '/rooms' },
        { name: "Sovg'alar", icon: Gift, path: '/gifts' },
        { name: 'Moliya', icon: Wallet, path: '/finance' },
        { name: 'Boshqarish', icon: Settings, path: '/settings' },
    ],
    TEACHER: [
        { name: 'Asosiy', icon: Home, path: '/dashboard' },
        { name: 'Guruhlarim', icon: Layers3, path: '/my-groups' },
        { name: 'Darslar', icon: BookOpen, path: '/lessons' },
        { name: 'Vazifalar', icon: GraduationCap, path: '/homeworks' },
        { name: 'Moliyam', icon: Wallet, path: '/my-finance' },
        { name: 'Boshqarish', icon: Settings, path: '/settings' },
    ],
    STUDENT: [
        { name: 'Asosiy', icon: Home, path: '/dashboard' },
        { name: 'Guruhlarim', icon: Layers3, path: '/my-groups' },
        { name: 'Vazifalar', icon: GraduationCap, path: '/homeworks' },
        { name: 'Videolar', icon: PlayCircle, path: '/videos' },
        { name: 'Natijalar', icon: BookOpen, path: '/progress' },
        { name: 'Boshqarish', icon: Settings, path: '/settings' },
    ],
};
function isRouteActive(pathname, itemPath) {
    if (itemPath === '/dashboard')
        return pathname === '/dashboard';
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('erp_theme');
        return saved === 'night';
    });
    const toggleTheme = () => {
        const next = !dark;
        setDark(next);
        localStorage.setItem('erp_theme', next ? 'night' : 'day');
        if (next)
            document.body.classList.add('theme-night');
        else
            document.body.classList.remove('theme-night');
    };
    if (dark)
        document.body.classList.add('theme-night');
    else
        document.body.classList.remove('theme-night');
    const normalizedRole = normalizeRole(user?.role);
    const items = SIDEBAR_ITEMS[normalizedRole] || [];
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (<div className="modern-shell min-h-screen flex fancy-enter">

      {mobileOpen && (<div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)}/>)}


      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen border-r
        flex flex-col transition-all duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-72' : 'w-24'}
      `}>
        <div className="absolute inset-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}/>


        <div className="relative h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 fancy-enter-delay">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[17px] font-bold text-[#c88600] shrink-0" style={{ background: 'linear-gradient(160deg, #ffd980, #f6b941)', border: '2px solid #f0c263' }}>
              E
            </div>
            {sidebarOpen && <span className="text-[33px] font-extrabold italic tracking-tight" style={{ color: '#7e56d8' }}>EduCoin</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex w-8 h-8 rounded-xl items-center justify-center transition text-white" style={{ background: '#7f56d9' }}>
            {sidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden" style={{ color: 'var(--text-muted)' }}>
            <X size={20}/>
          </button>
        </div>


        <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(location.pathname, item.path);
            return (<button key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active
                    ? 'text-white shadow-lg'
                    : 'hover:translate-x-0.5'} ${!sidebarOpen ? 'justify-center' : ''}`} style={active
                    ? { background: 'linear-gradient(135deg, #7e56d8, #8258dd)' }
                    : { color: 'var(--text-muted)' }} title={item.name}>
                <Icon size={20} className="shrink-0"/>
                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              </button>);
        })}
        </nav>


        <div className="relative p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className={`rounded-2xl border p-4 ${!sidebarOpen ? 'hidden' : ''}`} style={{ borderColor: 'var(--border)', background: '#f8fafc' }}>
            <p className="text-lg font-semibold text-gray-800">Obuna</p>
            <p className="text-sm text-red-500 mb-4">Obunangiz tugagan</p>
            <button className="w-full h-11 rounded-xl text-white font-semibold" style={{ background: '#ff374f' }}>
              Obunani yangilash
            </button>
          </div>
          <button onClick={handleLogout} className={`mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition ${!sidebarOpen ? 'justify-center' : ''}`}>
            <LogOut size={20} className="shrink-0"/>
            {sidebarOpen && <span className="font-medium text-sm">Chiqish</span>}
          </button>
        </div>
      </aside>


      <div className="flex-1 flex flex-col min-w-0">

        <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 backdrop-blur-lg" style={{ background: 'color-mix(in srgb, var(--surface) 94%, transparent)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden">
              <Menu size={24} style={{ color: 'var(--text-muted)' }}/>
            </button>
            <button className="hidden lg:flex w-10 h-10 rounded-xl items-center justify-center border" style={{ borderColor: 'var(--border)', background: '#fff' }}>
              <CalendarDays size={18} className="text-gray-500"/>
            </button>
            <button className="hidden lg:flex w-12 h-10 rounded-xl items-center justify-center border" style={{ borderColor: 'var(--border)', background: '#fff' }}>
              <Plus size={18} className="text-gray-700"/>
            </button>
            <div className="relative hidden sm:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}/>
              <input type="text" placeholder="Qidirish..." className="w-60 lg:w-72 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: '0 0 0 0 var(--ring)' }}/>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex h-10 px-4 rounded-xl border items-center gap-2 text-sm text-gray-600 font-medium" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'User'}
            </div>
            <button className="hidden lg:flex h-10 px-4 rounded-xl border items-center gap-2 text-sm text-gray-600" style={{ borderColor: 'var(--border)', background: '#fff' }}>
              O'zbekcha <ChevronDown size={16}/>
            </button>
            <button className="w-10 h-10 rounded-xl border flex items-center justify-center transition" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <Bell size={18} style={{ color: 'var(--text-muted)' }}/>
            </button>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}>
              {dark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
        </header>


        <main className="flex-1 p-4 lg:p-6 overflow-auto fancy-enter-delay">
          {children}
        </main>
      </div>
    </div>);
}
