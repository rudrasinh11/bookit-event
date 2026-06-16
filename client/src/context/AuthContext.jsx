import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axios';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [liveNotification, setLiveNotification] = useState(null);

    // Main system initializer
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            setUser(parsedUser);
            // Connect to real-time pipelines if user session exists
            connectWebSocket();
        }
        setLoading(false);

        // Cleanup connection when component unmounts
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

// ⚡ Production-Grade Real-time Gateway Connector Engine
    const connectWebSocket = () => {
        try {
            const wsUrl = import.meta.env.VITE_WS_URL || 'https://bookit-event-backend.vercel.app';
            
            // 🛡️ SERVERLESS GUARD: Bypasses handshakes on Vercel to prevent 404 console loops
            if (wsUrl.includes('vercel.app')) {
                return;
            }

            const socketToken = localStorage.getItem('token');
            if (socket) socket.disconnect();

            const newSocket = io(wsUrl, {
                auth: { token: socketToken },
                transports: ['polling', 'websocket']
            });

            newSocket.on('connect', () => {
                console.log('Connected natively to Production Socket Cluster! 🎉');
                setSocket(newSocket);
            });

            newSocket.on('user_notification_alert', (incomingData) => {
                setLiveNotification(incomingData);
            });

            newSocket.on('disconnect', () => {
                setSocket(null);
            });

        } catch (err) {
            console.error('Failed to initialize connection pool:', err);
        }
    };

    // Helper function allowing your app components to broadcast data safely
    const emitWebSocketMessage = (eventName, payload = {}) => {
        if (socket && socket.connected) {
            socket.emit(eventName, payload);
        } else {
            console.warn('Cannot emit telemetry: Socket is currently offline or sleeping.');
        }
    };

    // Sets up automatic silent authorization refresh on initial load or interception
    const executeTokenRotation = async () => {
        try {
            const currentRefreshSignature = localStorage.getItem('refreshToken');
            if (!currentRefreshSignature) return logout();

            const { data } = await api.post('/auth/refresh-token', { refreshToken: currentRefreshSignature });
            
            localStorage.setItem('token', data.token);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.token;
        } catch (err) {
            console.error("Token rotation chain failed. Requesting user re-auth.");
            logout();
            return null;
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }

            // Re-trigger real-time setup with the fresh login token
            setTimeout(() => connectWebSocket(), 50);
            
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            throw error.response?.data?.message || 'Login credentials submission failed.';
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }

            setTimeout(() => connectWebSocket(), 50);
            
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification layer rejected input.';
        }
    };

    const logout = () => {
        if (socket) {
            socket.disconnect();
        }
        setUser(null);
        setSocket(null);
        setLiveNotification(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            register, 
            verifyOTP, 
            logout, 
            loading,
            executeTokenRotation,
            socketConnected: !!socket && socket.connected,
            emit: emitWebSocketMessage,
            liveNotification
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};