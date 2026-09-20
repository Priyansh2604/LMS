import "./Header.css";
import { memo, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";

function Header({ theme, setTheme }) {
  const [user, setUser] = useState(() => getStoredUser());
  const navigate = useNavigate();

  useEffect(() => {
    function refreshUser() {
      setUser(getStoredUser());
    }

    window.addEventListener("storage", refreshUser);
    window.addEventListener("learnly-auth-change", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("learnly-auth-change", refreshUser);
    };
  }, []);

  function toggleTheme() {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }

  function handleLogout() {
    localStorage.removeItem("learnlyUser");
    window.dispatchEvent(new Event("learnly-auth-change"));
    navigate("/");
  }

  return (
   
    <header className="site-header">
      <div className="header-nav">
        <Link className="brand-mark" to="/" aria-label="Learnly home">
          <span className="brand-icon">L</span><span>Learnly</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-link active"><Link to="/">Home</Link></span>
          <span className="nav-link"><Link to="/AboutPage">About</Link></span>
          <span className="nav-link"><Link to="/AboutTopics">Topics</Link></span>
          <span className="nav-link"><Link to="/CoursesPage">Courses</Link></span>
          {user?.role === "instructor" && (
            <span className="nav-link"><Link to="/InstructorAdmin">Instructor</Link></span>
          )}
          <span className="nav-link"><Link to="/QuizPage">Take quiz</Link></span>
        </nav>
        <div className="header-actions">
          <LanguageSelector />
          <button
            type="button"
            className={`theme-toggle-btn ${theme === "light" ? "light-mode" : "dark-mode"}`}
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            <span className="toggle-track">
              <span className="toggle-thumb">
                <span className="toggle-icon">{theme === "light" ? "☀️" : "🌙"}</span>
              </span>
            </span>
          </button>
          {user ? (
            <div className="account-menu">
              <Link className="account-profile" to="/Account" aria-label={`${user.name}'s account`}>
                <span className="account-avatar">{getInitial(user.name)}</span>
                <span className="account-name">{user.name}</span>
              </Link>
              <button className="logout-btn" type="button" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <Link to="/Login" className="login-btn" aria-label="Log in to your account">
              <span className="account-icon" aria-hidden="true"><span /></span>
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

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

function getInitial(name = "") {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export default memo(Header);
