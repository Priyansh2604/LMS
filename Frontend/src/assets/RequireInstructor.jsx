import { Navigate, useLocation } from "react-router-dom";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("learnlyUser");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function RequireInstructor({ children }) {
  const location = useLocation();
  const currentUser = getStoredUser();

  if (!currentUser || currentUser.role !== "instructor") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default RequireInstructor;
