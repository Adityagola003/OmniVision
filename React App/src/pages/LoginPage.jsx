import { Link } from "react-router-dom";

const LoginPage = () => (
  <div className="container mt-5">
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body p-5">
            <h3 className="text-center mb-4">Welcome Back</h3>
            <form>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input type="email" className="form-control" placeholder="name@example.com" />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="Enter your password" />
              </div>
              <div className="d-grid mt-4">
                <button type="submit" className="btn btn-primary">Sign In</button>
              </div>
            </form>
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

export default LoginPage;
