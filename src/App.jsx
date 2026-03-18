import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import Unauthorized from './components/Unauthorized.jsx';
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard.jsx';
import AdminDashboard from './components/dashboard/AdminDashboard.jsx';
import TeacherDashboard from './components/dashboard/TeacherDashboard.jsx';
import StudentDashboard from './components/dashboard/StudentDashboard.jsx';
import TeachersPage from './components/TeachersPage.jsx';
import StudentsPage from './components/StudentsPage.jsx';
import GroupsPage from './components/GroupsPage.jsx';
import CoursesPage from './components/CoursesPage.jsx';
import RoomsPage from './components/RoomsPage.jsx';
import FinancePage from './components/FinancePage.jsx';
import HomeworksPage from './components/HomeworksPage.jsx';
import ProgressPage from './components/ProgressPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import MyGroupsPage from './components/MyGroupsPage.jsx';
import LessonsPage from './components/LessonsPage.jsx';

// Chooses dashboard component based on authenticated user role.
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case 'SUPERADMIN': return <SuperAdminDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    case 'TEACHER': return <TeacherDashboard />;
    case 'STUDENT': return <StudentDashboard />;
    default: return <Navigate to="/login" />;
  }
}

// Wraps every protected page with both auth guard and shared layout shell.
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
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Shared dashboard entry */}
          <Route path="/dashboard" element={
            <AuthenticatedLayout>
              <DashboardRouter />
            </AuthenticatedLayout>
          } />

          {/* Superadmin/Admin routes */}
          <Route path="/teachers" element={
            <AuthenticatedLayout allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <TeachersPage />
            </AuthenticatedLayout>
          } />
          <Route path="/students" element={
            <AuthenticatedLayout allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <StudentsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/groups" element={
            <AuthenticatedLayout allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <GroupsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/courses" element={
            <AuthenticatedLayout allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <CoursesPage />
            </AuthenticatedLayout>
          } />
          <Route path="/rooms" element={
            <AuthenticatedLayout allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <RoomsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/finance" element={
            <AuthenticatedLayout allowedRoles={['SUPERADMIN']}>
              <FinancePage />
            </AuthenticatedLayout>
          } />

          {/* Teacher-only routes */}
          <Route path="/lessons" element={
            <AuthenticatedLayout allowedRoles={['TEACHER']}>
              <LessonsPage />
            </AuthenticatedLayout>
          } />

          {/* Teacher + Student shared routes */}
          <Route path="/my-groups" element={
            <AuthenticatedLayout allowedRoles={['TEACHER', 'STUDENT']}>
              <MyGroupsPage />
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

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Prevents showing login page to already-authenticated users.
function LoginGuard() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default App;
