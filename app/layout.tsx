import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevContext — Codebase Understanding Platform',
  description:
    'Explore source files, analyse dependencies, and understand the impact of changes across your codebase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
