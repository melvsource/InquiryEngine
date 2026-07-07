'use client';

// apps/web/components/InquiryModal.tsx
// Renders as a modal overlay triggered by "Start an Inquiry".
// The homepage layout is never touched.

import { useState, useEffect, useCallback } from 'react';
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
      html += `<h3 style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:#1A1814;margin:28px 0 10px;">${inline(line.slice(4))}</h3>`;
    } else if (line.match(/^[-•]\s/)) {
      if (!inUl) { closeList(); html += '<ul style="list-style:none;padding-left:0;margin-bottom:16px;">'; inUl = true; }
      html += `<li style="padding-left:20px;margin-bottom:8px;position:relative;"><span style="position:absolute;left:6px;color:#B8942A;font-size:20px;line-height:1.4;">·</span>${inline(line.slice(2))}</li>`;
    } else if (line.match(/^\d+\.\s/)) {
      if (!inOl) { closeList(); html += '<ol style="list-style:none;padding-left:0;margin-bottom:16px;counter-reset:item;">'; inOl = true; }
      html += `<li style="padding-left:20px;margin-bottom:8px;position:relative;counter-increment:item;"><span style="position:absolute;left:0;color:#B8942A;font-family:'IBM Plex Mono',monospace;font-size:11px;top:4px;">${line.match(/^\d+/)?.[0]??''}.</span>${inline(line.replace(/^\d+\.\s/, ''))}</li>`;
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html += `<p style="margin-bottom:16px;">${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function InquiryModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [report, setReport]     = useState<InquiryReport | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Close on Escape key
  const handleKeyGlobal = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyGlobal);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyGlobal);
      document.body.style.overflow = '';
    };
  }, [handleKeyGlobal]);

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
      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');
        .ie-breathe { animation: ie-breathe 2s ease-in-out infinite; }
        .ie-pulse   { animation: ie-pulse 1.5s ease-in-out infinite; }
        @keyframes ie-breathe {
          0%,100% { opacity:0.3; transform:scale(0.97); }
          50%     { opacity:1;   transform:scale(1.03); }
        }
        @keyframes ie-pulse {
          0%,100% { opacity:0.4; }
          50%     { opacity:1; }
        }
        .ie-section-reveal {
          animation: ie-fadeup 0.5s ease forwards;
        }
        @keyframes ie-fadeup {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .ie-reset-btn:hover { border-color:#B8942A !important; color:#B8942A !important; }
        .ie-close-btn:hover { background:rgba(0,0,0,0.08) !important; }
        .ie-submit-btn:hover:not(:disabled) { background:#B8942A !important; }
        .ie-textarea:focus { box-shadow:0 4px 24px rgba(184,148,42,0.1); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '40px 16px',
        }}
      >
        {/* Panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#F0EBE0',
            width: '100%',
            maxWidth: '760px',
            borderRadius: 0,
            position: 'relative',
            minHeight: '300px',
          }}
        >
          {/* Close button */}
          <button
            className="ie-close-btn"
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '8px',
              borderRadius: '4px', transition: 'background 0.2s',
              color: '#6B7280', fontSize: '20px', lineHeight: 1,
              zIndex: 10,
            }}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Header */}
          <div style={{
            textAlign: 'center',
            padding: '56px 32px 40px',
            borderBottom: '1px solid rgba(184,148,42,0.25)',
            position: 'relative',
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#B8942A',
              marginBottom: '16px',
            }}>
              A Proprietary Reasoning Instrument
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(40px,7vw,72px)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#1A1814',
              lineHeight: 1,
              marginBottom: '12px',
            }}>
              Inquiry Engine
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '18px',
              fontWeight: 300,
              color: '#6B7280',
              maxWidth: '480px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}>
              From appearances to reality. From assumptions to understanding.
            </p>
          </div>

          {/* Input area */}
          {!report && (
            <div style={{ padding: '40px 48px' }}>
              <label style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#B8942A',
                display: 'block',
                marginBottom: '14px',
              }}>
                Subject of Inquiry
              </label>
              <textarea
                className="ie-textarea"
                placeholder="Name a subject, question, title, concept, or claim…"
                rows={2}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#FEFCF8',
                  border: '1px solid rgba(184,148,42,0.25)',
                  borderBottom: '2px solid #B8942A',
                  padding: '18px 20px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '22px',
                  fontWeight: 400,
                  color: '#1A1814',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '72px',
                  lineHeight: 1.4,
                  transition: 'box-shadow 0.2s',
                  opacity: loading ? 0.5 : 1,
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  color: '#9CA3AF',
                  letterSpacing: '0.1em',
                }}>
                  Enter to investigate · Shift+Enter for new line
                </span>
                <button
                  className="ie-submit-btn"
                  onClick={handleInquiry}
                  disabled={loading || !subject.trim()}
                  style={{
                    background: '#1A1814',
                    color: '#F0EBE0',
                    border: 'none',
                    padding: '14px 36px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    cursor: loading || !subject.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    opacity: loading || !subject.trim() ? 0.4 : 1,
                  }}
                >
                  Investigate
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <span className="ie-breathe" style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '48px',
                color: '#B8942A',
                display: 'block',
                marginBottom: '24px',
              }}>✦</span>
              <div className="ie-pulse" style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}>
                Conducting investigation…
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '0 48px 40px' }}>
              <div style={{
                border: '1px solid rgba(180,60,60,0.3)',
                background: 'rgba(180,60,60,0.04)',
                padding: '20px 24px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                color: '#8B2020',
                letterSpacing: '0.05em',
              }}>
                {error}
              </div>
            </div>
          )}

          {/* Report */}
          {report && (
            <div>
              {/* Report header */}
              <div style={{
                textAlign: 'center',
                padding: '40px 48px 32px',
                borderBottom: '1px solid rgba(184,148,42,0.25)',
              }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: '#B8942A',
                  marginBottom: '12px',
                }}>
                  Inquiry Report
                </div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(24px,4vw,36px)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: '#1A1814',
                  lineHeight: 1.2,
                  marginBottom: '10px',
                }}>
                  {report.subject}
                </div>
                {report.objective && (
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '16px',
                    fontWeight: 300,
                    color: '#6B7280',
                    maxWidth: '480px',
                    margin: '0 auto',
                    lineHeight: 1.5,
                  }}>
                    {report.objective}
                  </div>
                )}
              </div>

              {/* Sections */}
              <div style={{ background: '#FEFCF8', border: '1px solid rgba(184,148,42,0.25)' }}>
                {report.sections.map((section, i) => (
                  <div
                    key={section.id}
                    className="ie-section-reveal"
                    style={{
                      padding: '36px 48px',
                      borderBottom: i < report.sections.length - 1
                        ? '1px solid rgba(184,148,42,0.25)'
                        : 'none',
                      animationDelay: `${i * 100}ms`,
                      opacity: 0,
                    }}
                  >
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.35em',
                      textTransform: 'uppercase',
                      color: '#B8942A',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      {section.label}
                      <span style={{ flex: 1, height: '1px', background: 'rgba(184,148,42,0.25)' }} />
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '18px',
                        fontWeight: 400,
                        color: '#2E2B25',
                        lineHeight: 1.75,
                      }}
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(section.content) }}
                    />
                  </div>
                ))}
              </div>

              {/* New inquiry */}
              <div style={{ textAlign: 'center', padding: '32px 48px 48px' }}>
                <button
                  className="ie-reset-btn"
                  onClick={handleReset}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(184,148,42,0.25)',
                    color: '#6B7280',
                    padding: '10px 28px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                >
                  New Inquiry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
