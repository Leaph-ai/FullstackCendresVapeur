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
  /** Niveau de titre : 2 par défaut, 1 pour le titre principal d'une page. */
  headingLevel?: 1 | 2;
}

export function PanelHead({ sector, title, lamp = 'default', right, headingLevel = 2 }: PanelHeadProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="panel-head">
      <span className={`lamp${lamp === 'amber' ? ' amber' : ''}`} />
      <span className="panel-sect">{sector}</span>
      <Heading className="panel-title">{title}</Heading>
      {right && <span className="right">{right}</span>}
    </div>
  );
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <div className="panel-body">{children}</div>;
}
