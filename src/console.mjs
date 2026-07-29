import { createHash } from 'node:crypto'
import { PROJECT_OS_VERSION } from './version.mjs'

const PRIORITY_ORDER = new Map([
  ['critical', 0],
  ['high', 1],
  ['medium', 2],
  ['low', 3],
])

const TERMINAL_TASKS = new Set(['completed', 'cancelled'])

export const AGENT_BOOT_ORDER = Object.freeze([
  'AGENTS.md',
  'PROJECT-OS.html',
  'project-os onboard --json',
  'canonical task.json',
  'linked run packet',
  'verification and handoff',
])

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]))
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function taskOrder(left, right) {
  const statusOrder = { in_progress: 0, backlog: 1, blocked: 2, completed: 3, cancelled: 4 }
  return (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9)
    || (PRIORITY_ORDER.get(left.priority) ?? 9) - (PRIORITY_ORDER.get(right.priority) ?? 9)
    || left.id.localeCompare(right.id)
}

function taskHref(task) {
  return `../../${task.path}`
}

function attentionModel(snapshot) {
  const items = []
  for (const task of snapshot.tasks.filter((candidate) => !TERMINAL_TASKS.has(candidate.status))) {
    if (task.requires_human) {
      items.push({
        key: `human:${task.id}`,
        kind: 'human_gate',
        id: task.id,
        title: task.title,
        reason: task.human_gate_reason || 'Human decision required',
        status: task.status,
        path: task.path,
      })
    }
    if (task.status === 'blocked') {
      items.push({
        key: `blocked:${task.id}`,
        kind: 'blocked_task',
        id: task.id,
        title: task.title,
        reason: task.blocker?.reason || 'Task is blocked',
        status: task.status,
        path: task.path,
      })
    }
  }
  for (const campaign of snapshot.campaigns.filter((candidate) => candidate.stage === 'review')) {
    items.push({
      key: `review:${campaign.id}`,
      kind: 'ui_review',
      id: campaign.id,
      title: campaign.title || campaign.id,
      reason: 'UI candidates are waiting for a recorded human verdict',
      status: campaign.stage,
      path: `.uihub/campaigns/${campaign.id}/campaign.json`,
    })
  }
  return items.sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id))
}

function nextWorkModel(snapshot) {
  const completed = new Set(snapshot.tasks.filter((task) => task.status === 'completed').map((task) => task.id))
  return snapshot.tasks
    .filter((task) => ['in_progress', 'backlog'].includes(task.status))
    .filter((task) => !task.requires_human)
    .filter((task) => (task.dependencies ?? []).every((id) => completed.has(id)))
    .sort(taskOrder)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      domain: task.domain,
      owner: task.owner,
      path: task.path,
    }))
}

export function onboardingModel(snapshot) {
  const statuses = {}
  for (const task of snapshot.tasks) statuses[task.status ?? 'invalid'] = (statuses[task.status ?? 'invalid'] ?? 0) + 1
  return {
    schema_version: 1,
    project_name: snapshot.project_name,
    project_summary: snapshot.project_summary,
    desired_outcome: snapshot.desired_outcome,
    generated_from: snapshot.generation,
    boot_order: AGENT_BOOT_ORDER,
    projection_health: {
      state: 'requires_live_check',
      command: 'project-os check --json',
      reason: 'A static file cannot prove that no canonical input changed after generation.',
    },
    counts: snapshot.counts,
    task_statuses: statuses,
    human_attention: attentionModel(snapshot),
    next_work: nextWorkModel(snapshot),
    active_sprints: snapshot.sprints.filter((sprint) => ['planned', 'active', 'blocked'].includes(sprint.status)),
    open_runs: snapshot.runs.filter((run) => !['completed', 'failed', 'cancelled'].includes(run.status)),
    active_ui_campaigns: snapshot.campaigns.filter((campaign) => !['verified', 'superseded'].includes(campaign.stage)),
  }
}

