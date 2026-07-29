import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function matchesType(value, expected) {
  if (expected === 'null') return value === null
  if (expected === 'array') return Array.isArray(value)
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
  if (expected === 'integer') return Number.isInteger(value)
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value)
  return typeof value === expected
}

function resolveLocalReference(root, reference) {
  if (!reference.startsWith('#/')) throw new Error(`only local schema references are supported: ${reference}`)
  return reference.slice(2).split('/').reduce((value, token) => value?.[token.replaceAll('~1', '/').replaceAll('~0', '~')], root)
}

function validDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function validDateTime(value) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/)
  if (!match || !validDate(match[1])) return false
  if (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) return false
  if (match[5] !== 'Z') {
    const [hours, minutes] = match[5].slice(1).split(':').map(Number)
    if (hours > 23 || minutes > 59) return false
  }
  return !Number.isNaN(Date.parse(value))
}

function inspect(value, schema, root, path, errors) {
  if (schema === true || schema === undefined) return
  if (schema === false) {
    errors.push({ path, message: 'value is forbidden by schema' })
    return
  }
  if (schema.$ref) {
    const target = resolveLocalReference(root, schema.$ref)
    if (!target) errors.push({ path, message: `unresolved schema reference ${schema.$ref}` })
    else inspect(value, target, root, path, errors)
  }
  if (schema.anyOf) {
    const matches = schema.anyOf.some((candidate) => validateSchema(value, candidate, root).length === 0)
    if (!matches) errors.push({ path, message: 'value does not match any allowed schema' })
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => validateSchema(value, candidate, root).length === 0).length
    if (matches !== 1) errors.push({ path, message: `value must match exactly one schema; matched ${matches}` })
  }
  if (schema.allOf) for (const candidate of schema.allOf) inspect(value, candidate, root, path, errors)
  if (schema.not && validateSchema(value, schema.not, root).length === 0) errors.push({ path, message: 'value matches a forbidden schema' })
  if (schema.if) {
    const conditionMatches = validateSchema(value, schema.if, root).length === 0
    if (conditionMatches && schema.then) inspect(value, schema.then, root, path, errors)
    if (!conditionMatches && schema.else) inspect(value, schema.else, root, path, errors)
  }

  if (schema.const !== undefined && !sameValue(value, schema.const)) errors.push({ path, message: `expected constant ${JSON.stringify(schema.const)}` })
  if (schema.enum && !schema.enum.some((allowed) => sameValue(value, allowed))) errors.push({ path, message: `value is not in enum ${JSON.stringify(schema.enum)}` })

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!types.some((type) => matchesType(value, type))) {
      errors.push({ path, message: `expected type ${types.join('|')}` })
      return
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push({ path, message: `string is shorter than ${schema.minLength}` })
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push({ path, message: `string is longer than ${schema.maxLength}` })
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) errors.push({ path, message: `string does not match ${schema.pattern}` })
    if (schema.format === 'date' && !validDate(value)) errors.push({ path, message: 'string is not a valid date' })
    if (schema.format === 'date-time' && !validDateTime(value)) errors.push({ path, message: 'string is not a valid date-time' })
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push({ path, message: `number is less than ${schema.minimum}` })
    if (schema.maximum !== undefined && value > schema.maximum) errors.push({ path, message: `number is greater than ${schema.maximum}` })
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push({ path, message: `array has fewer than ${schema.minItems} items` })
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push({ path, message: `array has more than ${schema.maxItems} items` })
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push({ path, message: 'array items are not unique' })
    if (schema.items) value.forEach((item, index) => inspect(item, schema.items, root, `${path}[${index}]`, errors))
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push({ path: `${path}.${key}`, message: 'required property is missing' })
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key]) inspect(child, schema.properties[key], root, `${path}.${key}`, errors)
      else if (schema.additionalProperties === false) errors.push({ path: `${path}.${key}`, message: 'additional property is not allowed' })
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') inspect(child, schema.additionalProperties, root, `${path}.${key}`, errors)
    }
  }
}

export function validateSchema(value, schema, root = schema) {
  const errors = []
  inspect(value, schema, root, '$', errors)
  return errors
}

export async function assertProjectRecord(root, schemaName, value) {
  const schemaPath = join(root, '.project-os', 'schemas', `${schemaName}.schema.json`)
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const violations = validateSchema(value, schema)
  if (violations.length === 0) return
  const error = new Error(`${schemaName} record violates its schema:\n${violations.map((violation) => `- ${violation.path}: ${violation.message}`).join('\n')}`)
  error.exitCode = 2
  throw error
}
