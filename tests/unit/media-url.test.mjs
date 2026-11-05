import { test } from 'node:test';
import assert from 'node:assert/strict';

// a plain TypeScript module: Node strips the types itself
const { url } = await import('../../src/lib/media-url.ts');

test('an uploaded image gets a version stamp from when it last changed', () => {
  const a = url({ url: '/api/media/file/logo.webp', updatedAt: '2026-11-05T01:00:00.000Z' });
  const b = url({ url: '/api/media/file/logo.webp', updatedAt: '2026-11-05T02:00:00.000Z' });
  assert.match(a, /^\/api\/media\/file\/logo\.webp\?v=[a-z0-9]+$/);
  assert.notEqual(a, b, 'a replaced file must get a new address');
  assert.equal(
    a,
    url({ url: '/api/media/file/logo.webp', updatedAt: '2026-11-05T01:00:00.000Z' }),
    'an unchanged file keeps its address',
  );
});

test('missing or odd values', () => {
  assert.equal(url(null), '');
  assert.equal(url('x'), '');
  assert.equal(url({ url: '' }), '');
  assert.equal(url({ url: '/a.png' }), '/a.png');
  assert.equal(url({ url: '/a.png?x=1', updatedAt: '2026-01-01T00:00:00Z' }).startsWith('/a.png?x=1&v='), true);
});
