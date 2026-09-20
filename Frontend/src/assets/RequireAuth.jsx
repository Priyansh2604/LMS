import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("learnlyUser");
    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);
    return parsedUser && typeof parsedUser === "object" ? parsedUser : null;
  } catch {
    return null;
  }
}

function RequireAuth({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncUser = () => setCurrentUser(getStoredUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener("learnly-auth-change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("learnly-auth-change", syncUser);
    };
  }, []);

  const isAuthenticated = Boolean(currentUser?.id || currentUser?.email);

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default RequireAuth;