import { Student } from '../models/Student.js';

// Add student
export const addStudent = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Student name is required' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      userId,
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existingStudent) {
      return res.status(409).json({ message: 'Student already exists' });
    }

    const student = await Student.create({
      name: name.trim(),
      userId
    });

    res.status(201).json({
      message: 'Student added successfully',
      student
    });
  } catch (error) {
    next(error);
  }
};

// Get all students for a user
export const getStudents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let query = { userId };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const students = await Student.find(query).sort({ createdAt: -1 });

    // Calculate total stats
    let totalPresent = 0;
    let totalAbsent = 0;

    students.forEach(student => {
      totalPresent += student.present;
      totalAbsent += student.absent;
    });

    res.status(200).json({
      success: true,
      count: students.length,
      totalPresent,
      totalAbsent,
      students
    });
  } catch (error) {
    next(error);
  }
};

// Mark attendance
export const markAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { date, status } = req.body;
    const userId = req.user.id;

    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'Status must be present or absent' });
    }

    const student = await Student.findOne({ _id: studentId, userId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if attendance already marked for this date
    const existingRecord = student.history.find(
      record => new Date(record.date).toDateString() === new Date(date).toDateString()
    );

    if (existingRecord) {
      // Update existing record
      if (existingRecord.status === 'present') {
        student.present--;
      } else {
        student.absent--;
      }
      
      existingRecord.status = status;
      existingRecord.time = new Date().toLocaleTimeString();
    } else {
      // Add new record
      student.history.push({
        date: new Date(date),
        status,
        time: new Date().toLocaleTimeString()
      });
    }

    // Update counts
    if (status === 'present') {
      student.present++;
    } else {
      student.absent++;
    }

    await student.save();

    res.status(200).json({
      message: 'Attendance marked successfully',
      student
    });
  } catch (error) {
    next(error);
  }
};

// Delete student
export const deleteStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;

    const student = await Student.findOneAndDelete({ _id: studentId, userId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json({
      message: 'Student deleted successfully',
      student
    });
  } catch (error) {
    next(error);
  }
};

// Get single student
export const getStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;

    const student = await Student.findOne({ _id: studentId, userId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    next(error);
  }
};

// Get attendance statistics
export const getAttendanceStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const students = await Student.find({ userId });

    let totalStudents = students.length;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalRecords = 0;

    students.forEach(student => {
      totalPresent += student.present;
      totalAbsent += student.absent;
      totalRecords += student.history.length;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalPresent,
        totalAbsent,
        totalRecords,
        averageAttendance: totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};
