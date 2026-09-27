import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conecta',
  description: 'Sistema Conecta de gestión comercial y control por campaña.',
  icons: {
    icon: '/conecta.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/conecta.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
