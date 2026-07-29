import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import {
  copyRenderedTree,
  copySchemas,
  parseArgs,
  pathExists,
  projectRoot,
  schemasRoot,
  templateRoot,
} from './shared.mjs'
import { buildProject } from './build.mjs'
import { checkProject } from './check.mjs'
import { closeRun, createRun, createSprint, createTask, updateTask } from './work.mjs'
import { advanceUiCampaign, createUiCampaign } from './ui.mjs'

const HELP = `SISO Project OS

Usage:
  project-os init [path] [--name <name>] [--dry-run]
  project-os check [path] [--json]
  project-os build [path]
  project-os task create --title <title> [options]
  project-os task update TASK-NNNN --by <agent> [options]
  project-os sprint create --title <title> [--tasks TASK-0001,TASK-0002]
  project-os run create --title <title> --task TASK-0001
  project-os run close RUN-... --by <agent> --verdict passed|failed|cancelled --summary <text>
  project-os ui create --title <title> --task TASK-0001
  project-os ui advance UI-... --stage <stage> [receipts]

Global options:
  --root <path>   Project root for state commands
  --json          Machine-readable output
`

function print(value, json = false) {
  if (json || typeof value !== 'string') process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
  else process.stdout.write(`${value}\n`)
}

async function assertInitialized(root) {
  if (!(await pathExists(join(root, '.project-os', 'project.json')))) {
    throw new Error(`${root} is not initialized; run project-os init first`)
  }
}

async function initProject(tokens) {
  const { positional, flags } = parseArgs(tokens)
  const root = resolve(positional[0] ?? process.cwd())
  const name = typeof flags.name === 'string' ? flags.name : basename(root)
  const dryRun = flags['dry-run'] === true
  const existingAgentRules = await pathExists(join(root, 'AGENTS.md'))
  const replacements = { '{{PROJECT_NAME}}': name }

  await copyRenderedTree(templateRoot, root, replacements, {
    dryRun: true,
    skipExistingAgentRules: existingAgentRules,
  })
  await copySchemas(root, { dryRun: true })
  if (existingAgentRules && await pathExists(join(root, '.project-os', 'AGENTS.project-os.md'))) {
    const error = new Error('init would overwrite .project-os/AGENTS.project-os.md')
    error.exitCode = 2
    throw error
  }
  if (dryRun) {
    print({ ok: true, dry_run: true, root, project_name: name, existing_agent_rules: existingAgentRules }, flags.json === true)
    return
  }

  await mkdir(root, { recursive: true })
  const copied = await copyRenderedTree(templateRoot, root, replacements, {
    skipExistingAgentRules: existingAgentRules,
  })
  await copySchemas(root)
  if (existingAgentRules) {
    const source = await readFile(join(templateRoot, 'AGENTS.md'), 'utf8')
    const rendered = source.split('{{PROJECT_NAME}}').join(name)
    const destination = join(root, '.project-os', 'AGENTS.project-os.md')
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, rendered, 'utf8')
  }
  await buildProject(root)
  print({
    ok: true,
    root,
    project_name: name,
    files_installed: copied.files.length - copied.skipped.length,
    agent_rules: existingAgentRules ? 'staged at .project-os/AGENTS.project-os.md for manual merge' : 'installed as AGENTS.md',
  }, flags.json === true)
}

export async function main(argv) {
  const [command, subcommand, ...rest] = argv
  if (!command || ['help', '--help', '-h'].includes(command)) {
    print(HELP)
    return
  }
  if (command === '--version' || command === 'version') {
    const packageJson = JSON.parse(await readFile(join(dirname(new URL(import.meta.url).pathname), '..', 'package.json'), 'utf8'))
    print(packageJson.version)
    return
  }
  if (command === 'init') return initProject(argv.slice(1))

  if (command === 'check' || command === 'build') {
    const { positional, flags } = parseArgs(argv.slice(1))
    const root = resolve(positional[0] ?? (typeof flags.root === 'string' ? flags.root : process.cwd()))
    await assertInitialized(root)
    if (command === 'build') {
      const outputs = await buildProject(root)
      print({ ok: true, outputs: Object.keys(outputs) }, flags.json === true)
      return
    }
    const result = await checkProject(root)
    print(result, flags.json === true)
    if (!result.ok) process.exitCode = 1
    return
  }

  const { positional, flags } = parseArgs(rest)
  const root = projectRoot(flags)
  await assertInitialized(root)
  let result
  if (command === 'task' && subcommand === 'create') result = await createTask(root, flags)
  else if (command === 'task' && subcommand === 'update') result = await updateTask(root, positional[0], flags)
  else if (command === 'sprint' && subcommand === 'create') result = await createSprint(root, flags)
  else if (command === 'run' && subcommand === 'create') result = await createRun(root, flags)
  else if (command === 'run' && subcommand === 'close') result = await closeRun(root, positional[0], flags)
  else if (command === 'ui' && subcommand === 'create') result = await createUiCampaign(root, flags)
  else if (command === 'ui' && subcommand === 'advance') result = await advanceUiCampaign(root, positional[0], flags)
  else throw new Error(`unknown command\n\n${HELP}`)
  await buildProject(root)
  print(result, flags.json === true)
}
