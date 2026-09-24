import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import GalleryPage from "./pages/GalleryPage";
import UploadPage from "./pages/UploadPage";
import SharedPage from "./pages/SharedPage";
import { API_BASE, clearAuth, getToken, getUser, authHeaders } from "./auth";

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getUser());

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const updateAuth = () => setUser(getUser());
    window.addEventListener("authchange", updateAuth);
    return () => window.removeEventListener("authchange", updateAuth);
  }, []);

  const handleLogout = async () => {
    if (getToken()) {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: authHeaders() }).catch(() => {});
    }
    clearAuth();
    closeMenu();
  };

  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top">
          <div className="container">
            <Link className="navbar-brand" to="/" onClick={closeMenu}>
              <i className="bi bi-camera-fill me-2"></i>IntelliVision
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(open => !open)}
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className={`navbar-collapse ${menuOpen ? "show" : ""}`} id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><Link className="nav-link" to="/" onClick={closeMenu}>Home</Link></li>
                {user && <li className="nav-item"><Link className="nav-link" to="/gallery" onClick={closeMenu}>Gallery</Link></li>}
                {user && <li className="nav-item"><Link className="nav-link" to="/upload" onClick={closeMenu}>Upload</Link></li>}
                {user ? (
                  <li className="nav-item ms-lg-3"><button className="btn btn-outline-primary btn-sm" onClick={handleLogout}>Log out</button></li>
                ) : (
                  <><li className="nav-item ms-lg-3"><Link className="btn btn-outline-primary btn-sm me-2" to="/login" onClick={closeMenu}>Login</Link></li><li className="nav-item"><Link className="btn btn-primary btn-sm" to="/signup" onClick={closeMenu}>Sign Up</Link></li></>
                )}
              </ul>
            </div>
          </div>
        </nav>

        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/share/:token" element={<SharedPage />} />
          </Routes>
        </main>

        <footer className="footer text-center">
          <div className="container">
            <p className="mb-0">&copy; 2026 IntelliVision. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
