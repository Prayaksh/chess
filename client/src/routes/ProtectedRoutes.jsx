import { useAuth } from "../hooks/useAuth.jsx";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();
  console.log("ProtectedRoutes useAuth fetched user is - ", user);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("user null moving to login");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
