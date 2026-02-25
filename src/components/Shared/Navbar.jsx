import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't show navbar on landing page if not logged in
  if (!user && location.pathname === '/') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          Business Card Maker
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                My Cards
              </Link>
              <Link
                to="/editor"
                className={`nav-link ${location.pathname === '/editor' ? 'active' : ''}`}
              >
                Create New
              </Link>
              <div className="navbar-divider"></div>
              <div className="user-info">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="user-avatar"
                />
                <span className="user-name">{user.displayName}</span>
              </div>
              <button onClick={handleLogout} className="nav-button logout">
                Logout
              </button>
            </>
          ) : (
            <Link to="/" className="nav-button primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
