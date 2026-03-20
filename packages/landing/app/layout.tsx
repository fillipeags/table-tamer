import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Table Tamer — Real-time WatermelonDB Inspector for React Native',
  description: 'Inspect, edit, and query your WatermelonDB/SQLite databases in real time. Desktop app for macOS, Windows, and Linux.',
  openGraph: {
    title: 'Table Tamer',
    description: 'Real-time WatermelonDB/SQLite inspector for React Native apps',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0c0e14] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
