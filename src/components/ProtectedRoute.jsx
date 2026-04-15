import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { isRoleAllowed } from '../utils/roles.js';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
