import { createHash } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import {
  isoNow,
  packageRoot,
  pathExists,
  readJson,
  resolveProjectPointer,
  schemasRoot,
  templateRoot,
  walkFiles,
  withExclusiveLock,
  writeJsonAtomic,
} from './shared.mjs'
import { PROJECT_OS_VERSION } from './version.mjs'

export { PROJECT_OS_VERSION }
const INSTALL_MANIFEST_PATH = '.project-os/install-manifest.json'
const PROTECTED_RUNTIME_SHIMS = new Set(['AGENTS.md', 'CLAUDE.md'])

function digest(content) {
  return createHash('sha256').update(content).digest('hex')
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function embeddedJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function compareVersions(left, right) {
  const parse = (value) => /^\d+\.\d+\.\d+$/.test(value ?? '') ? value.split('.').map(Number) : null
  const a = parse(left)
  const b = parse(right)
  if (!a || !b) return null
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1
  }
  return 0
}

function upgradeId(fromVersion, toVersion, now) {
  const stable = (value) => String(value).toUpperCase().replace(/[^A-Z0-9.-]+/g, '-').replace(/^-+|-+$/g, '')
  return `UPGRADE-${stable(fromVersion)}-TO-${stable(toVersion)}-${stable(now)}`
}

async function projectConfiguration(root) {
  const path = join(root, '.project-os', 'project.json')
  if (!(await pathExists(path))) throw new Error(`${root} is not initialized; run project-os init or adopt first`)
  const value = await readJson(path)
  return { path, value }
}

function replacements(configuration) {
  const name = String(configuration.project_name ?? '')
  return {
    '{{PROJECT_NAME}}': name,
    '{{PROJECT_NAME_JSON}}': JSON.stringify(name),
    '{{PROJECT_NAME_HTML}}': htmlEscape(name),
    '{{PROJECT_SUMMARY_JSON}}': JSON.stringify(String(configuration.project_summary ?? '')),
    '{{DESIRED_OUTCOME_JSON}}': JSON.stringify(String(configuration.desired_outcome ?? '')),
  }
}

function render(content, values) {
  let output = content
  for (const [token, value] of Object.entries(values)) output = output.split(token).join(value)
  return output
}

async function desiredAssets(root, configuration) {
  const values = replacements(configuration)
  const assets = new Map()
  for (const path of await walkFiles(templateRoot)) {
    if (path === '.project-os/project.json') continue
    assets.set(path, render(await readFile(join(templateRoot, path), 'utf8'), values))
  }
  for (const path of await walkFiles(schemasRoot)) {
    assets.set(`.project-os/schemas/${path}`, await readFile(join(schemasRoot, path), 'utf8'))
  }
  const upgradedConfiguration = {
    ...configuration,
    project_os_version: PROJECT_OS_VERSION,
    launcher: { program: 'npx', arguments: ['--yes', `github:sisodias/siso-project-os#v${PROJECT_OS_VERSION}`] },
  }
  assets.set('.project-os/project.json', `${JSON.stringify(upgradedConfiguration, null, 2)}\n`)
  return assets
}

async function historicalHashes(values) {
  const result = new Map()
  const root = join(packageRoot, 'migrations')
  for (const file of await walkFiles(root)) {
    if (!file.endsWith('.json')) continue
    const baseline = await readJson(join(root, file))
    for (const entry of baseline.files ?? []) {
      const historicalHash = entry.templated === true && typeof entry.template_source === 'string'
        ? digest(render(entry.template_source, values))
        : entry.sha256
      if (!result.has(entry.path)) result.set(entry.path, new Set())
      result.get(entry.path).add(historicalHash)
    }
  }
  return result
}

async function installedManifest(root) {
  const path = join(root, INSTALL_MANIFEST_PATH)
  if (!(await pathExists(path))) return null
  try {
    return await readJson(path)
  } catch {
    return null
  }
}

async function manifestFor(root, paths, options = {}) {
  const files = []
  for (const path of [...new Set(paths)].sort()) {
    const absolute = resolveProjectPointer(root, path)
    if (!(await pathExists(absolute))) continue
    files.push({ path, sha256: digest(await readFile(absolute)) })
  }
  return {
    schema_version: 1,
    package: '@siso/project-os',
    installed_version: PROJECT_OS_VERSION,
    installed_at: isoNow(options),
    installed_by: options.by ?? 'project-os',
    files,
    preserved_paths: [...new Set(options.preservedPaths ?? [])].sort(),
  }
}

export async function writeInstallManifest(projectRoot, options = {}) {
  const root = resolve(projectRoot)
  const paths = options.paths ?? [...(await desiredAssets(root, (await projectConfiguration(root)).value)).keys()]
  const manifest = await manifestFor(root, paths, options)
  const target = join(root, INSTALL_MANIFEST_PATH)
  if (await pathExists(target)) {
    try {
      const existing = await readJson(target)
      const sameFiles = JSON.stringify(existing.files ?? []) === JSON.stringify(manifest.files)
      const samePreserved = JSON.stringify(existing.preserved_paths ?? []) === JSON.stringify(manifest.preserved_paths)
      if (existing.installed_version === manifest.installed_version && sameFiles && samePreserved) return existing
    } catch {}
  }
  await writeJsonAtomic(target, manifest)
  return manifest
}

