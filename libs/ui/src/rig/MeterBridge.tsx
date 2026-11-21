import type { ReactNode } from 'react';

/** Row that holds the S meter and the dial; they stack on narrow screens. */
export const MeterBridge = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-stretch gap-4">{children}</div>
);
