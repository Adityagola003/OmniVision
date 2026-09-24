import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE, authHeaders, clearAuth, getToken } from "../auth";

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [search, setSearch] = useState('');
  const [shareMessage, setShareMessage] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(!getToken());

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    if (!getToken()) {
      setRequiresAuth(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/gallery`, { headers: authHeaders() });
      if (response.status === 401) {
        clearAuth();
        setRequiresAuth(true);
        setImages([]);
        return;
      }
      if (!response.ok) throw new Error("Unable to load gallery.");
      const data = await response.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}/`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok || res.status === 204) {
        setImages(prev => prev.filter(x => x.id !== id));
        if (selectedImage && selectedImage.id === id) setSelectedImage(null);
      } else {
        console.error('Failed to delete image', await res.text());
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const shareImage = async image => {
    const response = await fetch(`${API_BASE}/gallery/${image.id}/share`, { method: "POST", headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) return setShareMessage(data.error || "Unable to create share link.");
    const link = `${window.location.origin}/share/${data.share_token}`;
    await navigator.clipboard.writeText(link);
    setImages(prev => prev.map(item => item.id === image.id ? { ...item, is_shared: true } : item));
    setShareMessage("Share link copied to clipboard.");
  };

  const revokeShare = async image => {
    const response = await fetch(`${API_BASE}/gallery/${image.id}/share`, { method: "DELETE", headers: authHeaders() });
    if (response.ok || response.status === 204) {
      setImages(prev => prev.map(item => item.id === image.id ? { ...item, is_shared: false } : item));
      setShareMessage("Share link revoked.");
    }
  };

  const q = search.trim().toLowerCase();
  const filteredImages = q
    ? images.filter(img => {
        const title = (img.title || '').toLowerCase();
        const caption = (img.caption || '').toLowerCase();
        const category = (img.category || '').toLowerCase();
        const date = (img.date || '').toLowerCase();
        return title.includes(q) || caption.includes(q) || category.includes(q) || date.includes(q);
      })
    : images;

  if (loading) {
    return (
        <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );
  }

  if (requiresAuth) {
    return (
      <div className="container page-shell">
        <div className="empty-state text-center">
          <i className="bi bi-lock-fill empty-state-icon"></i>
          <span className="eyebrow">Private gallery</span>
          <h2>Sign in to view your photos</h2>
          <p className="text-muted">Your gallery is private and only available to your account.</p>
          <Link className="btn btn-primary mt-3" to="/login">Sign in to continue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-5 fw-bold">Your Image Gallery</h2>
      {shareMessage && <div className="alert alert-success text-center">{shareMessage}</div>}
      <div className="row mb-4">
        <div className="col-md-6 offset-md-3">
          <div className="input-group">
            <input
              type="search"
              className="form-control"
              placeholder="Search by title, caption or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      
      {images.length === 0 ? (
        <p className="text-center text-muted">No images found. Go upload some!</p>
      ) : filteredImages.length === 0 ? (
        <p className="text-center text-muted">No results for "{search}"</p>
      ) : (
        <div className="row g-4">
          {filteredImages.map((img) => (
            <div key={img.id} className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="position-relative">
                    <img 
                    src={img.url} 
                    className="card-img-top" 
                    alt={img.title} 
                    style={{ height: "250px", objectFit: "cover", cursor: "pointer" }}
                    onClick={() => setSelectedImage(img)} // Click image to open
                    />
                    <span className="position-absolute top-0 end-0 badge bg-primary m-2">
                        {img.category}
                    </span>
                </div>
                
                <div className="card-body">
                  <h6 className="card-title text-truncate">{img.title}</h6>
                  <p className="card-text small text-muted mb-2">
                    {img.caption ? `"${img.caption}"` : "No caption generated."}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">{img.date}</small>
                    <div>
                      {/* View Button Triggers Popup */}
                      <button 
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => setSelectedImage(img)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </button>

                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => shareImage(img)}>
                        <i className="bi bi-link-45deg me-1"></i> Share
                      </button>
                      {img.is_shared && <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => revokeShare(img)}>Revoke</button>}

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={async (e) => { e.stopPropagation(); if (!confirm('Delete this image?')) return; await deleteImage(img.id); }}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- IMAGE VIEWER MODAL (POPUP) --- */}
      {selectedImage && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setSelectedImage(null)} // Click outside to close
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedImage.title}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>
              <div className="modal-body text-center p-0 bg-dark">
                <img 
                  src={selectedImage.url} 
                  className="img-fluid" 
                  alt={selectedImage.title}
                  style={{ maxHeight: '80vh' }} 
                />
              </div>
              {selectedImage.caption && (
                 <div className="modal-footer justify-content-center">
                    <p className="text-muted mb-0">{selectedImage.caption}</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;