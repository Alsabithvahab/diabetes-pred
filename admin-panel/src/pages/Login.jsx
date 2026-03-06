import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
            if (res.data.user.isAdmin) {
                loginUser(res.data.user, res.data.token);
                // Save to admin-specific local storage in context handled this, but ensuring persistence
                navigate('/dashboard');
            } else {
                setError('Access denied: You are not an administrator.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <h1 className="auth-title">
                    <span className="highlight">Admin</span> <span className="faded">Login</span>
                </h1>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="styled-input"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Password</label>
                        <div className="input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="styled-input"
                                placeholder="••••••••"
                                required
                            />
                            <span
                                className="toggle-icon"
                                onClick={() => {
                                    console.log('Toggling password visibility to:', !showPassword);
                                    setShowPassword(!showPassword);
                                }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
