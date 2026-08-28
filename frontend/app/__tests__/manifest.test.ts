import { describe, it, expect } from 'vitest';
import manifest from '../manifest';

describe('PWA web app manifest (L1)', () => {
  const m = manifest();

  it('declares installable metadata', () => {
    expect(m.name).toContain('GreyAuction');
    expect(m.short_name).toBe('GreyAuction');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/');
    expect(m.scope).toBe('/');
  });

  it('provides 192 and 512 PNG icons plus a maskable variant', () => {
    const icons = m.icons ?? [];
    expect(icons.some((i) => i.src === '/icons/icon-192.png' && i.sizes === '192x192')).toBe(true);
    expect(icons.some((i) => i.src === '/icons/icon-512.png' && i.sizes === '512x512')).toBe(true);
    expect(
      icons.some(
        (i) => i.src === '/icons/icon-maskable-512.png' && (i as { purpose?: string }).purpose === 'maskable',
      ),
    ).toBe(true);
  });

  it('uses theme colors matching the brand', () => {
    expect(m.theme_color).toBe('#1a1a2e');
    expect(m.background_color).toBe('#1a1a2e');
  });
});
