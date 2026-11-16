/* Renderização no build (pré-renderização): gera o HTML completo da página para buscadores,
   prévias de link e quem abre o site antes do JavaScript carregar. */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

// eslint-disable-next-line react/only-export-components -- idem
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
// eslint-disable-next-line react/only-export-components -- arquivo de build, não participa do recarregamento rápido
export { SITE as SITE_INFO } from './config/site';
