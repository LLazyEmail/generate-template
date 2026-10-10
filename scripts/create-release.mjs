import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = `v${version}`;

try {
  execFileSync('npm', ['publish'], { stdio: 'inherit' });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/previously published|cannot publish over|EPUBLISHCONFLICT/i.test(message)) throw error;
  console.log(`${version} is already published`);
}

try {
  execFileSync('gh', ['release', 'view', tag], { stdio: 'ignore' });
  console.log(`${tag} already exists`);
} catch {
  execFileSync('gh', ['release', 'create', tag, '--title', tag, '--generate-notes'], {
    stdio: 'inherit',
  });
}
