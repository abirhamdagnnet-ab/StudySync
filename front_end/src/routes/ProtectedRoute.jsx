import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { Spinner } from "../components/ui/index.js";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Spinner size={28} label="Checking your session" /></div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children ?? <Outlet />;
}

export default ProtectedRoute;