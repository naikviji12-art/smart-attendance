import React, { useState, useEffect } from 'react';

function Dashboard({ user, onLogout }) {
  const [userDetails, setUserDetails] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Attendance state
  const [students, setStudents] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [search, setSearch] = useState("");
  const [totalStats, setTotalStats] = useState({ present: 0, absent: 0 });
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Update statistics whenever students or search changes
  useEffect(() => {
    let totalP = 0, totalA = 0;
    
    students
      .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      .forEach(s => {
        totalP += s.present;
        totalA += s.absent;
      });
    
    setTotalStats({ present: totalP, absent: totalA });
  }, [students, search]);

  // Fetch current user details and students on mount
  useEffect(() => {
    fetchUserDetails();
    fetchStudents();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchUserDetails = async () => {
    const token = getToken();
    
    try {
      setLoading(true);
      const response = await fetch('https://backend-samrt.onrender.com/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUserDetails(data.user);
    } catch (err) {
      setError(err.message);
      console.error('Fetch user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (searchTerm = '') => {
    const token = getToken();
    
    try {
      setLoadingStudents(true);
      let url = 'http://localhost:5000/api/students';
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Fetch students error:', err);
      setError(err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const addStudent = async () => {
    if (!studentName.trim()) {
      alert("Enter student name");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch('http://localhost:5000/api/students/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: studentName }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to add student');
        return;
      }

      setStudents([data.student, ...students]);
      setStudentName("");
    } catch (err) {
      console.error('Add student error:', err);
      alert('Failed to add student');
    }
  };

  const markAttendance = async (studentId, status) => {
    if (!attendanceDate) {
      alert("Select date");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: attendanceDate, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to mark attendance');
        return;
      }

      // Update student in local state
      setStudents(students.map(s => s._id === studentId ? data.student : s));
    } catch (err) {
      console.error('Mark attendance error:', err);
      alert('Failed to mark attendance');
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      setStudents(students.filter(s => s._id !== studentId));
    } catch (err) {
      console.error('Delete student error:', err);
      alert('Failed to delete student');
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Student Attendance System
            </h1>
            <p className="text-lg text-gray-400">Welcome, {userDetails?.username}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Logout
          </button>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Total Students</p>
                <span className="text-4xl font-bold text-slate-900">{students.length}</span>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <span className="text-3xl">👥</span>
              </div>
            </div>
          </div>

          {/* Total Present Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Total Present</p>
                <span className="text-4xl font-bold text-green-600">{totalStats.present}</span>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <span className="text-3xl">✓</span>
              </div>
            </div>
          </div>

          {/* Total Absent Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Total Absent</p>
                <span className="text-4xl font-bold text-red-600">{totalStats.absent}</span>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <span className="text-3xl">✗</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Student Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-slide-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Student</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
              <button
                onClick={addStudent}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Student
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <label className="flex items-center text-gray-700 font-medium">
                <span className="mr-3">Select Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8 animate-slide-in" style={{animationDelay: '0.2s'}}>
          <input
            type="text"
            placeholder="🔍 Search student..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchStudents(e.target.value);
            }}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
          />
        </div>

        {/* Student List Section */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Students List</h2>
          
          {loadingStudents ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg animate-fade-in">
              <p className="text-gray-500 text-xl">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg animate-fade-in">
              <p className="text-gray-500 text-xl">No students found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student, index) => (
                <div
                  key={student._id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-102 animate-slide-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 md:mb-0">{student.name}</h3>
                    <div className="flex gap-2 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                        Total: {student.present + student.absent}
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                        Present: {student.present}
                      </span>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                        Absent: {student.absent}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <button
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-lg hover:from-green-600 hover:to-green-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={() => markAttendance(student._id, 'present')}
                    >
                      ✓ Present
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-lg hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={() => markAttendance(student._id, 'absent')}
                    >
                      ✗ Absent
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold py-3 rounded-lg hover:from-gray-500 hover:to-gray-600 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={() => deleteStudent(student._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <b className="text-gray-700 block mb-3">📋 Attendance History</b>
                    {student.history.length === 0 ? (
                      <p className="text-gray-400 italic">No attendance history</p>
                    ) : (
                      <div className="space-y-2">
                        {student.history.map((record, hIndex) => (
                          <div key={hIndex} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span>{new Date(record.date).toLocaleDateString()} - {record.status.toUpperCase()} at {record.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
