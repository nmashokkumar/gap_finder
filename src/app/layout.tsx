import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'GapFinder AI — Find What the Student Doesn’t Know',
  description:
    'A calm, focused study doctor that diagnoses student learning gaps via RAG-grounded quizzes and builds adaptive revision plans.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#FAF8F5]">
      <body className="min-h-full flex flex-col font-sans text-stone-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </body>
    </html>
  );
}
