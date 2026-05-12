import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import GalleryPage from "./pages/GalleryPage";
import UploadPage from "./pages/UploadPage";

const App = () => {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <i className="bi bi-camera-fill me-2"></i>IntelliVision
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/gallery">Gallery</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/upload">Upload</Link></li>
                <li className="nav-item ms-lg-3"><Link className="btn btn-outline-primary btn-sm me-2" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="btn btn-primary btn-sm" to="/signup">Sign Up</Link></li>
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
          </Routes>
        </main>

        <footer className="footer text-center">
          <div className="container">
            <p className="mb-0">&copy; 2025 IntelliVision. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
