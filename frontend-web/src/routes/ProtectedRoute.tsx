import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../features/auth/authSlice";

export default function ProtectedRoute() {
    const token = useSelector(selectToken);
    const { pathname } = useLocation();
    if (!token) return <Navigate to={`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`} replace />;
    return <Outlet />;
}