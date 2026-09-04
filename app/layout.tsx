import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

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
    <html lang="en">
      <body className="bg-[var(--surface-0)] text-[var(--text-primary)] min-h-screen flex flex-col antialiased selection:bg-[var(--bg-accent)] selection:text-[var(--text-accent)]">
        <Navbar />
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>

      </body>
    </html>
  );
}
