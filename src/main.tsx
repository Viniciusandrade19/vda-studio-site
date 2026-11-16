import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import '@fontsource-variable/archivo/wdth.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/v2.css';
import './styles/v3.css';

import App from './App';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// HTML já veio pré-renderizado do build: só "acorda" a página. Em desenvolvimento, renderiza do zero.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
