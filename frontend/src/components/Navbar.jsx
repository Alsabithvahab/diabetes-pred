import React from 'react';
import { NavLink } from 'react-router-dom';
export default function Navbar() {
    return (
        <nav className="navbar">
            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>DiabetesAI</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <NavLink to="/" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'inherit', textDecoration: 'none' })}>Home</NavLink>
                <NavLink to="/dashboard" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'inherit', textDecoration: 'none' })}>Dashboard</NavLink>
            </div>
        </nav>
    );
}
