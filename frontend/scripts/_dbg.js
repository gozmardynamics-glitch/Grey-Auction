const fs = require('fs');
const c = fs.readFileSync('audit2.log', 'utf8');
console.log('len', c.length);
console.log('has path token:', c.indexOf('{"path":'));
console.log('has AUDIT:', c.indexOf('AUDIT'));
const i = c.indexOf('AUDIT');
console.log('raw:', JSON.stringify(c.slice(i, i + 100)));