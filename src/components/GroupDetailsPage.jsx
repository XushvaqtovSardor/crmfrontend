import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, Coins, Download, Edit3, History, Loader2, Plus, RefreshCcw, Snowflake, Trash2, UserPlus, X, } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
const DAY_SHORT = {
    MONDAY: 'Du',
    TUESDAY: 'Se',
    WEDNESDAY: 'Cho',
    THURSDAY: 'Pa',
    FRIDAY: 'Ju',
    SATURDAY: 'Sha',
    SUNDAY: 'Ya',
};
const DAY_HEADER = {
    MONDAY: 'Dush',
    TUESDAY: 'Sesh',
    WEDNESDAY: 'Chor',
    THURSDAY: 'Pay',
    FRIDAY: 'Jum',
    SATURDAY: 'Shan',
    SUNDAY: 'Yak',
};
const WEEKDAY_INDEX = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6,
};
function normalizeList(payload) {
    if (Array.isArray(payload?.data?.data?.data))
        return payload.data.data.data;
    if (Array.isArray(payload?.data?.data))
        return payload.data.data;
    if (Array.isArray(payload?.data))
        return payload.data;
    return [];
}
function normalizeObject(payload) {
    if (payload?.data?.data)
        return payload.data.data;
    if (payload?.data)
        return payload.data;
    return null;
}
function formatDate(value) {
    if (!value)
        return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return '--';
    return parsed.toLocaleDateString('uz-UZ');
}
function formatDateTime(value) {
    if (!value)
        return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return '--';
    return parsed.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function formatDays(days = []) {
    if (!Array.isArray(days) || !days.length)
        return '--';
    return days.map((day) => DAY_SHORT[day] || day).join(', ');
}
function addDays(baseDate, amount) {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + amount);
    return next;
}
function addMonths(baseDate, amount) {
    const next = new Date(baseDate);
    next.setMonth(baseDate.getMonth() + amount);
    return next;
}
function toDateKey(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getWeekStartMonday(baseDate) {
    const date = new Date(baseDate);
    const weekday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - weekday);
    date.setHours(0, 0, 0, 0);
    return date;
}
function buildAttendanceColumns(baseDate, weekDays = []) {
    const monday = getWeekStartMonday(baseDate);
    const preferred = [...new Set(Array.isArray(weekDays) ? weekDays : [])];
    if (!preferred.length) {
        preferred.push('MONDAY', 'THURSDAY');
    }
    while (preferred.length < 2) {
        preferred.push(preferred[0] === 'MONDAY' ? 'THURSDAY' : 'MONDAY');
    }
    return preferred.slice(0, 2).map((dayName) => {
        const offset = WEEKDAY_INDEX[dayName] ?? 0;
        const currentDate = addDays(monday, offset);
        return {
            key: toDateKey(currentDate),
            dayLabel: DAY_HEADER[dayName] || dayName,
            dayNumber: currentDate.getDate(),
        };
    });
}
function csvEscape(value) {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
}
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
function exportToCsv(fileName, headers, rows) {
    const head = headers.map(csvEscape).join(',');
    const body = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    downloadFile(`${head}\n${body}`, fileName, 'text/csv;charset=utf-8;');
}
function exportToExcel(fileName, headers, rows) {
    const headHtml = headers.map((header) => `<th>${String(header)}</th>`).join('');
    const bodyHtml = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? '')}</td>`).join('')}</tr>`)
        .join('');
    const table = `
            <table>
                  <thead><tr>${headHtml}</tr></thead>
                  <tbody>${bodyHtml}</tbody>
            </table>
      `;
    downloadFile(table, fileName, 'application/vnd.ms-excel;charset=utf-8;');
}
function SidebarSection({ title, open, onToggle, children }) {
    return (<section className="rounded-2xl border border-[#e6ebf6] overflow-hidden bg-[#fafbff]">
                  <button type="button" onClick={onToggle} className="w-full px-4 py-3 text-left flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-800">{title}</span>
                        {open ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
                  </button>
                  {open && <div className="px-4 pb-4">{children}</div>}
            </section>);
}
export default function GroupDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const groupId = Number(id);
    const [group, setGroup] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentId, setStudentId] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('attendance');
    const [focusDate, setFocusDate] = useState(new Date());
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceSavingKey, setAttendanceSavingKey] = useState('');
    const [attendanceResetKey, setAttendanceResetKey] = useState('');
    const [studentRemovingId, setStudentRemovingId] = useState(0);
    const [attendanceByDate, setAttendanceByDate] = useState({});
    const [form, setForm] = useState(INITIAL_FORM);
    const [openSections, setOpenSections] = useState({
        info: true,
        teacher: true,
        students: true,
    });
    const attendanceColumns = useMemo(() => buildAttendanceColumns(focusDate, group?.weekDays || []), [focusDate, group?.weekDays]);
    const monthLabel = useMemo(() => focusDate.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }), [focusDate]);
    const groupStudents = useMemo(() => (group?.studentGroup || []).map((membership) => membership.student).filter(Boolean), [group]);
    const availableStudents = useMemo(() => {
        const assignedIds = new Set(groupStudents.map((student) => Number(student.id)));
        return students.filter((student) => {
            if (assignedIds.has(Number(student.id)))
                return false;
            return student.status !== 'INACTIVE';
        });
    }, [groupStudents, students]);
    const filteredStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();
        if (!query)
            return availableStudents;
        return availableStudents.filter((student) => {
            const byName = String(student.fullName || '').toLowerCase().includes(query);
            const byEmail = String(student.email || '').toLowerCase().includes(query);
            return byName || byEmail;
        });
    }, [availableStudents, studentSearch]);
    const attendanceLookup = useMemo(() => {
        const result = {};
        for (const column of attendanceColumns) {
            const rows = attendanceByDate[column.key]?.students || [];
            result[column.key] = new Map(rows.map((row) => [Number(row.studentId), row]));
        }
        return result;
    }, [attendanceByDate, attendanceColumns]);
    const coinRows = useMemo(() => {
        return groupStudents.map((student) => {
            let presentCount = 0;
            let absentCount = 0;
            attendanceColumns.forEach((column) => {
                const status = attendanceLookup[column.key]?.get(Number(student.id))?.isPresent;
                if (status === true)
                    presentCount += 1;
                if (status === false)
                    absentCount += 1;
            });
            return {
                id: student.id,
                fullName: student.fullName,
                presentCount,
                absentCount,
                earnedCoin: presentCount * 10,
            };
        });
    }, [groupStudents, attendanceColumns, attendanceLookup]);
    const coinSummary = useMemo(() => {
        const earned = coinRows.reduce((sum, row) => sum + row.earnedCoin, 0);
        const spent = Math.round(earned * 0.25);
        return {
            earned,
            spent,
            balance: Math.max(earned - spent, 0),
        };
    }, [coinRows]);
    const activityHistory = useMemo(() => {
        if (!group)
            return [];
        const lessonHistory = (group.lessons || [])
            .filter((lesson) => !String(lesson.title || '').startsWith('__ATTENDANCE__'))
            .map((lesson) => ({
            id: `lesson-${lesson.id}`,
            date: lesson.created_at,
            text: `Yangi dars qo'shildi: ${lesson.title}`,
        }));
        const studentHistory = (group.studentGroup || []).map((membership) => ({
            id: `student-${membership.id}`,
            date: membership.created_at,
            text: `${membership.student?.fullName || 'Talaba'} guruhga qo'shildi`,
        }));
        const baseHistory = [
            {
                id: `group-${group.id}`,
                date: group.created_at,
                text: 'Guruh yaratildi',
            },
            ...lessonHistory,
            ...studentHistory,
        ];
        return baseHistory.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    }, [group]);
    const loadGroup = useCallback(async () => {
        if (!Number.isInteger(groupId) || groupId <= 0) {
            setError('Guruh ID noto\'g\'ri.');
            setLoading(false);
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await api.get(`/groups/${groupId}`);
            const nextGroup = normalizeObject(response.data);
            setGroup(nextGroup);
            if (nextGroup) {
                setForm({
                    name: nextGroup.name || '',
                    teacherId: String(nextGroup.teacherId || ''),
                    courseId: String(nextGroup.courseId || ''),
                    roomId: String(nextGroup.roomId || ''),
                    startDate: nextGroup.startDate?.split('T')[0] || '',
                    startTime: nextGroup.startTime || '09:00',
                    weekDays: nextGroup.weekDays || [],
                });
            }
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Guruh ma'lumotlarini yuklab bo'lmadi"));
            setGroup(null);
        }
        finally {
            setLoading(false);
        }
    }, [groupId]);
    const loadMeta = useCallback(async () => {
        try {
            const [teacherRes, courseRes, roomRes, studentRes] = await Promise.allSettled([
                api.get('/teachers?page=1&limit=300'),
                api.get('/courses?page=1&limit=300'),
                api.get('/rooms?page=1&limit=300'),
                api.get('/students?page=1&limit=300'),
            ]);
            if (teacherRes.status === 'fulfilled')
                setTeachers(normalizeList(teacherRes.value.data));
            if (courseRes.status === 'fulfilled')
                setCourses(normalizeList(courseRes.value.data));
            if (roomRes.status === 'fulfilled')
                setRooms(normalizeList(roomRes.value.data));
            if (studentRes.status === 'fulfilled')
                setStudents(normalizeList(studentRes.value.data));
        }
        catch {
        }
    }, []);
    const loadAttendance = useCallback(async (dateKeys) => {
        if (!Number.isInteger(groupId) || groupId <= 0)
            return;
        setAttendanceLoading(true);
        try {
            const results = await Promise.allSettled(dateKeys.map((dateKey) => api.get(`/groups/${groupId}/attendance?date=${dateKey}`)));
            const next = {};
            results.forEach((result, index) => {
                const dateKey = dateKeys[index];
                if (result.status === 'fulfilled') {
                    next[dateKey] = normalizeObject(result.value.data) || {};
                }
            });
            setAttendanceByDate((prev) => ({ ...prev, ...next }));
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Davomatni yuklashda xatolik"));
        }
        finally {
            setAttendanceLoading(false);
        }
    }, [groupId]);
    useEffect(() => {
        loadGroup();
        loadMeta();
    }, [loadGroup, loadMeta]);
    useEffect(() => {
        if (!group)
            return;
        loadAttendance(attendanceColumns.map((column) => column.key));
    }, [group, attendanceColumns, loadAttendance]);
    const toggleSection = (key) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const toggleDay = (day) => {
        setForm((prev) => ({
            ...prev,
            weekDays: prev.weekDays.includes(day)
                ? prev.weekDays.filter((item) => item !== day)
                : [...prev.weekDays, day],
        }));
    };
    const saveGroup = async () => {
        if (!group)
            return;
        if (!form.name.trim() || !form.teacherId || !form.courseId || !form.roomId || !form.startDate || !form.weekDays.length) {
            setError("Saqlash uchun barcha maydonlarni to'ldiring");
            return;
        }
        if (!user?.id) {
            setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await api.patch(`/groups/${group.id}`, {
                name: form.name.trim(),
                teacherId: Number(form.teacherId),
                courseId: Number(form.courseId),
                roomId: Number(form.roomId),
                userId: Number(user.id),
                startDate: new Date(form.startDate).toISOString(),
                startTime: form.startTime,
                weekDays: form.weekDays,
            });
            setShowEditModal(false);
            await loadGroup();
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Guruhni saqlashda xatolik"));
        }
        finally {
            setSaving(false);
        }
    };
    const addStudent = async () => {
        if (!group || !studentId)
            return;
        if (!user?.id) {
            setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await api.post(`/groups/${group.id}/students`, {
                studentId: Number(studentId),
                userId: Number(user.id),
            });
            setStudentId('');
            setStudentSearch('');
            setShowStudentModal(false);
            await loadGroup();
            await loadAttendance(attendanceColumns.map((column) => column.key));
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Talabani qo'shishda xatolik"));
        }
        finally {
            setSaving(false);
        }
    };
    const archiveGroup = async () => {
        if (!group)
            return;
        if (!user?.id) {
            setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
            return;
        }
        if (!window.confirm("Guruhni arxivga o'tkazishni xohlaysizmi?"))
            return;
        setSaving(true);
        try {
            await api.patch(`/groups/${group.id}`, {
                status: 'INACTIVE',
                userId: Number(user.id),
            });
            navigate('/groups', { replace: true });
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Guruhni arxivlashda xatolik"));
        }
        finally {
            setSaving(false);
        }
    };
    const toggleGroupStatus = async () => {
        if (!group || !user?.id)
            return;
        const nextStatus = group.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
        setSaving(true);
        try {
            await api.patch(`/groups/${group.id}`, {
                status: nextStatus,
                userId: Number(user.id),
            });
            await loadGroup();
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Guruh holatini o'zgartirib bo'lmadi"));
        }
        finally {
            setSaving(false);
        }
    };
    const setAttendance = async (studentIdValue, dateKey, isPresent) => {
        if (!group || !user?.id) {
            setError('Foydalanuvchi aniqlanmadi. Qayta login qiling.');
            return;
        }
        const requestKey = `${dateKey}:${studentIdValue}`;
        setAttendanceSavingKey(requestKey);
        setError('');
        try {
            await api.patch(`/groups/${group.id}/attendance`, {
                studentId: Number(studentIdValue),
                date: dateKey,
                isPresent,
                userId: Number(user.id),
            });
            await loadAttendance([dateKey]);
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Davomatni saqlab bo'lmadi"));
        }
        finally {
            setAttendanceSavingKey('');
        }
    };
    const resetAttendance = async (dateKey, studentIdValue = null) => {
        if (!group)
            return;
        const resetMessage = studentIdValue
            ? `Ushbu talaba uchun ${dateKey} sanasidagi davomatni tozalamoqchimisiz?`
            : `${dateKey} sanasi bo'yicha barcha davomat yozuvlarini tozalamoqchimisiz?`;
        if (!window.confirm(resetMessage))
            return;
        const key = studentIdValue ? `${dateKey}:${studentIdValue}:reset` : `${dateKey}:reset`;
        setAttendanceResetKey(key);
        setError('');
        try {
            await api.delete(`/groups/${group.id}/attendance`, {
                params: {
                    date: dateKey,
                    ...(studentIdValue ? { studentId: Number(studentIdValue) } : {}),
                },
            });
            await loadAttendance([dateKey]);
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Davomatni reset qilishda xatolik"));
        }
        finally {
            setAttendanceResetKey('');
        }
    };
    const removeStudentFromGroup = async (studentIdValue, fullName) => {
        if (!group)
            return;
        if (!window.confirm(`${fullName || 'Talaba'}ni guruhdan chiqarishni xohlaysizmi?`))
            return;
        setStudentRemovingId(Number(studentIdValue));
        setError('');
        try {
            await api.delete(`/groups/${group.id}/students/${studentIdValue}`);
            await loadGroup();
            await loadAttendance(attendanceColumns.map((column) => column.key));
        }
        catch (e) {
            setError(getApiErrorMessage(e, "Talabani guruhdan chiqarib bo'lmadi"));
        }
        finally {
            setStudentRemovingId(0);
        }
    };
    const updateFocusDate = (value) => {
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime()))
            return;
        setFocusDate(parsed);
    };
    const exportAttendance = (format) => {
        const headers = ['Talaba', ...attendanceColumns.map((column) => `${column.dayLabel} ${column.dayNumber}`)];
        const rows = groupStudents.map((student) => {
            const columns = attendanceColumns.map((column) => {
                const status = attendanceLookup[column.key]?.get(Number(student.id))?.isPresent;
                if (status === true)
                    return 'Bor';
                if (status === false)
                    return "Yo'q";
                return '-';
            });
            return [student.fullName || '--', ...columns];
        });
        const period = toDateKey(focusDate);
        if (format === 'excel') {
            exportToExcel(`davomat-${group.name}-${period}.xls`, headers, rows);
            return;
        }
        exportToCsv(`davomat-${group.name}-${period}.csv`, headers, rows);
    };
    const exportHistory = (format) => {
        const headers = ['Sana', 'Amal'];
        const rows = activityHistory.map((item) => [formatDateTime(item.date), item.text]);
        if (format === 'excel') {
            exportToExcel(`tarix-${group.name}.xls`, headers, rows);
            return;
        }
        exportToCsv(`tarix-${group.name}.csv`, headers, rows);
    };
    if (loading) {
        return (<div className="space-y-4">
                        <div className="h-16 rounded-2xl bg-white border border-[#e7ecf6] animate-pulse"/>
                        <div className="h-80 rounded-2xl bg-white border border-[#e7ecf6] animate-pulse"/>
                  </div>);
    }
    if (!group) {
        return (<div className="bg-white rounded-2xl border border-red-200 px-6 py-6">
                        <p className="text-red-600 font-medium">Guruh topilmadi yoki o'chirib yuborilgan.</p>
                        <button type="button" onClick={() => navigate('/groups')} className="mt-4 h-10 px-4 rounded-xl bg-violet-500 text-white text-sm font-semibold">
                              Guruhlarga qaytish
                        </button>
                  </div>);
    }
    return (<div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                              <button type="button" onClick={() => navigate('/groups')} className="h-10 px-4 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold flex items-center gap-2">
                                    <ArrowLeft size={16}/> Guruhlar
                              </button>

                              <button type="button" onClick={toggleGroupStatus} disabled={saving} className={`w-11 h-6 rounded-full relative transition ${group.status !== 'INACTIVE' ? 'bg-violet-500' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${group.status !== 'INACTIVE' ? 'left-5.5' : 'left-0.5'}`}/>
                              </button>

                              <h1 className="text-4xl font-semibold text-gray-900">{group.name}</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => setShowEditModal(true)} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-800 text-sm font-semibold inline-flex items-center gap-2">
                                    <Edit3 size={16}/> Tahrirlash
                              </button>
                              <button type="button" onClick={() => setShowEditModal(true)} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-800 text-sm font-semibold inline-flex items-center gap-2">
                                    <Plus size={16}/> O'qituvchi qo'shish
                              </button>
                              <button type="button" onClick={() => setShowStudentModal(true)} className="h-11 px-5 rounded-xl border border-[#dfe4ef] bg-white text-gray-800 text-sm font-semibold inline-flex items-center gap-2">
                                    <Plus size={16}/> O'quvchi qo'shish
                              </button>
                              <button type="button" onClick={archiveGroup} className="w-11 h-11 rounded-xl bg-red-500 text-white inline-flex items-center justify-center disabled:opacity-70" disabled={saving}>
                                    <Trash2 size={18}/>
                              </button>
                        </div>
                  </div>

                  {error && (<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                              {error}
                        </div>)}

                  <div className="grid grid-cols-1 xl:grid-cols-[340px,1fr] gap-4">
                        <aside className="space-y-3">
                              <SidebarSection title="Ma'lumotlar" open={openSections.info} onToggle={() => toggleSection('info')}>
                                    <div className="space-y-3 text-sm">
                                          <div>
                                                <p className="text-gray-500">Kurs</p>
                                                <p className="font-medium text-gray-800">{group.course?.name || '--'}</p>
                                          </div>
                                          <div>
                                                <p className="text-gray-500">Boshlanish</p>
                                                <p className="font-medium text-gray-800">{formatDate(group.startDate)}</p>
                                          </div>
                                          <div>
                                                <p className="text-gray-500">Dars vaqti</p>
                                                <p className="font-medium text-gray-800">{group.startTime || '--:--'} ({formatDays(group.weekDays)})</p>
                                          </div>
                                          <div>
                                                <p className="text-gray-500">Xona</p>
                                                <p className="font-medium text-gray-800">{group.room?.name || '--'}</p>
                                          </div>
                                    </div>
                              </SidebarSection>

                              <SidebarSection title="O'qituvchilar" open={openSections.teacher} onToggle={() => toggleSection('teacher')}>
                                    <div className="rounded-xl border border-[#e6ebf6] bg-white px-3 py-2">
                                          <p className="text-sm font-semibold text-gray-900">{group.teacher?.fullName || "O'qituvchi yo'q"}</p>
                                          <p className="text-xs text-gray-500 mt-1">{group.teacher?.email || '--'}</p>
                                    </div>
                              </SidebarSection>

                              <SidebarSection title="Talabalar" open={openSections.students} onToggle={() => toggleSection('students')}>
                                    <div className="space-y-2 max-h-107.5 overflow-auto pr-1">
                                          {group.studentGroup?.length > 0 ? (group.studentGroup.map((membership) => (<div key={membership.id} className="rounded-xl border border-[#e6ebf6] bg-white px-3 py-2 flex items-center justify-between">
                                                            <div>
                                                                  <p className="text-sm font-semibold text-gray-900">{membership.student?.fullName || '--'}</p>
                                                                  <p className="text-xs text-gray-500">{membership.student?.email || '--'}</p>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                  <span className="text-xs text-emerald-600 font-semibold">Faol</span>
                                                                  <button type="button" onClick={() => removeStudentFromGroup(membership.studentId, membership.student?.fullName)} disabled={studentRemovingId === Number(membership.studentId)} title="Talabani guruhdan chiqarish" className="w-8 h-8 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 inline-flex items-center justify-center disabled:opacity-60">
                                                                        {studentRemovingId === Number(membership.studentId)
                ? <Loader2 size={14} className="animate-spin"/>
                : <X size={14}/>}
                                                                  </button>
                                                            </div>
                                                      </div>))) : (<p className="text-sm text-gray-400">Hozircha talaba biriktirilmagan</p>)}
                                    </div>
                              </SidebarSection>
                        </aside>

                        <section className="bg-white rounded-2xl border border-[#e6ebf6] overflow-hidden">
                              <div className="px-4 py-3 border-b border-[#e9edf5] flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                          <button type="button" onClick={() => setActiveTab('attendance')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${activeTab === 'attendance' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500 bg-[#f5f7fd]'}`}>
                                                Davomat
                                          </button>
                                          <button type="button" onClick={() => setActiveTab('coin')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${activeTab === 'coin' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500 bg-[#f5f7fd]'}`}>
                                                Coin
                                          </button>
                                          <button type="button" onClick={() => setActiveTab('history')} className={`h-9 px-4 rounded-xl text-sm font-semibold ${activeTab === 'history' ? 'bg-white border border-[#dfe4ef] text-gray-800' : 'text-gray-500 bg-[#f5f7fd]'}`}>
                                                Tarix
                                          </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                          {(activeTab === 'attendance' || activeTab === 'history') && (<>
                                                      <button type="button" onClick={() => activeTab === 'attendance' ? exportAttendance('csv') : exportHistory('csv')} className="h-10 px-3 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold inline-flex items-center gap-2">
                                                            <Download size={15}/> CSV
                                                      </button>
                                                      <button type="button" onClick={() => activeTab === 'attendance' ? exportAttendance('excel') : exportHistory('excel')} className="h-10 px-3 rounded-xl border border-[#dfe4ef] bg-white text-gray-700 text-sm font-semibold inline-flex items-center gap-2">
                                                            <Download size={15}/> Excel
                                                      </button>
                                                </>)}

                                          <button type="button" onClick={() => {
            loadGroup();
            loadAttendance(attendanceColumns.map((column) => column.key));
        }} className="w-10 h-10 rounded-xl border border-[#dfe4ef] bg-white text-gray-500 flex items-center justify-center" title="Yangilash">
                                                <RefreshCcw size={16}/>
                                          </button>
                                    </div>
                              </div>

                              {activeTab === 'attendance' && (<div className="p-4">
                                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                      <input type="date" value={toDateKey(focusDate)} onChange={(event) => updateFocusDate(event.target.value)} className="h-9 px-3 rounded-xl border border-[#dfe4ef] bg-white text-sm text-gray-700"/>
                                                      <button type="button" onClick={() => setFocusDate(new Date())} className="h-9 px-3 rounded-xl border border-[#dfe4ef] bg-white text-sm font-semibold text-gray-700">
                                                            Bugun
                                                      </button>
                                                </div>

                                                <div className="flex items-center justify-end gap-1">
                                                      <button type="button" onClick={() => setFocusDate((prev) => addMonths(prev, -1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                            <ChevronsLeft size={16}/>
                                                      </button>
                                                      <button type="button" onClick={() => setFocusDate((prev) => addDays(prev, -7))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                            <ChevronLeft size={16}/>
                                                      </button>
                                                      <p className="w-44 text-center text-xl font-semibold text-gray-700 capitalize">{monthLabel}</p>
                                                      <button type="button" onClick={() => setFocusDate((prev) => addDays(prev, 7))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                            <ChevronRight size={16}/>
                                                      </button>
                                                      <button type="button" onClick={() => setFocusDate((prev) => addMonths(prev, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                            <ChevronsRight size={16}/>
                                                      </button>
                                                </div>
                                          </div>

                                          <div className="overflow-x-auto">
                                                <table className="w-full min-w-190">
                                                      <thead>
                                                            <tr className="border border-[#e9edf5] bg-[#fafbff]">
                                                                  <th className="text-left py-3 px-4 text-xl font-semibold text-gray-700 border-r border-[#e9edf5]">Nomi</th>
                                                                  {attendanceColumns.map((column) => (<th key={column.key} className="text-center py-2 px-3 text-sm font-semibold text-gray-600 border-r last:border-r-0 border-[#e9edf5]">
                                                                              <p>{column.dayLabel}</p>
                                                                              <p className="text-xl text-gray-700 mt-1">{column.dayNumber}</p>
                                                                              <button type="button" onClick={() => resetAttendance(column.key)} disabled={attendanceResetKey === `${column.key}:reset` || attendanceLoading} className="mt-1 mx-auto w-6 h-6 rounded-md text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center disabled:opacity-60" title="Shu sana davomatini reset qilish">
                                                                                    {attendanceResetKey === `${column.key}:reset`
                    ? <Loader2 size={13} className="animate-spin"/>
                    : <RefreshCcw size={13}/>}
                                                                              </button>
                                                                        </th>))}
                                                            </tr>
                                                      </thead>
                                                      <tbody>
                                                            {groupStudents.length > 0 ? (groupStudents.map((student) => (<tr key={student.id} className="border-b border-x border-[#eef2f8]">
                                                                              <td className="py-3 px-4">
                                                                                    <div className="flex items-center gap-3">
                                                                                          <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 inline-flex items-center justify-center font-semibold text-sm">
                                                                                                {String(student.fullName || 'S').charAt(0).toUpperCase()}
                                                                                          </div>
                                                                                          <div>
                                                                                                <p className="text-[28px] leading-tight font-medium text-[#27314f]">{student.fullName}</p>
                                                                                                <p className="text-sm text-gray-500">Active</p>
                                                                                          </div>
                                                                                    </div>
                                                                              </td>

                                                                              {attendanceColumns.map((column, columnIndex) => {
                    const row = attendanceLookup[column.key]?.get(Number(student.id));
                    const status = row?.isPresent;
                    const requestKey = `${column.key}:${student.id}`;
                    const isBusy = attendanceSavingKey === requestKey;
                    const resetKey = `${column.key}:${student.id}:reset`;
                    const isFreeze = String(student.status || '').toUpperCase() === 'FREEZE';
                    return (<td key={`${student.id}-${column.key}`} className="py-3 px-3 border-l border-[#eef2f8]">
                                                                                                {attendanceLoading && !row ? (<div className="flex justify-center">
                                                                                                            <div className="w-16 h-8 rounded-full bg-gray-100 animate-pulse"/>
                                                                                                      </div>) : isBusy || attendanceResetKey === resetKey ? (<div className="flex justify-center">
                                                                                                            <Loader2 size={18} className="animate-spin text-violet-500"/>
                                                                                                      </div>) : isFreeze ? (<div className="flex justify-center">
                                                                                                            <div className="h-11 min-w-24 px-4 rounded-full border border-[#b9d6ff] bg-[#e8f2ff] text-[#4a8ed8] inline-flex items-center justify-center">
                                                                                                                  <Snowflake size={16}/>
                                                                                                            </div>
                                                                                                      </div>) : columnIndex === 0 ? (<div className="flex justify-center">
                                                                                                            <div className="h-11 rounded-full border border-[#d8deeb] overflow-hidden inline-flex">
                                                                                                                  <button type="button" onClick={() => setAttendance(student.id, column.key, true)} className={`w-12 h-full inline-flex items-center justify-center transition ${status === true ? 'bg-[#c9f0ea] text-[#10b29f]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                                                                                                                        <Check size={18}/>
                                                                                                                  </button>
                                                                                                                  <button type="button" onClick={() => setAttendance(student.id, column.key, false)} className={`w-12 h-full inline-flex items-center justify-center border-l border-[#d8deeb] transition ${status === false ? 'bg-[#ffe0e3] text-[#ef4444]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                                                                                                                        <X size={18}/>
                                                                                                                  </button>
                                                                                                            </div>
                                                                                                      </div>) : (<div className="flex items-center justify-center gap-1">
                                                                                                            <button type="button" onClick={() => {
                                if (status === true) {
                                    setAttendance(student.id, column.key, false);
                                    return;
                                }
                                setAttendance(student.id, column.key, true);
                            }} className={`h-11 min-w-24 px-4 rounded-full text-base font-semibold border inline-flex items-center justify-center gap-2 ${status === true
                                ? 'bg-[#14b8a6] border-[#14b8a6] text-white'
                                : status === false
                                    ? 'bg-[#ff384c] border-[#ff384c] text-white'
                                    : 'bg-white border-[#d8deeb] text-gray-300'}`}>
                                                                                                                  {status === true && <Check size={16}/>}
                                                                                                                  {status === false && <X size={16}/>}
                                                                                                                  {status === true ? 'Bor' : status === false ? "Yo'q" : ''}
                                                                                                            </button>

                                                                                                            {status !== null && (<button type="button" onClick={() => resetAttendance(column.key, student.id)} disabled={attendanceResetKey === resetKey} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 inline-flex items-center justify-center disabled:opacity-60" title="Bitta qator davomatini reset qilish">
                                                                                                                        <RefreshCcw size={14}/>
                                                                                                                  </button>)}
                                                                                                      </div>)}
                                                                                          </td>);
                })}
                                                                        </tr>))) : (<tr>
                                                                        <td colSpan={1 + attendanceColumns.length} className="py-16 text-center text-sm text-gray-400 border border-[#eef2f8]">
                                                                              Guruhda talabalar yo'q
                                                                        </td>
                                                                  </tr>)}
                                                      </tbody>
                                                </table>
                                          </div>
                                    </div>)}

                              {activeTab === 'coin' && (<div className="p-4">
                                          <div className="flex items-center justify-end gap-1 mb-3">
                                                <button type="button" onClick={() => setFocusDate((prev) => addMonths(prev, -1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                      <ChevronsLeft size={16}/>
                                                </button>
                                                <button type="button" onClick={() => setFocusDate((prev) => addDays(prev, -7))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                      <ChevronLeft size={16}/>
                                                </button>
                                                <p className="w-44 text-center text-xl font-semibold text-gray-700 capitalize">{monthLabel}</p>
                                                <button type="button" onClick={() => setFocusDate((prev) => addDays(prev, 7))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                      <ChevronRight size={16}/>
                                                </button>
                                                <button type="button" onClick={() => setFocusDate((prev) => addMonths(prev, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex items-center justify-center">
                                                      <ChevronsRight size={16}/>
                                                </button>
                                          </div>

                                          <div className="overflow-x-auto">
                                                <table className="w-full min-w-190">
                                                      <thead>
                                                            <tr className="border border-[#e9edf5] bg-[#fafbff]">
                                                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500 uppercase border-r border-[#e9edf5]">Nomi</th>
                                                                  {attendanceColumns.map((column) => (<th key={column.key} className="text-center py-2 px-3 text-sm font-semibold text-gray-600 border-r last:border-r-0 border-[#e9edf5]">
                                                                              <p>{column.dayLabel}</p>
                                                                              <p className="text-xl text-gray-700 mt-1">{column.dayNumber}</p>
                                                                        </th>))}
                                                            </tr>
                                                      </thead>

                                                      <tbody>
                                                            {groupStudents.map((student) => (<tr key={`coin-${student.id}`} className="border-b border-x border-[#eef2f8]">
                                                                        <td className="py-3 px-4 border-r border-[#eef2f8]">
                                                                              <div className="flex items-center gap-3">
                                                                                    <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 inline-flex items-center justify-center font-semibold text-sm">
                                                                                          {String(student.fullName || 'S').charAt(0).toUpperCase()}
                                                                                    </div>
                                                                                    <div>
                                                                                          <p className="text-3xl leading-tight font-medium text-[#27314f]">{student.fullName}</p>
                                                                                          <p className="text-sm text-gray-500">Active</p>
                                                                                    </div>
                                                                              </div>
                                                                        </td>

                                                                        {attendanceColumns.map((column) => {
                    const status = attendanceLookup[column.key]?.get(Number(student.id))?.isPresent;
                    const value = status === true ? 10 : status === false ? 0 : '-';
                    return (<td key={`coin-${student.id}-${column.key}`} className="py-3 px-3 text-center border-l border-[#eef2f8]">
                                                                                          <span className={`text-2xl ${value === '-' ? 'text-gray-300' : 'text-[#b8bfce]'}`}>{value}</span>
                                                                                    </td>);
                })}
                                                                  </tr>))}
                                                      </tbody>
                                                </table>
                                          </div>

                                          <div className="mt-4 rounded-xl border border-[#e7ecf6] bg-[#fafbff] px-4 py-3 inline-flex items-center gap-3">
                                                <Coins size={17} className="text-violet-500"/>
                                                <p className="text-sm text-gray-600">Jami coin:</p>
                                                <p className="text-lg font-semibold text-gray-800">{coinSummary.earned}</p>
                                          </div>
                                    </div>)}

                              {activeTab === 'history' && (<div className="p-4">
                                          <div className="rounded-2xl border border-[#e7ecf6] overflow-hidden">
                                                <div className="px-4 py-3 bg-[#fafbff] border-b border-[#e7ecf6] text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                                                      <History size={16} className="text-violet-500"/> O'zgarishlar tarixi
                                                </div>

                                                <div className="divide-y divide-[#f1f4fa]">
                                                      {activityHistory.length > 0 ? activityHistory.map((item) => (<div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                                                                  <div>
                                                                        <p className="text-sm font-medium text-gray-800">{item.text}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(item.date)}</p>
                                                                  </div>
                                                                  <CalendarDays size={16} className="text-gray-300 shrink-0"/>
                                                            </div>)) : (<p className="px-4 py-8 text-sm text-gray-400 text-center">Tarix bo'sh</p>)}
                                                </div>
                                          </div>
                                    </div>)}
                        </section>
                  </div>

                  {showEditModal && (<div className="fixed inset-0 z-50 flex items-center justify-center">
                              <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)}/>

                              <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                                    <div className="flex items-center justify-between mb-5">
                                          <h3 className="text-lg font-bold text-gray-900">Guruhni tahrirlash</h3>
                                          <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                                <X size={20}/>
                                          </button>
                                    </div>

                                    <div className="space-y-4">
                                          <Inp label="Guruh nomi" value={form.name} onChange={(value) => setForm({ ...form, name: value })}/>
                                          <Sel label="O'qituvchi" value={form.teacherId} onChange={(value) => setForm({ ...form, teacherId: value })} options={teachers.map((teacher) => ({ value: String(teacher.id), label: teacher.fullName }))}/>
                                          <Sel label="Kurs" value={form.courseId} onChange={(value) => setForm({ ...form, courseId: value })} options={courses.map((course) => ({ value: String(course.id), label: course.name }))}/>
                                          <Sel label="Xona" value={form.roomId} onChange={(value) => setForm({ ...form, roomId: value })} options={rooms.map((room) => ({ value: String(room.id), label: `${room.name} (${room.capacity} o'rin)` }))}/>
                                          <Inp label="Boshlanish sanasi" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} type="date"/>
                                          <Inp label="Boshlanish vaqti" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} type="time"/>

                                          <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Hafta kunlari</label>
                                                <div className="flex flex-wrap gap-2">
                                                      {DAYS.map((day) => (<button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-2 rounded-xl text-xs font-medium transition ${form.weekDays.includes(day) ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                                  {DAY_SHORT[day]}
                                                            </button>))}
                                                </div>
                                          </div>

                                          <button type="button" disabled={saving} onClick={saveGroup} className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition disabled:opacity-70">
                                                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                                          </button>
                                    </div>
                              </div>
                        </div>)}

                  {showStudentModal && (<div className="fixed inset-0 z-50 flex items-center justify-center">
                              <div className="absolute inset-0 bg-black/40" onClick={() => setShowStudentModal(false)}/>

                              <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                                    <div className="flex items-center justify-between mb-5">
                                          <h3 className="text-lg font-bold text-gray-900">Talaba qo'shish</h3>
                                          <button type="button" onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                                                <X size={20}/>
                                          </button>
                                    </div>

                                    <Inp label="Talaba qidirish" value={studentSearch} onChange={setStudentSearch} placeholder="Ism yoki email"/>

                                    <Sel label="Talaba" value={studentId} onChange={setStudentId} options={filteredStudents.map((student) => ({
                value: String(student.id),
                label: `${student.fullName} (${student.email})`,
            }))}/>

                                    {filteredStudents.length === 0 && (<p className="mt-2 text-xs text-gray-400">Qo'shish mumkin bo'lgan talaba topilmadi</p>)}

                                    <button type="button" disabled={saving || !studentId} onClick={addStudent} className="w-full mt-4 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition disabled:opacity-70 inline-flex items-center justify-center gap-2">
                                          <UserPlus size={16}/>
                                          {saving ? "Qo'shilmoqda..." : "Qo'shish"}
                                    </button>
                              </div>
                        </div>)}
            </div>);
}
function Inp({ label, value, onChange, type = 'text', placeholder }) {
    return (<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"/>
            </div>);
}
function Sel({ label, value, onChange, options }) {
    return (<div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition">
                        <option value="">Tanlang...</option>
                        {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                  </select>
            </div>);
}
