import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'components', 'lib', 'messages']
const CODE_EXTS = new Set(['.ts', '.tsx', '.json'])

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
      continue
    }
    if (CODE_EXTS.has(path.extname(entry.name))) out.push(full)
  }
}

function flatten(obj, prefix = '', out = {}) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix] = obj
    return out
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    flatten(v, key, out)
  }
  return out
}

function readText(file) {
  return fs.readFileSync(file, 'utf8')
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    critical: [],
    warnings: [],
    info: [],
  }

  const files = []
  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir)
    if (fs.existsSync(abs)) walk(abs, files)
  }

  // 1) Broken encoding markers
  // UTF-8 baytlarının Latin-1 okunması (Ã§, Ä±, Å…: ikinci bayt 0x80–0xBF) veya U+FFFD.
  // Türkçe şapkalı harfler (ŞİKÂYET, Elâzığ) bozulma sayılmaz.
  const mojibake = /[ÃÄÅÂ][\u0080-¿]|�/
  for (const file of files) {
    const content = readText(file)
    if (mojibake.test(content)) report.critical.push(`Mojibake marker found: ${path.relative(ROOT, file)}`)
  }

  // 2) i18n parity
  const trPath = path.join(ROOT, 'messages', 'tr.json')
  const enPath = path.join(ROOT, 'messages', 'en.json')
  if (fs.existsSync(trPath) && fs.existsSync(enPath)) {
    const trFlat = flatten(JSON.parse(readText(trPath)))
    const enFlat = flatten(JSON.parse(readText(enPath)))
    const trKeys = Object.keys(trFlat)
    const enKeys = Object.keys(enFlat)
    const missingInEn = trKeys.filter((k) => !(k in enFlat))
    const missingInTr = enKeys.filter((k) => !(k in trFlat))
    if (missingInEn.length) report.warnings.push(`Missing keys in en.json: ${missingInEn.length}`)
    if (missingInTr.length) report.warnings.push(`Missing keys in tr.json: ${missingInTr.length}`)
    report.info.push(`i18n key count tr=${trKeys.length}, en=${enKeys.length}`)
  } else {
    report.critical.push('messages/tr.json or messages/en.json missing')
  }

  // 3) Required SEO files
  const seoFiles = ['app/layout.tsx', 'app/robots.ts', 'app/sitemap.ts']
  for (const rel of seoFiles) {
    if (!exists(rel)) report.critical.push(`Missing SEO file: ${rel}`)
  }

  // 4) Required core route pages
  const coreRoutes = [
    'app/page.tsx',
    'app/products/page.tsx',
    'app/products/[id]/page.tsx',
    'app/category/[id]/page.tsx',
    'app/faq/page.tsx',
    'app/contact/page.tsx',
  ]
  for (const rel of coreRoutes) {
    if (!exists(rel)) report.critical.push(`Missing core route: ${rel}`)
  }

  // 5) Admin protection checks
  const middlewarePath = path.join(ROOT, 'middleware.ts')
  if (!fs.existsSync(middlewarePath)) {
    report.critical.push('Missing middleware.ts for admin route guard')
  } else {
    const middleware = readText(middlewarePath)
    if (!middleware.includes("pathname.startsWith('/admin')")) {
      report.critical.push('Admin path guard not found in middleware.ts')
    }
  }

  const adminApiDir = path.join(ROOT, 'app', 'api', 'admin')
  if (fs.existsSync(adminApiDir)) {
    const adminRoutes = []
    walk(adminApiDir, adminRoutes)
    const routeFiles = adminRoutes.filter((f) => path.basename(f) === 'route.ts')
    const exempt = new Set(['app/api/admin/auth/route.ts', 'app/api/admin/logout/route.ts'])
    for (const file of routeFiles) {
      const rel = path.relative(ROOT, file).replaceAll('\\', '/')
      if (exempt.has(rel)) continue
      const content = readText(file)
      if (!content.includes('checkAdmin(')) {
        report.critical.push(`Admin API without checkAdmin: ${rel}`)
      }
    }
    report.info.push(`Admin API routes checked: ${routeFiles.length}`)
  } else {
    report.warnings.push('Admin API directory not found')
  }

  // 6) Basic page semantics check (H1 count > 1 warning)
  const pageFiles = []
  walk(path.join(ROOT, 'app'), pageFiles)
  for (const file of pageFiles.filter((f) => f.endsWith('page.tsx'))) {
    const rel = path.relative(ROOT, file).replaceAll('\\', '/')
    if (rel.includes('/api/')) continue
    const content = readText(file)
    const h1Count = (content.match(/<h1[\s>]/g) || []).length
    if (h1Count > 1) report.warnings.push(`Multiple h1 (${h1Count}): ${rel}`)
  }

  // Write report
  const outDir = path.join(ROOT, 'docs')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'site-audit-report.json'), JSON.stringify(report, null, 2), 'utf8')

  const lines = []
  lines.push('# Site Audit Report')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push('')
  lines.push(`- Critical: ${report.critical.length}`)
  lines.push(`- Warnings: ${report.warnings.length}`)
  lines.push(`- Info: ${report.info.length}`)
  lines.push('')
  if (report.critical.length) {
    lines.push('## Critical')
    for (const item of report.critical) lines.push(`- ${item}`)
    lines.push('')
  }
  if (report.warnings.length) {
    lines.push('## Warnings')
    for (const item of report.warnings) lines.push(`- ${item}`)
    lines.push('')
  }
  if (report.info.length) {
    lines.push('## Info')
    for (const item of report.info) lines.push(`- ${item}`)
    lines.push('')
  }
  fs.writeFileSync(path.join(outDir, 'site-audit-report.md'), lines.join('\n'), 'utf8')

  if (report.critical.length > 0) {
    console.error(`Audit failed with ${report.critical.length} critical issues.`)
    process.exit(1)
  }

  console.log(`Audit passed. warnings=${report.warnings.length}`)
}

main()
