import { Link } from "react-router-dom";

const HomePage = () => (
  <div>
    <div className="hero-section text-center">
      <div className="container">
        <h1 className="display-4 fw-bold mb-4">Transform Your Photos with IntelliVision</h1>
        <p className="lead mb-5 text-muted mx-auto" style={{ maxWidth: "700px" }}>
          The ultimate platform for organizing, enhancing, and sharing your visual memories. 
          Experience the power of AI-driven photo management.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link className="btn btn-primary btn-lg px-4 py-2" to="/upload">
            <i className="bi bi-cloud-upload me-2"></i>Get Started
          </Link>
          <Link className="btn btn-outline-secondary btn-lg px-4 py-2" to="/gallery">
            <i className="bi bi-images me-2"></i>View Gallery
          </Link>
        </div>
      </div>
    </div>

    <div className="container my-5">
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card h-100 text-center p-4">
            <div className="card-body">
              <i className="bi bi-magic fs-1 text-primary mb-3"></i>
              <h5 className="card-title">AI Enhancement</h5>
              <p className="card-text text-muted">
                Automatically enhance your photos with our cutting-edge AI algorithms.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 text-center p-4">
            <div className="card-body">
              <i className="bi bi-shield-lock fs-1 text-primary mb-3"></i>
              <h5 className="card-title">Secure Storage</h5>
              <p className="card-text text-muted">
                Your memories are safe with our enterprise-grade security and encryption.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 text-center p-4">
            <div className="card-body">
              <i className="bi bi-share fs-1 text-primary mb-3"></i>
              <h5 className="card-title">Easy Sharing</h5>
              <p className="card-text text-muted">
                Share your albums with friends and family with just a single click.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;
