import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Access Denied</h1>
            <p>You do not have administrator privileges.</p>
        </div>;
    }

    return children;
};

export default AdminRoute;
