import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatJson,
  base64EncodeUtf8,
  base64DecodeUtf8,
  decodeJwt,
  testRegex,
  convertTimestampOrColor
} from '../app.js';

test('formatJson sorts keys and minifies accurately', () => {
  const out = formatJson('{"b":1,"a":2}', { minify: true, sortKeys: true });
  assert.equal(out, '{"a":2,"b":1}');
});

test('UTF-8 Base64 round-trips Unicode and URL-safe encoding', () => {
  const sample = 'Hello DevKit — 2026!';
  const b64 = base64EncodeUtf8(sample, true);
  assert.ok(!b64.includes('='));
  assert.equal(base64DecodeUtf8(b64), sample);
});

test('decodeJwt parses header and payload cleanly', () => {
  const hdr = base64EncodeUtf8(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), true);
  const pay = base64EncodeUtf8(JSON.stringify({ sub: 'muzammil-s', iat: 1794500000 }), true);
  const res = decodeJwt(`${hdr}.${pay}.sig`);
  assert.equal(res.header.alg, 'HS256');
  assert.equal(res.payload.sub, 'muzammil-s');
  assert.ok(res.meta.issuedAt.startsWith('2026-'));
});

test('testRegex returns all matches and capture groups', () => {
  const matches = testRegex('([a-z]+)@([a-z]+\\.com)', 'gi', 'a@b.com and c@d.com');
  assert.equal(matches.length, 2);
  assert.deepEqual(matches[0].groups, ['a', 'b.com']);
});

test('convertTimestampOrColor converts HEX colors and Unix timestamps', () => {
  const color = convertTimestampOrColor('#38bdf8');
  assert.equal(color.rgb, 'rgb(56, 189, 248)');
  const ts = convertTimestampOrColor('1794500000');
  assert.equal(ts.epochSeconds, 1794500000);
});
