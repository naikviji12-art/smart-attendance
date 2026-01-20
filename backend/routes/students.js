import express from 'express';
import {
  addStudent,
  getStudents,
  getStudent,
  markAttendance,
  deleteStudent,
  getAttendanceStats
} from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Student routes
router.post('/add', addStudent);
router.get('/', getStudents);
router.get('/stats', getAttendanceStats);
router.get('/:studentId', getStudent);
router.post('/:studentId/attendance', markAttendance);
router.delete('/:studentId', deleteStudent);

export default router;