function emptyOrList(items, render, empty) {
  return items.length > 0 ? `<ol class="stack">${items.map(render).join('')}</ol>` : `<p class="empty">${htmlEscape(empty)}</p>`
}

function statusPills(model) {
  return ['in_progress', 'backlog', 'blocked', 'completed', 'cancelled']
    .map((status) => `<span class="pill" data-status="${status}"><b>${model.task_statuses[status] ?? 0}</b> ${status.replace('_', ' ')}</span>`)
    .join('')
}

export function renderOnboardingHtml(snapshot) {
  const model = onboardingModel(snapshot)
  const machineState = JSON.stringify(model).replace(/<\//g, '<\\/')
  const visibleAttention = model.human_attention.slice(0, 20)
  const attention = emptyOrList(visibleAttention, (item) => `<li data-kind="${htmlEscape(item.kind)}" data-id="${htmlEscape(item.id)}" data-status="${htmlEscape(item.status)}"><div><a href="../../${htmlEscape(item.path)}"><b>${htmlEscape(item.id)}</b> · ${htmlEscape(item.title)}</a><p>${htmlEscape(item.reason)}</p></div><span class="tag attention">${htmlEscape(item.kind.replace('_', ' '))}</span></li>`, 'Nothing currently requires human attention.')
    + (model.human_attention.length > visibleAttention.length ? `<p class="empty">${model.human_attention.length - visibleAttention.length} more item(s) remain in the embedded JSON report.</p>` : '')
  const nextWork = emptyOrList(model.next_work.slice(0, 12), (task) => `<li data-kind="task" data-id="${htmlEscape(task.id)}" data-status="${htmlEscape(task.status)}"><div><a href="${htmlEscape(taskHref(task))}"><b>${htmlEscape(task.id)}</b> · ${htmlEscape(task.title)}</a><p>${htmlEscape(task.domain)} · ${htmlEscape(task.priority)}${task.owner ? ` · ${htmlEscape(task.owner)}` : ''}</p></div><span class="tag">${htmlEscape(task.status.replace('_', ' '))}</span></li>`, 'No unblocked task is ready. Create a canonical task or resolve a blocker.')
  const orderedTasks = [...snapshot.tasks].sort(taskOrder)
  const visibleTasks = orderedTasks.slice(0, 50)
  const trunk = emptyOrList(visibleTasks, (task) => `<li data-kind="task" data-id="${htmlEscape(task.id)}" data-status="${htmlEscape(task.status ?? 'invalid')}"><div><a href="${htmlEscape(taskHref(task))}"><b>${htmlEscape(task.id)}</b> · ${htmlEscape(task.title ?? 'Unreadable task')}</a><p>${htmlEscape(task.domain ?? 'unknown')} · ${htmlEscape(task.priority ?? 'unknown')}${task.owner ? ` · owner ${htmlEscape(task.owner)}` : ''}</p></div><span class="tag">${htmlEscape((task.status ?? 'invalid').replace('_', ' '))}</span></li>`, 'The delivery trunk is empty. Start by creating one outcome-shaped task.')
    + (orderedTasks.length > visibleTasks.length ? `<p class="empty">Showing 50 of ${orderedTasks.length} tasks. Open <a href="./project-index.html">the full generated index</a> for the remainder.</p>` : '')
  const campaigns = emptyOrList(model.active_ui_campaigns, (campaign) => `<li data-kind="ui-campaign" data-id="${htmlEscape(campaign.id)}" data-status="${htmlEscape(campaign.stage)}"><div><a href="../../.uihub/campaigns/${htmlEscape(campaign.id)}/campaign.json"><b>${htmlEscape(campaign.id)}</b> · ${htmlEscape(campaign.title ?? campaign.id)}</a><p>task ${htmlEscape(campaign.task_id ?? 'unlinked')}</p></div><span class="tag">${htmlEscape(campaign.stage)}</span></li>`, 'No active UI campaigns.')
  const coordinationItems = [
    ...model.active_sprints.map((sprint) => ({ ...sprint, kind: 'sprint', path: `.agents/sprints/${sprint.id}/sprint.json` })),
    ...model.open_runs.map((run) => ({ ...run, kind: 'run', path: `.agents/runs/${run.id}/run.json` })),
  ]
  const coordination = emptyOrList(coordinationItems.slice(0, 20), (item) => `<li data-kind="${item.kind}" data-id="${htmlEscape(item.id)}" data-status="${htmlEscape(item.status)}"><div><a href="../../${htmlEscape(item.path)}"><b>${htmlEscape(item.id)}</b> · ${htmlEscape(item.title ?? item.id)}</a><p>${htmlEscape(item.objective ?? 'No objective recorded')} · ${(item.task_ids ?? []).length} task(s) · ${(item.gates ?? []).length} gate(s)</p></div><span class="tag">${htmlEscape(item.status)}</span></li>`, 'No active sprint or open run. Standalone ready tasks remain visible above.')
    + (coordinationItems.length > 20 ? `<p class="empty">${coordinationItems.length - 20} more coordination record(s) are available through the canonical folders.</p>` : '')
  const purpose = model.desired_outcome || model.project_summary || 'Project outcome is not declared yet; set it in .project-os/project.json.'
  const payload = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><meta name="generator" content="siso-project-os@${PROJECT_OS_VERSION}/onboarding"><meta name="project-os-source-commit" content="${htmlEscape(snapshot.generation.source_commit ?? '')}"><meta name="project-os-input-digest" content="${htmlEscape(snapshot.generation.input_digest)}"><title>${htmlEscape(model.project_name)} · Project OS</title>
<style>:root{color-scheme:light;--ink:#17202a;--muted:#647184;--paper:#f7f5ef;--card:#fff;--line:#dcd8cc;--accent:#2254d1;--warn:#9b4510}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif}main{width:min(1120px,calc(100% - 32px));margin:32px auto 72px}header{padding:28px 30px;border:1px solid var(--line);background:var(--ink);color:white;border-radius:18px}header p{color:#c9d0d9;max-width:760px}.purpose{font-size:1.05rem;color:white}h1{font-size:clamp(2rem,5vw,4rem);line-height:1;margin:.15em 0}h2{margin:0 0 8px;font-size:1.25rem}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.72rem;font-weight:750}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;min-width:0}.wide{grid-column:1/-1}.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.pill,.tag{display:inline-flex;gap:5px;align-items:center;border:1px solid #d9deea;border-radius:999px;padding:4px 9px;background:#f5f7fb;color:var(--ink);font-size:.75rem}.attention{color:var(--warn);background:#fff4e8;border-color:#f0c69f}.stack{list-style:none;padding:0;margin:14px 0 0}.stack li{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;border-top:1px solid #ebe8df;padding:12px 0}.stack p{color:var(--muted);font-size:.85rem;margin:3px 0}.empty{color:var(--muted);border-top:1px solid #ebe8df;padding-top:12px}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}code{font:13px/1.4 ui-monospace,SFMono-Regular,monospace;background:#eff1f4;padding:2px 5px;border-radius:4px}.steps{padding-left:20px}.steps li{margin:8px 0}.truth{width:100%;border-collapse:collapse}.truth td{padding:8px 0;border-top:1px solid #ebe8df;vertical-align:top}.truth td:first-child{width:34%;font-weight:700}footer{color:var(--muted);font-size:.8rem;margin-top:18px}p,footer,code,a{overflow-wrap:anywhere}@media(max-width:760px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}header{padding:24px 20px}.stack li{display:block}.tag{margin-top:7px}}</style></head>
<body data-project-os-view="onboarding" data-contract="project-os-cockpit" data-contract-version="1" data-source-commit="${htmlEscape(snapshot.generation.source_commit ?? '')}" data-input-digest="${htmlEscape(snapshot.generation.input_digest)}"><main id="project-os-cockpit"><header><div class="eyebrow">Project OS · shared operating surface</div><h1>${htmlEscape(model.project_name)}</h1><p class="purpose">${htmlEscape(purpose)}</p><p>Generated projection, never a second source of truth. Canonical writes stay in the linked records.</p><div class="pills">${statusPills(model)}<span class="pill"><b>${model.counts.sprints}</b> sprints</span><span class="pill"><b>${model.counts.runs}</b> runs</span><span class="pill"><b>${model.counts.campaigns}</b> UI campaigns</span></div></header>
<div class="grid"><section class="card" id="agent-start" data-contract="agent-start" aria-labelledby="agent-start-title"><div class="eyebrow">Agent boot · six moves</div><h2 id="agent-start-title">Cold-pickup protocol</h2><ol class="steps"><li>Read <a href="../../AGENTS.md">AGENTS.md</a> — binding repository rules.</li><li>Read <a href="../../PROJECT-OS.html">PROJECT-OS.html</a> — one destination per question.</li><li>Run <code>project-os onboard --json</code> — health, attention, and next work.</li><li>Open the selected canonical <code>task.json</code>; confirm dependencies, acceptance, and file fence.</li><li>Record the attempt with a linked run packet; update only through Project OS commands.</li><li>Verify, attach receipts, run <code>project-os check</code>, then hand off from Git truth.</li></ol></section>
<section class="card" id="human-start" data-contract="human-start" aria-labelledby="human-start-title"><div class="eyebrow">Human boot · one page</div><h2 id="human-start-title">What needs judgment?</h2><p>Start with the attention queue, then scan the delivery trunk. Decisions belong in task or UI decision records—not chat.</p><p><a href="../../docs/project-os/ONBOARDING.html">Read the full operating guide →</a></p><p><b>Live health:</b> requires <code>project-os check --json</code>. A static file cannot prove nothing changed after generation.</p></section>
<section class="card wide" id="human-attention" data-contract="human-attention" data-item-count="${model.human_attention.length}" aria-labelledby="human-attention-title"><div class="eyebrow">Needs you</div><h2 id="human-attention-title">Human-attention queue (${model.human_attention.length})</h2>${attention}</section>
<section class="card" id="next-work" data-contract="next-work" data-item-count="${model.next_work.length}" aria-labelledby="next-work-title"><div class="eyebrow">Agent-ready</div><h2 id="next-work-title">Next unblocked work</h2>${nextWork}</section>
<section class="card" id="ui-campaigns" data-contract="ui-campaigns" aria-labelledby="ui-campaigns-title"><div class="eyebrow">Visual delivery</div><h2 id="ui-campaigns-title">Active UI campaigns</h2>${campaigns}</section>
<section class="card wide" id="active-delivery" data-contract="active-delivery" data-item-count="${coordinationItems.length}" aria-labelledby="active-delivery-title"><div class="eyebrow">You are here</div><h2 id="active-delivery-title">Active sprints and runs</h2>${coordination}</section>
<section class="card wide" id="delivery-trunk" data-contract="delivery-trunk" data-item-count="${snapshot.tasks.length}" aria-labelledby="delivery-trunk-title"><div class="eyebrow">Canonical journey</div><h2 id="delivery-trunk-title">Project delivery trunk (${snapshot.tasks.length})</h2>${trunk}</section>
<section class="card" id="truth-map" data-contract="truth-map" aria-labelledby="truth-map-title"><div class="eyebrow">Do not improvise homes</div><h2 id="truth-map-title">Truth map</h2><table class="truth"><tr><td>Committed work</td><td><a href="../../.agents/tasks/">.agents/tasks/</a></td></tr><tr><td>Delivery windows</td><td><a href="../../.agents/sprints/">.agents/sprints/</a></td></tr><tr><td>Execution attempts</td><td><a href="../../.agents/runs/">.agents/runs/</a></td></tr><tr><td>Durable knowledge</td><td><a href="../../docs/spine/INDEX.html">docs/spine/</a></td></tr><tr><td>UI decisions</td><td><a href="../../.uihub/campaigns/">.uihub/campaigns/</a></td></tr><tr><td>Generated views</td><td><a href="./project-index.html">.project-os/generated/</a></td></tr></table></section>
<section class="card" id="commands" data-contract="commands" aria-labelledby="commands-title"><div class="eyebrow">Executable layout</div><h2 id="commands-title">Common commands</h2><p><code>project-os task create --title "Outcome"</code></p><p><code>project-os task update TASK-0001 --by agent --status in_progress</code></p><p><code>project-os run create --task TASK-0001 --title "Attempt"</code></p><p><code>project-os ui create --task TASK-0001 --title "Surface"</code></p><p><code>project-os build &amp;&amp; project-os check</code></p></section></div>
<footer>Generated from ${htmlEscape(snapshot.generation.input_digest)} · source commit ${htmlEscape(snapshot.generation.source_commit ?? 'uncommitted')} · never edit this file by hand.</footer><script id="project-os-state" type="application/json" data-schema="project-os-cockpit.v1">${machineState}</script><script>(()=>{const required=['agent-start','human-attention','next-work','active-delivery','delivery-trunk','truth-map','commands'];const snapshot=()=>JSON.parse(document.getElementById('project-os-state').textContent);const contracts=()=>Array.from(document.querySelectorAll('[data-contract]')).map((node)=>node.dataset.contract);window.__verify=Object.freeze({version:'project-os-cockpit.v1',snapshot,manifest:()=>({contract:document.body.dataset.contract,version:document.body.dataset.contractVersion,contracts:contracts()}),runAll:()=>{const present=contracts();return [{id:'cockpit.contract',verdict:document.body.dataset.contract==='project-os-cockpit'?'PASS':'FAIL',expected:'project-os-cockpit',actual:document.body.dataset.contract},{id:'cockpit.required-sections',verdict:required.every((id)=>present.includes(id))?'PASS':'FAIL',expected:required,actual:present},{id:'cockpit.input-digest',verdict:snapshot().generated_from.input_digest===document.body.dataset.inputDigest?'PASS':'FAIL',expected:snapshot().generated_from.input_digest,actual:document.body.dataset.inputDigest}]}});})();</script></main></body></html>`
  return payload.replace('<title>', `<meta name="project-os-output-digest" content="${sha256(payload)}"><title>`)
}

export function onboardingReport(root, snapshot, check) {
  const model = onboardingModel(snapshot)
  return {
    ok: check.ok,
    root,
    project_name: snapshot.project_name,
    project_summary: snapshot.project_summary,
    desired_outcome: snapshot.desired_outcome,
    guide: '.project-os/generated/onboarding.html',
    check: {
      errors: check.errors.length,
      warnings: check.warnings.length,
      error_codes: [...new Set(check.errors.map((error) => error.code))].sort(),
    },
    counts: model.counts,
    human_attention: model.human_attention,
    next_work: model.next_work,
    boot_order: AGENT_BOOT_ORDER,
  }
}

export function formatOnboardingReport(report) {
  const health = report.ok ? 'PASS' : `FAIL (${report.check.errors} errors)`
  const next = report.next_work[0]
    ? `${report.next_work[0].id} — ${report.next_work[0].title}`
    : 'No unblocked canonical task is ready'
  return [
    `${report.project_name} · Project OS ${health}`,
    `Guide: ${report.guide}`,
    `Human attention: ${report.human_attention.length}`,
    `Next work: ${next}`,
    `Boot: ${report.boot_order.join(' → ')}`,
  ].join('\n')
}
