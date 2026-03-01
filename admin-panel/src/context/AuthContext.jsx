import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('admin_user')) || null);
    const [token, setToken] = useState(localStorage.getItem('admin_token') || null);

    const loginUser = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        localStorage.setItem('admin_token', userToken);
    };

    const logoutUser = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loginUser,
            logoutUser,
            isAuthenticated: !!token,
            isAdmin: user?.isAdmin || false
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
