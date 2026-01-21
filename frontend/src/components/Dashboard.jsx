import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function Dashboard({ user, onLogout }) {
  const [userDetails, setUserDetails] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Attendance state
  const [students, setStudents] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentImage, setStudentImage] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [search, setSearch] = useState("");
  const [totalStats, setTotalStats] = useState({ present: 0, absent: 0 });
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'class-wise'
  const [classWiseData, setClassWiseData] = useState([]);
  const [loadingClassWise, setLoadingClassWise] = useState(false);
  const [selectedClass, setSelectedClass] = useState(''); // Selected class for filtering

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
    
    // Auto-refresh students list every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStudents(search);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [search]);

  const getToken = () => localStorage.getItem('token');

  const fetchUserDetails = async () => {
    const token = getToken();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
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
      let url = `${API_BASE_URL}/api/students`;
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

  const fetchClassWiseAttendance = async () => {
    const token = getToken();
    
    try {
      setLoadingClassWise(true);
      const response = await fetch(`${API_BASE_URL}/api/students/class-wise`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch class-wise attendance');
      }

      const data = await response.json();
      setClassWiseData(data.data || []);
    } catch (err) {
      console.error('Fetch class-wise error:', err);
      setError(err.message);
    } finally {
      setLoadingClassWise(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Debug: Check if preset is loaded
    if (!CLOUDINARY_UPLOAD_PRESET) {
      alert('Cloudinary upload preset is not configured. Check your .env file.');
      console.error('CLOUDINARY_UPLOAD_PRESET:', CLOUDINARY_UPLOAD_PRESET);
      console.error('CLOUDINARY_CLOUD_NAME:', CLOUDINARY_CLOUD_NAME);
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      console.log('Uploading to:', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      console.log('Preset:', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Upload error response:', data);
        alert(`Upload failed: ${data.error?.message || 'Unknown error'}`);
        return;
      }

      setStudentImage(data.secure_url);
      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const addStudent = async () => {
    if (!studentName.trim()) {
      alert("Enter student name");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: studentName,
          class: studentClass || null,
          image: studentImage || null,
          mobileNumber: studentMobile || null,
          address: studentAddress || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to add student');
        return;
      }

      setStudents([data.student, ...students]);
      setStudentName("");
      setStudentClass("");
      setStudentImage("");
      setStudentMobile("");
      setStudentAddress("");
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
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/attendance`, {
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
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`, {
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
            {/* Student Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Student Name *</label>
              <input
                type="text"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Class</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <option value="">Select Class</option>
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Student Image</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 flex-1 cursor-pointer disabled:bg-gray-100"
                />
                {uploadingImage && <span className="text-blue-600 font-semibold">Uploading...</span>}
              </div>
              {studentImage && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={studentImage} alt="Student" className="w-16 h-16 rounded-lg object-cover border-2 border-blue-300" />
                  <button
                    type="button"
                    onClick={() => setStudentImage("")}
                    className="text-red-500 hover:text-red-700 font-semibold text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={studentMobile}
                onChange={(e) => setStudentMobile(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Address</label>
              <textarea
                placeholder="Enter student address"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                rows="2"
              />
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Select Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={addStudent}
              disabled={uploadingImage}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Student
            </button>
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

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setActiveTab('students');
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-900 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            👥 Students List
          </button>
          <button
            onClick={() => {
              setActiveTab('class-wise');
              fetchClassWiseAttendance();
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'class-wise'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-900 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            📅 Class-wise Attendance
          </button>
        </div>

        {/* Student List Section */}
        <div>
          {activeTab === 'students' ? (
            <>
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
                      {/* Student Header with Image */}
                      <div className="flex flex-col md:flex-row gap-6 mb-4">
                        {/* Student Image */}
                        {student.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={student.image}
                              alt={student.name}
                              className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-4 border-blue-300 shadow-md"
                            />
                          </div>
                        )}
                        
                        {/* Student Info */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">{student.name}</h3>
                          
                          {/* Class, Mobile and Address */}
                          {(student.class || student.mobileNumber || student.address) && (
                            <div className="space-y-1 mb-3 text-gray-600">
                              {student.class && (
                                <p className="text-sm">
                                  <span className="font-semibold">🎓 Class:</span> {student.class}
                                </p>
                              )}
                              {student.mobileNumber && (
                                <p className="text-sm">
                                  <span className="font-semibold">📱 Mobile:</span> {student.mobileNumber}
                                </p>
                              )}
                              {student.address && (
                                <p className="text-sm">
                                  <span className="font-semibold">📍 Address:</span> {student.address}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex gap-2 text-sm flex-wrap">
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
                                <span>{new Date(record.date).toLocaleDateString('en-GB')} - {record.status.toUpperCase()} at {record.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-6">Class-wise Attendance</h2>
              
              {loadingClassWise ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg animate-fade-in">
                  <p className="text-gray-500 text-xl">Loading attendance data...</p>
                </div>
              ) : classWiseData.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg animate-fade-in">
                  <p className="text-gray-500 text-xl">No attendance records found</p>
                </div>
              ) : (
                <>
                  {/* Class Selection Dropdown */}
                  <div className="mb-6 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-white font-medium mb-2">Select Class</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <option value="">-- View All Classes --</option>
                        {classWiseData.map((classData, idx) => (
                          <option key={idx} value={classData.class}>
                            {classData.class} ({classData.students.length} students)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Display Selected Class or All Classes */}
                  <div className="space-y-4">
                    {(selectedClass ? classWiseData.filter(c => c.class === selectedClass) : classWiseData).map((classData, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 animate-slide-up"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        {/* Class Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-bold text-white">🎓 {classData.class}</h3>
                              <p className="text-blue-100 text-sm">Total Students: {classData.students.length}</p>
                            </div>
                            <div className="flex gap-3">
                              <div className="text-center bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                <p className="text-white text-lg font-bold">{classData.totalPresent}</p>
                                <p className="text-blue-100 text-xs font-semibold">Present</p>
                              </div>
                              <div className="text-center bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                <p className="text-white text-lg font-bold">{classData.totalAbsent}</p>
                                <p className="text-blue-100 text-xs font-semibold">Absent</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Students List */}
                        <div className="p-6">
                          <div className="space-y-3">
                            {classData.students.map((student, sIndex) => (
                              <div
                                key={sIndex}
                                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                              >
                                {/* Student Header */}
                                <div className="flex items-start gap-4 mb-3">
                                  {student.studentImage && (
                                    <img
                                      src={student.studentImage}
                                      alt={student.studentName}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-lg">{student.studentName}</h4>
                                    {(student.mobileNumber || student.address) && (
                                      <div className="text-sm text-gray-600 space-y-1">
                                        {student.mobileNumber && (
                                          <p>📱 {student.mobileNumber}</p>
                                        )}
                                        {student.address && (
                                          <p>📍 {student.address}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                      ✓ {student.present}
                                    </span>
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                      ✗ {student.absent}
                                    </span>
                                  </div>
                                </div>

                                {/* Attendance Records */}
                                {student.attendanceRecords && student.attendanceRecords.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">📋 Attendance History</p>
                                    <div className="space-y-1">
                                      {student.attendanceRecords.map((record, rIndex) => (
                                        <div key={rIndex} className="text-xs text-gray-600 flex items-center gap-2">
                                          <span className={`inline-block w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                          <span>{record.date} - {record.status.toUpperCase()} at {record.time}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
