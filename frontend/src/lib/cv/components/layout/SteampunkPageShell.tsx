import type { ReactNode } from 'react';
import { FooterBoiler } from '../layout/FooterBoiler';
import { MachineRail } from '../layout/MachineRail';
import { SteamChimney } from '../layout/SteamChimney';
import { Topbar } from '../layout/Topbar';
import { useScrollRail } from '../../hooks/useScrollRail';
import { OverlayFx } from '../primitives/OverlayFx';

interface SteampunkPageShellProps {
  cartCount: number;
  activeSection?: string;
  children: ReactNode;
}

export function SteampunkPageShell({
  cartCount,
  activeSection,
  children,
}: SteampunkPageShellProps) {
  const railRef = useScrollRail();

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="home">
        <Topbar cartCount={cartCount} activeSection={activeSection} />
        <main className="home-main" id="contenu">{children}</main>
      </div>
      <FooterBoiler />
      <OverlayFx />
    </>
  );
}
