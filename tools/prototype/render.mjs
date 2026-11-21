// Renders docs/prototype/Main.dc.html to static HTML for a given component state.
// Usage: pnpm prototype:render <out.html> '<state json>'
// The state keys are the prototype's (`screen`, `pos`, `shown`, `secs`, `hanging`…).
// Event handlers are dropped: the output is a static snapshot for visual comparison.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const src = new URL('../../docs/prototype/Main.dc.html', import.meta.url);
const [, , out = 'prototype.html', stateJson = '{}'] = process.argv;
const html = readFileSync(src, 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;
const script = doc.querySelector('script[data-dc-script]').textContent;

class DCLogic {
  constructor(props) {
    this.props = props || {};
    this.state = {};
  }
  setState(s) {
    Object.assign(this.state, typeof s === 'function' ? s(this.state) : s);
  }
}
const Component = new Function('DCLogic', 'window', script + '\nreturn Component;')(DCLogic, {
  AudioContext: null,
});
const c = new Component({});
Object.assign(c.state, JSON.parse(stateJson));
const vals = c.renderVals();

const evalExpr = (expr, scope) => {
  expr = expr.trim();
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  return expr.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
};
const fill = (str, scope) =>
  str.replace(/\{\{([^}]+)\}\}/g, (_, e) => {
    const v = evalExpr(e, scope);
    return v == null ? '' : String(v);
  });

const walk = (node, scope) => {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) {
      child.textContent = fill(child.textContent, scope);
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = child.tagName.toLowerCase();
    if (tag === 'sc-if') {
      const v = evalExpr(child.getAttribute('value').replace(/[{}]/g, ''), scope);
      if (v) {
        walk(child, scope);
        child.replaceWith(...child.childNodes);
      } else child.remove();
      continue;
    }
    if (tag === 'sc-for') {
      const list = evalExpr(child.getAttribute('list').replace(/[{}]/g, ''), scope) || [];
      const as = child.getAttribute('as');
      const frag = doc.createDocumentFragment();
      for (const item of list) {
        const tmpl = child.cloneNode(true);
        walk(tmpl, { ...scope, [as]: item });
        frag.append(...tmpl.childNodes);
      }
      child.replaceWith(frag);
      continue;
    }
    for (const attr of [...child.attributes]) {
      if (/^on[A-Z]/.test(attr.name) || /^on[a-z]+$/.test(attr.name)) {
        child.removeAttribute(attr.name);
        continue;
      }
      if (attr.name.startsWith('hint-')) {
        child.removeAttribute(attr.name);
        continue;
      }
      child.setAttribute(attr.name, fill(attr.value, scope));
    }
    if (tag === 'input' && child.hasAttribute('value'))
      child.setAttribute('value', child.getAttribute('value'));
    walk(child, scope);
  }
};

const xdc = doc.querySelector('x-dc');
const helmet = xdc.querySelector('helmet');
const head = helmet.innerHTML;
helmet.remove();
walk(xdc, vals);
const body = xdc.innerHTML;
writeFileSync(
  out,
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${body}</body></html>`,
);
console.log('wrote', out);
