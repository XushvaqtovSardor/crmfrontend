import { useMemo, useState } from 'react';
import { Bell, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';

function splitName(fullName) {
    const clean = String(fullName || '').trim();
    if (!clean) return { firstName: '', lastName: '' };
    const [lastName = '', firstName = ''] = clean.split(' ');
    return { firstName, lastName };
}

export default function StudentSettingsPanel() {
    const { user } = useAuth();
    const [message, setMessage] = useState('');

    const { firstName, lastName } = useMemo(() => splitName(user?.fullName), [user?.fullName]);

    return (
        <div className="space-y-4">
            <h1 className="text-[34px] leading-none font-semibold text-gray-900">Shaxsiy ma'lumotlar</h1>

            <section className="rounded-2xl border border-[#dce1ea] bg-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                    <div className="h-32 w-32 rounded-2xl bg-linear-to-br from-[#f3b77a] to-[#e89347] text-white flex items-center justify-center text-3xl font-semibold">
                        {String(user?.fullName || 'U').trim().charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InfoRow label="Ism" value={firstName || '--'} />
                        <InfoRow label="Familiya" value={lastName || '--'} />
                        <InfoRow label="Telefon" value={user?.phone || '--'} />
                        <InfoRow label="Jinsi" value="Erkak" />
                        <InfoRow label="Tug'ilgan sana" value="--" />
                        <InfoRow label="HH.uz ID" value={`#${user?.id || '--'}`} />
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <FeatureCard
                    icon={<User size={18} />}
                    title="Kirish"
                    text={`Login: ${user?.phone || '--'}`}
                    button="O'zgartirish"
                />
                <FeatureCard
                    icon={<Lock size={18} />}
                    title="Parol"
                    text="****************"
                    button="O'zgartirish"
                />
                <FeatureCard
                    icon={<Bell size={18} />}
                    title="Bildirishnoma sozlamalari"
                    text="Push xabarlar yoqilgan"
                    button="Sozlash"
                />
            </div>

            <section className="rounded-2xl border border-[#dce1ea] bg-white p-4 space-y-2">
                <h3 className="text-base font-semibold text-gray-800 inline-flex items-center gap-2">
                    <Mail size={16} className="text-[#bf7735]" />
                    Murojaatlar
                </h3>
                <label className="rounded-xl border border-[#dce1ea] bg-[#fafbfd] px-3 py-2 block">
                    <textarea
                        rows={4}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Xabar yozing"
                        className="w-full resize-none bg-transparent text-sm text-gray-700 outline-none"
                    />
                </label>
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setMessage('')}
                        className="h-9 rounded-lg bg-[#d48a42] px-4 text-sm font-semibold text-white"
                    >
                        Yuborish
                    </button>
                </div>
            </section>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="rounded-xl border border-[#e3e8f1] bg-[#f9fbff] px-3 py-2">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{value}</p>
        </div>
    );
}

function FeatureCard({ icon, title, text, button }) {
    return (
        <article className="rounded-2xl border border-[#dce1ea] bg-white p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff3e6] text-[#bf7635]">
                {icon}
            </span>
            <h4 className="mt-3 text-sm font-semibold text-gray-800">{title}</h4>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
            <button
                type="button"
                className="mt-3 h-8 rounded-lg border border-[#d6dce7] bg-white px-3 text-xs font-semibold text-gray-700"
            >
                {button}
            </button>
        </article>
    );
}
