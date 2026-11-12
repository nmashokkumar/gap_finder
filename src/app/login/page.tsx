'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Stethoscope, 
  Sparkles, 
  ArrowRight, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { loginStudent, DEMO_PROFILE } from '@/lib/storage/studentStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    loginStudent(email);
    router.push('/');
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    loginStudent(DEMO_PROFILE.email, DEMO_PROFILE.name);
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              GapFinder <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Find What the Student Doesn’t Know · {`{igebra.ai}`}
            </p>
          </div>
        </div>

        {/* Demo Credentials Card (Mandatory for Judges) */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Judge & Evaluator Access</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Instant Demo
            </span>
          </div>

          <div className="bg-white/80 rounded-xl p-3 border border-indigo-100 text-xs space-y-1 font-mono text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-semibold text-slate-900">{DEMO_PROFILE.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Password:</span>
              <span className="font-semibold text-slate-900">demo1234</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In as Demo Student (1-Click)'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Custom Login Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="text-center">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or Sign In with Custom Email
            </h2>
          </div>

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Student Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
          <div className="p-2 rounded-lg bg-slate-100/80">
            <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
            <span>RAG Grounded</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-100/80">
            <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
            <span>Source Citations</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-100/80">
            <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-violet-600" />
            <span>Adaptive Plans</span>
          </div>
        </div>
      </div>
    </div>
  );
}
