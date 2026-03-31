/**
 * exportUtils.js — JSON and PDF export helpers (upgraded)
 */

export function exportJSON(result) {
  const payload = {
    run_id: result.run_id,
    generated_at: result.generated_at,
    language: result.language,
    coverage_score: result.coverage_score,
    coverage_breakdown: result.coverage_breakdown,
    test_cases: result.test_cases,
    functional_tests: result.functional_tests || [],
    edge_cases: result.edge_cases,
    bug_predictions: result.bug_predictions,
    fix_suggestions: result.fix_suggestions,
    ui_analysis: result.ui_analysis || {},
    explanation: result.explanation,
    improvements: result.improvements,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `qa-report-${result.run_id || Date.now()}.json` })
  a.click(); URL.revokeObjectURL(url)
}

export async function exportPDF(result) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const mg = 14
  const uw = pw - mg * 2
  let y    = mg

  const np = (need = 10) => { if (y + need > 283) { doc.addPage(); y = mg } }

  const h1 = (t, sz = 13) => {
    np(12); doc.setFontSize(sz); doc.setFont('helvetica', 'bold'); doc.setTextColor(6, 182, 212)
    doc.text(t, mg, y); y += sz * 0.45 + 3; doc.setTextColor(40, 40, 40)
  }
  const txt = (t, sz = 9, color = [70, 70, 90]) => {
    doc.setFontSize(sz); doc.setFont('helvetica', 'normal'); doc.setTextColor(...color)
    const lines = doc.splitTextToSize(String(t), uw)
    np(lines.length * (sz * 0.38 + 0.8))
    doc.text(lines, mg, y); y += lines.length * (sz * 0.38 + 0.8) + 1.5
  }
  const div = () => { np(5); doc.setDrawColor(220, 220, 230); doc.line(mg, y, pw - mg, y); y += 4 }
  const small = (t) => txt(t, 8, [120, 120, 140])

  // ── Cover ──────────────────────────────────────────────────────────────────
  doc.setFillColor(3, 7, 18)
  doc.rect(0, 0, pw, 48, 'F')
  doc.setFillColor(6, 182, 212, 0.8)
  doc.rect(0, 48, pw, 2, 'F')
  doc.setFontSize(20); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold')
  doc.text('AI QA Automation Report', mg, 20)
  doc.setFontSize(10); doc.setTextColor(100,160,200)
  doc.text(`Run #${result.run_id || '?'}  ·  Language: ${result.language || 'N/A'}  ·  Coverage: ${result.coverage_score?.toFixed(1)}%`, mg, 30)
  doc.text(`Generated: ${result.generated_at ? new Date(result.generated_at).toLocaleString() : 'N/A'}`, mg, 38)
  y = 60

  // ── Coverage ───────────────────────────────────────────────────────────────
  h1('Coverage Summary')
  txt(`Overall: ${result.coverage_score?.toFixed(1)}% — ${result.coverage_score >= 80 ? 'Good' : result.coverage_score >= 60 ? 'Fair' : 'Needs Work'}`)
  Object.entries(result.coverage_breakdown || {}).forEach(([k, v]) => small(`  ${k.replace(/_/g,' ')}: ${v}%`))
  div()

  // ── Test Cases ─────────────────────────────────────────────────────────────
  h1(`Test Cases (${result.test_cases?.length || 0})`)
  ;(result.test_cases || []).forEach((tc, i) => {
    np(28); doc.setFontSize(10); doc.setTextColor(6,182,212); doc.setFont('helvetica','bold')
    doc.text(`${i+1}. ${tc.name}`, mg, y); y += 5
    txt(tc.description)
    small(`Input: ${tc.input}`)
    small(`Expected: ${tc.expected_output}`)
    small(`Category: ${tc.category}  ·  Priority: ${tc.priority}`)
    y += 2
  })
  div()

  // ── Edge Cases ─────────────────────────────────────────────────────────────
  h1(`Edge Cases (${result.edge_cases?.length || 0})`)
  ;(result.edge_cases || []).forEach((ec, i) => {
    np(20); doc.setFontSize(10); doc.setTextColor(245,158,11); doc.setFont('helvetica','bold')
    doc.text(`${i+1}. ${ec.scenario.replace(/_/g,' ')}  [${ec.risk_level}]`, mg, y); y += 5
    txt(ec.description); small(`Suggestion: ${ec.suggestion}`); y += 2
  })
  div()

  // ── Bug Predictions ────────────────────────────────────────────────────────
  if (result.bug_predictions?.length) {
    h1(`Bug Predictions (${result.bug_predictions.length})`)
    ;(result.bug_predictions || []).forEach((b, i) => {
      np(16); doc.setFontSize(10); doc.setTextColor(239,68,68); doc.setFont('helvetica','bold')
      doc.text(`${i+1}. ${b.title}  [${b.severity}]`, mg, y); y += 5
      txt(b.description); y += 2
    })
    div()
  }

  // ── Explanation ────────────────────────────────────────────────────────────
  h1('Analysis & Improvements')
  txt(result.explanation || '')
  y += 3
  ;(result.improvements || []).forEach((imp, i) => small(`${i+1}. ${imp}`))

  doc.save(`qa-report-${result.run_id || Date.now()}.pdf`)
}
