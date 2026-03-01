import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { isAuthenticated, logoutUser, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (location.pathname === '/login') {
        return null;
    }

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <nav className="navbar" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}>A</div>
                <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>DiabetesAI <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Admin</span></div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {isAuthenticated && (
                    <>
                        <NavLink
                            to="/dashboard"
                            style={({ isActive }) => ({
                                color: isActive ? 'var(--primary)' : 'var(--text-dark)',
                                textDecoration: 'none',
                                fontWeight: isActive ? '700' : '500',
                                fontSize: '0.95rem'
                            })}
                        >
                            Analytics Dashboard
                        </NavLink>
                        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Administrator</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
}
