import { useEffect } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Motor de movimento do site — um único observer e um único loop de scroll para tudo:
 *
 *  [data-reveal]            → recebe .is-in ao entrar na tela (revelações de texto e imagem)
 *  [data-parallax="0.12"]   → desloca em Y conforme a posição na tela (fator pequeno = sutil)
 *  [data-progress]          → recebe a variável CSS --p (0 → 1) enquanto atravessa a tela
 *
 * Anima apenas transform/opacity/variáveis, e desliga parallax e progresso
 * quando o usuário prefere movimento reduzido.
 */
export function useScrollFx() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const root = document.documentElement;
    root.classList.add('fx-ready');

    // ── Revelações ────────────────────────────────────────────────
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    let io: IntersectionObserver | null = null;
    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-in'));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              io?.unobserve(e.target);
            }
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
      );
      revealEls.forEach((el) => io!.observe(el));
    }

    if (reduced) {
      document.querySelectorAll<HTMLElement>('[data-progress]').forEach((el) => el.style.setProperty('--p', '1'));
      return () => io?.disconnect();
    }

    // ── Parallax + progresso (só calcula o que está perto da tela) ──
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const progressEls = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
    const visible = new Set<HTMLElement>();
    let frame = 0;
    const vio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement)));
        onScroll();
      },
      { rootMargin: '20% 0px 20% 0px' },
    );
    [...parallaxEls, ...progressEls].forEach((el) => vio.observe(el));

    const smallScreen = window.matchMedia('(max-width: 767px)');

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      visible.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (el.dataset.parallax !== undefined) {
          const raw = el.dataset.parallax || '0.1';
          // "s0.2" = relativo à rolagem da página (usado no hero); "0.2" = relativo ao centro da tela
          const bySroll = raw.startsWith('s');
          const factor = parseFloat(bySroll ? raw.slice(1) : raw) * (smallScreen.matches ? 0.6 : 1);
          const offset = bySroll ? window.scrollY * factor : -(rect.top + rect.height / 2 - vh / 2) * factor;
          el.style.setProperty('--py', `${offset.toFixed(1)}px`);
        }
        if (el.dataset.progress !== undefined) {
          // 0 quando o topo do elemento entra pela base da tela, 1 quando o fim do elemento chega ao topo
          const mode = el.dataset.progress;
          const total = mode === 'sticky' ? rect.height - vh : rect.height + vh;
          const passed = mode === 'sticky' ? -rect.top : vh - rect.top;
          const p = Math.min(1, Math.max(0, passed / Math.max(1, total)));
          el.style.setProperty('--p', p.toFixed(4));
        }
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    // segunda passada depois que o observer populou o conjunto visível
    const t = window.setTimeout(onScroll, 60);

    return () => {
      io?.disconnect();
      vio.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
  }, []);
}
