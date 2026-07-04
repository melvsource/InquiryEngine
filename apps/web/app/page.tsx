export default function Home() {
  return (
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

        <div className="flex gap-4">
          <button className="rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800">
            Start an Inquiry
          </button>

          <button className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-100">
            Browse Reports
          </button>
        </div>
      </section>
    </main>
  );
}