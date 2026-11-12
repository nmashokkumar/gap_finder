'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  ArrowRight,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { loginStudent, DEMO_PROFILE } from '@/lib/storage/studentStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-700 items-center justify-center text-white shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              GapFinder AI
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Find what you don’t know before exam day · {'{igebra.ai}'}
            </p>
          </div>
        </div>

        {/* Demo Credentials Card */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Demo Evaluator Access
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200">
              1-Click Login
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-amber-200/80 text-xs space-y-1 font-mono text-stone-700">
            <div className="flex justify-between">
              <span className="text-stone-400">Email:</span>
              <span className="font-semibold text-stone-900">{DEMO_PROFILE.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Password:</span>
              <span className="font-semibold text-stone-900">demo1234</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In as Demo Student'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Student Login */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">
            Or Sign In with Student Email
          </h2>

          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
