export function sortJsonKeys(value) {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortJsonKeys(value[k]);
        return acc;
      }, {});
  }
  return value;
}

export function formatJson(input, { minify = false, sortKeys = false, indent = 2 } = {}) {
  let parsed = JSON.parse(input);
  if (sortKeys) parsed = sortJsonKeys(parsed);
  return minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
}

export function base64EncodeUtf8(str, urlSafe = false) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  let out = btoa(binary);
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return out;
}

export function base64DecodeUtf8(input) {
  let norm = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (norm.length % 4) norm += '=';
  const binary = atob(norm);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function decodeJwt(token) {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 3) throw new Error('A valid JWT must have 3 dot-separated segments (header.payload.signature).');
  const header = JSON.parse(base64DecodeUtf8(parts[0]));
  const payload = JSON.parse(base64DecodeUtf8(parts[1]));
  const meta = {};
  if (typeof payload.iat === 'number') meta.issuedAt = new Date(payload.iat * 1000).toISOString();
  if (typeof payload.exp === 'number') {
    meta.expiresAt = new Date(payload.exp * 1000).toISOString();
    meta.expired = payload.exp * 1000 < Date.now();
  }
  return { header, payload, signaturePreview: parts[2].slice(0, 18) + '...', meta };
}

export function testRegex(pattern, flags, text) {
  const rx = new RegExp(pattern, flags);
  const matches = [];
  if (rx.global) {
    let m;
    while ((m = rx.exec(text)) !== null) {
      matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      if (m[0] === '') rx.lastIndex++;
    }
  } else {
    const m = rx.exec(text);
    if (m) matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
  }
  return matches;
}

export function convertTimestampOrColor(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Enter a Unix timestamp, ISO date, or HEX/RGB color.');

  // HEX color
  const hexMatch = raw.match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
    }
    return {
      kind: 'color',
      hex: '#' + hex.toUpperCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    };
  }

  // Unix numeric epoch (seconds or ms)
  if (/^\d{9,13}$/.test(raw)) {
    const num = Number(raw);
    const ms = raw.length <= 10 ? num * 1000 : num;
    const d = new Date(ms);
    return {
      kind: 'time',
      epochSeconds: Math.floor(ms / 1000),
      epochMs: ms,
      isoUtc: d.toISOString(),
      localString: d.toString()
    };
  }

  // ISO / date string
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return {
      kind: 'time',
      epochSeconds: Math.floor(parsed / 1000),
      epochMs: parsed,
      isoUtc: d.toISOString(),
      localString: d.toString()
    };
  }

  throw new Error('Could not recognize input as Unix epoch, ISO date, or HEX color (e.g. #38bdf8).');
}

