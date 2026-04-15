import { motion } from 'framer-motion';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLocation } from 'wouter';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/shared/utils/cn';

const IMAGERY = [
  '/branding/imagery/nick-levish-8CaGRlLvmKw-unsplash.jpg',
  '/branding/imagery/pawel-czerwinski-KOlJcVU0JW0-unsplash.jpg',
  '/branding/imagery/pawel-czerwinski-TLzxYiyXw1o-unsplash.jpg',
  '/branding/imagery/pawel-czerwinski-uA6x_MXI_fE-unsplash.jpg',
  '/branding/imagery/rohit-choudhari-sC2Twgvu3lg-unsplash - Copia.jpg',
  '/branding/imagery/trophim-laptev-WRaMq1fJWdg-unsplash.jpg'
];

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loginPending, setLoginPending] = useState(false);

  // Sorteia uma imagem de branding por sessão
  const selectedImage = useMemo(() => IMAGERY[Math.floor(Math.random() * IMAGERY.length)], []);

  const handleLogin = () => {
    setLoginPending(true);
    login();
  };

  useEffect(() => {
    if (isAuthenticated) setLocation('/');
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      
      {/* 
        =========================================================
        LEFT COLUMN (HERO) - Visible only on Desktop
        =========================================================
      */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden bg-zinc-950 border-r border-border">
        {/* Layer 1: The Image (Grayscale base) */}
        <img 
          src={selectedImage}
          alt="Lidtek Branding" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
        />
        {/* Layer 2: Brand Color Tint Overlay */}
        <div className="absolute inset-0 bg-primary/30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-color" />
        {/* Layer 3: Vignette / Fade to bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
        
        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 p-16 mt-auto text-white"
        >
           <img 
             src="/branding/icon.svg" 
             className="w-14 h-14 mb-8 filter brightness-0 invert opacity-90" 
             alt="Lidtek Logo" 
           />
           <h2 className="font-[family-name:var(--font-display)] text-[2.75rem] font-bold tracking-tight mb-4 leading-[1.15]">
             Otimize sua visão<br/><span className="text-primary-light">estratégica.</span>
           </h2>
           <p className="text-white/70 text-lg max-w-md font-light leading-relaxed">
             A plataforma central de operações da Lidtek. Gestão de excelência dos nossos clientes e projetos, preparando o terreno para o futuro Portal do Cliente.
           </p>
        </motion.div>
      </div>

      {/* 
        =========================================================
        RIGHT COLUMN (AUTH) - Full width on Mobile, 45% on Desktop
        =========================================================
      */}
      <div className="w-full lg:w-[45%] flex items-center justify-center relative p-6 sm:p-12 z-20">
        
        {/* Mobile Background — Full bleed image like the desktop hero */}
        <div className="absolute inset-0 block lg:hidden bg-zinc-950 overflow-hidden">
          <img src={selectedImage} className="w-full h-full object-cover opacity-70 mix-blend-luminosity scale-105" />
          {/* Brand color tint — same recipe as desktop */}
          <div className="absolute inset-0 bg-primary/25 mix-blend-overlay" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-color" />
          {/* Vignette for card readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        </div>

        <motion.div
          className={cn(
            "w-full max-w-[380px] text-center relative z-10",
            // Mobile: Dark frosted glass over the hero image
            "p-8 sm:p-10 rounded-2xl",
            "bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30",
            // Desktop: Clean transparent panel (inherits bg-background from parent)
            "lg:bg-background lg:backdrop-blur-none lg:border-transparent lg:shadow-none lg:rounded-none lg:p-0"
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo — inverted white on mobile, normal on desktop */}
          <div className="flex justify-center mb-6 lg:mb-8 lg:hidden">
            <img src="/branding/icon.svg" alt="Lidtek" className="w-14 h-14 filter brightness-0 invert" />
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-[1.65rem] font-bold tracking-tight text-white lg:text-foreground mb-1.5">
            Lidtek CRM
          </h1>
          <p className="text-white/60 lg:text-foreground-muted text-sm mb-8 lg:mb-10">
            Acesse seu espaço de trabalho
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleLogin}
            disabled={loginPending || isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-primary text-white font-medium text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] hover:bg-primary/95 active:scale-[0.98] transition-all duration-300 cursor-pointer border border-primary/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 press-scale"
          >
            {loginPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-background/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando...
              </>
            ) : (
              <>
                {/* Minimalist Google Icon variant */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="currentColor"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="currentColor"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="currentColor"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="currentColor"/>
                </svg>
                Continuar com Google
              </>
            )}
          </button>

          <p className="text-white/30 lg:text-foreground-muted/40 text-[10px] mt-8 lg:mt-12 uppercase tracking-widest font-semibold">
            Acesso Restrito
          </p>
        </motion.div>
      </div>
    </div>
  );
}
