import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { architectureSnapshot, checkArchitecture, writeArchitectureBaseline } from '../src/architecture.mjs'
import { copyRenderedTree, copySchemas, templateRoot } from '../src/shared.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'project-kit-architecture-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await copyRenderedTree(templateRoot, root, {
    '{{PROJECT_NAME}}': 'Architecture fixture',
    '{{PROJECT_SUMMARY_JSON}}': JSON.stringify(''),
    '{{DESIRED_OUTCOME_JSON}}': JSON.stringify(''),
  })
  await copySchemas(root)
  return root
}

test('architecture profile gives a cold agent one stable orientation map', async (t) => {
  const root = await fixture(t)
  const snapshot = await architectureSnapshot(root)
  assert.equal(snapshot.metrics.required_missing, 0)
  assert.equal(snapshot.metrics.operations_missing, 5)
  assert.equal(snapshot.score, 70)
  assert.deepEqual(snapshot.ambiguous_directories, [])
})

test('architecture baseline gates regression and only ratchets tighter', async (t) => {
  const root = await fixture(t)
  await writeArchitectureBaseline(root, { now: '2026-07-29T00:00:00.000Z', by: 'test' })
  assert.equal((await checkArchitecture(root)).ok, true)

  await mkdir(join(root, 'src', 'utils'), { recursive: true })
  await writeFile(join(root, 'src', 'utils', 'new-debt.mjs'), 'export const debt = true\n', 'utf8')
  const regressed = await checkArchitecture(root)
  assert.equal(regressed.ok, false)
  assert.ok(regressed.errors.some((error) => error.code === 'architecture_regression' && error.metric === 'ambiguous_directories'))
  await assert.rejects(
    writeArchitectureBaseline(root, { ratchet: true, now: '2026-07-29T00:01:00.000Z', by: 'test' }),
    /cannot be loosened/,
  )
})
