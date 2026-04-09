import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, useSidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-blue-light/5 blur-[120px]" />
      </div>

      <Sidebar />

      <motion.main
        className="relative z-10 min-h-screen flex flex-col"
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <TopBar />

        <div className="flex-1 p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
