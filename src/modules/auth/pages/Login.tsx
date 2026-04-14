import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLocation, useSearch } from 'wouter';
import { useEffect, useState } from 'react';

export function Login() {
  const { login, loginWithPassword, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [loginPending, setLoginPending] = useState(false);

  // Email/password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation('/');
  }, [isAuthenticated, setLocation]);

  const handleLogin = () => {
    setLoginPending(true);
    login();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setEmailError(null);
    setEmailLoading(true);
    const { error } = await loginWithPassword(email.trim(), password);
    if (error) {
      setEmailError(error);
      setEmailLoading(false);
    }
    // On success, the onAuthStateChange in AuthProvider handles navigation
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4 sm:px-0">
      {/* Decorative glows */}
      <div className="absolute -top-[400px] -right-[300px] w-[700px] h-[700px] rounded-full bg-primary/6 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-[300px] -left-[200px] w-[500px] h-[500px] rounded-full bg-blue-light/4 blur-[120px] pointer-events-none" />

      <motion.div
        className="glass rounded-xl p-8 sm:p-10 w-full max-w-sm text-center relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/branding/icon.svg"
            alt="Lidtek"
            className="w-14 h-14"
          />
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground mb-1">
          Lidtek CRM
        </h1>
        <p className="text-foreground-muted text-sm mb-6">
          Sistema de Gestão de Projetos
        </p>



        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3 mb-5">
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
          <input
            id="login-password"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
          {emailError && (
            <p className="text-xs text-red-500 text-left">{emailError}</p>
          )}
          <button
            id="login-submit"
            type="submit"
            disabled={emailLoading || !email.trim() || !password.trim()}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed press-scale"
          >
            {emailLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-foreground-muted/50 uppercase tracking-widest">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleLogin}
          disabled={loginPending || isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg bg-white dark:bg-white text-gray-800 font-medium text-sm shadow-sm hover:shadow-lg hover:shadow-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer border border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 press-scale"
        >
          {loginPending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecionando...
            </>
          ) : (
            <>
              {/* Google Icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        <p className="text-foreground-muted/40 text-[10px] mt-6">
          Acesso restrito à equipe Lidtek
        </p>
      </motion.div>
    </div>
  );
}
