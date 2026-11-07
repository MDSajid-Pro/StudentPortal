import React, { useState } from 'react';
import axios from 'axios';
import { 
  GraduationCap, 
  FileText, 
  Bell, 
  ArrowRight, 
  Lock, 
  User, 
  Loader2, 
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Info,
  PhoneCall,
  ShieldCheck,
  Award,
  DollarSign
} from 'lucide-react';

export default function StudentLanding({ apiBase, onLoginSuccess }) {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' or 'login'
  const [rollNumber, setRollNumber] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`${apiBase}/api/student-portal/login`, {
        rollNumber: rollNumber.trim(),
        parentPhone: parentPhone.trim()
      });

      if (res.data?.success) {
        const { token, student } = res.data;
        localStorage.setItem('student_token', token);
        localStorage.setItem('student_info', JSON.stringify(student));
        
        if (onLoginSuccess) {
          onLoginSuccess(student, token);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid credentials. Please check your Roll Number and Phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-900 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-225 h-100 bg-amber-400/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linera-to-br from-amber-500 to-amber-600 grid place-items-center text-white font-black shadow-md shadow-amber-500/20">
            IQ
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase text-slate-900">Iqra Independent PU College</h1>
            <p className="text-[10px] text-amber-600 font-mono font-bold">Basavakalyan, Bidar</p>
          </div>
        </div>

        {currentView === 'landing' ? (
          <button
            onClick={() => setCurrentView('login')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-slate-900/10 transition-all cursor-pointer active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Student Portal Login</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}
      </nav>

      {/* Dynamic View: Landing Page vs Login Page */}
      <main className="flex-1 flex flex-col justify-center relative z-10 px-6 py-12">
        {currentView === 'landing' ? (
          <div className="max-w-5xl mx-auto text-center space-y-12">
            
            {/* Hero Heading */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Official Student & Parent Self-Service Portal
              </div>
              
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Empowering Your Academic Journey at <span className="text-amber-600">Iqra College</span>
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Access your year-wise fee ledgers, download official payment receipts instantly, track academic marks cards, and stay updated securely.
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-xl shadow-slate-900/20 flex items-center gap-3 transition-all cursor-pointer active:scale-95"
                >
                  <span>Access Student Portal Login</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-6">
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 grid place-items-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Fee Ledgers & Receipts</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View independent fee structures for PUC-I and PUC-II, inspect installment history, and download official payment receipts anytime.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 grid place-items-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Published Exam Results</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View subject-wise marks cards, aggregate percentages, and examination grades once officially published by the principal office.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 grid place-items-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Secure Student Profile</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Verify your academic stream (Science, Commerce, Arts), father's name, and monitor your student registration details securely.
                </p>
              </div>
            </div>

            {/* Step-by-Step Guide Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-left space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Quick Guide</span>
                <h3 className="text-2xl font-black text-slate-900">How to Use the Student Portal</h3>
                <p className="text-xs text-slate-500">Follow these simple steps to access your academic and financial records.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black grid place-items-center text-xs">1</div>
                  <h4 className="font-bold text-slate-900 text-sm">Click Portal Login</h4>
                  <p className="text-xs text-slate-500">Click the 'Student Portal Login' button at the top right or center of this page.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black grid place-items-center text-xs">2</div>
                  <h4 className="font-bold text-slate-900 text-sm">Enter Credentials</h4>
                  <p className="text-xs text-slate-500">Input your official college Roll Number and registered parent phone number.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black grid place-items-center text-xs">3</div>
                  <h4 className="font-bold text-slate-900 text-sm">Inspect Fee Ledgers</h4>
                  <p className="text-xs text-slate-500">Switch between PUC-I and PUC-II tabs to check pending dues and print receipts.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black grid place-items-center text-xs">4</div>
                  <h4 className="font-bold text-slate-900 text-sm">View Exam Results</h4>
                  <p className="text-xs text-slate-500">Navigate to the Academic Results tab to see subject marks and aggregate grades.</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Modern Login Page View with Dynamic Instructions */
          <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/80 p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 grid place-items-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Student Portal Login</h3>
              <p className="text-xs text-slate-500">Access your fee ledgers and marks securely.</p>
            </div>

            {/* Dynamic Instructions Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-[11px] text-amber-900">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-amber-800">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Login Instructions:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Enter your official college <strong>Roll Number</strong> (e.g., <span className="font-mono font-semibold">PUC25A0001</span>).</li>
                <li>Provide your registered <strong>Parent / Guardian phone number</strong> for verification.</li>
              </ul>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Roll Number</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. PUC25A0001"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Parent / Guardian Phone</label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Registered phone number..."
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50 mt-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                <span>Login to Student Dashboard</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 relative z-10 bg-white">
        <p className='text-black font-semibold'>© 2026 Iqra Independent PU College, Basavakalyan. All rights reserved.</p>
      </footer>
    </div>
  );
}