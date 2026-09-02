import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Bayarin — Bayad. Organisado. Panatag.',
  description: 'A Philippines-first household command center for bills, reminders, and obligations.',
  openGraph: {
    title: 'Bayarin — Bayad. Organisado. Panatag.',
    description: 'A calm, private household organizer for bills, load reminders, and public-service deadlines.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bayarin — Bayad. Organisado. Panatag.',
    description: 'A calm, private household organizer for bills, load reminders, and public-service deadlines.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
