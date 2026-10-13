import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { verifyCli } from './cli.mjs';
import { verifySetup } from './setup.mjs';

const execute = promisify(execFile);
const repository = fileURLToPath(new URL('../', import.meta.url));
const skillNames = [
  'game-studio-batch-production',
  'game-studio-content-lifecycle',
  'game-studio-graphics-editing',
  'game-studio-project-authoring',
  'game-studio-project-setup',
];
const resources = [
  'LICENSE',
  'SKILL.md',
  'references/cli.md',
  ...['README.md', 'authoring.md', 'creative.md', 'graphics.md', 'lifecycle.md', 'relic-signal.batch.json']
    .map((name) => `references/examples/${name}`),
];
const packageFiles = [
  'package.json', 'README.md', 'README.ru.md', 'INSTALL.md', 'INSTALL.ru.md', 'LICENSE', '.env', 'bin/game-studio.js',
  ...skillNames.flatMap((skill) => resources.map((file) => `skills/${skill}/${file}`)),
].sort();

async function filesUnder(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${join(directory, entry.name)}`);
    if (entry.isDirectory()) {
      for (const file of await filesUnder(join(directory, entry.name))) result.push(`${entry.name}/${file}`);
    } else result.push(entry.name);
  }
  return result.sort();
}

async function checkLinks(root, files) {
  for (const name of files.filter((file) => file.endsWith('.md'))) {
    const content = await readFile(join(root, name), 'utf8');
    for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(link)) continue;
      const target = resolve(root, dirname(name), link.split('#')[0]);
      assert.ok(!relative(root, target).startsWith('..'), `Link escapes installation: ${name} -> ${link}`);
      await assert.doesNotReject(access(target), `Missing local reference: ${name} -> ${link}`);
    }
  }
}

test('npm tarball and Skills CLI installs preserve the complete licensed collection', { timeout: 120_000 }, async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'game-studio-skills-test-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const env = {
    ...process.env,
    DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1',
    npm_config_cache: join(temporary, 'npm-cache'),
  };
  delete env.GAME_STUDIO_TOKEN;
  delete env.GAME_STUDIO_ENDPOINT;
  const run = (args, cwd = repository, overrides = {}) => execute(process.execPath, args, {
    cwd, env: { ...env, ...overrides }, timeout: 45_000, maxBuffer: 2 * 1024 * 1024,
  });
  assert.ok(process.env.npm_execpath, 'Run this suite with npm test');
  const npm = (args, cwd) => run([process.env.npm_execpath, ...args], cwd);
  const { stdout } = await npm(['pack', '--ignore-scripts', '--json', '--pack-destination', temporary]);
  const [packed] = JSON.parse(stdout);
  assert.equal(packed.name, '@lumenarium/game-studio-skills');
  assert.deepEqual(packed.files.map(({ path }) => path).sort(), packageFiles);

  const consumer = join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'isolated-skill-consumer', private: true }));
  await npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temporary, packed.filename)], consumer);
  const installed = join(consumer, 'node_modules/@lumenarium/game-studio-skills');
  assert.deepEqual(await filesUnder(installed), packageFiles);
  const manifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.publishConfig.access, 'public');
  assert.deepEqual(manifest.bin, { 'game-studio': 'bin/game-studio.js' });
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), ['markdown-it', 'sharp', 'skills', 'zod']);
  assert.match(await readFile(join(installed, '.env'), 'utf8'), /^GAME_STUDIO_TOKEN=\r?\n$/);
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
    assert.equal(manifest.scripts?.[hook], undefined, `Unexpected installation hook: ${hook}`);
  }
  await checkLinks(installed, packageFiles);
  await t.test('one setup command installs the package, credentials and skills in a new project', async () => {
    await verifySetup({ installed, temporary, tarball: join(temporary, packed.filename), run });
  });
  await t.test('packaged CLI initializes credentials, authenticates and renders native pixels', async () => {
    await verifyCli({ installed, consumer, run, npm });
  });
  for (const skill of skillNames) {
    for (const file of resources) {
      assert.deepEqual(await readFile(join(installed, 'skills', skill, file)),
        await readFile(join(repository, 'skills', skill, file)), `Tarball changed ${skill}/${file}`);
    }
  }

  for (const [label, source] of [['repository', repository], ['npm package', installed]]) {
    await t.test(`Skills CLI installs from ${label} for Codex and Claude Code`, async () => {
      const project = await mkdtemp(join(temporary, 'project-'));
      await run([join(repository, 'node_modules/skills/bin/cli.mjs'), 'add', source,
        '--skill', '*', '--agent', 'codex', 'claude-code', '--yes', '--copy'], project);
      for (const agent of ['.agents', '.claude']) {
        const skills = join(project, agent, 'skills');
        assert.deepEqual((await readdir(skills)).sort(), skillNames);
        for (const skill of skillNames) {
          assert.deepEqual(await filesUnder(join(skills, skill)), [...resources].sort());
          for (const file of resources) {
            assert.deepEqual(await readFile(join(skills, skill, file)),
              await readFile(join(installed, 'skills', skill, file)), `Installer changed ${agent}/${skill}/${file}`);
          }
        }
        await checkLinks(skills, await filesUnder(skills));
      }
    });
  }
});
