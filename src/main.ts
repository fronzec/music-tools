import App from './App.svelte';
import './app.css';

const target = document.getElementById('app')!;

try {
  new App({ target });
  console.log('[music-tools] App mounted');
} catch (err) {
  console.error('[music-tools] Failed to mount:', err);
  target.innerHTML = `<div style="padding:2rem;color:red;font-family:monospace">
    <h2>Startup Error</h2>
    <pre>${err instanceof Error ? err.message : String(err)}</pre>
  </div>`;
}
