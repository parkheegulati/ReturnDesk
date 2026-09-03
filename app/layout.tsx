import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReturnDesk — Support Agent Desk',
  description: 'Internal customer return & replacement lifecycle management desk for online store support agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-frido-cream text-frido-ink min-h-screen flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-frido-line py-6 text-center text-xs text-zinc-500 bg-[#F7F7F7]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>ReturnDesk Internal Agent Workspace &copy; {new Date().getFullYear()}</span>
            <span className="text-zinc-400">Enforced by PostgreSQL constraints</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
