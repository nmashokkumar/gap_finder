import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'GapFinder AI — Find What the Student Doesn’t Know',
  description:
    'An EdTech study doctor that diagnoses student learning gaps via grounded RAG quizzes and builds personalized, adaptive revision plans.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </body>
    </html>
  );
}
