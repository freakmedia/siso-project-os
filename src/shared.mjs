import { constants } from 'node:fs'
import {
  access,
  appendFile,
  cp,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const templateRoot = join(packageRoot, 'template')
export const schemasRoot = join(packageRoot, 'schemas')

export const TASK_FOLDERS = ['backlog', 'in_progress', 'blocked', 'completed', 'cancelled', 'archived']
export const TASK_STATUSES = ['backlog', 'in_progress', 'blocked', 'completed', 'cancelled']
export const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low']
export const UI_STAGES = [
  'intent',
  'research',
  'directions',
  'candidates',
  'review',
  'decided',
  'implemented',
  'verified',
  'superseded',
]

export function parseArgs(tokens) {
  const positional = []
  const flags = {}
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token.startsWith('--')) {
      positional.push(token)
      continue
    }
    const name = token.slice(2)
    const next = tokens[index + 1]
    if (next !== undefined && !next.startsWith('--')) {
      flags[name] = next
      index += 1
    } else {
      flags[name] = true
    }
  }
  return { positional, flags }
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'untitled'
}

export function isoNow(flags = {}) {
  return typeof flags.now === 'string' ? flags.now : new Date().toISOString()
}

export function utcDate(flags = {}) {
  return typeof flags.date === 'string' ? flags.date : isoNow(flags).slice(0, 10)
}

export function splitList(value) {
  if (typeof value !== 'string' || value.trim() === '') return []
  return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean)
}

export function projectRoot(flags = {}, fallback = process.cwd()) {
  return resolve(typeof flags.root === 'string' ? flags.root : fallback)
}

export async function pathExists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

export async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.tmp-${process.pid}`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, path)
}

export async function appendJsonLine(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await appendFile(path, `${JSON.stringify(value)}\n`, 'utf8')
}

export async function listDirectories(path) {
  if (!(await pathExists(path))) return []
  const entries = await readdir(path, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
}

export async function walkFiles(root, current = root, output = []) {
  if (!(await pathExists(current))) return output
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name)
    if (entry.isDirectory()) await walkFiles(root, absolute, output)
    else if (entry.isFile()) output.push(relative(root, absolute).split(sep).join('/'))
  }
  return output.sort()
}

export function taskFolderForStatus(status) {
  if (status === 'backlog') return 'backlog'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'blocked') return 'blocked'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  throw new Error(`unsupported task status: ${status}`)
}

export function resolveProjectPointer(root, pointer) {
  if (typeof pointer !== 'string' || pointer.trim() === '') throw new Error('repository-relative pointer is required')
  const absolute = resolve(root, pointer)
  const rel = relative(root, absolute)
  if (rel === '' || rel.startsWith(`..${sep}`) || rel === '..') throw new Error(`pointer escapes project root: ${pointer}`)
  return absolute
}

export async function withExclusiveLock(root, relativeLockPath, operation) {
  const lockPath = join(root, relativeLockPath)
  await mkdir(dirname(lockPath), { recursive: true })
  let handle
  try {
    handle = await open(lockPath, 'wx')
    await handle.writeFile(`${JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() })}\n`)
  } catch (error) {
    if (error?.code === 'EEXIST') {
      const locked = new Error(`registry lock exists: ${relative(root, lockPath)}; inspect it instead of stealing it`)
      locked.exitCode = 3
      throw locked
    }
    throw error
  }
  try {
    return await operation()
  } finally {
    await handle.close()
    await unlink(lockPath).catch(() => {})
  }
}

export async function withRegistryLock(root, operation) {
  return withExclusiveLock(root, join('.agents', 'tasks', '.locks', 'registry.lock'), operation)
}

export async function copyRenderedTree(sourceRoot, targetRoot, replacements, options = {}) {
  const files = await walkFiles(sourceRoot)
  const collisions = []
  const skipped = []
  for (const file of files) {
    const destination = join(targetRoot, file)
    if (!(await pathExists(destination))) continue
    if (file === 'AGENTS.md' && options.skipExistingAgentRules) {
      skipped.push(file)
      continue
    }
    collisions.push(file)
  }
  if (collisions.length > 0) {
    const error = new Error(`init would overwrite existing files:\n${collisions.map((file) => `- ${file}`).join('\n')}`)
    error.exitCode = 2
    throw error
  }
  if (options.dryRun) return { files, skipped }
  for (const file of files) {
    if (skipped.includes(file)) continue
    const source = join(sourceRoot, file)
    const destination = join(targetRoot, file)
    await mkdir(dirname(destination), { recursive: true })
    let content = await readFile(source, 'utf8')
    for (const [token, value] of Object.entries(replacements)) content = content.split(token).join(value)
    await writeFile(destination, content, 'utf8')
  }
  return { files, skipped }
}

export async function copySchemas(targetRoot, options = {}) {
  const destination = join(targetRoot, '.project-os', 'schemas')
  const files = await walkFiles(schemasRoot)
  const collisions = []
  for (const file of files) if (await pathExists(join(destination, file))) collisions.push(`.project-os/schemas/${file}`)
  if (collisions.length > 0) {
    const error = new Error(`init would overwrite existing schema files:\n${collisions.map((file) => `- ${file}`).join('\n')}`)
    error.exitCode = 2
    throw error
  }
  if (!options.dryRun) await cp(schemasRoot, destination, { recursive: true, errorOnExist: true, force: false })
  return files
}

export async function directorySize(path) {
  return (await stat(path)).size
}

export async function removePath(path) {
  await rm(path, { recursive: true, force: true })
}
