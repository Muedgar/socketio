import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Socket.IO Foundations',
  description: 'NestJS and Next.js Socket.IO Level 1 playground',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
