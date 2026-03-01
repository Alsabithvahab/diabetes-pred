import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { isAuthenticated, logoutUser, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Do not show navbar on login and signup pages
    if (location.pathname === '/login' || location.pathname === '/signup') {
        return null;
    }

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>DiabetesAI</div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <NavLink to="/" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'inherit', textDecoration: 'none' })}>Home</NavLink>
                {isAuthenticated ? (
                    <>
                        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Logout</button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" className="btn" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none', border: '1px solid var(--border)' }}>Login</NavLink>
                        <NavLink to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none' }}>Sign Up</NavLink>
                    </>
                )}
            </div>
        </nav>
    );
}
