'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Stethoscope, 
  Upload, 
  HelpCircle, 
  FileCheck, 
  MessageSquare, 
  TrendingUp, 
  Layers
} from 'lucide-react';

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

  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">GapFinder</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">The Study Doctor · EdTech RAG</p>
            </div>
          </Link>

          {/* Workflow Steps Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Student Status Badge */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">Demo Student</span>
              <span className="text-[11px] text-slate-500">demo@gapfinder.ai</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center text-xs font-bold">
              DS
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Workflow Scroll */}
      <div className="lg:hidden flex items-center space-x-1 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200">
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
