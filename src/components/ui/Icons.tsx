/* Ícones desenhados para o sistema visual da LíderPrev (traço fino, cantos vivos).
   Os glifos de WhatsApp e Instagram seguem as formas oficiais das marcas. */
type P = { className?: string; size?: number };

export const ArrowUpRight = ({ className, size = 16 }: P) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
);

export const ArrowDown = ({ className, size = 16 }: P) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
);

export const WhatsAppGlyph = ({ className, size = 18 }: P) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.45-9.43a9.4 9.4 0 0 1 9.43 9.44c0 5.2-4.24 9.44-9.44 9.44Zm8.03-17.47A11.3 11.3 0 0 0 12.04.7C5.78.7.69 5.79.69 12.04c0 2 .52 3.95 1.52 5.67L.6 23.3l5.72-1.5a11.3 11.3 0 0 0 5.72 1.46c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02Z"
    />
  </svg>
);

export const InstagramGlyph = ({ className, size = 18 }: P) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
  </svg>
);

export const PhoneGlyph = ({ className, size = 18 }: P) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.5 1.5 0 0 1-1.5 1.5C10.6 20.5 3.5 13.4 3.5 5A1.5 1.5 0 0 1 5 3.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

/** Marcador técnico: retícula de mira usada como "carimbo" de seção. */
export const Reticle = ({ className, size = 14 }: P) => (
  <svg className={className} width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1" />
    <path d="M7 0v4M7 10v4M0 7h4M10 7h4" stroke="currentColor" strokeWidth="1" />
  </svg>
);
