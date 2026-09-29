import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import ForbiddenPage from "../pages/public/ForbiddenPage.jsx";

function RoleRoute({ role, roles, children }) {
  const { user } = useAuth();
  const allowedRoles = roles ?? [role];

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <ForbiddenPage />;
  return children ?? <Outlet />;
}

export default RoleRoute;
