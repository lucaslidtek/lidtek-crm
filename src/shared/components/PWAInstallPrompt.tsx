import { usePWAInstall } from '@/shared/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'crm-pwa-prompt-seen';

export function PWAInstallPrompt() {
  const { isInstallable, install, dismiss } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; }
    catch { return false; }
  });

  if (!isInstallable || isDismissed) return null;

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    await install();
    markSeen();
  };

  const handleDismiss = () => {
    markSeen();
    dismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[min(420px,calc(100vw-2rem))]"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111118]/95 backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Gradient accent top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="p-4 flex items-center gap-4">
            {/* App icon */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
              <img
                src="/pwa-192x192.png"
                alt="CRM"
                className="w-10 h-10 object-contain"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">
                Instalar CRM
              </p>
              <p className="text-xs text-white/50 mt-0.5 leading-tight">
                Acesse o app direto da sua tela inicial
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white bg-primary hover:brightness-110 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>

              <button
                onClick={handleDismiss}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
