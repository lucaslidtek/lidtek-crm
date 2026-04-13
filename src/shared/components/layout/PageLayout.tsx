import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, useSidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useLocation } from 'wouter';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { collapsed } = useSidebar();
  const isMobile = useIsMobile();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 hidden md:block">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-blue-light/5 blur-[120px]" />
      </div>

      {/* Sidebar apenas em desktop */}
      <Sidebar />

      <motion.main
        className="relative z-10 min-h-screen flex flex-col"
        animate={{ marginLeft: isMobile ? 0 : (collapsed ? 72 : 256) }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <TopBar />

        {/* Page content with subtle transition */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Bottom Navigation apenas em mobile */}
      <BottomNavigation />
    </div>
  );
}