function renderUpgradeHtml(record) {
  const rows = record.operations.map((entry) => `<tr><td>${htmlEscape(entry.action)}</td><td><code>${htmlEscape(entry.path)}</code></td><td>${htmlEscape(entry.reason)}</td></tr>`).join('')
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlEscape(record.id)}</title><style>body{font:15px/1.5 system-ui;max-width:76rem;margin:auto;padding:2rem}table{border-collapse:collapse;width:100%}th,td{padding:.6rem;border-bottom:1px solid #ccd4df;text-align:left;vertical-align:top}code{overflow-wrap:anywhere}</style></head><body><main data-contract="project-os-upgrade"><h1>${htmlEscape(record.id)}</h1><p>State: <strong>${htmlEscape(record.state)}</strong> · ${htmlEscape(record.from_version)} → ${htmlEscape(record.to_version)}</p><table><thead><tr><th>Action</th><th>Path</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table></main><script id="project-os-upgrade-state" type="application/json">${embeddedJson(record)}</script></body></html>\n`
}

export async function planUpgrade(projectRoot, options = {}) {
  const root = resolve(projectRoot)
  const configuration = await projectConfiguration(root)
  const existingManifest = await installedManifest(root)
  const fromVersion = configuration.value.project_os_version ?? existingManifest?.installed_version ?? 'legacy-unversioned'
  const order = compareVersions(fromVersion, PROJECT_OS_VERSION)
  const desired = await desiredAssets(root, configuration.value)
  const installedHashes = new Map((existingManifest?.files ?? []).map((entry) => [entry.path, entry.sha256]))
  const historical = await historicalHashes(replacements(configuration.value))
  const operations = []

  for (const [path, content] of [...desired.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const absolute = resolveProjectPointer(root, path)
    const toSha = digest(content)
    if (!(await pathExists(absolute))) {
      operations.push({ action: 'create', path, reason: 'managed file is missing', from_sha256: null, to_sha256: toSha })
      continue
    }
    const current = await readFile(absolute)
    const fromSha = digest(current)
    if (fromSha === toSha) {
      operations.push({ action: 'retain', path, reason: 'already matches target package', from_sha256: fromSha, to_sha256: toSha })
      continue
    }
    if (PROTECTED_RUNTIME_SHIMS.has(path)) {
      const routed = current.toString('utf8').includes('.agents/skills/project-operator/SKILL.md')
      operations.push({ action: routed ? 'retain' : 'preserve', path, reason: routed ? 'engine-owned rules already contain the canonical route' : 'engine-owned rules need manual route merge', from_sha256: fromSha, to_sha256: toSha })
      continue
    }
    if (path === '.project-os/project.json') {
      operations.push({ action: 'replace', path, reason: 'merge the target Project OS version into canonical project configuration', from_sha256: fromSha, to_sha256: toSha })
      continue
    }
    const owned = installedHashes.get(path) === fromSha
    const knownHistorical = historical.get(path)?.has(fromSha) === true
    operations.push({
      action: owned || knownHistorical ? 'replace' : 'preserve',
      path,
      reason: owned ? 'unchanged since the recorded installation' : knownHistorical ? 'matches a checked-in baseline from an earlier package release' : 'differs from every recorded Project OS baseline; preserve project authority',
      from_sha256: fromSha,
      to_sha256: toSha,
    })
  }

  const unresolvedPaths = operations.filter((entry) => entry.action === 'preserve').map((entry) => entry.path)
  const now = isoNow(options)
  const id = options.id ?? upgradeId(fromVersion, PROJECT_OS_VERSION, now)
  const downgrade = order === 1
  return {
    schema_version: 1,
    id,
    from_version: fromVersion,
    to_version: PROJECT_OS_VERSION,
    state: 'planned',
    created_at: now,
    applied_at: null,
    rolled_back_at: null,
    backup_root: `.project-os/upgrades/${id}/backup`,
    operations,
    unresolved_paths: unresolvedPaths,
    current: order === 0 && existingManifest !== null && operations.every((entry) => entry.action === 'retain'),
    can_apply: !downgrade && unresolvedPaths.length === 0,
    downgrade_refused: downgrade,
    summary: Object.fromEntries(['create', 'replace', 'retain', 'preserve'].map((action) => [action, operations.filter((entry) => entry.action === action).length])),
  }
}

async function writeUpgradeRecord(root, record) {
  const directory = join(root, '.project-os', 'upgrades', record.id)
  await mkdir(directory, { recursive: true })
  await writeJsonAtomic(join(directory, 'upgrade.json'), record)
  await writeFile(join(directory, 'upgrade.html'), renderUpgradeHtml(record), 'utf8')
}

export async function applyUpgrade(projectRoot, options = {}) {
  const root = resolve(projectRoot)
  return withExclusiveLock(root, join('.project-os', 'upgrades', '.locks', 'upgrade.lock'), async () => {
    const plan = await planUpgrade(root, options)
    if (!plan.can_apply) {
      const error = new Error(plan.downgrade_refused ? `refusing Project OS downgrade from ${plan.from_version} to ${plan.to_version}` : `upgrade preserves unresolved project authorities:\n${plan.unresolved_paths.map((path) => `- ${path}`).join('\n')}`)
      error.exitCode = 2
      error.plan = plan
      throw error
    }
    if (options.dryRun || plan.current) return { ok: true, dry_run: options.dryRun === true, current: plan.current, plan }

    const configuration = (await projectConfiguration(root)).value
    const desired = await desiredAssets(root, configuration)
    const targetContents = new Map(desired)
    const manifest = {
      schema_version: 1,
      package: '@siso/project-os',
      installed_version: PROJECT_OS_VERSION,
      installed_at: plan.created_at,
      installed_by: options.by ?? 'project-os:upgrade',
      files: plan.operations
        .filter((entry) => entry.action !== 'preserve')
        .map((entry) => ({ path: entry.path, sha256: entry.action === 'retain' ? entry.from_sha256 : entry.to_sha256 }))
        .sort((left, right) => left.path.localeCompare(right.path)),
      preserved_paths: [],
    }
    targetContents.set(INSTALL_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
    const manifestAbsolute = join(root, INSTALL_MANIFEST_PATH)
    const manifestCurrent = await pathExists(manifestAbsolute) ? await readFile(manifestAbsolute) : null
    const manifestOperation = {
      action: manifestCurrent ? 'replace' : 'create',
      path: INSTALL_MANIFEST_PATH,
      reason: 'record hashes for guarded future upgrades',
      from_sha256: manifestCurrent ? digest(manifestCurrent) : null,
      to_sha256: digest(targetContents.get(INSTALL_MANIFEST_PATH)),
    }
    const record = { ...plan, operations: [...plan.operations, manifestOperation] }
    delete record.current
    delete record.can_apply
    delete record.downgrade_refused
    delete record.summary
    const changed = record.operations.filter((entry) => ['create', 'replace'].includes(entry.action))
    const backupRoot = join(root, record.backup_root)
    const created = []
    const replaced = []
    await writeUpgradeRecord(root, record)
    try {
      for (const operation of changed) {
        const target = resolveProjectPointer(root, operation.path)
        if (operation.action === 'replace') {
          const backup = join(backupRoot, operation.path)
          await mkdir(dirname(backup), { recursive: true })
          await writeFile(backup, await readFile(target))
          replaced.push({ target, backup })
        } else {
          created.push(target)
        }
        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, targetContents.get(operation.path), operation.action === 'create' ? { flag: 'wx' } : undefined)
      }
      record.state = 'applied'
      record.applied_at = isoNow(options)
      await writeUpgradeRecord(root, record)
    } catch (error) {
      for (const target of created.reverse()) await unlink(target).catch(() => {})
      for (const entry of replaced.reverse()) await writeFile(entry.target, await readFile(entry.backup)).catch(() => {})
      throw error
    }
    return {
      ok: true,
      dry_run: false,
      record: `.project-os/upgrades/${record.id}/upgrade.html`,
      next_commands: ['project-os build .', 'project-os check . --json'],
      upgrade: record,
    }
  })
}

export async function rollbackUpgrade(projectRoot, id, options = {}) {
  const root = resolve(projectRoot)
  if (!/^UPGRADE-[A-Z0-9.-]+$/.test(id ?? '')) throw new Error('upgrade rollback requires a valid UPGRADE-... id')
  return withExclusiveLock(root, join('.project-os', 'upgrades', '.locks', 'upgrade.lock'), async () => {
    const recordPath = join(root, '.project-os', 'upgrades', id, 'upgrade.json')
    const record = await readJson(recordPath)
    if (record.state !== 'applied') throw new Error(`${id} is ${record.state}; only applied upgrades can be rolled back`)
    const changed = record.operations.filter((entry) => ['create', 'replace'].includes(entry.action))
    for (const operation of changed) {
      const target = resolveProjectPointer(root, operation.path)
      if (!(await pathExists(target)) || digest(await readFile(target)) !== operation.to_sha256) {
        const error = new Error(`rollback refused because ${operation.path} changed after ${id}`)
        error.exitCode = 2
        throw error
      }
      if (operation.action === 'replace' && !(await pathExists(join(root, record.backup_root, operation.path)))) {
        throw new Error(`rollback backup is missing for ${operation.path}`)
      }
    }
    for (const operation of [...changed].reverse()) {
      const target = resolveProjectPointer(root, operation.path)
      if (operation.action === 'create') await unlink(target)
      else await writeFile(target, await readFile(join(root, record.backup_root, operation.path)))
    }
    record.state = 'rolled_back'
    record.rolled_back_at = isoNow(options)
    await writeUpgradeRecord(root, record)
    return {
      ok: true,
      record: `.project-os/upgrades/${id}/upgrade.html`,
      next_commands: [`rebuild projections with the restored ${record.from_version} Project OS launcher`, 'run the restored Project OS check'],
      upgrade: record,
    }
  })
}
