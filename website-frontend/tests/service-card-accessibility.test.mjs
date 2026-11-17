import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/_webapp-mirror/components/common/ServiceCard/ServiceCard.jsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
const component = {};
new Function('require', 'exports', outputText)(name => name.endsWith('.css') ? {} : name === 'next-intl' ? { useTranslations: () => key => key } : require(name), component);
const service = { serviceId: 's1', title: 'Keyboard accessible service', executionType: 'DIGITAL', basePrice: 100000, coverImage: '/cover.png', provider: { name: 'Provider', avatar: '/avatar.png' } };

test('a selectable service exposes a native keyboard button with its title', () => {
  const html = renderToStaticMarkup(React.createElement(component.default, { service, onSelectService() {} }));
  assert.match(html, /<button[^>]*>Keyboard accessible service<\/button>/);
});
test('favorite control remains separate from the service navigation button', () => {
  const html = renderToStaticMarkup(React.createElement(component.default, { service, onSelectService() {} }));
  assert.equal((html.match(/<button\b/g) ?? []).length, 2);
  assert.doesNotMatch(html, /<button\b(?:(?!<\/button>)[\s\S])*<button\b/);
});
