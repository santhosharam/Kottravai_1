import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginModal: React.FC = () => {
    const { isLoginModalOpen, closeLoginModal, login, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLoginModalOpen) return null;

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 6) score++;
        if (pass.length >= 10) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        // Cap score at 4
        const finalScore = Math.min(4, Math.max(1, score - (pass.length < 8 ? 1 : 0)));

        switch (finalScore) {
            case 1: return { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-400', score: 1 };
            case 2: return { label: 'Fair', color: 'bg-yellow-400', textColor: 'text-yellow-400', score: 2 };
            case 3: return { label: 'Good', color: 'bg-blue-400', textColor: 'text-blue-400', score: 3 };
            case 4: return { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500', score: 4 };
            default: return { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-400', score: 1 };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isLogin) {
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);

            if (password.length < 8) {
                setError("Password must be at least 8 characters long.");
                return;
            }
            if (!hasNumber || !hasSpecial) {
                setError("Password must contain at least one number and one special character.");
                return;
            }
            if (getPasswordStrength(password).score < 3) {
                setError("Please choose a stronger password.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (isLogin) {
                const { error: loginError } = await login(email, password);
                if (loginError) {
                    setError(loginError.message);
                } else {
                    closeLoginModal();
                }
            } else {
                const { error: signUpError } = await signUp(email, password, name);
                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    // Supabase by default requires email confirmation
                    setError("Success! Please check your email for the confirmation link.");
                    // Optional: auto-login or switch to login state
                    // setIsLogin(true);
                }
            }
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputClick = () => {
        if (error) setError(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={closeLoginModal}
            ></div>

            <div className="relative bg-white w-full max-w-[450px] rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                {/* Header Image Part */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1610665518460-29c303350326?q=80&w=1000&auto=format&fit=crop"
                        alt="Artisan at work"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                        <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-wider">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </h2>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={closeLoginModal}
                        className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-black transition-colors z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Part */}
                <div className="p-8 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="relative animate-in slide-in-from-top-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        required={!isLogin}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={handleInputClick}
                                        className="w-full px-6 py-4 bg-[#F0F5FF] border-none rounded-2xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#b5128f]/20 outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={handleInputClick}
                                    className="w-full px-6 py-4 bg-[#F0F5FF] border-none rounded-2xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#b5128f]/20 outline-none transition-all"
                                />
                            </div>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={handleInputClick}
                                    className="w-full px-6 py-4 bg-[#F0F5FF] border-none rounded-2xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#b5128f]/20 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-1 fade-in duration-300">
                                    <p className="text-xs font-bold text-red-500 text-center uppercase tracking-tight">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Password Strength Indicator (Sign Up only) */}
                            {!isLogin && password.length > 0 && (
                                <div className="px-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="flex gap-1 h-1.5">
                                        {[1, 2, 3, 4].map((step) => {
                                            const strength = getPasswordStrength(password);
                                            return (
                                                <div
                                                    key={step}
                                                    className={`flex-1 rounded-full transition-all duration-500 ${step <= strength.score
                                                        ? strength.color
                                                        : 'bg-gray-100'
                                                        }`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${getPasswordStrength(password).textColor}`}>
                                        Password Strength: {getPasswordStrength(password).label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {isLogin && (
                            <div className="flex justify-start">
                                <button type="button" className="text-sm font-medium text-gray-400 hover:text-[#b5128f] transition-colors underline underline-offset-4">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 bg-black text-white font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#b5128f] transition-all transform active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>

                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError(null);
                                    }}
                                    className="text-[#b5128f] font-bold hover:underline"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
