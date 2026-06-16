import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminGateScan from './pages/AdminGateScan';
import NotificationLedger from './pages/NotificationLedger';

const Home = React.lazy(() => import('./pages/Home'));
const EventDetail = React.lazy(() => import('./pages/EventDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = React.lazy(() => import('./pages/PaymentFailed'));

const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Terms = React.lazy(() => import('./pages/Terms'));

function RouteSkeletonLoader() {
    return (
        <div className="w-full min-h-screen p-6 space-y-6 bg-[#2B2621] animate-pulse pt-28">
            <div className="h-48 w-full bg-[#3D352E]/50 rounded-3xl border border-[#8C7A6B]/30" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-72 bg-[#3D352E]/50 rounded-2xl border border-[#8C7A6B]/30" />
                <div className="h-72 bg-[#3D352E]/50 rounded-2xl border border-[#8C7A6B]/30" />
                <div className="h-72 bg-[#3D352E]/50 rounded-2xl border border-[#8C7A6B]/30" />
            </div>
        </div>
    );
}

class UIErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary intercepted lifecycle failure:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#2B2621] text-center px-4 border border-[#8C7A6B]/30">
                    <h2 className="text-xl font-bold uppercase tracking-wider text-[#F4EFEA] mb-2">Something went wrong</h2>
                    <p className="text-[#F4EFEA]/70 text-xs mb-6 max-w-xs font-medium">An unhandled rendering exception occurred inside the application view tree.</p>
                    <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#F4EFEA] text-[#2B2621] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#F4EFEA]/80 transition-all shadow-xl">
                        Reload Application Space
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 bg-[#2B2621]">
            <div className="text-9xl font-black text-[#3D352E]/40 tracking-tighter animate-pulse select-none">404</div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-[#F4EFEA] mt-4 mb-2">Page Not Found</h2>
            <p className="text-[#F4EFEA]/70 mb-8 max-w-xs text-xs font-medium">The targeted configuration route matches no established screen endpoint.</p>
            <a href="/" className="px-5 py-3 bg-[#F4EFEA] text-[#2B2621] font-bold text-xs tracking-wider uppercase rounded-xl transition-all hover:bg-[#F4EFEA]/80 shadow-md">
                Return to Safety
            </a>
        </div>
    );
}

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    useEffect(() => {
        document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';

        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode((prev) => !prev);
    };

    return (
        <UIErrorBoundary>
            <Router>
                <div className="min-h-screen flex flex-col bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300 font-sans antialiased selection:bg-[#8C7A6B]/40 selection:text-[#F4EFEA]">
                    <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
                    <main className="flex-grow">
                        <Suspense fallback={<RouteSkeletonLoader />}>
                            <Routes>
                                <Route path="/"                   element={<Home />} />
                                <Route path="/events/:id"         element={<EventDetail />} />
                                <Route path="/login"              element={<Login />} />
                                <Route path="/register"           element={<Register />} />
                                <Route path="/dashboard"          element={<UserDashboard />} />
                                <Route path="/admin"              element={<AdminDashboard />} />
                                <Route path="/payment-success"    element={<PaymentSuccess />} />
                                <Route path="/payment-failed"     element={<PaymentFailed />} />
                                <Route path="/notifications"      element={<NotificationLedger />} />
                                <Route path="/admin/gate-scan"    element={<AdminGateScan />} />
                                
                                <Route path="/about"              element={<About />} />
                                <Route path="/contact"            element={<Contact />} />
                                <Route path="/terms"              element={<Terms />} />

                                <Route path="*"                   element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>
                </div>
            </Router>
        </UIErrorBoundary>
    );
}

export default App;