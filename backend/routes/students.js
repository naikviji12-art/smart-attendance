import express from 'express';
import {
  addStudent,
  getStudents,
  getStudent,
  markAttendance,
  deleteStudent,
  getAttendanceStats,
  getClassWiseAttendance
} from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Student routes (static routes before dynamic :studentId)
router.post('/add', addStudent);
router.get('/stats', getAttendanceStats);
router.get('/class-wise', getClassWiseAttendance);
router.get('/', getStudents);router.get('/:studentId', getStudent);
router.post('/:studentId/attendance', markAttendance);
router.delete('/:studentId', deleteStudent);

export default router;