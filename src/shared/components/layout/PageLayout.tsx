import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, useSidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNavigation } from './BottomNavigation';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { collapsed } = useSidebar();

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
        className="relative z-10 min-h-screen flex flex-col md:ml-0"
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        style={{
          // Forçamos a margem a ser 0 via custom media styles (o Tailwind classes tem menor prioridade que o inline style do Framer)
          marginLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : undefined
        }}
      >
        <TopBar />

        {/* Padding inferior para contornar a BottomNavigation apenas em celular */}
        <div className="flex-1 p-4 md:p-6 pb-28 md:pb-6">
          {children}
        </div>
      </motion.main>

      {/* Bottom Navigation apenas em mobile */}
      <BottomNavigation />
    </div>
  );
}
