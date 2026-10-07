import type { Metadata } from 'next';
import { Mali } from 'next/font/google';
import './globals.css';

const mali = Mali({
  variable: '--font-mali',
  subsets: ['thai', 'latin'],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Math World — เกมผจญภัยคณิตศาสตร์',
  description: 'เกมการเรียนรู้คณิตศาสตร์สำหรับเด็กอนุบาลถึงประถม พร้อมเส้นทางการเรียนรู้เฉพาะบุคคล',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" className={mali.variable}>
      <body>{children}</body>
    </html>
  );
}
