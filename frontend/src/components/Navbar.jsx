import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { isAuthenticated, logoutUser, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Do not show navbar on login and signup pages
    if (location.pathname === '/login' || location.pathname === '/signup') {
        return null;
    }

    const handleLogout = () => {
        logoutUser();
        setIsOpen(false);
        navigate('/login');
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="navbar">
            <Link to="/" onClick={closeMenu} className="navbar-brand" style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.25rem', textDecoration: 'none' }}>DiabetesAI</Link>

            <div className={`hamburger ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>

            <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
                <NavLink to="/" onClick={closeMenu} style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'inherit', textDecoration: 'none' })}>Home</NavLink>
                <NavLink to="/about" onClick={closeMenu} style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'inherit', textDecoration: 'none' })}>About</NavLink>
                {isAuthenticated ? (
                    <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Logout</button>
                ) : (
                    <div className="nav-auth-buttons">
                        <NavLink to="/login" onClick={closeMenu} className="btn" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none', border: '1px solid var(--border)' }}>Login</NavLink>
                        <NavLink to="/signup" onClick={closeMenu} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none' }}>Sign Up</NavLink>
                    </div>
                )}
            </div>
        </nav>
    );
}
