import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import App from '../../src/App.svelte';

describe('App routing integration', () => {
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    // Reset URL to root before each test so tests are isolated.
    history.replaceState({}, '', '/');
    unmount = undefined;
  });

  afterEach(() => {
    // Unmount App so the $effect cleanup removes the popstate listener.
    unmount?.();
    // Ensure URL is reset after each test.
    history.replaceState({}, '', '/');
  });

  describe('initial view seeded from pathname', () => {
    it('renders HomePage when pathname is /', () => {
      // pathname is already '/' from beforeEach
      const result = render(App);
      unmount = result.unmount;
      // HomePage renders the "Music Tools" heading
      expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    });

    it('renders CagedTool when pathname is /caged', () => {
      history.pushState({}, '', '/caged');
      const result = render(App);
      unmount = result.unmount;
      // CagedTool renders a heading with "CAGED" in it
      expect(document.body.textContent).toContain('CAGED');
    });

    it('falls back to HomePage for an unknown path', () => {
      history.pushState({}, '', '/unknown-tool');
      const result = render(App);
      unmount = result.unmount;
      // HomePage is rendered (not a blank screen)
      expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    });
  });

  describe('navigate() syncs URL', () => {
    it('updates location.pathname when navigating to a tool', async () => {
      history.replaceState({}, '', '/');
      const result = render(App);
      unmount = result.unmount;

      // Click a tool card on the home page to trigger navigate()
      const cagedBtn = screen.getByRole('button', { name: /CAGED Visualizer/i });
      await cagedBtn.click();

      expect(window.location.pathname).toBe('/caged');
    });

    it('sets pathname to / when navigating to home', async () => {
      history.replaceState({}, '', '/caged');
      const result = render(App);
      unmount = result.unmount;

      // CagedTool renders a "Back to Home" button that calls navigate('home').
      // getByRole throws if it is missing, so this can never pass vacuously.
      const backBtn = screen.getByRole('button', { name: /back to home/i });
      await backBtn.click();

      expect(window.location.pathname).toBe('/');
    });
  });

  describe('popstate (back/forward) navigation', () => {
    it('updates view to match URL after popstate event', async () => {
      // Start at root, render App
      history.replaceState({}, '', '/');
      const result = render(App);
      unmount = result.unmount;

      // Verify we start at home
      expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();

      // Simulate back/forward: manually set pathname and fire popstate
      history.replaceState({}, '', '/caged');
      window.dispatchEvent(new PopStateEvent('popstate'));
      // Wait for Svelte to flush the $state change to the DOM (sync mode schedules
      // the update on a microtask; assert after tick() so this is not timing-fragile).
      await tick();

      // After popstate, the view should update to caged
      // Check that CagedTool content is present
      expect(document.body.textContent).toContain('CAGED');
    });

    it('does not call history.pushState when handling popstate', () => {
      history.replaceState({}, '', '/');
      const result = render(App);
      unmount = result.unmount;

      const pushStateSpy = vi.spyOn(history, 'pushState');

      // Dispatch popstate — the listener must NOT call pushState
      history.replaceState({}, '', '/caged');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(pushStateSpy).not.toHaveBeenCalled();

      pushStateSpy.mockRestore();
    });
  });
});