if (typeof document !== 'undefined') {
  const tabs = [...document.querySelectorAll('.tool-tab')];
  const source = document.getElementById('source');
  const output = document.getElementById('output');
  const title = document.getElementById('toolTitle');
  const description = document.getElementById('toolDescription');
  const number = document.getElementById('toolNumber');
  const run = document.getElementById('runTool');
  const secondaryAction = document.getElementById('secondaryAction');
  const hint = document.getElementById('toolHint');
  const message = document.getElementById('message');
  const subControls = document.getElementById('subControls');
  const extraPreview = document.getElementById('extraPreview');

  const examples = {
    json: '{"projects":["LinkLens","DevKit","NetworkScope"],"developer":"Muzammil","active":true,"year":2026}',
    url: 'https://github.com/Muzammil-s?tab=repositories&q=security+tools&lang=js',
    base64: 'DevKit local UTF-8 Base64 converter!',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtdXphbW1pbC1zIiwicm9sZSI6ImRldmVsb3BlciIsImlhdCI6MTc5NDUwMDAwMCwiZXhwIjoxODk0NTAwMDAwfQ.sample_signature_not_verified',
    regex: 'Contact muzammilw10@gmail.com or backup@example.org for portfolio inquiries.',
    crypto: 'Muzammil-s/DevKit-Developer-Toolbox',
    convert: '#38bdf8'
  };

  const settings = {
    json: { number: 'TOOL 01 / DATA', title: 'JSON Formatter & Validator', description: 'Pretty-print, sort keys, or minify JSON payloads with syntax validation.', action: 'Format JSON', secondary: 'Minify JSON', hint: 'Uses native JSON.parse() locally; invalid syntax reports exact parser diagnostics.' },
    url: { number: 'TOOL 02 / WEB', title: 'URL Encoder & Query Parser', description: 'Encode/decode URL components and inspect query string key-value pairs.', action: 'Encode URL', secondary: 'Decode URL', hint: 'Full URLs automatically populate the parsed query-parameter breakdown below.' },
    base64: { number: 'TOOL 03 / TEXT', title: 'Base64 / UTF-8 Converter', description: 'Convert Unicode text to standard or URL-safe Base64 and back.', action: 'Encode Base64', secondary: 'Decode Base64', hint: 'Base64 is encoding, not encryption — never use it to hide secrets.' },
    jwt: { number: 'TOOL 04 / AUTH', title: 'JWT Inspector', description: 'Decode JWT header, claims payload, and iat/exp timestamps client-side.', action: 'Decode JWT', secondary: null, hint: 'Educational inspection only: signature verification requires the issuer secret or public key.' },
    regex: { number: 'TOOL 05 / PATTERN', title: 'Regex Tester', description: 'Test JavaScript regular expressions with flags and inspect capture groups.', action: 'Run Match', secondary: null, hint: 'Supports standard JS flags (g, i, m, s, u).' },
    crypto: { number: 'TOOL 06 / CRYPTO', title: 'Web Crypto Hash & UUID Generator', description: 'Compute SHA-1/SHA-256/SHA-384/SHA-512 digests and generate UUID v4 tokens.', action: 'Compute Hash', secondary: 'Generate 5 UUIDs', hint: 'Powered by browser crypto.subtle.digest() and crypto.randomUUID().' },
    convert: { number: 'TOOL 07 / CONVERTER', title: 'Timestamp & Color Converter', description: 'Convert Unix epochs / ISO timestamps or HEX colors (#38bdf8) to RGB & HSL.', action: 'Convert Value', secondary: 'Insert Current Epoch', hint: 'Accepts 10/13-digit Unix timestamps, ISO-8601 dates, or 3/6-digit HEX colors.' }
  };

  let active = 'json';

  function setMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
  }

  function renderSubControls(tool) {
    subControls.replaceChildren();
    extraPreview.hidden = true;
    extraPreview.replaceChildren();

    if (tool === 'json') {
      subControls.innerHTML = `
        <label><input type="checkbox" id="jsonSortKeys" /> Sort keys alphabetically</label>
        <label>Indent: <select id="jsonIndent"><option value="2">2 spaces</option><option value="4">4 spaces</option></select></label>
      `;
    } else if (tool === 'base64') {
      subControls.innerHTML = `<label><input type="checkbox" id="b64UrlSafe" /> URL-safe Base64 (- and _)</label>`;
    } else if (tool === 'regex') {
      subControls.innerHTML = `
        <label>Pattern: <input type="text" id="rxPattern" value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}" style="min-width:260px" /></label>
        <label>Flags: <input type="text" id="rxFlags" value="gi" style="width:70px" /></label>
      `;
    } else if (tool === 'crypto') {
      subControls.innerHTML = `
        <label>Algorithm: <select id="hashAlgo"><option value="SHA-256">SHA-256</option><option value="SHA-512">SHA-512</option><option value="SHA-384">SHA-384</option><option value="SHA-1">SHA-1</option></select></label>
      `;
    }
  }

  function activate(tool) {
    active = tool;
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tool === tool));
    const cfg = settings[tool];
    number.textContent = cfg.number;
    title.textContent = cfg.title;
    description.textContent = cfg.description;
    run.innerHTML = `${cfg.action} <span>&#8594;</span>`;
    if (cfg.secondary) {
      secondaryAction.hidden = false;
      secondaryAction.textContent = cfg.secondary;
    } else {
      secondaryAction.hidden = true;
    }
    hint.textContent = cfg.hint;
    renderSubControls(tool);
    source.value = examples[tool];
    output.value = '';
    setMessage('');
  }

  async function runPrimary(isSecondary = false) {
    const val = source.value;
    extraPreview.hidden = true;
    try {
      if (active === 'json') {
        const sortKeys = document.getElementById('jsonSortKeys')?.checked;
        const indent = Number(document.getElementById('jsonIndent')?.value || 2);
        output.value = formatJson(val, { minify: isSecondary, sortKeys, indent });
        setMessage(isSecondary ? 'JSON minified.' : 'JSON formatted & validated.');
      } else if (active === 'url') {
        output.value = isSecondary ? decodeURIComponent(val) : encodeURIComponent(val);
        try {
          const parsed = new URL(isSecondary ? output.value : val);
          const entries = [...parsed.searchParams.entries()];
          if (entries.length) {
            extraPreview.hidden = false;
            extraPreview.textContent = 'Query Params: ' + entries.map(([k, v]) => `${k} = ${v}`).join(' | ');
          }
        } catch {}
        setMessage(isSecondary ? 'URL decoded.' : 'URL encoded.');
      } else if (active === 'base64') {
        const urlSafe = document.getElementById('b64UrlSafe')?.checked;
        output.value = isSecondary ? base64DecodeUtf8(val) : base64EncodeUtf8(val, urlSafe);
        setMessage(isSecondary ? 'Base64 decoded.' : 'Base64 encoded.');
      } else if (active === 'jwt') {
        const decoded = decodeJwt(val);
        output.value = JSON.stringify(decoded, null, 2);
        setMessage('JWT decoded locally.');
      } else if (active === 'regex') {
        const pattern = document.getElementById('rxPattern')?.value || '';
        const flags = document.getElementById('rxFlags')?.value || '';
        const matches = testRegex(pattern, flags, val);
        output.value = JSON.stringify({ count: matches.length, matches }, null, 2);
        setMessage(`Found ${matches.length} match(es).`);
      } else if (active === 'crypto') {
        if (isSecondary) {
          output.value = Array.from({ length: 5 }, () => crypto.randomUUID()).join('\n');
          setMessage('Generated 5 UUID v4 tokens.');
        } else {
          const algo = document.getElementById('hashAlgo')?.value || 'SHA-256';
          const bytes = new TextEncoder().encode(val);
          const digest = await crypto.subtle.digest(algo, bytes);
          output.value = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
          setMessage(`${algo} digest computed.`);
        }
      } else if (active === 'convert') {
        if (isSecondary) {
          source.value = String(Math.floor(Date.now() / 1000));
        }
        const res = convertTimestampOrColor(source.value);
        output.value = JSON.stringify(res, null, 2);
        if (res.kind === 'color') {
          extraPreview.hidden = false;
          extraPreview.innerHTML = `<span class="color-swatch" style="background:${res.hex}"></span>${res.hex} · ${res.rgb} · ${res.hsl}`;
        }
        setMessage('Converted.');
      }
    } catch (err) {
      output.value = '';
      setMessage(err.message || 'Conversion failed.', true);
    }
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.tool)));
  run.addEventListener('click', () => runPrimary(false));
  secondaryAction.addEventListener('click', () => runPrimary(true));
  document.getElementById('loadExample').addEventListener('click', () => { source.value = examples[active]; output.value = ''; setMessage('Example loaded.'); });
  document.getElementById('clearTool').addEventListener('click', () => { source.value = ''; output.value = ''; extraPreview.hidden = true; setMessage('Cleared.'); source.focus(); });
  document.getElementById('copyOutput').addEventListener('click', async () => {
    if (!output.value) return setMessage('Nothing to copy yet.', true);
    try { await navigator.clipboard.writeText(output.value); setMessage('Copied to clipboard.'); }
    catch { output.focus(); output.select(); setMessage('Select output and press Ctrl+C.', true); }
  });
  source.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runPrimary(false);
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  activate('json');
}
