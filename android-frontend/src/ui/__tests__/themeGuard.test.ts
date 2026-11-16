import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

// The argument of each StyleSheet.create(...) call, matched by parentheses.
function createArgs(code: string): string[] {
  const args: string[] = [];
  let at = code.indexOf('StyleSheet.create(');
  while (at !== -1) {
    let depth = 0;
    let end = at + 'StyleSheet.create'.length;
    for (; end < code.length; end++) {
      if (code[end] === '(') depth++;
      else if (code[end] === ')' && --depth === 0) break;
    }
    args.push(code.slice(at, end));
    at = code.indexOf('StyleSheet.create(', end);
  }
  return args;
}

// A StyleSheet built at import time freezes the colours of the scheme the app
// started in; theme colours belong in makeStyles so they follow the switch.
test('no StyleSheet.create reads theme colours at import time', () => {
  const offenders = sourceFiles(SRC)
    .filter((file) => !file.endsWith(join('ui', 'theme.ts')))
    .filter((file) => createArgs(readFileSync(file, 'utf-8')).some((arg) => /\bcolors\./.test(arg)))
    .map((file) => relative(SRC, file).split(sep).join('/'));
  expect(offenders).toEqual([]);
});
