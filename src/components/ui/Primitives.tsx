import type { CSSProperties, ReactNode, AnchorHTMLAttributes } from 'react';
import type { ImageSet } from '../../assets/images';
import { ArrowUpRight, WhatsAppGlyph } from './Icons';
import { waLink } from '../../config/site';

/* ── Picture: AVIF → WebP, com srcset e dimensões declaradas (sem salto de layout) ── */
type PictureProps = {
  img: ImageSet;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  style?: CSSProperties;
};

export function Picture({ img, alt, sizes, className, imgClassName, priority, style }: PictureProps) {
  return (
    <picture className={className} style={style}>
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={img.fallback}
        alt={alt}
        width={img.width}
        height={img.height}
        className={imgClassName}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
      />
    </picture>
  );
}

/* ── Eyebrow: rótulo técnico de seção ("01 — Proteção em movimento") ── */
export function Eyebrow({ index, children, tone = 'red' }: { index?: string; children: ReactNode; tone?: 'red' | 'blue' }) {
  return (
    <p className={`eyebrow eyebrow--${tone}`} data-reveal>
      {index && <span className="eyebrow__index">{index}</span>}
      <span className="eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/* ── Lines: cada linha sobe de dentro de uma máscara ao entrar na tela ── */
export function Lines({ lines, as: Tag = 'span', className }: { lines: ReactNode[]; as?: 'span' | 'div'; className?: string }) {
  return (
    <>
      {lines.map((line, i) => (
        <Tag key={i} className={`line ${className ?? ''}`} data-reveal style={{ '--d': `${i * 90}ms` } as CSSProperties}>
          <span className="line__inner">{line}</span>
        </Tag>
      ))}
    </>
  );
}

/* ── Botões ─────────────────────────────────────────────────────────── */
type BtnProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'solid' | 'ghost' | 'blue' | 'red';
  icon?: 'arrow' | 'whatsapp' | 'none';
  children: ReactNode;
};

export function Button({ variant = 'solid', icon = 'arrow', className, children, ...rest }: BtnProps) {
  const external = rest.href?.startsWith('http');
  return (
    <a
      className={`btn btn--${variant} ${className ?? ''}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      <span className="btn__label">
        <span className="btn__text">{children}</span>
        <span className="btn__text btn__text--clone" aria-hidden="true">
          {children}
        </span>
      </span>
      {icon !== 'none' && (
        <span className="btn__icon" aria-hidden="true">
          {icon === 'whatsapp' ? <WhatsAppGlyph size={16} /> : <ArrowUpRight size={14} />}
        </span>
      )}
      {external && <span className="sr-only"> (abre em nova aba)</span>}
    </a>
  );
}

export function WhatsAppButton({ message, children, variant = 'blue', className }: { message: string; children: ReactNode; variant?: BtnProps['variant']; className?: string }) {
  return (
    <Button href={waLink(message)} variant={variant} icon="whatsapp" className={className}>
      {children}
    </Button>
  );
}
