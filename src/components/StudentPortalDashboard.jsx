import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LogOut, 
  FileText, 
  DollarSign, 
  Printer, 
  Loader2, 
  Sparkles, 
  Award,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export default function StudentPortalDashboard({ apiBase, studentData, onLogout }) {
  const [activeTab, setActiveTab] = useState('fees'); // 'fees', 'results'
  const [classYearTab, setClassYearTab] = useState(studentData?.classYear || 'PUC-I');
  const [feeData, setFeeData] = useState({ loading: true, totalFee: 0, paidFee: 0, pendingFee: 0, history: [] });
  const [resultsData, setResultsData] = useState({ loading: true, results: [] });
  const [latestReceipt, setLatestReceipt] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('student_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchStudentFeeLedger(classYearTab);
    fetchStudentResults();
  }, [classYearTab]);

  const fetchStudentFeeLedger = async (targetYear) => {
    setFeeData(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.get(`${apiBase}/api/student-portal/my-fees?classYear=${targetYear}`, getAuthHeader());
      setFeeData({
        loading: false,
        totalFee: res.data?.totalFee || 0,
        paidFee: res.data?.paidFee || 0,
        pendingFee: res.data?.pendingFee || (res.data?.totalFee || 0) - (res.data?.paidFee || 0),
        history: Array.isArray(res.data?.history) ? res.data?.history : []
      });
    } catch (err) {
      console.error("Failed to load fee ledger:", err);
      setFeeData({ loading: false, totalFee: 0, paidFee: 0, pendingFee: 0, history: [] });
    }
  };

  const fetchStudentResults = async () => {
    setResultsData(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.get(`${apiBase}/api/student-portal/my-results`, getAuthHeader());
      setResultsData({
        loading: false,
        results: res.data?.data || res.data?.results || []
      });
    } catch (err) {
      setResultsData({ loading: false, results: [] });
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-900 pb-16">
      
      {/* Print styles for receipts */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 20px;
          }
        }
      `}</style>

      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 grid place-items-center text-white font-black shadow-md shadow-amber-500/20">
              IQ
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider uppercase text-slate-900">Iqra Independent PU College</h1>
              <p className="text-[10px] text-amber-600 font-mono font-bold">Student Self-Service Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right font-mono">
              <p className="text-xs font-bold text-slate-900">{studentData?.name}</p>
              <p className="text-[10px] text-slate-500">Roll: {studentData?.rollNumber} • {studentData?.stream}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" /> Welcome back, {studentData?.name}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Student Dashboard</h2>
            <p className="text-xs text-slate-400">Stream: <strong className="text-slate-200">{studentData?.stream}</strong> • Father: <strong className="text-slate-200">{studentData?.fatherName || 'N/A'}</strong></p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs relative z-10">
            <button
              onClick={() => setActiveTab('fees')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'fees' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Fee Dues & Ledger
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Academic Results
            </button>
          </div>
        </div>

        {/* TAB 1: FEES & LEDGERS */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs w-fit">
              <span className="text-xs font-bold text-slate-500 px-3">Select Academic Year:</span>
              {["PUC-I", "PUC-II"].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setClassYearTab(yr)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    classYearTab === yr 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {yr} Ledger
                </button>
              ))}
            </div>

            {feeData.loading ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                Loading {classYearTab} financial records...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{classYearTab} Total Annual Fee</span>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">₹{feeData.totalFee.toLocaleString()}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xl shadow-emerald-500/5 space-y-1">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Total Amount Paid</span>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">₹{feeData.paidFee.toLocaleString()}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-xl shadow-rose-500/5 space-y-1">
                    <span className="text-[10px] text-rose-600 uppercase font-bold tracking-wider">Pending Dues</span>
                    <p className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">₹{feeData.pendingFee.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" /> {classYearTab} Installment Payment History
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">{feeData.history.length} Transactions Recorded</span>
                  </div>

                  {feeData.history.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs">
                      No fee installments recorded for {classYearTab} yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                            <th className="py-3.5 px-6">Receipt No</th>
                            <th className="py-3.5 px-4">Fee Category</th>
                            <th className="py-3.5 px-4">Payment Mode</th>
                            <th className="py-3.5 px-4">Date</th>
                            <th className="py-3.5 px-4 font-mono text-right">Amount Paid</th>
                            <th className="py-3.5 px-6 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {feeData.history.map((tx) => (
                            <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-6 font-mono font-bold text-amber-600">{tx.receiptNo || 'IQRA-RCP'}</td>
                              <td className="py-3.5 px-4 text-slate-800 font-bold">{tx.feeType}</td>
                              <td className="py-3.5 px-4 text-slate-600">{tx.paymentMode}</td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono">{formatDate(tx.date || tx.createdAt)}</td>
                              <td className="py-3.5 px-4 font-mono font-black text-emerald-600 text-right">₹{tx.amountPaid?.toLocaleString()}</td>
                              <td className="py-3.5 px-6 text-center">
                                <button
                                  onClick={() => setLatestReceipt(tx)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                                  <span>View Receipt</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: ACADEMIC RESULTS */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" /> Published Examination Results & Marks Card
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Official published results for {studentData?.name}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold">
                  {studentData?.stream} Stream
                </span>
              </div>

              {resultsData.loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  Loading examination results...
                </div>
              ) : resultsData.results.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No published examination results available.</p>
                  <p className="text-[11px] text-slate-400">Results will appear here once officially published by the principal office.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {resultsData.results.map((resItem, idx) => (
                    <div key={idx} className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
                        <div>
                          <h4 className="font-black text-slate-900 text-base">{resItem.examName}</h4>
                          <p className="text-xs text-slate-500">Academic Year: {resItem.academicYear} • Class: {resItem.classYear} ({resItem.stream})</p>
                        </div>
                        <span className={`px-3.5 py-1 rounded-full text-xs font-bold w-fit shadow-xs ${
                          resItem.status === 'Passed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {resItem.status} • {resItem.percentage}%
                        </span>
                      </div>

                      {/* Subject Breakdown Table */}
                      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                              <th className="py-3 px-4">Subject</th>
                              <th className="py-3 px-4 text-center">Max Marks</th>
                              <th className="py-3 px-4 text-center">Marks Obtained</th>
                              <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {resItem.subjects?.map((sub, sIdx) => (
                              <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{sub.subject}</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600">{sub.maxMarks}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                                  {sub.isAbsent ? <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Absent</span> : sub.marksObtained}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className={`font-semibold px-2 py-0.5 rounded-md ${sub.isAbsent ? 'text-rose-600 bg-rose-50' : 'text-slate-700 bg-slate-100'}`}>
                                    {sub.isAbsent ? 'AB' : (sub.marksObtained >= sub.maxMarks * 0.35 ? 'Pass' : 'Fail')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                        <span className="text-slate-700">Overall Aggregate Grade: <strong className="text-amber-700 text-sm">{resItem.grade}</strong></span>
                        <span className="text-slate-700">Total Marks Obtained: <strong className="text-slate-900 text-sm">{resItem.totalMarks}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* OFFICIAL RECEIPT PREVIEW & PRINT MODAL */}
      {latestReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            id="printable-receipt"
            className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-slate-800"
          >
            <div className="text-center space-y-1.5 pb-4 border-b border-slate-200">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900">Iqra Independent PU College</h3>
              <p className="text-[11px] text-slate-500">Basavakalyan, Bidar District, Karnataka - 585327</p>
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-mono font-bold text-[10px] uppercase">
                Official Fee Payment Receipt ({classYearTab})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">RECEIPT NO:</span>
                <span className="font-bold text-amber-600">{latestReceipt.receiptNo || 'IQRA-RCP'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">DATE:</span>
                <span className="font-bold text-slate-700">{formatDate(latestReceipt.date || latestReceipt.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{studentData?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Father's Name:</span>
                <span className="font-bold text-slate-800">{studentData?.fatherName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Roll Number / Class:</span>
                <span className="font-bold text-slate-800 font-mono">{studentData?.rollNumber} • {classYearTab} ({studentData?.stream})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fee Category:</span>
                <span className="font-bold text-amber-600">{latestReceipt.feeType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold text-slate-800">{latestReceipt.paymentMode}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-700">Amount Received:</span>
              <span className="text-xl font-black font-mono text-emerald-800">₹{latestReceipt.amountPaid?.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3 pt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={() => setLatestReceipt(null)}
                className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}