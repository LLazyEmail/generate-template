import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = `v${version}`;

execFileSync('chmod', ['+x', 'dist/cli.js', 'dist/assert-cli.js'], { stdio: 'inherit' });
execFileSync('npm', ['publish'], { stdio: 'inherit' });

try {
  execFileSync('gh', ['release', 'view', tag], { stdio: 'ignore' });
  console.log(`${tag} already exists`);
} catch {
  execFileSync('gh', ['release', 'create', tag, '--title', tag, '--generate-notes'], {
    stdio: 'inherit',
  });
}
