import { useState, useEffect } from "react";

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/gallery");
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-5 fw-bold">Your Image Gallery</h2>
      
      {images.length === 0 ? (
        <p className="text-center text-muted">No images found. Go upload some!</p>
      ) : (
        <div className="row g-4">
          {images.map((img) => (
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
                    
                    {/* View Button Triggers Popup */}
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSelectedImage(img)}
                    >
                      <i className="bi bi-eye me-1"></i> View
                    </button>

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