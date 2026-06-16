import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            {/* Global reactive toast notification component container hook */}
            <Toaster 
                position="top-right" 
                toastOptions={{
                    className: 'dark:bg-zinc-900 dark:text-white bg-white text-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium shadow-xl',
                    duration: 4000,
                }} 
            />
            <App />
        </AuthProvider>
    </React.StrictMode>,
)