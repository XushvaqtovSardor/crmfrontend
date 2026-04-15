import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

const Login = lazy(() => import('./components/Login.jsx'));
const Unauthorized = lazy(() => import('./components/Unauthorized.jsx'));
const SuperAdminDashboard = lazy(() => import('./components/dashboard/SuperAdminDashboard.jsx'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard.jsx'));
const TeacherDashboard = lazy(() => import('./components/dashboard/TeacherDashboard.jsx'));
const StudentDashboard = lazy(() => import('./components/dashboard/StudentDashboard.jsx'));
const TeachersPage = lazy(() => import('./components/TeachersPage.jsx'));
const TeacherDetailsPage = lazy(() => import('./components/TeacherDetailsPage.jsx'));
const StudentsPage = lazy(() => import('./components/StudentsPage.jsx'));
const StudentDetailsPage = lazy(() => import('./components/StudentDetailsPage.jsx'));
const GroupsPage = lazy(() => import('./components/GroupsPage.jsx'));
const GroupDetailsPage = lazy(() => import('./components/GroupDetailsPage.jsx'));
const CoursesPage = lazy(() => import('./components/CoursesPage.jsx'));
const RoomsPage = lazy(() => import('./components/RoomsPage.jsx'));
const FinancePage = lazy(() => import('./components/FinancePage.jsx'));
const HomeworksPage = lazy(() => import('./components/HomeworksPage.jsx'));
const ProgressPage = lazy(() => import('./components/ProgressPage.jsx'));
const SettingsPage = lazy(() => import('./components/SettingsPage.jsx'));
const MyGroupsPage = lazy(() => import('./components/MyGroupsPage.jsx'));
const LessonsPage = lazy(() => import('./components/LessonsPage.jsx'));
const TeacherFinancePage = lazy(() => import('./components/TeacherFinancePage.jsx'));
const StudentVideosPage = lazy(() => import('./components/StudentVideosPage.jsx'));
import { getDefaultRouteByRole, normalizeRole, STAFF_ROLES } from './utils/roles.js';

const STAFF_ALLOWED_ROLES = [...STAFF_ROLES];

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      Sahifa yuklanmoqda...
    </div>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  if (!user) return <Navigate to="/login" />;
  switch (role) {
    case 'SUPERADMIN': return <SuperAdminDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    case 'MANAGEMENT': return <AdminDashboard />;
    case 'ADMINSTRATOR': return <AdminDashboard />;
    case 'TEACHER': return <TeacherDashboard />;
    case 'STUDENT': return <StudentDashboard />;
    default: return <Navigate to="/unauthorized" />;
  }
}

function AuthenticatedLayout({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginGuard mode="login" />} />
            <Route path="/register" element={<LoginGuard mode="register" />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/dashboard" element={
              <AuthenticatedLayout>
                <DashboardRouter />
              </AuthenticatedLayout>
            } />

            <Route path="/teachers" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <TeachersPage />
              </AuthenticatedLayout>
            } />
            <Route path="/teachers/:id" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <TeacherDetailsPage />
              </AuthenticatedLayout>
            } />
            <Route path="/students" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <StudentsPage />
              </AuthenticatedLayout>
            } />
            <Route path="/students/:id" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <StudentDetailsPage />
              </AuthenticatedLayout>
            } />
            <Route path="/groups" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <GroupsPage />
              </AuthenticatedLayout>
            } />
            <Route path="/groups/:id" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <GroupDetailsPage />
              </AuthenticatedLayout>
            } />
            <Route path="/courses" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <CoursesPage />
              </AuthenticatedLayout>
            } />
            <Route path="/gifts" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <CoursesPage />
              </AuthenticatedLayout>
            } />
            <Route path="/rooms" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <RoomsPage />
              </AuthenticatedLayout>
            } />
            <Route path="/finance" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <FinancePage />
              </AuthenticatedLayout>
            } />
            <Route path="/finance/:tab" element={
              <AuthenticatedLayout allowedRoles={STAFF_ALLOWED_ROLES}>
                <FinancePage />
              </AuthenticatedLayout>
            } />

            <Route path="/lessons" element={
              <AuthenticatedLayout allowedRoles={['TEACHER']}>
                <LessonsPage />
              </AuthenticatedLayout>
            } />

            <Route path="/my-groups" element={
              <AuthenticatedLayout allowedRoles={['TEACHER', 'STUDENT']}>
                <MyGroupsPage />
              </AuthenticatedLayout>
            } />

            <Route path="/my-finance" element={
              <AuthenticatedLayout allowedRoles={['TEACHER']}>
                <TeacherFinancePage />
              </AuthenticatedLayout>
            } />

            <Route path="/videos" element={
              <AuthenticatedLayout allowedRoles={['STUDENT']}>
                <StudentVideosPage />
              </AuthenticatedLayout>
            } />

            <Route path="/homeworks" element={
              <AuthenticatedLayout allowedRoles={['TEACHER', 'STUDENT']}>
                <HomeworksPage />
              </AuthenticatedLayout>
            } />
            <Route path="/progress" element={
              <AuthenticatedLayout allowedRoles={['STUDENT']}>
                <ProgressPage />
              </AuthenticatedLayout>
            } />
            <Route path="/settings" element={
              <AuthenticatedLayout>
                <SettingsPage />
              </AuthenticatedLayout>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginGuard({ mode = 'login' }) {
  const { user } = useAuth();
  if (user) return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  return <Login initialMode={mode} />;
}

export default App;
