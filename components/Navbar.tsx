import Link from 'next/link';

export function Navbar() {
  return (
    <header className="bg-frido-ink text-white border-b border-frido-charcoal sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="font-bold text-xl tracking-tight text-white flex items-center">
                Return<span className="text-frido-amber">Desk</span>
              </span>
              <span className="text-xs bg-frido-charcoal text-zinc-300 font-mono px-2 py-0.5 rounded border border-zinc-700">
                Internal
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/requests/new"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-frido-amber hover:bg-frido-amber-dark text-frido-ink transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-frido-amber focus:ring-offset-2 focus:ring-offset-frido-ink"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Return
            </Link>
          </div>
        </div>
      </div>
      {/* Brand accent hairline beneath navigation */}
      <div className="h-0.5 bg-gradient-to-r from-frido-amber via-frido-amber to-transparent opacity-80" />
    </header>
  );
}
