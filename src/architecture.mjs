import { join } from 'node:path'
import { assertProjectRecord } from './schema.mjs'
import { pathExists, readJson, walkFiles, writeJsonAtomic } from './shared.mjs'

const AMBIGUOUS_DIRECTORY_NAMES = new Set(['common', 'helpers', 'misc', 'utils'])

function missingCount(records) {
  return records.filter((record) => !record.exists).length
}

function scoreSnapshot(snapshot) {
  const requiredScore = snapshot.metrics.required_missing === 0 ? 50 : Math.max(0, 50 - (snapshot.metrics.required_missing * 10))
  const operationsScore = Math.max(0, 30 - (snapshot.metrics.operations_missing * 6))
  const ambiguityScore = Math.max(0, 20 - (snapshot.metrics.ambiguous_directories * 4))
  return requiredScore + operationsScore + ambiguityScore
}

export async function architectureSnapshot(root) {
  const profilePath = join(root, '.project-os', 'architecture', 'profile.json')
  const profile = await readJson(profilePath)
  await assertProjectRecord(root, 'architecture-profile', profile)

  const required = await Promise.all(profile.required_paths.map(async (path) => ({
    path,
    exists: await pathExists(join(root, path)),
  })))
  const operations = await Promise.all(profile.operations.entrypoints.map(async (name) => {
    const path = `${profile.operations.root}/${name}`
    return { name, path, exists: await pathExists(join(root, path)) }
  }))
  const ambiguousDirectories = new Set()
  for (const file of await walkFiles(root)) {
    if (file.startsWith('.git/') || file.startsWith('node_modules/') || file.startsWith('.project-os/generated/')) continue
    const segments = file.split('/').slice(0, -1)
    for (let index = 0; index < segments.length; index += 1) {
      if (AMBIGUOUS_DIRECTORY_NAMES.has(segments[index])) ambiguousDirectories.add(segments.slice(0, index + 1).join('/'))
    }
  }
  const snapshot = {
    schema_version: 1,
    profile: '.project-os/architecture/profile.json',
    required,
    operations,
    ambiguous_directories: [...ambiguousDirectories].sort(),
    metrics: {
      required_missing: missingCount(required),
      operations_missing: missingCount(operations),
      ambiguous_directories: ambiguousDirectories.size,
    },
  }
  return { ...snapshot, score: scoreSnapshot(snapshot) }
}

export async function writeArchitectureBaseline(root, options = {}) {
  const profile = await readJson(join(root, '.project-os', 'architecture', 'profile.json'))
  const path = join(root, profile.ratchet.baseline)
  const current = await architectureSnapshot(root)
  const previous = await pathExists(path) ? await readJson(path) : null
  if (previous && !options.ratchet) throw new Error('architecture baseline already exists; use an explicit ratchet operation')
  if (previous) {
    for (const key of Object.keys(current.metrics)) {
      if (current.metrics[key] > previous.metrics[key]) {
        throw new Error(`architecture baseline cannot be loosened: ${key} ${previous.metrics[key]} -> ${current.metrics[key]}`)
      }
    }
  }
  const baseline = {
    schema_version: 1,
    policy: 'non-regression',
    created_at: options.now ?? new Date().toISOString(),
    created_by: options.by ?? 'project-os',
    decision_ref: options.decision ?? null,
    metrics: current.metrics,
    score: current.score,
  }
  await writeJsonAtomic(path, baseline)
  return baseline
}

export async function checkArchitecture(root) {
  const profile = await readJson(join(root, '.project-os', 'architecture', 'profile.json'))
  const current = await architectureSnapshot(root)
  const baselinePath = join(root, profile.ratchet.baseline)
  const errors = []
  const warnings = []
  if (!(await pathExists(baselinePath))) {
    errors.push({ code: 'missing_architecture_baseline', path: profile.ratchet.baseline })
  } else {
    const baseline = await readJson(baselinePath)
    for (const [metric, value] of Object.entries(current.metrics)) {
      const allowed = baseline.metrics?.[metric]
      if (!Number.isInteger(allowed)) errors.push({ code: 'invalid_architecture_baseline', path: profile.ratchet.baseline, metric })
      else if (value > allowed) errors.push({ code: 'architecture_regression', metric, baseline: allowed, current: value })
    }
  }
  for (const record of current.required.filter((record) => !record.exists)) {
    errors.push({ code: 'missing_required_architecture_path', path: record.path })
  }
  for (const record of current.operations.filter((record) => !record.exists)) {
    warnings.push({ code: 'missing_normalized_operation', path: record.path })
  }
  return { ok: errors.length === 0, current, errors, warnings }
}
