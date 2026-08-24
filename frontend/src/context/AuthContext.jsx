import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = 'http://localhost:8000';

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                await fetchUser(token);
            } else {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const fetchUser = async (token) => {
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('access_token');
                setUser(null);
            }
        } catch (err) {
            console.error("Failed to fetch user", err);
            localStorage.removeItem('access_token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            await fetchUser(data.access_token);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const register = async (name, email, password) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            // Immediately log in after successful registration
            return await login(email, password);
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        sessionStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, setError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
