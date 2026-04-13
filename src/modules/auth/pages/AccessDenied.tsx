import { motion } from 'framer-motion';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLocation } from 'wouter';

export function AccessDenied() {
  const { deniedEmail, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleBackToLogin = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute -top-[400px] -right-[300px] w-[700px] h-[700px] rounded-full bg-red-500/6 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-[300px] -left-[200px] w-[500px] h-[500px] rounded-full bg-orange-500/4 blur-[120px] pointer-events-none" />

      <motion.div
        className="glass rounded-xl p-10 w-full max-w-sm text-center relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Shield icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-foreground mb-2">
          Acesso Negado
        </h1>

        <p className="text-foreground-muted text-sm mb-2 leading-relaxed">
          O sistema é restrito à equipe autorizada da Lidtek.
        </p>

        {deniedEmail && (
          <p className="text-foreground-muted/60 text-xs mb-6 font-mono bg-surface-raised px-3 py-1.5 rounded-lg inline-block">
            {deniedEmail}
          </p>
        )}

        {!deniedEmail && <div className="mb-6" />}

        <p className="text-foreground-muted/50 text-xs mb-6 leading-relaxed">
          Se você deveria ter acesso, entre em contato com o administrador do sistema para ser adicionado como membro.
        </p>

        <button
          onClick={handleBackToLogin}
          className="w-full py-2.5 rounded-lg bg-surface-raised border border-border text-foreground font-medium text-sm hover:bg-surface-raised/80 active:scale-[0.98] transition-all"
        >
          ← Voltar ao Login
        </button>

        <p className="text-foreground-muted/30 text-[10px] mt-6">
          Lidtek CRM — Sistema de Gestão de Projetos
        </p>
      </motion.div>
    </div>
  );
}
