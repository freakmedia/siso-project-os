#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { packageRoot } from '../src/shared.mjs'

const execute = promisify(execFile)
const version = process.argv[2]
if (!/^v?[0-9]+\.[0-9]+\.[0-9]+$/.test(version ?? '')) throw new Error('usage: generate-version-baseline.mjs <version>')
const tag = version.startsWith('v') ? version : `v${version}`
const normalized = tag.slice(1)
const { stdout } = await execute('git', ['ls-tree', '-r', '--name-only', tag, '--', 'template', 'schemas'], { cwd: packageRoot })
const files = []
for (const source of stdout.split('\n').filter(Boolean).sort()) {
  const { stdout: content } = await execute('git', ['show', `${tag}:${source}`], { cwd: packageRoot, encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 })
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const installedPath = source.startsWith('template/') ? source.slice('template/'.length) : `.project-os/${source}`
  const templated = buffer.includes(Buffer.from('{{'))
  files.push({
    path: installedPath,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    templated,
    ...(templated ? { template_source: buffer.toString('utf8') } : {}),
  })
}
const output = join(packageRoot, 'migrations', `${normalized}.json`)
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify({ schema_version: 1, package: '@siso/project-os', version: normalized, files }, null, 2)}\n`, 'utf8')
process.stdout.write(`${output}\n`)
