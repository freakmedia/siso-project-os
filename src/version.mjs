import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { packageRoot } from './shared.mjs'

export const PROJECT_OS_VERSION = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')).version
