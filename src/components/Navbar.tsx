'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Stethoscope, 
  Upload, 
  HelpCircle, 
  FileCheck, 
  MessageSquare, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  LogOut, 
  RotateCcw,
  Check
} from 'lucide-react';
import { 
  getCurrentStudent, 
  logoutStudent, 
  loadSampleDataset, 
  clearAllStudentData,
  getDocuments
} from '@/lib/storage/studentStore';
import { StudentProfile } from '@/types';

const NAV_ITEMS = [
  { href: '/', label: '1. Upload & Map', icon: Upload },
  { href: '/quiz', label: '2. Diagnostic Quiz', icon: HelpCircle },
  { href: '/report', label: '3. Gap Report & Plan', icon: FileCheck },
  { href: '/chat', label: '4. Explain Chat', icon: MessageSquare },
  { href: '/progress', label: '5. Progress', icon: TrendingUp },
  { href: '/architecture', label: 'How RAG Works', icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoadedSample, setIsLoadedSample] = useState(false);

  useEffect(() => {
    setStudent(getCurrentStudent());
    const docs = getDocuments();
    if (docs.length > 0) {
      setIsLoadedSample(true);
    }
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
    setIsLoadedSample(true);
    window.location.reload();
  };

  const handleReset = () => {
    if (confirm('Clear all uploaded files, quiz results, and revision plans?')) {
      clearAllStudentData();
      setIsLoadedSample(false);
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">GapFinder</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">The Study Doctor · EdTech</p>
            </div>
          </Link>

          {/* Workflow Steps Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Student Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* 1-Click Load Sample Demo Button */}
            <button
              onClick={handleLoadDemo}
              title="Loads Class 11/12 Physics Syllabus, Notes & Past Papers"
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isLoadedSample 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              {isLoadedSample ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Sample Physics Loaded</span>
                  <span className="sm:hidden">Physics Loaded</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Load Sample Demo</span>
                </>
              )}
            </button>

            {/* Reset Data */}
            <button
              onClick={handleReset}
              title="Clear all student data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Student Info & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {student?.name || 'Demo Student'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {student?.email || 'demo@gapfinder.ai'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout student session"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Workflow Scroll */}
      <div className="xl:hidden flex items-center space-x-1 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-600 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
