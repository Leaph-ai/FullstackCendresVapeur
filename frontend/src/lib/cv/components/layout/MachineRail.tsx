import type { RefObject } from 'react';
import { CogSvg } from '../primitives/CogSvg';

interface MachineRailProps {
  railRef: RefObject<HTMLDivElement | null>;
}

export function MachineRail({ railRef }: MachineRailProps) {
  return (
    <div className="machine-rail" ref={railRef} aria-hidden="true">
      <div className="rail-chain" />
      <div className="rail-pulley rail-pulley-top" />
      <div className="rail-cog cog-main">
        <CogSvg />
      </div>
      <div className="rail-cog cog-aux">
        <CogSvg />
      </div>
      <div className="rail-pulley rail-pulley-idler" />
      <div className="rail-arm" />
      <div className="rail-plate">CV-MACHINE · ZF-12</div>
    </div>
  );
}
