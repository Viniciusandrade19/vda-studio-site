/**
 * Dados oficiais da LíderPrev usados no site (Instagram @liderprevpb e WhatsApp Business).
 * Para alterar contato ou textos de benefício, edite somente este arquivo.
 */
export const SITE = {
  name: 'LíderPrev',
  fullName: 'LíderPrev — Proteção Veicular',
  city: 'Campina Grande',
  state: 'PB',
  /** Número como cadastrado no WhatsApp Business (+55 83 9930-2606). */
  whatsappNumber: '558399302606' as string,
  phoneDisplay: '(83) 99930-2606',
  phoneHref: 'tel:+5583999302606',
  instagramHandle: '@liderprevpb',
  instagramUrl: 'https://www.instagram.com/liderprevpb/',
  studio: {
    name: 'VDA Studio',
    url: 'https://www.instagram.com/vda_studio7/',
  },
} as const;

export type VehicleKind = 'carro' | 'moto' | 'caminhao' | 'utilitario';

export const VEHICLE_LABEL: Record<VehicleKind, { label: string; article: string }> = {
  carro: { label: 'carro', article: 'meu' },
  moto: { label: 'moto', article: 'minha' },
  caminhao: { label: 'caminhão', article: 'meu' },
  utilitario: { label: 'utilitário', article: 'meu' },
};

/** Mensagens pré-preenchidas por contexto — o atendente já sabe de onde a pessoa veio. */
export const WA_MESSAGES = {
  geral: 'Olá, LíderPrev! Vim pelo site e gostaria de conhecer a proteção veicular.',
  especialista: 'Olá, LíderPrev! Vim pelo site e gostaria de falar com um especialista sobre proteção veicular.',
  assistencia: 'Olá, LíderPrev! Vim pelo site e preciso falar sobre a assistência 24 horas.',
  cobertura: 'Olá, LíderPrev! Vim pelo site e gostaria de entender a abrangência nacional da proteção.',
  vehicle: (kind: VehicleKind) => {
    const v = VEHICLE_LABEL[kind];
    return `Olá, LíderPrev! Vim pelo site e quero proteger ${v.article} ${v.label}. Pode me ajudar?`;
  },
};

export const waLink = (message: string = WA_MESSAGES.geral) =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const NAV_ITEMS = [
  { id: 'beneficios', label: 'Benefícios' },
  { id: 'solucoes', label: 'Coberturas' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'assistencia', label: 'Diferenciais' },
  { id: 'duvidas', label: 'Dúvidas' },
] as const;
