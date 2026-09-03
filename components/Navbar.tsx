import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo, Wordmark & Operations Pill */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-8 h-9 flex items-center justify-center transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="ReturnDesk Logo"
                  width={32}
                  height={36}
                  className="h-8 w-auto object-contain drop-shadow-2xs"
                  priority
                />
              </div>
              <span className="font-medium text-xl tracking-tight text-slate-900 flex items-center">
                Return<span className="text-blue-600 font-semibold">Desk</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Operations Live</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center space-x-3">
            <Link
              href="/requests/new"
              className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="w-4 h-4 mr-1.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Raise Return
            </Link>
          </div>
        </div>
      </div>
      {/* Brand accent hairline */}
      <div className="h-[2px] bg-gradient-to-r from-blue-600 via-blue-400 to-transparent opacity-80" />
    </header>
  );
}
