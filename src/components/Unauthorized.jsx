import { ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <ShieldX size={64} className="text-red-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ruxsat yo'q</h1>
        <p className="text-gray-500 mb-6">Bu sahifaga kirish huquqingiz yo'q</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    </div>
  );
}
