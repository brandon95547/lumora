import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './app.css';

// A deploy that removed a chunk this open page still asks for: reload once instead of breaking.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('lumora:reloaded')) return;
  sessionStorage.setItem('lumora:reloaded', '1');
  location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
