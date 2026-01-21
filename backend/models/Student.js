import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString()
  }
});

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true
    },
    class: {
      type: String,
      trim: true,
      default: null
    },
    image: {
      type: String,
      default: null
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    history: [attendanceRecordSchema]
  },
  { timestamps: true }
);

// Index for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ userId: 1, name: 1 });

export const Student = mongoose.model('Student', studentSchema);
