import { IMG } from '../assets/images';

/** Escudo oficial da LíderPrev + assinatura tipográfica. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`logo ${compact ? 'logo--compact' : ''}`}>
      <picture className="logo__shield">
        <source type="image/avif" srcSet={IMG.logo.avif} sizes="64px" />
        <img src={IMG.logo.fallback} srcSet={IMG.logo.webp} sizes="64px" alt="" width={64} height={44} />
      </picture>
      <span className="logo__type">
        <span className="logo__name">LíderPrev</span>
        {!compact && <span className="logo__tag">Proteção Veicular</span>}
      </span>
    </span>
  );
}
