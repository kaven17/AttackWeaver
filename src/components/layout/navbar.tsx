'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LayoutDashboard, ShieldCheck, ShieldHalf, UploadCloud } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ingest', label: 'Ingest Logs', icon: UploadCloud },
    { href: '/logs', label: 'Logs', icon: ShieldCheck }
  ];

  useMotionValueEvent(scrollYProgress, 'change', (current) => {
    if (typeof current === 'number') {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (direction < 0) {
        // Scrolling up
        setVisible(true);
      } else {
        // Scrolling down
        setVisible(false);
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className="flex max-w-fit fixed top-4 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] px-4 py-2 items-center justify-center gap-2"
      >
        <Link href="/" className="flex items-center gap-2 pr-4 border-r border-border">
          <ShieldHalf className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">ThreatX</span>
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative dark:text-neutral-50 items-center flex gap-2 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500 px-3 py-1.5 rounded-full transition-colors',
                pathname === item.href && 'bg-neutral-100 dark:bg-neutral-800'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Avatar className="h-8 w-8">
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}