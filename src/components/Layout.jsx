import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Users, GraduationCap, Layers3, BookOpen, DoorOpen, Wallet, Gift, Settings, Bell, Moon, Sun, Search, LogOut, Menu, X, ChevronDown, CalendarDays, Plus, ChevronLeft, ChevronRight, PlayCircle, CreditCard, BarChart3, Trophy, ShoppingBag, } from 'lucide-react';
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
    { name: 'Boshqarish', icon: Settings, path: '/management' },
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
    { name: 'Boshqarish', icon: Settings, path: '/management' },
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
    { name: 'Boshqarish', icon: Settings, path: '/management' },
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
    { name: 'Boshqarish', icon: Settings, path: '/management' },
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

const STAFF_ROLE_SET = new Set(['SUPERADMIN', 'ADMIN', 'MANAGEMENT', 'ADMINSTRATOR']);

const STAFF_QUICK_ACTIONS = [
  { label: "O'qituvchi qo'shish", path: '/teachers?create=1', icon: Users },
  { label: 'Guruh qo\'shish', path: '/groups?create=1', icon: Layers3 },
  { label: 'Talaba qo\'shish', path: '/students?create=1', icon: GraduationCap },
];

const CENTER_OPTIONS = [
  'AICoder markazi',
  'Fizika va Matematika',
  '4-maktab',
  'Niner markazi',
  'SAT,IELTS,AP,CONSULTING centre',
  'IELTS full mock',
];

const CENTER_STORAGE_KEY = 'erp_selected_center';

