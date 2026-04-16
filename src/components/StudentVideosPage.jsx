import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, PlayCircle, Search } from 'lucide-react';
import api from '../api.js';
import { getApiErrorMessage } from '../utils/http.js';
function parsePayload(response) {
    return response?.data?.data ?? response?.data ?? [];
}
function isVideoUrl(value) {
    const url = String(value || '').toLowerCase();
    return url.startsWith('http://') || url.startsWith('https://');
}
export default function StudentVideosPage() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/erp/student/videos');
                const payload = parsePayload(response);
                if (active) {
                    setVideos(Array.isArray(payload) ? payload : []);
                }
            }
            catch (e) {
                if (active) {
                    setError(getApiErrorMessage(e, 'Videolarni yuklashda xatolik yuz berdi'));
                    setVideos([]);
                }
            }
            finally {
                if (active) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);
    const filteredVideos = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return videos;
        }
        return videos.filter((video) => {
            const text = `${video.lesson?.title || ''} ${video.lesson?.group?.name || ''} ${video.teacher?.fullName || ''}`.toLowerCase();
            return text.includes(q);
        });
    }, [query, videos]);
    return (<div className="space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <h1 className="text-[34px] leading-none font-semibold text-gray-900">Qo'shimcha darslar</h1>



            <div className="relative w-full sm:w-80">

                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mavzu, guruh yoki ustoz bo'yicha qidirish" className="h-10 w-full rounded-xl border border-[#dfe4ef] bg-white pl-9 pr-3 text-sm" />

            </div>

        </div>



        {error && (<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

            {error}

        </div>)}



        {loading ? (<div className="py-16 flex items-center justify-center">

            <Loader2 size={26} className="animate-spin text-[#c07a37]" />

        </div>) : filteredVideos.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {filteredVideos.map((video) => (<article key={video.id} className="bg-white rounded-2xl border border-[#dce1ea] p-5 shadow-sm">

                <div className="w-11 h-11 rounded-xl bg-[#fff2e4] text-[#be7734] flex items-center justify-center mb-3">

                    <PlayCircle size={20} />

                </div>



                <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{video.lesson?.title || 'Dars videosi'}</h3>

                <p className="text-sm text-gray-500 mt-1">Guruh: {video.lesson?.group?.name || '--'}</p>

                <p className="text-sm text-gray-500">Ustoz: {video.teacher?.fullName || '--'}</p>

                <p className="text-xs text-gray-400 mt-2">{new Date(video.created_at).toLocaleString('uz-UZ')}</p>



                {isVideoUrl(video.file) ? (<a href={video.file} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#b76d2e] hover:text-[#9d5c26]">

                    Videoni ochish

                    <ExternalLink size={14} />

                </a>) : (<p className="mt-4 text-sm text-gray-500 break-all">{video.file}</p>)}

            </article>))}

        </div>) : (<div className="py-16 text-center text-gray-400">

            <PlayCircle size={44} className="mx-auto mb-2 text-gray-300" />

            Hozircha videolar topilmadi

        </div>)}

    </div>);
}
