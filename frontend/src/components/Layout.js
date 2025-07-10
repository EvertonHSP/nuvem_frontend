import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountMenu from './AccountMenu';
import './style/Layout.css'; 

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="nav-link">Home</Link>
        </div>
        <div className="nav-right">
          {!user ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          ) : (
            <>
              {location.pathname === '/' && <AccountMenu />}
              <button onClick={logout} className="logout-button">Logout</button>
            </>
          )}
        </div>
      </nav>
      <div className="content-container">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;