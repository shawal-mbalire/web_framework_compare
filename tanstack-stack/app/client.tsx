import { StartClient } from '@tanstack/start';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { router } from './router';
import './styles/global.css';

const rootElement = document.getElementById('root')!;

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <StartClient router={router} />);
} else {
  createRoot(rootElement).render(<StartClient router={router} />);
}
