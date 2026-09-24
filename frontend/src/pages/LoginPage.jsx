import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, saveAuth } from "../auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async event => {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to sign in.");
    saveAuth(data);
    navigate("/gallery");
  };

  return (
  <div className="container mt-5">
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body p-5">
            <h3 className="text-center mb-4">Welcome Back</h3>
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input type="email" required className="form-control" placeholder="name@example.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" required className="form-control" placeholder="Enter your password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
              </div>
              <div className="d-grid mt-4">
                <button type="submit" className="btn btn-primary">Sign In</button>
              </div>
            </form>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="text-center mt-3">
              <p className="small text-muted">
                Don't have an account? <Link to="/signup">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default LoginPage;
