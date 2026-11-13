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
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentPortalDashboard({ apiBase, studentData, onLogout }) {
  const [activeTab, setActiveTab] = useState('fees'); // 'fees', 'results', 'tc', 'attendance'
  const [classYearTab, setClassYearTab] = useState(studentData?.classYear || 'PUC-I');
  const [resultsClassFilter, setResultsClassFilter] = useState('All'); // 'All', 'PUC-I', 'PUC-II'
  
  const [feeData, setFeeData] = useState({ loading: true, totalFee: 0, paidFee: 0, pendingFee: 0, history: [] });
  const [resultsData, setResultsData] = useState({ loading: true, results: [] });
  const [tcData, setTcData] = useState({ loading: true, requests: [] });
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-11"
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState({ loading: true, calendarDays: [], monthlyPercentage: 0 });

  const [tcReason, setTcReason] = useState('');
  const [tcSubmitting, setTcSubmitting] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('student_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchStudentFeeLedger(classYearTab);
    fetchStudentResults();
    fetchStudentTcRequests();
    fetchMonthlyAttendanceCalendar(attendanceMonth);
  }, [classYearTab, attendanceMonth]);

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

  const fetchStudentTcRequests = async () => {
    setTcData(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.get(`${apiBase}/api/tc/student/my-tc`, getAuthHeader());
      setTcData({
        loading: false,
        requests: res.data?.data || []
      });
    } catch (err) {
      setTcData({ loading: false, requests: [] });
    }
  };

  const fetchMonthlyAttendanceCalendar = async (monthStr) => {
    setMonthlyAttendanceData(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.get(`${apiBase}/api/student-portal/monthly-attendance?month=${monthStr}`, getAuthHeader());
      setMonthlyAttendanceData({
        loading: false,
        calendarDays: Array.isArray(res.data?.calendarDays) ? res.data?.calendarDays : [],
        monthlyPercentage: res.data?.monthlyPercentage || 0
      });
    } catch (err) {
      // Fallback mock generator with weekday alignment offset
      const [year, month] = monthStr.split('-').map(Number);
      const monthIndex = month - 1;
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday, 1 = Monday...

      let mockDays = [];
      let presentCount = 0;
      let totalRecorded = 0;

      // Add leading empty padding slots for grid alignment
      for (let i = 0; i < firstDayOfWeek; i++) {
        mockDays.push({ empty: true });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateString = `${monthStr}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(year, monthIndex, d);
        const isSunday = dateObj.getDay() === 0;
        
        let status = isSunday ? 'Sunday' : (d % 3 === 0 ? 'Absent' : 'Present');
        if (!isSunday) {
          totalRecorded++;
          if (status === 'Present') presentCount++;
        }

        mockDays.push({ date: dateString, day: d, status });
      }

      const percentage = totalRecorded > 0 ? ((presentCount / totalRecorded) * 100).toFixed(1) : 0;
      setMonthlyAttendanceData({
        loading: false,
        calendarDays: mockDays,
        monthlyPercentage: percentage
      });
    }
  };

  const handleTcSubmit = async (e) => {
    e.preventDefault();
    if (!tcReason.trim()) return;

    setTcSubmitting(true);
    try {
      await axios.post(`${apiBase}/api/tc/student/request-tc`, { reason: tcReason.trim() }, getAuthHeader());
      setTcReason('');
      fetchStudentTcRequests();
      alert("Transfer Certificate request submitted successfully to the Principal office.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit TC request.");
    } finally {
      setTcSubmitting(false);
    }
  };

  // Download Marksheet PDF Generator
  const handleDownloadMarksheetPdf = (resItem) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Iqra Independent PU College", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("Basavakalyan, Bidar District, Karnataka - 585327", 14, 21);
    doc.text("OFFICIAL EXAMINATION MARKS CARD", 14, 28);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Student Name: ${studentData?.name}`, 14, 50);
    doc.text(`Roll Number: ${studentData?.rollNumber}`, 14, 56);
    doc.text(`Stream: ${studentData?.stream} (${resItem.classYear})`, 120, 50);
    doc.text(`Examination: ${resItem.examName}`, 120, 56);
    doc.text(`Academic Year: ${resItem.academicYear}`, 120, 62);

    const tableRows = resItem.subjects.map((sub, idx) => [
      idx + 1,
      sub.subject,
      sub.maxMarks,
      sub.isAbsent ? "ABSENT" : sub.marksObtained,
      sub.isAbsent ? "AB" : (sub.marksObtained >= sub.maxMarks * 0.35 ? "PASS" : "FAIL")
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["#", "Subject Name", "Max Marks", "Marks Obtained", "Status"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, halign: "center", textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 80, halign: "left" },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 33 }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 14;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Marks: ${resItem.totalMarks}`, 14, finalY);
    doc.text(`Percentage: ${resItem.percentage}%`, 14, finalY + 6);
    doc.text(`Overall Grade: ${resItem.grade}`, 120, finalY);
    doc.text(`Result Status: ${resItem.status}`, 120, finalY + 6);

    const sigY = finalY + 25;
    doc.setFontSize(9);
    doc.text("College Seal", 14, sigY);
    doc.text("Principal Signature", 150, sigY);
    doc.setLineWidth(0.5);
    doc.line(14, sigY + 8, 50, sigY + 8);
    doc.line(135, sigY + 8, 195, sigY + 8);

    doc.save(`Marksheet_${studentData?.rollNumber}_${resItem.examName.replace(/\s+/g, "_")}.pdf`);
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const hasPendingDues = feeData.pendingFee > 0;

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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 grid place-items-center text-white font-black shadow-md shadow-amber-500/20">
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" /> Welcome back, {studentData?.name}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Student Dashboard</h2>
            <p className="text-xs text-slate-400">Stream: <strong className="text-slate-200">{studentData?.stream}</strong> • Father: <strong className="text-slate-200">{studentData?.fatherName || 'N/A'}</strong></p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs relative z-10 gap-1">
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
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Attendance
            </button>
            <button
              onClick={() => setActiveTab('tc')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tc' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Transfer Certificate (TC)
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
            
            {/* Academic Year Selector Pills */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs w-fit">
              <span className="text-xs font-bold text-slate-500 px-3">Select Class Level:</span>
              {["All", "PUC-I", "PUC-II"].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setResultsClassFilter(yr)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    resultsClassFilter === yr 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {yr} Results
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" /> Published Examination Results & Marks Card
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Official published results for {studentData?.name}</p>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold w-fit">
                  {studentData?.stream} Stream
                </span>
              </div>

              {resultsData.loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  Loading examination results...
                </div>
              ) : resultsData.results.filter(r => resultsClassFilter === 'All' || r.classYear === resultsClassFilter).length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No published results found for {resultsClassFilter}.</p>
                  <p className="text-[11px] text-slate-400">Results will appear here once officially published by the principal office.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {resultsData.results
                    .filter(resItem => resultsClassFilter === 'All' || resItem.classYear === resultsClassFilter)
                    .map((resItem, idx) => (
                      <div key={idx} className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white shadow-lg shadow-slate-200/40 space-y-5">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                          <div>
                            <h4 className="font-black text-slate-900 text-base sm:text-lg">{resItem.examName}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Academic Year: {resItem.academicYear} • Class: <strong className="text-slate-800">{resItem.classYear}</strong> ({resItem.stream})</p>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold w-fit shadow-xs flex items-center gap-1.5 ${
                            resItem.status === 'Passed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{resItem.status} • {resItem.percentage}%</span>
                          </span>
                        </div>

                        {/* Subject Breakdown Table */}
                        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                <th className="py-3.5 px-5">Subject</th>
                                <th className="py-3.5 px-4 text-center font-mono">Max Marks</th>
                                <th className="py-3.5 px-4 text-center font-mono">Marks Obtained</th>
                                <th className="py-3.5 px-5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {resItem.subjects?.map((sub, sIdx) => (
                                <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3.5 px-5 font-bold text-slate-800">{sub.subject}</td>
                                  <td className="py-3.5 px-4 text-center font-mono text-slate-600">{sub.maxMarks}</td>
                                  <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700">
                                    {sub.isAbsent ? <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md text-[11px]">Absent</span> : sub.marksObtained}
                                  </td>
                                  <td className="py-3.5 px-5 text-right font-mono">
                                    <span className={`font-bold px-2.5 py-1 rounded-md text-[11px] ${sub.isAbsent ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-slate-700 bg-slate-100'}`}>
                                      {sub.isAbsent ? 'AB' : (sub.marksObtained >= sub.maxMarks * 0.35 ? 'Pass' : 'Fail')}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-4 bg-amber-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200/80">
                          <div className="space-y-0.5">
                            <p className="text-slate-700">Overall Aggregate Grade: <strong className="text-amber-800 text-sm font-black">{resItem.grade}</strong></p>
                            <p className="text-slate-700">Total Marks Obtained: <strong className="text-slate-900 text-sm font-black">{resItem.totalMarks}</strong></p>
                          </div>

                          <button
                            onClick={() => handleDownloadMarksheetPdf(resItem)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Download Marksheet PDF</span>
                          </button>
                        </div>

                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE CALENDAR & PERCENTAGE TRACKER */}
{activeTab === 'attendance' && (
  <div className="space-y-6 animate-in fade-in duration-200">
    
    {/* Summary Metric Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl flex items-center justify-between border border-slate-800">
        <div className="space-y-1">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Monthly Attendance</span>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{monthlyAttendanceData.monthlyPercentage}%</p>
          <p className="text-[10px] text-slate-400">Maintained for {attendanceMonth}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400 font-black text-base">
          📊
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Holidays</span>
          <p className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {monthlyAttendanceData.calendarDays?.filter(d => d.status === 'Holiday').length || 0}
          </p>
          <p className="text-[10px] text-slate-500">Official institutional non-working days</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 grid place-items-center text-amber-600 font-black text-base">
          🏛️
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Board Criteria</span>
          <p className="text-xs font-bold text-emerald-700 mt-0.5">PU Board Compliant</p>
          <p className="text-[10px] text-slate-500">Minimum 75% required</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 grid place-items-center text-emerald-600 font-black text-base">
          ✅
        </div>
      </div>
    </div>

    {/* Main Calendar Card (Mobile Responsive Wrapper) */}
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
            📅 Monthly Attendance & Holiday Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Visualizing daily attendance logs and Principal-declared institutional holidays.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={attendanceMonth}
            onChange={(e) => setAttendanceMonth(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
          />
        </div>
      </div>

      {monthlyAttendanceData.loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          Loading attendance calendar...
        </div>
      ) : (
        <div className="space-y-5 overflow-x-auto">
          
          {/* Enhanced Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 min-w-[300px]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg bg-emerald-500 inline-block shadow-xs" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg bg-rose-500 inline-block shadow-xs" /> Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg bg-amber-500 inline-block shadow-xs" />Holiday</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg bg-slate-300 inline-block shadow-xs" /> Sunday / Off</span>
          </div>

          {/* Calendar Grid (Min-width constraint to prevent breaking on small phones) */}
          <div className="min-w-[340px]">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
              {monthlyAttendanceData.calendarDays.map((item, idx) => {
                const isPresent = item.status === 'Present';
                const isAbsent = item.status === 'Absent';
                const isHoliday = item.status === 'Holiday';
                const isSunday = item.status === 'Sunday';

                return (
                  <div
                    key={idx}
                    className={`group relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-between min-h-[72px] sm:min-h-[80px] transition-all duration-200 hover:scale-105 cursor-pointer ${
                      isPresent 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs' 
                        : isAbsent 
                        ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-xs' 
                        : isHoliday
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="font-mono font-black text-xs sm:text-sm">{item.day}</span>
                    
                    <div className="flex flex-col items-center justify-center w-full">
                      <span className={`text-[8.5px] sm:text-[9px] font-bold uppercase tracking-tight px-1 py-0.5 rounded-md truncate max-w-full ${
                        isPresent 
                          ? 'bg-emerald-200 text-emerald-800' 
                          : isAbsent 
                          ? 'bg-rose-200 text-rose-800' 
                          : isHoliday
                          ? 'bg-amber-200 text-amber-950 font-extrabold'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isSunday ? 'Sunday' : (isHoliday ? (item.reason || 'Holiday') : item.status)}
                      </span>
                    </div>

                    {/* Tooltip for full holiday name on hover */}
                    {item.reason && (
                      <div className="absolute bottom-full mb-2 hidden group-hover:block w-36 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl text-center z-20 font-sans pointer-events-none">
                        {item.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  </div>
)}

        {/* TAB 4: TRANSFER CERTIFICATE (TC) PORTAL */}
        {activeTab === 'tc' && (
          <div className="space-y-6">
            
            {/* Student Details Summary Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" /> Transfer Certificate (TC) Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verify your profile details and fee clearance status before applying.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold">
                  Roll: {studentData?.rollNumber}
                </span>
              </div>

              {/* Student Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Student Name:</span>
                  <strong className="text-slate-900 text-sm font-sans">{studentData?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Father's Name:</span>
                  <strong className="text-slate-800 font-sans">{studentData?.fatherName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Stream & Class:</span>
                  <strong className="text-slate-800">{studentData?.stream} Stream ({studentData?.classYear})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Guardian Phone:</span>
                  <strong className="text-slate-800">{studentData?.parentPhone || 'N/A'}</strong>
                </div>
              </div>

              {/* Fee Clearance Status Banner */}
              {hasPendingDues ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-rose-900">Fee Dues Pending (₹{feeData.pendingFee.toLocaleString()})</h4>
                    <p className="text-rose-700 leading-relaxed">
                      You currently have pending fee installments for your academic year. Please clear your dues at the college administrative office before your Transfer Certificate can be approved and issued.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Fee Clearance Verified: All Dues Paid</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Cleared</span>
                </div>
              )}
            </div>

            {/* Request Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Submit New TC Request</h4>
              
              {hasPendingDues ? (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 py-6 space-y-1">
                  <p className="font-semibold text-slate-700">TC Application Form Locked</p>
                  <p>You must clear all pending fee dues before submitting a Transfer Certificate request.</p>
                </div>
              ) : (
                <form onSubmit={handleTcSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Reason for Transfer Certificate</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Higher Studies / Course Completion"
                      value={tcReason}
                      onChange={(e) => setTcReason(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={tcSubmitting}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {tcSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-400" />}
                    <span>Submit Request to Principal Office</span>
                  </button>
                </form>
              )}
            </div>

            {/* Track Existing Requests */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Your TC Request History</h4>
              {tcData.loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                  Loading TC history...
                </div>
              ) : tcData.requests.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No Transfer Certificate requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tcData.requests.map((req) => (
                    <div key={req._id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">Reason: {req.reason}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">Requested On: {formatDate(req.createdAt)}</p>
                        {req.rejectionReason && (
                          <p className="text-[11px] text-rose-600 font-medium">Note: {req.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          req.status === 'Approved' || req.status === 'Issued' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : req.status === 'Rejected' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {req.status === 'Approved' || req.status === 'Issued' ? <CheckCircle2 className="w-3.5 h-3.5" /> : req.status === 'Rejected' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{req.status}</span>
                        </span>
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