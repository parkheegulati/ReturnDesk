import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  return (
    <header className="bg-[var(--surface-2)] border-b border-[var(--border)] sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left half: Brand Logo only */}
          <Link href="/" className="flex items-center">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="ReturnDesk Logo"
                width={36}
                height={36}
                className="h-9 w-auto object-contain hover:opacity-90 transition-opacity"
                priority
              />
            </div>
          </Link>

          {/* Right half: "Raise Return" + Light/Dark Toggle */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <Link
              href="/requests/new"
              className="inline-flex items-center justify-center px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--bg-accent)]"
            >
              <svg
                className="w-4 h-4 mr-1.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Raise Return
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
