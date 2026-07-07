'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { runInquiry, InquiryResult } from '../lib/inquiry';

const InquiryReportView = dynamic(() => import('../components/InquiryReport'), {
  ssr: false,
});

type Status = 'idle' | 'searching-library' | 'investigating' | 'done' | 'error';

export default function Home() {
  const [subject, setSubject]   = useState('');
  const [status, setStatus]     = useState<Status>('idle');
  const [result, setResult]     = useState<InquiryResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const reportRef               = useRef<HTMLDivElement>(null);

  const isLoading = status === 'searching-library' || status === 'investigating';

  async function handleInquiry() {
    const trimmed = subject.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setResult(null);
    setStatus('searching-library');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setStatus('investigating');

      const inquiryResult = await runInquiry(trimmed);
      setResult(inquiryResult);
      setStatus('done');

      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStatus('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleInquiry();
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setSubject('');
    setStatus('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getStatusLabel(): string {
    if (status === 'searching-library') return 'Checking library…';
    if (status === 'investigating') return 'Conducting investigation…';
    return '';
  }

  return (
    <>
      <style>{`
        .ie-search-input:focus {
          outline: none;
          border-color: #1a1a1a;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.08);
        }
        .ie-search-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ie-start-btn {
          transition: background 0.2s;
        }
        .ie-start-btn:hover:not(:disabled) {
          background: #374151 !important;
        }
        .ie-start-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ie-status-pulse {
          animation: ie-status-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ie-status-pulse {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
      `}</style>

      <main className="min-h-screen bg-white text-gray-900">
        <section className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            Inquiry Engine
          </p>

          <h1 className="mb-6 text-5xl font-bold leading-tight">
            Investigate Ideas.
            <br />
            Discover Truth.
          </h1>

          <p className="mb-10 max-w-2xl text-lg text-gray-600">
            Inquiry Engine exists to help people move from information to
            understanding and from understanding to wisdom through rigorous,
            transparent investigation.
          </p>

          {/* ── Search field — no button inside ── */}
          <div className="w-full max-w-2xl mb-6">
            <input
              type="text"
              className="ie-search-input w-full px-5 py-4 text-lg text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm transition"
              placeholder="Enter a subject, question, or concept…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />

            {/* Status line */}
            {isLoading && (
              <p className="ie-status-pulse mt-3 text-sm text-gray-400 tracking-widest uppercase text-center">
                {getStatusLabel()}
              </p>
            )}

            {/* Error */}
            {status === 'error' && error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          {/* ── Buttons ── */}
          <div className="flex gap-4">
            <button
              onClick={handleInquiry}
              disabled={isLoading}
              className="ie-start-btn rounded-lg bg-black px-6 py-3 text-white"
            >
              {isLoading ? 'Investigating…' : 'Start an Inquiry'}
            </button>

            <button className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-100">
              Browse Reports
            </button>
          </div>
        </section>
      </main>

      {/* ── Report renders below ── */}
      {status === 'done' && result && (
        <div ref={reportRef}>
          <InquiryReportView result={result} onReset={handleReset} />
        </div>
      )}
    </>
  );
}
