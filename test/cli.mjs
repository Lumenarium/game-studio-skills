import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function verifyCli({ installed, consumer, run, npm }) {
  const cli = async (args, env = {}, preloads = []) => {
    const result = await run([...preloads, join(installed, 'bin/game-studio.js'), ...args, '--json'], consumer, env);
    return { ...result, data: JSON.parse(result.stdout).data };
  };
  const version = await npm(['exec', '--offline', '--', 'game-studio', '--version', '--json'], consumer);
  assert.equal(JSON.parse(version.stdout).data.cliVersion, '0.1.2');
  const help = await cli(['--help']);
  assert.ok(help.data.commands.includes('init'));
  assert.ok(!help.data.globalOptions.includes('endpoint'));
  await assert.rejects(cli(['auth', 'whoami', '--endpoint', 'https://untrusted.test']), { code: 2 });
  await assert.rejects(readFile(join(consumer, '.env')), { code: 'ENOENT' });
  assert.equal(Object.hasOwn((await cli(['init'])).data, 'endpoint'), false);
  assert.equal(await readFile(join(consumer, '.env'), 'utf8'), 'GAME_STUDIO_TOKEN=\n');
  assert.equal(await readFile(join(consumer, '.gitignore'), 'utf8'), '/.env\n');

  const token = `sfat_file.${'f'.repeat(32)}`;
  const override = `sfat_environment.${'e'.repeat(32)}`;
  await writeFile(join(consumer, '.env'), `OTHER=preserved\nGAME_STUDIO_TOKEN="${token}"\n`);
  const setup = await cli(['init']);
  assert.ok(!setup.stdout.includes(token));
  assert.equal(await readFile(join(consumer, '.env'), 'utf8'), `OTHER=preserved\nGAME_STUDIO_TOKEN="${token}"\n`);
  const authorizations = [];
  const id = '10000000-0000-4000-8000-000000000001';
  const server = createServer((request, response) => {
    authorizations.push({ url: request.url, token: request.headers.authorization });
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ principal: {
      kind: 'agent', userId: id, studioId: id, tokenId: id, scopes: ['projects:read'],
    } }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const endpoint = `http://127.0.0.1:${server.address().port}`;
    for (const env of [{}, { GAME_STUDIO_TOKEN: override }]) {
      const result = await cli(['auth', 'whoami'], {
        ...env, STUDIO_TEST_ORIGIN: endpoint, GAME_STUDIO_ENDPOINT: 'https://untrusted.test',
      }, ['--import', fileURLToPath(new URL('./transport.mjs', import.meta.url))]);
      assert.equal(result.data.principal.studioId, id);
      for (const secret of [token, override]) assert.ok(!(result.stdout + result.stderr).includes(secret));
    }
    assert.deepEqual(authorizations, [
      { url: '/api/automation/v1/whoami', token: `Bearer ${token}` },
      { url: '/api/automation/v1/whoami', token: `Bearer ${override}` },
    ]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }

  // A real local graphics command proves the native Sharp dependency works after npm installation.
  const rgba = Buffer.from([255, 0, 0, 255]);
  // Load native DLLs in child processes so Windows can remove the installation afterward.
  const sharp = async (expression) => run(['--input-type=module', '--eval', `
    import sharp from 'sharp';
    const bytes = await ${expression};
    process.stdout.write(bytes.toString('base64'));
  `], consumer);
  const encoded = await sharp('sharp(Buffer.from([255, 0, 0, 255]), { raw: { width: 1, height: 1, channels: 4 } }).png().toBuffer()');
  const png = Buffer.from(encoded.stdout, 'base64');
  await writeFile(join(consumer, 'cell.png'), png);
  await writeFile(join(consumer, 'native.json'), JSON.stringify({
    manifest: {
      version: 'native-pixel-v1', width: 1, height: 1, previewFrameId: id,
      layers: [{ id, name: 'Pixel', visible: true, opacity: 1 }],
      frames: [{ id, cells: [{ layerId: id, byteSize: png.length, checksum: createHash('sha256').update(png).digest('hex') }] }],
    },
    cells: [{ frameId: id, layerId: id, path: 'cell.png' }],
  }));
  await cli(['asset', 'native', 'render', '--input', 'native.json', '--mode', 'frame', '--output-root', '.', '--image', 'rendered.png']);
  const pixels = await sharp("sharp('rendered.png').ensureAlpha().raw().toBuffer()");
  assert.deepEqual(Buffer.from(pixels.stdout, 'base64'), rgba);
}
