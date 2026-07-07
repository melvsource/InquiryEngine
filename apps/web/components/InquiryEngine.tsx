'use client';

// apps/web/components/InquiryEngine.tsx
// Full Inquiry Engine UI — input, loading, report rendering.
// Drop this into any page.

import { useState } from 'react';
import { runInquiry, InquiryReport } from '../lib/inquiry';

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
      html += `<h3 class="ie-h3">${inline(line.slice(4))}</h3>`;
    } else if (line.match(/^[-•]\s/)) {
      if (!inUl) { closeList(); html += '<ul class="ie-ul">'; inUl = true; }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else if (line.match(/^\d+\.\s/)) {
      if (!inOl) { closeList(); html += '<ol class="ie-ol">'; inOl = true; }
      html += `<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`;
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html += `<p class="ie-p">${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function InquiryEngine() {
  const [subject, setSubject]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [report, setReport]     = useState<InquiryReport | null>(null);
  const [error, setError]       = useState<string | null>(null);

  async function handleInquiry() {
    const trimmed = subject.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await runInquiry(trimmed);
      setReport(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInquiry();
    }
  }

  function handleReset() {
    setReport(null);
    setError(null);
    setSubject('');
  }

  return (
    <>
      <style>{`
        /* ── Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');

        :root {
          --ie-parchment: #F0EBE0;
          --ie-parchment-dark: #E6DFD0;
          --ie-ink: #1A1814;
          --ie-ink-soft: #2E2B25;
          --ie-gold: #B8942A;
          --ie-gold-light: #D4AF50;
          --ie-slate: #6B7280;
          --ie-slate-light: #9CA3AF;
          --ie-divider: rgba(184,148,42,0.25);
          --ie-report-bg: #FEFCF8;
        }

        .ie-wrap {
          background: var(--ie-parchment);
          color: var(--ie-ink);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }

        /* Header */
        .ie-header {
          text-align: center;
          padding: 72px 24px 48px;
          position: relative;
        }
        .ie-header::after {
          content: '';
          display: block;
          width: 1px;
          height: 48px;
          background: var(--ie-gold);
          margin: 32px auto 0;
          opacity: 0.5;
        }
        .ie-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--ie-gold);
          margin-bottom: 20px;
        }
        .ie-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 8vw, 96px);
          font-weight: 300;
          font-style: italic;
          color: var(--ie-ink);
          line-height: 1;
          margin-bottom: 16px;
        }
        .ie-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(16px, 2.5vw, 22px);
          font-weight: 300;
          color: var(--ie-slate);
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Input */
        .ie-input-section {
          max-width: 680px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        .ie-input-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--ie-gold);
          display: block;
          margin-bottom: 14px;
        }
        .ie-textarea {
          width: 100%;
          background: var(--ie-report-bg);
          border: 1px solid var(--ie-divider);
          border-bottom: 2px solid var(--ie-gold);
          padding: 18px 20px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          color: var(--ie-ink);
          outline: none;
          resize: none;
          min-height: 72px;
          line-height: 1.4;
          transition: box-shadow 0.2s;
        }
        .ie-textarea::placeholder { color: var(--ie-slate-light); font-style: italic; }
        .ie-textarea:focus { box-shadow: 0 4px 24px rgba(184,148,42,0.08); }
        .ie-textarea:disabled { opacity: 0.5; }

        .ie-submit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ie-hint {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--ie-slate-light);
          letter-spacing: 0.1em;
        }
        .ie-btn {
          background: var(--ie-ink);
          color: var(--ie-parchment);
          border: none;
          padding: 14px 36px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          flex-shrink: 0;
        }
        .ie-btn:hover:not(:disabled) { background: var(--ie-gold); color: #fff; }
        .ie-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Loading */
        .ie-loading {
          text-align: center;
          padding: 64px 24px;
          max-width: 680px;
          margin: 0 auto;
        }
        .ie-glyph {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          color: var(--ie-gold);
          display: block;
          margin-bottom: 24px;
          animation: ie-breathe 2s ease-in-out infinite;
        }
        .ie-loading-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--ie-slate);
          animation: ie-pulse 1.5s ease-in-out infinite;
        }
        @keyframes ie-breathe {
          0%, 100% { opacity: 0.3; transform: scale(0.97); }
          50%       { opacity: 1;   transform: scale(1.03); }
        }
        @keyframes ie-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }

        /* Error */
        .ie-error {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 24px 48px;
        }
        .ie-error-box {
          border: 1px solid rgba(180,60,60,0.3);
          background: rgba(180,60,60,0.04);
          padding: 20px 24px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #8B2020;
          letter-spacing: 0.05em;
        }

        /* Report */
        .ie-report {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px 96px;
        }
        .ie-report-header {
          text-align: center;
          padding: 48px 0 40px;
          border-top: 1px solid var(--ie-divider);
          border-bottom: 1px solid var(--ie-divider);
          animation: ie-fadeup 0.6s ease forwards;
        }
        .ie-report-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--ie-gold);
          margin-bottom: 16px;
        }
        .ie-report-subject {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 400;
          font-style: italic;
          color: var(--ie-ink);
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .ie-report-objective {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 300;
          color: var(--ie-slate);
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.5;
        }
        .ie-report-body {
          background: var(--ie-report-bg);
          border: 1px solid var(--ie-divider);
        }
        .ie-section {
          padding: 40px 48px;
          border-bottom: 1px solid var(--ie-divider);
          animation: ie-fadeup 0.5s ease forwards;
        }
        .ie-section:last-child { border-bottom: none; }
        .ie-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--ie-gold);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ie-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--ie-divider);
        }
        .ie-section-content {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          color: var(--ie-ink-soft);
          line-height: 1.75;
        }
        .ie-section-content .ie-h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          color: var(--ie-ink);
          margin: 28px 0 10px;
        }
        .ie-section-content .ie-p { margin-bottom: 16px; }
        .ie-section-content .ie-p:last-child { margin-bottom: 0; }
        .ie-section-content .ie-ul,
        .ie-section-content .ie-ol {
          padding-left: 0;
          list-style: none;
          margin-bottom: 16px;
        }
        .ie-section-content li {
          padding-left: 20px;
          margin-bottom: 8px;
          position: relative;
        }
        .ie-section-content .ie-ul li::before {
          content: '·';
          position: absolute;
          left: 6px;
          color: var(--ie-gold);
          font-size: 20px;
          line-height: 1.4;
        }
        .ie-section-content strong { font-weight: 600; color: var(--ie-ink); }
        .ie-section-content em { font-style: italic; }

        /* Reset */
        .ie-reset-row { text-align: center; padding: 40px 0 0; }
        .ie-reset-btn {
          background: transparent;
          border: 1px solid var(--ie-divider);
          color: var(--ie-slate);
          padding: 10px 28px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .ie-reset-btn:hover { border-color: var(--ie-gold); color: var(--ie-gold); }

        @keyframes ie-fadeup {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .ie-section { padding: 28px 24px; }
          .ie-section-content { font-size: 17px; }
        }
      `}</style>

      <div className="ie-wrap">
        {/* Header */}
        <header className="ie-header">
          <div className="ie-eyebrow">A Proprietary Reasoning Instrument</div>
          <h1 className="ie-title">Inquiry Engine</h1>
          <p className="ie-tagline">
            From appearances to reality. From assumptions to understanding. From information to wisdom.
          </p>
        </header>

        {/* Input */}
        {!report && (
          <div className="ie-input-section">
            <label className="ie-input-label" htmlFor="ie-subject">
              Subject of Inquiry
            </label>
            <textarea
              id="ie-subject"
              className="ie-textarea"
              placeholder="Name a subject, question, title, concept, or claim…"
              rows={2}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="ie-submit-row">
              <span className="ie-hint">Enter to investigate · Shift+Enter for new line</span>
              <button
                className="ie-btn"
                onClick={handleInquiry}
                disabled={loading || !subject.trim()}
              >
                Investigate
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="ie-loading">
            <span className="ie-glyph">✦</span>
            <div className="ie-loading-text">Conducting investigation…</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ie-error">
            <div className="ie-error-box">{error}</div>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="ie-report">
            <div className="ie-report-header">
              <div className="ie-report-label">Inquiry Report</div>
              <div className="ie-report-subject">{report.subject}</div>
              {report.objective && (
                <div className="ie-report-objective">{report.objective}</div>
              )}
            </div>
            <div className="ie-report-body">
              {report.sections.map((section, i) => (
                <div
                  key={section.id}
                  className="ie-section"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="ie-section-label">{section.label}</div>
                  <div
                    className="ie-section-content"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(section.content) }}
                  />
                </div>
              ))}
            </div>
            <div className="ie-reset-row">
              <button className="ie-reset-btn" onClick={handleReset}>
                New Inquiry
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
