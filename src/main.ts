import { mount } from 'svelte';
import App from './App.svelte';
// Studio skin typography — self-hosted, only the weights we use.
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './app.css';

const target = document.getElementById('app')!;
target.innerHTML = '';

function shouldEnableAnalytics(): boolean {
  return import.meta.env.PROD && import.meta.env.VITE_VERCEL_ENV === 'production';
}

try {
  mount(App, { target });
  console.log('[music-tools] App mounted');
} catch (err) {
  console.error('[music-tools] Failed to mount:', err);
  target.innerHTML = `<div style="padding:2rem;color:red;font-family:monospace">
    <h2>Startup Error</h2>
    <pre>${err instanceof Error ? err.message : String(err)}</pre>
  </div>`;
}

// Analytics is mounted AFTER and OUTSIDE the app's try/catch so a failure in the
// analytics SDK can never clobber a successfully mounted app. The dynamic import
// also keeps @vercel/analytics out of the bundle path except when the gate
// passes (production on Vercel only).
if (shouldEnableAnalytics()) {
  import('@vercel/analytics')
    .then(({ inject }) => inject())
    .catch((err) => console.error('[music-tools] Analytics failed to load:', err));
}
