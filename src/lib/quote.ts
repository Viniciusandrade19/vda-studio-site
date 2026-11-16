import type { VehicleKind } from '../config/site';

export const QUOTE_EVENT = 'liderprev:quote';

/** Leva a pessoa até o formulário de cotação, já com o tipo de veículo escolhido. */
export function openQuote(kind?: VehicleKind) {
  window.dispatchEvent(new CustomEvent(QUOTE_EVENT, { detail: { kind } }));
  const el = document.getElementById('cotacao');
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  window.setTimeout(() => document.getElementById('q-nome')?.focus({ preventScroll: true }), reduced ? 0 : 700);
}
