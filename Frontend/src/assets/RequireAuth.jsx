import { Navigate, useLocation } from "react-router-dom";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("learnlyUser");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function RequireAuth({ children }) {
  const location = useLocation();
  const isAuthenticated = Boolean(getStoredUser());

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default RequireAuth;