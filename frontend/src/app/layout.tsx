import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Peña de Apuestas',
  description: 'Dashboard privado para peña de apuestas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}

