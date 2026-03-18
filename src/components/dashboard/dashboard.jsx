import {
  Home,
  Users,
  GraduationCap,
  Layers3,
  Wallet,
  Settings,
  Bell,
  Moon,
  Search,
  ChevronDown,
  Snowflake,
  Archive,
  AlertTriangle,
  CreditCard,
  UserCircle2,
  Crown,
} from "lucide-react";

const stats = [
  {
    title: "Faol talabalar",
    value: 49,
    icon: <GraduationCap size={22} className="text-violet-500" />,
  },
  {
    title: "Guruhlar",
    value: 19,
    icon: <Users size={22} className="text-violet-500" />,
  },
  {
    title: "Joriy oy to'lovlar",
    value: 0,
    icon: <CreditCard size={22} className="text-violet-500" />,
  },
  {
    title: "Qarzdorlar",
    value: 59,
    icon: <AlertTriangle size={22} className="text-violet-500" />,
  },
  {
    title: "Muzlatilganlar",
    value: 0,
    icon: <Snowflake size={22} className="text-violet-500" />,
  },
  {
    title: "Arxivdagilar",
    value: 17,
    icon: <Archive size={22} className="text-violet-500" />,
  },
];

const menuItems = [
  { name: "Asosiy", icon: <Home size={20} /> },
  { name: "O'qituvchilar", icon: <Users size={20} /> },
  { name: "Guruhlar", icon: <Layers3 size={20} /> },
  { name: "Talabalar", icon: <GraduationCap size={20} /> },
  { name: "Sozlamalar", icon: <Settings size={20} /> },
  { name: "Moliya", icon: <Wallet size={20} /> },
  { name: "Boshqarish", icon: <Settings size={20} /> },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f6f6fb] flex text-[#1f1f29]">
      
      <aside className="w-[250px] bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          
          <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-lg shadow">
              E
            </div>
            <h1 className="text-2xl font-bold text-violet-500">EduCoin</h1>
          </div>

          
          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                  index === 0
                    ? "bg-violet-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-violet-50"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        
        <div className="p-4">
          <div className="bg-[#faf7ff] border border-violet-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Crown className="text-orange-500" size={22} />
              </div>
              <div>
                <p className="font-semibold text-sm">Obuna</p>
                <p className="text-xs text-gray-500">Obunangiz tugagan</p>
              </div>
            </div>

            <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition">
              Obunani yangilash
            </button>
          </div>
        </div>
      </aside>

      
      <main className="flex-1 p-6">
        
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow">
              ‹
            </button>

            <div className="relative w-[320px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Qidirish..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-white border border-gray-200 px-5 py-2.5 rounded-2xl font-medium hover:bg-gray-50">
              AICoder markazi
            </button>

            <button className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-gray-50">
              <span>O'zbekcha</span>
              <ChevronDown size={16} />
            </button>

            <button className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <Bell size={18} />
            </button>

            <button className="w-11 h-11 rounded-xl bg-[#111827] text-white flex items-center justify-center">
              <Moon size={18} />
            </button>

            <button className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              <UserCircle2 size={28} className="text-gray-600" />
            </button>
          </div>
        </div>

        
        <div className="mb-6">
          <h2 className="text-4xl font-bold mb-2">Salom, Islombek Baxromov!</h2>
          <p className="text-gray-500 text-lg">
            EduCoin platformasiga xush kelibsiz!
          </p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7 flex flex-col items-center justify-center min-h-[145px]"
            >
              <div className="mb-3">{item.icon}</div>
              <p className="text-gray-600 font-medium text-center mb-3">
                {item.title}
              </p>
              <h3 className="text-4xl font-bold">{item.value}</h3>
            </div>
          ))}
        </div>

        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Joriy oy uchun to'lovlar</h3>
            <ChevronDown className="text-gray-500" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Yillik Foyda</h3>
            <ChevronDown className="text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Dars jadvali</h3>
          <ChevronDown className="text-gray-500" />
        </div>

        
        <div className="h-[320px]"></div>
      </main>
    </div>
  );
}