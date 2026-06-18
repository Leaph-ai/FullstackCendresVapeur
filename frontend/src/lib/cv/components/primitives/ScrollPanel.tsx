import type { ReactNode } from 'react';
import { PanelAnchors, PanelRig } from './PanelRig';

interface ScrollPanelProps {
  id: string;
  animated?: boolean;
  locked?: boolean;
  clanking?: boolean;
  className?: string;
  children: ReactNode;
}

export function ScrollPanel({
  id,
  animated = true,
  locked = false,
  clanking = false,
  className = '',
  children,
}: ScrollPanelProps) {
  const classes = [
    'panel',
    animated ? 'panel--animated' : '',
    locked ? 'locked' : '',
    clanking ? 'clank' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} id={id}>
      {animated && id !== 'accueil' && <PanelRig />}
      {children}
      {animated && <PanelAnchors />}
    </section>
  );
}

interface PanelHeadProps {
  sector: string;
  title: string;
  lamp?: 'default' | 'amber';
  right?: ReactNode;
}

export function PanelHead({ sector, title, lamp = 'default', right }: PanelHeadProps) {
  return (
    <div className="panel-head">
      <span className={`lamp${lamp === 'amber' ? ' amber' : ''}`} />
      <span className="panel-sect">{sector}</span>
      <h2 className="panel-title">{title}</h2>
      {right && <span className="right">{right}</span>}
    </div>
  );
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <div className="panel-body">{children}</div>;
}
