// Temporary: parse playwright audit log (utf8 or PowerShell utf16le) into a violation summary.
const fs = require('fs');
const raw = fs.readFileSync(process.argv[2] || 'audit2.log');
let c = raw.toString('utf8');
if (c.indexOf('{"path":') === -1) {
  c = raw.toString('utf16le').replace(/^\uFEFF/, '');
}

function extractBlocks(text) {
  const blocks = [];
  let i = text.indexOf('{"path":');
  while (i !== -1) {
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
    }
    if (end === -1) break;
    blocks.push(text.slice(i, end));
    i = text.indexOf('{"path":', end);
  }
  return blocks;
}

const agg = new Map();
let parsed = 0;
for (const b of extractBlocks(c)) {
  let o; try { o = JSON.parse(b); } catch { console.log('PARSE FAIL:', b.slice(0, 80)); continue; }
  parsed++;
  for (const v of o.violations || []) {
    if (!agg.has(v.id)) agg.set(v.id, { total: 0, routes: {}, samples: [] });
    const e = agg.get(v.id);
    e.total += v.nodes;
    e.routes[o.path] = (e.routes[o.path] || 0) + v.nodes;
    for (const s of (v.sample || []).slice(0, 4)) {
      e.samples.push(o.path + ' | fg=' + s.fg + ' bg=' + s.bg + ' r=' + s.ratio + ' fs=' + s.fontSize + ' | ' + s.target);
    }
  }
}
const lines = ['parsedRoutes=' + parsed];
for (const [id, e] of agg) {
  lines.push('== ' + id + ' total=' + e.total);
  lines.push('routes: ' + Object.entries(e.routes).map(([k, v]) => k + '=' + v).join(' '));
  for (const s of e.samples.slice(0, 22)) lines.push('  ' + s);
}
const out = lines.join('\n');
fs.writeFileSync(process.argv[3] || 'audit-summary.txt', out);
console.log(out.slice(0, 4500));