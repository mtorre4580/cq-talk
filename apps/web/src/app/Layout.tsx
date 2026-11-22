import { useState } from 'react';
import type { ReactNode } from 'react';
import { SettingsDialog } from '@cq-talk/settings';
import { NightSky } from '@cq-talk/ui';
import type { SkyGlow } from '@cq-talk/ui';
import { Footer } from './Footer';

interface LayoutProps {
  glow: SkyGlow;
  /**
   * The radio page: full width, the desk and the lamp light under the receiver, and room for the
   * split call. Other pages (QSL card, logbook) keep a centered 1080 px column.
   */
  wide?: boolean;
  children?: ReactNode;
}

/** Page shell: the night sky, the page content and the footer. */
export const Layout = ({ glow, wide = false, children }: LayoutProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />;

  if (wide) {
    return (
      <div className="cq-page relative min-h-screen overflow-hidden bg-night font-body text-night-text">
        <NightSky glow={glow} />
        <div aria-hidden="true" className="cq-desk" />
        <div aria-hidden="true" className="cq-lamp" />
        <div className="cq-stage">
          <main className="cq-main">{children}</main>
          <div className="cq-footer">
            <Footer onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
        {settings}
      </div>
    );
  }

  return (
    <div className="relative box-border flex min-h-screen flex-col items-center overflow-hidden bg-night px-4 pt-10 pb-8 font-body text-night-text">
      <NightSky glow={glow} />
      <div className="relative flex w-full max-w-[1080px] flex-1 flex-col items-center gap-6">
        <main className="flex w-full flex-col items-center gap-6">{children}</main>
        <Footer onOpenSettings={() => setSettingsOpen(true)} />
      </div>
      {settings}
    </div>
  );
};
