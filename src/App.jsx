import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import StudentLanding from './components/StudentLanding';
import StudentPortalDashboard from './components/StudentPortalDashboard';

const App = () => {
  const navigate = useNavigate();
  const apiBase = "https://attendance-managment-pearl.vercel.app"; // Replace with your backend URL if deployed

  const [studentData, setStudentData] = useState(() => {
    try {
      const saved = localStorage.getItem('student_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (student, token) => {
    setStudentData(student);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_info');
    setStudentData(null);
    navigate('/login');
  };

  return (
    <>
      <Toaster position='bottom-right' />
      <Routes>
        {/* Landing Page Route */}
        <Route 
          path='/' 
          element={<StudentLanding apiBase={apiBase} onLoginSuccess={handleLoginSuccess} />} 
        />

        {/* Dedicated Login Route */}
        <Route 
          path='/login' 
          element={
            studentData ? (
              <Navigate to='/dashboard' replace />
            ) : (
              <StudentLanding apiBase={apiBase} onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        {/* Protected Student Dashboard Route */}
        <Route 
          path='/dashboard' 
          element={
            studentData ? (
              <StudentPortalDashboard 
                apiBase={apiBase} 
                studentData={studentData} 
                onLogout={handleLogout} 
              />
            ) : (
              <Navigate to='/login' replace />
            )
          } 
        />
      </Routes>
    </>
  );
};

export default App;