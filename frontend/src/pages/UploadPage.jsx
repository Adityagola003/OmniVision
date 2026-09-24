import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, authHeaders, getToken } from "../auth";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [comparisonPosition, setComparisonPosition] = useState(50);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Pointing to Django Backend
      const response = await fetch(`${API_BASE}/process-images`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const data = await response.json();
      setResult(data.data);
      setComparisonPosition(50);

    } catch (err) {
      console.error(err);
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              {!getToken() && <div className="alert alert-info">Please <Link to="/login">sign in</Link> before uploading photos.</div>}
              <h3 className="text-center mb-4">Upload Your Photo</h3>

              {/* Upload Input */}
              <div className="upload-area mb-4 position-relative border rounded p-5 text-center bg-light">
                <input
                  type="file"
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                  style={{ cursor: "pointer" }}
                  accept="image/*"
                  onChange={e => setFile(e.target.files[0])}
                />
                <div>
                  <i className="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                  <h5 className="mt-2">{file ? file.name : "Click to Upload"}</h5>
                  <p className="text-muted small">Supports JPG, PNG</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="d-grid">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleUpload}
                  disabled={!file || loading || !getToken()}
                >
                  {loading ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Processing...</span>
                  ) : "Process Image"}
                </button>
              </div>

              {/* Error Message */}
              {error && <div className="alert alert-danger mt-3">{error}</div>}

              {/* Results Display */}
              {result && (
                <div className="mt-4 p-3 border rounded bg-light">
                  <h5 className="text-success text-center mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>Processing Complete!
                  </h5>
                  
                  {result.processed_url ? (
                    <div className="comparison-wrap">
                      <div className="comparison-frame">
                        <img src={result.processed_url} alt="Enhanced" className="comparison-image" />
                        <div
                          className="comparison-original"
                          style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                        >
                          <img src={result.image_url} alt="Original" className="comparison-image" />
                        </div>
                        <div className="comparison-divider" style={{ left: `${comparisonPosition}%` }} aria-hidden="true" />
                        <span className="comparison-label comparison-label-original">Original</span>
                        <span className="comparison-label comparison-label-enhanced">Enhanced</span>
                        <input
                          className="comparison-overlay-control"
                          type="range"
                          min="0"
                          max="100"
                          value={comparisonPosition}
                          onChange={event => setComparisonPosition(Number(event.target.value))}
                          aria-label="Drag comparison slider across image"
                        />
                      </div>
                      <p className="comparison-hint mb-0">Drag the handle across the image to compare</p>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center border rounded bg-warning text-white p-4">
                      <div className="text-center">
                        <i className="bi bi-exclamation-triangle fs-3 mb-2"></i>
                        <p className="mb-0 small">Enhancement failed. Showing original.</p>
                        <img src={result.image_url} alt="Original" className="img-fluid rounded border mt-3" />
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <span className="badge bg-info text-dark me-2">{result.category}</span>
                    <p className="mt-2 text-muted fst-italic">"{result.caption}"</p>
                  </div>
                  
                  <div className="text-center mt-3">
                    <Link to="/gallery" className="btn btn-outline-primary btn-sm">
                        View in Gallery
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;