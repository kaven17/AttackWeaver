'use client';

import { useLayoutEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { Hero } from '@/components/layout/hero';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Dynamic import with SSR disabled — Three.js Canvas must NEVER
// render on the server, and lazy-loading prevents it from being
// part of React's initial reconciliation tree.
const SceneBackground = dynamic(
  () => import('@/components/Scene-background').then(m => ({ default: m.SceneBackground })),
  { ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect (not useEffect!) — cleanup runs SYNCHRONOUSLY
  // before React touches the DOM. This is critical because GSAP
  // pin: true physically reparents nodes; if React tries to unmount
  // first, the nodes aren't where React expects → removeChild crash.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('.panel');
      const totalWidth = el.scrollWidth - window.innerWidth;

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          pin: true,
          scrub: 1,
          snap: 1 / (sections.length - 1),
          end: () => `+=${totalWidth}`,
        },
      });
    }, el);

    // ctx.revert() restores all pinned nodes to their original
    // positions BEFORE React's reconciler tries to remove them.
    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="fixed inset-0 -z-10">
  <SceneBackground />
</div>

      <div ref={containerRef} className="relative z-10 h-screen w-full overflow-hidden">
        <div className="flex h-full">

          <section className="panel w-screen h-screen flex-shrink-0">
            <Hero />
          </section>

          <section className="panel w-screen h-screen flex-shrink-0">
            <div className="w-full h-full bg-neutral-950/60 backdrop-blur-sm">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-y-auto">
                <DashboardPage />
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}