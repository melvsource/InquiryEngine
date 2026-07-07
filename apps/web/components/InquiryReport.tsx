'use client';

// apps/web/components/InquiryReport.tsx
// Renders the inquiry report inline below the homepage.
// Includes copy-to-clipboard and save-as-PDF (styled).

import { InquiryResult } from '../lib/inquiry';
import { useState } from 'react';

// ── Markdown parser ───────────────────────────────────────────────────────────
function parseMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  function closeList() {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  }

  function inline(text: string): string {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      closeList();
      html += `<h3 class="ie-rh3">${inline(line.slice(4))}</h3>`;
    } else if (line.match(/^[-•]\s/)) {
      if (!inUl) { closeList(); html += '<ul class="ie-rul">'; inUl = true; }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else if (line.match(/^\d+\.\s/)) {
      if (!inOl) { closeList(); html += '<ol class="ie-rol">'; inOl = true; }
      html += `<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`;
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html += `<p class="ie-rp">${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

// ── Plain text for clipboard ──────────────────────────────────────────────────
function toPlainText(result: InquiryResult): string {
  const { report } = result;
  let text = `INQUIRY REPORT\n`;
  text += `${'─'.repeat(40)}\n`;
  text += `Subject: ${report.subject}\n`;
  if (report.objective) text += `Objective: ${report.objective}\n`;
  text += `\n`;

  for (const section of report.sections) {
    text += `${section.label.toUpperCase()}\n`;
    text += `${'─'.repeat(section.label.length)}\n`;
    // Strip markdown
    const plain = section.content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,3}\s/g, '')
      .replace(/^[-•]\s/gm, '• ');
    text += `${plain}\n\n`;
  }

  text += `─`.repeat(40) + `\n`;
  text += `Inquiry Engine · inquiryengine.com\n`;
  return text;
}

// ── PDF print ─────────────────────────────────────────────────────────────────
function printAsPdf(result: InquiryResult) {
  const { report } = result;

  const sectionsHtml = report.sections.map((s) => `
    <div class="section">
      <div class="section-label">${s.label}</div>
      <div class="section-content">${parseMarkdown(s.content)}</div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Inquiry Report — ${report.subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cormorant Garamond', serif;
    font-size: 13pt;
    color: #1A1814;
    background: #F0EBE0;
    padding: 48px;
    max-width: 720px;
    margin: 0 auto;
  }
  .report-header {
    text-align: center;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(184,148,42,0.4);
    margin-bottom: 32px;
  }
  .report-eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #B8942A;
    margin-bottom: 12px;
  }
  .report-subject {
    font-size: 28pt;
    font-weight: 400;
    font-style: italic;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  .report-objective {
    font-size: 12pt;
    font-weight: 300;
    color: #6B7280;
    line-height: 1.5;
  }
  .section {
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(184,148,42,0.2);
  }
  .section:last-child { border-bottom: none; }
  .section-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #B8942A;
    margin-bottom: 14px;
  }
  .section-content { font-size: 12pt; line-height: 1.75; color: #2E2B25; }
  .section-content p { margin-bottom: 12px; }
  .section-content h3 { font-size: 14pt; font-weight: 500; margin: 20px 0 8px; }
  .section-content ul, .section-content ol { padding-left: 20px; margin-bottom: 12px; }
  .section-content li { margin-bottom: 6px; }
  .ie-rh3 { font-size: 14pt; font-weight: 500; margin: 20px 0 8px; color: #1A1814; }
  .ie-rp { margin-bottom: 12px; }
  .ie-rul, .ie-rol { padding-left: 20px; margin-bottom: 12px; }
  .footer {
    text-align: center;
    margin-top: 40px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    color: #9CA3AF;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  @media print {
    body { background: white; padding: 24px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="report-header">
  <div class="report-eyebrow">Inquiry Report</div>
  <div class="report-subject">${report.subject}</div>
  ${report.objective ? `<div class="report-objective">${report.objective}</div>` : ''}
</div>
${sectionsHtml}
<div class="footer">Inquiry Engine · All Rights Reserved</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 800);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function InquiryReportView({
  result,
  onReset,
}: {
  result: InquiryResult;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { report, source, savedAt } = result;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toPlainText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = toPlainText(result);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const savedDate = savedAt
    ? new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');

        .ie-report-wrap {
          background: #F0EBE0;
          border-top: 1px solid rgba(184,148,42,0.25);
          padding: 0 0 80px;
          animation: ie-fadein 0.5s ease forwards;
        }
        @keyframes ie-fadein {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Source badge */
        .ie-source-bar {
          text-align: center;
          padding: 14px 24px;
          background: rgba(184,148,42,0.06);
          border-bottom: 1px solid rgba(184,148,42,0.15);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #B8942A;
        }

        /* Report header */
        .ie-rpt-header {
          text-align: center;
          padding: 48px 24px 36px;
          border-bottom: 1px solid rgba(184,148,42,0.25);
        }
        .ie-rpt-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #B8942A;
          margin-bottom: 16px;
        }
        .ie-rpt-subject {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 400;
          font-style: italic;
          color: #1A1814;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .ie-rpt-objective {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #6B7280;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Sections */
        .ie-rpt-body {
          max-width: 760px;
          margin: 0 auto;
          background: #FEFCF8;
          border: 1px solid rgba(184,148,42,0.2);
          margin-top: 0;
        }
        .ie-rsection {
          padding: 36px 48px;
          border-bottom: 1px solid rgba(184,148,42,0.15);
          animation: ie-fadeup 0.5s ease forwards;
          opacity: 0;
        }
        .ie-rsection:last-child { border-bottom: none; }
        @keyframes ie-fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ie-slabel {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #B8942A;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ie-slabel::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(184,148,42,0.25);
        }
        .ie-scontent {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          color: #2E2B25;
          line-height: 1.75;
        }
        .ie-scontent .ie-rh3 {
          font-size: 21px;
          font-weight: 500;
          color: #1A1814;
          margin: 24px 0 10px;
        }
        .ie-scontent .ie-rp { margin-bottom: 14px; }
        .ie-scontent .ie-rp:last-child { margin-bottom: 0; }
        .ie-scontent .ie-rul,
        .ie-scontent .ie-rol {
          list-style: none;
          padding-left: 0;
          margin-bottom: 14px;
        }
        .ie-scontent .ie-rul li {
          padding-left: 20px;
          margin-bottom: 8px;
          position: relative;
        }
        .ie-scontent .ie-rul li::before {
          content: '·';
          position: absolute;
          left: 6px;
          color: #B8942A;
          font-size: 20px;
          line-height: 1.4;
        }
        .ie-scontent .ie-rol li {
          padding-left: 20px;
          margin-bottom: 8px;
          position: relative;
        }
        .ie-scontent strong { font-weight: 600; color: #1A1814; }
        .ie-scontent em { font-style: italic; }

        /* Action bar */
        .ie-action-bar {
          max-width: 760px;
          margin: 0 auto;
          padding: 24px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ie-action-left {
          display: flex;
          gap: 12px;
        }
        .ie-action-btn {
          background: transparent;
          border: 1px solid rgba(184,148,42,0.35);
          color: #6B7280;
          padding: 10px 20px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ie-action-btn:hover {
          border-color: #B8942A;
          color: #B8942A;
        }
        .ie-action-btn.active {
          border-color: #B8942A;
          color: #B8942A;
          background: rgba(184,148,42,0.06);
        }
        .ie-new-btn {
          background: transparent;
          border: 1px solid #e5e7eb;
          color: #9CA3AF;
          padding: 10px 20px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .ie-new-btn:hover { border-color: #6B7280; color: #6B7280; }

        /* Save note */
        .ie-save-note {
          max-width: 760px;
          margin: 16px auto 0;
          padding: 14px 20px;
          background: rgba(184,148,42,0.06);
          border-left: 3px solid #B8942A;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #B8942A;
          letter-spacing: 0.1em;
          line-height: 1.6;
        }

        @media (max-width: 600px) {
          .ie-rsection { padding: 24px 20px; }
          .ie-scontent { font-size: 17px; }
          .ie-action-bar { justify-content: center; }
        }
      `}</style>

      <div className="ie-report-wrap">
        {/* Source indicator */}
        <div className="ie-source-bar">
          {source === 'library'
            ? `↩ Retrieved from library${savedDate ? ` · Saved ${savedDate}` : ''}`
            : `✦ Fresh investigation · Saved to library`}
        </div>

        {/* Report header */}
        <div className="ie-rpt-header">
          <div className="ie-rpt-eyebrow">Inquiry Report</div>
          <div className="ie-rpt-subject">{report.subject}</div>
          {report.objective && (
            <div className="ie-rpt-objective">{report.objective}</div>
          )}
        </div>

        {/* Sections */}
        <div className="ie-rpt-body">
          {report.sections.map((section, i) => (
            <div
              key={section.id}
              className="ie-rsection"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="ie-slabel">{section.label}</div>
              <div
                className="ie-scontent"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(section.content) }}
              />
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="ie-action-bar">
          <div className="ie-action-left">
            <button
              className={`ie-action-btn${copied ? ' active' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
            <button
              className="ie-action-btn"
              onClick={() => printAsPdf(result)}
            >
              ↓ Save as PDF
            </button>
          </div>
          <button className="ie-new-btn" onClick={onReset}>
            New Inquiry
          </button>
        </div>

        {/* Save note */}
        <div className="ie-save-note">
          ⚠ Save this now — reports reflect the investigation at the time of inquiry
          and may be refreshed after {30} days.
          Use Copy or Save as PDF to keep a permanent record.
        </div>
      </div>
    </>
  );
}
