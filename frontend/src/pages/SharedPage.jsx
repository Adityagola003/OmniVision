import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../auth";

const SharedPage = () => {
  const { token } = useParams();
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/share/${token}`)
      .then(response => {
        if (!response.ok) throw new Error("This share link is unavailable.");
        return response.json();
      })
      .then(setPhoto)
      .catch(error => setError(error.message));
  }, [token]);

  if (error) return <div className="container page-shell"><div className="alert alert-warning">{error}</div></div>;
  if (!photo) return <div className="container page-shell text-center"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="container page-shell">
      <div className="shared-photo-card">
        <span className="eyebrow">Shared from OmniVision</span>
        <h1>{photo.title}</h1>
        <img src={photo.url} alt={photo.title} className="shared-photo" />
        <div className="d-flex justify-content-between align-items-center gap-3 mt-4">
          <p className="mb-0 text-muted">{photo.caption || "A shared photo"}</p>
          <span className="badge bg-primary">{photo.category}</span>
        </div>
      </div>
    </div>
  );
};

export default SharedPage;