const STUDENT_MENU_ITEMS = [
  { name: 'Bosh sahifa', icon: Home, path: '/dashboard' },
  { name: "To'lovlarim", icon: CreditCard, path: '/payments' },
  { name: 'Guruhlarim', icon: Layers3, path: '/my-groups' },
  { name: "Ko'rsatgichlarim", icon: BarChart3, path: '/progress' },
  { name: 'Reyting', icon: Trophy, path: '/rating' },
  { name: "Do'kon", icon: ShoppingBag, path: '/shop' },
  { name: "Qo'shimcha darslar", icon: PlayCircle, path: '/videos' },
  { name: 'Sozlamalar', icon: Settings, path: '/settings' },
];

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
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef(null);
  const [selectedCenter, setSelectedCenter] = useState(() => {
    if (typeof window === 'undefined') {
      return CENTER_OPTIONS[0];
    }

    const saved = window.localStorage.getItem(CENTER_STORAGE_KEY);
    return saved && CENTER_OPTIONS.includes(saved) ? saved : CENTER_OPTIONS[0];
  });
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('erp_theme');
    return saved === 'night';
  });
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('erp_theme', next ? 'night' : 'day');
  };

  useEffect(() => {
    document.body.classList.toggle('theme-night', dark);
    return () => {
      document.body.classList.remove('theme-night');
    };
  }, [dark]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CENTER_STORAGE_KEY, selectedCenter);
  }, [selectedCenter]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncDesktopState = (matches) => {
      setIsDesktop(matches);
      if (matches) {
        setMobileOpen(false);
      }
    };

    syncDesktopState(mediaQuery.matches);

    const handleChange = (event) => {
      syncDesktopState(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      setMobileOpen(false);
      setQuickActionsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  const normalizedRole = normalizeRole(user?.role);
  const items = SIDEBAR_ITEMS[normalizedRole] || [];
  const quickActions = useMemo(() => {
    if (!STAFF_ROLE_SET.has(normalizedRole)) {
      return [];
    }
    return STAFF_QUICK_ACTIONS;
  }, [normalizedRole]);

  useEffect(() => {
    if (!quickActionsOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!quickActionsRef.current?.contains(event.target)) {
        setQuickActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [quickActionsOpen]);

  useEffect(() => {
    setQuickActionsOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickAction = (path) => {
    setQuickActionsOpen(false);
    navigate(path);
  };

  if (normalizedRole === 'STUDENT') {
    return (
      <StudentLayout
        user={user}
        pathname={location.pathname}
        navigate={navigate}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      >
        {children}
      </StudentLayout>
    );
  }

  return (<div className="modern-shell min-h-screen flex fancy-enter">



    {mobileOpen && !isDesktop && (<div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />)}





    <aside className={`

        fixed lg:sticky top-0 left-0 z-50 h-screen border-r

        flex flex-col transition-all duration-300

        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}

        ${sidebarOpen ? 'w-72' : 'w-24'}

      `}>

      <div className="absolute inset-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} />





      <div className="relative h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border)' }}>

        <div className="flex items-center gap-3 fancy-enter-delay">

          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[17px] font-bold text-[#c88600] shrink-0" style={{ background: 'linear-gradient(160deg, #ffd980, #f6b941)', border: '2px solid #f0c263' }}>

            E

          </div>

          {sidebarOpen && <span className="text-[33px] font-extrabold italic tracking-tight" style={{ color: '#7e56d8' }}>CRM</span>}

        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex w-8 h-8 rounded-xl items-center justify-center transition text-white" style={{ background: '#7f56d9' }}>

          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}

        </button>

        <button onClick={() => setMobileOpen(false)} className="lg:hidden" style={{ color: 'var(--text-muted)' }}>

          <X size={20} />

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

            <Icon size={20} className="shrink-0" />

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

          <LogOut size={20} className="shrink-0" />

          {sidebarOpen && <span className="font-medium text-sm">Chiqish</span>}

        </button>

      </div>

    </aside>





    <div className="flex-1 flex flex-col min-w-0">



      <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 backdrop-blur-lg" style={{ background: 'color-mix(in srgb, var(--surface) 94%, transparent)', borderColor: 'var(--border)' }}>

        <div className="flex items-center gap-4">

          <button onClick={() => setMobileOpen(true)} className="lg:hidden">

            <Menu size={24} style={{ color: 'var(--text-muted)' }} />

          </button>

          <button className="hidden lg:flex w-10 h-10 rounded-xl items-center justify-center border" style={{ borderColor: 'var(--border)', background: '#fff' }}>

            <CalendarDays size={18} className="text-gray-500" />

          </button>

          {quickActions.length > 0 && (<div className="relative hidden lg:block" ref={quickActionsRef}>

            <button onClick={() => setQuickActionsOpen((prev) => !prev)} className="w-12 h-10 rounded-xl items-center justify-center border inline-flex" style={{ borderColor: 'var(--border)', background: '#fff' }} title="Tezkor amallar">

              <Plus size={18} className="text-gray-700" />

            </button>



            {quickActionsOpen && (<div className="absolute top-12 left-0 z-40 w-56 rounded-xl border border-[#e4e9f4] bg-white shadow-xl py-1.5">

              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (<button key={action.path} type="button" onClick={() => handleQuickAction(action.path)} className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-[#f7f8fc] inline-flex items-center gap-2">

                  <ActionIcon size={16} className="text-violet-500" />

                  {action.label}

                </button>);
              })}

            </div>)}

          </div>)}

          <div className="relative hidden sm:block">

            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />

            <input type="text" placeholder="Qidirish..." className="w-60 lg:w-72 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: '0 0 0 0 var(--ring)' }} />

          </div>

        </div>



        <div className="flex items-center gap-2">

          <select
            value={selectedCenter}
            onChange={(event) => setSelectedCenter(event.target.value)}
            className="hidden lg:flex h-10 min-w-48 rounded-xl border px-4 text-sm text-gray-600 bg-white"
            style={{ borderColor: 'var(--border)' }}
          >
            {CENTER_OPTIONS.map((center) => (
              <option key={center} value={center}>{center}</option>
            ))}
          </select>

          <button className="hidden lg:flex h-10 px-4 rounded-xl border items-center gap-2 text-sm text-gray-600" style={{ borderColor: 'var(--border)', background: '#fff' }}>

            O'zbekcha <ChevronDown size={16} />

          </button>

          <button className="w-10 h-10 rounded-xl border flex items-center justify-center transition" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>

            <Bell size={18} style={{ color: 'var(--text-muted)' }} />

          </button>

          <button onClick={toggleTheme} className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}>

            {dark ? <Sun size={18} /> : <Moon size={18} />}

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

function isStudentRouteActive(pathname, itemPath) {
  if (itemPath === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function StudentLayout({ children, user, pathname, navigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncDesktopState = (matches) => {
      setIsDesktop(matches);
      if (matches) {
        setMobileOpen(false);
      }
    };

    syncDesktopState(mediaQuery.matches);

    const handleChange = (event) => {
      syncDesktopState(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#e9edf4] flex">
      {mobileOpen && !isDesktop && (
        <div className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen border-r border-[#d4dae5] bg-white flex flex-col transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? 'w-72' : 'w-24'}`}
      >
        <div className="h-16 border-b border-[#dde3ee] px-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-[#f3b674] to-[#d98a42] text-white flex items-center justify-center font-bold text-lg shrink-0">C</div>
            {sidebarOpen && <span className="text-2xl font-semibold text-[#b86e2e]">CRM</span>}
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="hidden lg:inline-flex h-8 w-8 rounded-lg border border-[#d4dae5] bg-white text-gray-600 items-center justify-center"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          <button type="button" onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-500">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {STUDENT_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isStudentRouteActive(pathname, item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full h-11 rounded-xl px-3 inline-flex items-center gap-3 text-sm font-medium transition ${active ? 'bg-[#fdeedc] text-[#b36a2a] border border-[#f0d0aa]' : 'text-gray-600 border border-transparent hover:bg-[#f7f8fc]'} ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                title={item.name}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#dde3ee]">
          <button
            type="button"
            onClick={onLogout}
            className={`w-full h-11 rounded-xl border border-[#f0c4c4] bg-[#fff5f5] text-red-600 inline-flex items-center gap-2 px-3 ${!sidebarOpen ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={17} />
            {sidebarOpen && <span className="text-sm font-semibold">Chiqish</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-[#d7deea] bg-[#f2f5fb] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg border border-[#d3d9e4] bg-white inline-flex items-center justify-center text-gray-600"
            >
              <Menu size={18} />
            </button>
            <p className="text-sm text-gray-500">Student panel</p>
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className={`h-10 w-10 rounded-xl border inline-flex items-center justify-center ${pathname === '/notifications' ? 'border-[#e7c39d] bg-[#fff0df] text-[#b86f2f]' : 'border-[#d4dae5] bg-white text-gray-600'}`}
            >
              <Bell size={17} />
            </button>

            <div className="h-10 rounded-xl border border-[#d4dae5] bg-white px-3 inline-flex items-center gap-2">
              <span className="inline-flex h-7 w-7 rounded-full bg-linear-to-br from-[#e9a969] to-[#ce7837] text-white items-center justify-center text-sm font-semibold">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-32 truncate">{user?.fullName || 'Student'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
