import { Link } from "react-router-dom";

const SignUpPage = () => (
  <div className="container mt-5">
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body p-5">
            <h3 className="text-center mb-4">Create Account</h3>
            <form>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" placeholder="John Doe" />
              </div>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input type="email" className="form-control" placeholder="name@example.com" />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="Create a password" />
              </div>
              <div className="d-grid mt-4">
                <button type="submit" className="btn btn-primary">Sign Up</button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p className="small text-muted">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SignUpPage;
