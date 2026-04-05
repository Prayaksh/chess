import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/profile" replace />;
  }
  return children;
};

export default PublicRoute;
