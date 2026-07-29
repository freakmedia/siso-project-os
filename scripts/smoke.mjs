#!/usr/bin/env node

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = await mkdtemp(join(tmpdir(), 'siso-project-os-smoke-'))
const bin = join(new URL('..', import.meta.url).pathname, 'bin', 'siso-project-os.mjs')

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' })
  if (result.status !== expected) {
    throw new Error(`command failed (${result.status}): ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
  }
  return result
}

try {
  run(['init', root, '--name', 'Smoke Project'])
  const created = JSON.parse(run(['task', 'create', '--root', root, '--title', 'Smoke task', '--accept', 'smoke passes', '--json']).stdout)
  run(['task', 'update', '--root', root, created.id, '--by', 'smoke', '--status', 'in_progress', '--log', 'started'])
  run(['task', 'update', '--root', root, created.id, '--by', 'smoke', '--verified', '--command', 'npm test', '--evidence', 'smoke://pass', '--status', 'completed'])
  run(['sprint', 'create', '--root', root, '--title', 'Smoke sprint', '--tasks', created.id])
  run(['run', 'create', '--root', root, '--title', 'Smoke run', '--task', created.id])
  run(['ui', 'create', '--root', root, '--title', 'Smoke UI', '--task', created.id])
  run(['build', root])
  const checked = JSON.parse(run(['check', root, '--json']).stdout)
  if (!checked.ok) throw new Error(JSON.stringify(checked, null, 2))
  const index = JSON.parse(await readFile(join(root, '.project-os', 'generated', 'project-index.json'), 'utf8'))
  if (index.counts.tasks !== 1 || index.counts.sprints !== 1 || index.counts.runs !== 1 || index.counts.campaigns !== 1) {
    throw new Error(`unexpected smoke counts: ${JSON.stringify(index.counts)}`)
  }
  process.stdout.write(`smoke: PASS (${root})\n`)
} finally {
  await rm(root, { recursive: true, force: true })
}
