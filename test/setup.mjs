import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function verifySetup({ installed, temporary, tarball, run }) {
  const project = join(temporary, 'new game project');
  await mkdir(join(project, '.agents/skills/unrelated'), { recursive: true });
  await writeFile(join(project, '.agents/skills/unrelated/SKILL.md'), 'Preserve this skill');
  const entry = join(installed, 'bin/game-studio.js');
  const npmShim = join(temporary, 'npm-fixture.mjs');
  await writeFile(npmShim, 'process.exitCode = 1;');
  await assert.rejects(run([entry, 'setup'], project, { npm_execpath: npmShim }));
  await assert.rejects(readFile(join(project, '.env')), { code: 'ENOENT' });
  await assert.rejects(readFile(join(project, 'package.json')), { code: 'ENOENT' });

  // Exercise actual npm installation, substituting the unpublised registry release with its tarball.
  // All filesystem work, CLI initialization and Skills CLI execution remain real.
  await writeFile(npmShim, `
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const args = process.argv.slice(2);
assert.deepEqual(args, ['install', '--save-dev', '--save-exact', '--ignore-scripts', '--no-audit', '--no-fund', '@lumenarium/game-studio-skills@0.1.2']);
args[args.length - 1] = process.env.FIXTURE_TARBALL;
const child = spawn(process.execPath, [process.env.FIXTURE_NPM, ...args], { stdio: 'inherit' });
child.once('error', () => { process.exitCode = 1; });
child.once('close', (code) => { process.exitCode = code ?? 1; });
`);
  const first = await run([entry, 'setup'], project, {
    npm_execpath: npmShim,
    FIXTURE_TARBALL: tarball,
    FIXTURE_NPM: process.env.npm_execpath,
  });
  assert.equal(JSON.parse(first.stdout).data.installed, true);
  const installedPackage = join(project, 'node_modules/@lumenarium/game-studio-skills');
  assert.equal(JSON.parse(await readFile(join(installedPackage, 'package.json'), 'utf8')).version, '0.1.2');
  const packageManifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  assert.ok(packageManifest.devDependencies['@lumenarium/game-studio-skills']);
  assert.equal(await readFile(join(project, '.env'), 'utf8'), 'GAME_STUDIO_TOKEN=\n');
  assert.equal(await readFile(join(project, '.gitignore'), 'utf8'), '/.env\n');
  const skills = (await readdir(join(installedPackage, 'skills'))).sort();
  assert.equal(skills.length, 5);
  for (const agent of ['.agents', '.claude']) {
    for (const skill of skills) {
      for (const file of ['SKILL.md', 'LICENSE', 'references/cli.md']) {
        assert.deepEqual(await readFile(join(project, agent, 'skills', skill, file)),
          await readFile(join(installedPackage, 'skills', skill, file)));
      }
    }
  }
  const token = 'GAME_STUDIO_TOKEN=preserved-test-token\n';
  await writeFile(join(project, '.env'), token);
  // Matching installations do not reinstall the package or need a registry connection.
  await writeFile(npmShim, 'process.exitCode = 1;');
  const repeated = await run([join(installedPackage, 'bin/game-studio.js'), 'setup'], project, { npm_execpath: npmShim });
  assert.equal(JSON.parse(repeated.stdout).data.installed, true);
  assert.equal(await readFile(join(project, '.env'), 'utf8'), token);
  assert.ok(!(repeated.stdout + repeated.stderr).includes('preserved-test-token'));
  assert.equal(await readFile(join(project, '.agents/skills/unrelated/SKILL.md'), 'utf8'), 'Preserve this skill');
}
