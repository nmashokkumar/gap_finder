'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Stethoscope,
  BookOpen,
  HelpCircle,
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  Layers,
  Sparkles,
  LogOut,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  getCurrentStudent,
  logoutStudent,
  loadSampleDataset,
  clearAllStudentData,
  getDocuments,
} from '@/lib/storage/studentStore';
import { StudentProfile } from '@/types';

const NAV_ITEMS = [
  { href: '/', label: 'Workspace', icon: BookOpen },
  { href: '/quiz', label: 'Quiz', icon: HelpCircle },
  { href: '/report', label: 'Gap Report', icon: ClipboardCheck },
  { href: '/chat', label: 'Explain Chat', icon: MessageSquare },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/architecture', label: 'How RAG Works', icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [hasDocs, setHasDocs] = useState(false);

  useEffect(() => {
    setStudent(getCurrentStudent());
    setHasDocs(getDocuments().length > 0);
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    logoutStudent();
    router.push('/login');
  };

  const handleLoadDemo = () => {
    loadSampleDataset();
    setHasDocs(true);
    window.location.href = '/';
  };

  const handleReset = () => {
    if (confirm('Clear all uploaded materials, quiz attempts, and revision plans?')) {
      clearAllStudentData();
      setHasDocs(false);
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm sm:text-base text-stone-900 tracking-tight">
                GapFinder AI
              </span>
              <span className="hidden sm:block text-[10px] text-stone-500">
                Study Diagnosis &amp; Revision
              </span>
            </div>
          </Link>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200/80'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Student */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleLoadDemo}
              title="Load sample AI/ML syllabus, notes, and past papers"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                hasDocs
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {hasDocs ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Sample Loaded</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Load Sample</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Reset student data"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
              <span className="hidden md:inline text-[11px] font-mono text-stone-500">
                {student?.email || 'demo@gapfinder.ai'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden flex items-center space-x-1 overflow-x-auto px-4 py-2 bg-stone-50 border-t border-stone-200">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
                isActive
                  ? 'bg-teal-700 text-white font-medium'
                  : 'text-stone-600 bg-white border border-stone-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
