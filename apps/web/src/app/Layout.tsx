import type { ReactNode } from 'react';
import { NightSky } from '@cq-talk/ui';
import type { SkyGlow } from '@cq-talk/ui';
import { Footer } from './Footer';

interface LayoutProps {
  glow: SkyGlow;
  children?: ReactNode;
}

/** Page shell from the prototype: the night sky behind a centered 1080 px column and the footer. */
export const Layout = ({ glow, children }: LayoutProps) => (
  <div className="relative box-border flex min-h-screen flex-col items-center overflow-hidden bg-night px-4 pt-10 pb-8 font-body text-night-text">
    <NightSky glow={glow} />
    <div className="relative flex w-full max-w-[1080px] flex-1 flex-col items-center gap-6">
      <main className="flex w-full flex-col items-center gap-6">{children}</main>
      <Footer />
    </div>
  </div>
);
