import './globals.css';
import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'מעבד קורות חיים',
  description: 'מערכת לניתוח קורות חיים',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.className} rtl`}>{children}</body>
    </html>
  );
}
