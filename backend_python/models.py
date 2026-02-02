from database import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    students = db.relationship('Student', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }
    
    def to_dict_safe(self):
        """Return user data without password"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }


class AttendanceRecord(db.Model):
    """Attendance record model"""
    __tablename__ = 'attendance_records'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False)  # 'present' or 'absent'
    time = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'status': self.status,
            'time': self.time
        }


class Student(db.Model):
    """Student model"""
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    class_name = db.Column(db.String(255))
    image = db.Column(db.Text)
    mobile_number = db.Column(db.String(20))
    address = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    present = db.Column(db.Integer, default=0)
    absent = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    attendance_records = db.relationship('AttendanceRecord', backref='student', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        history = []
        for record in self.attendance_records:
            history.append({
                'date': record.date.isoformat(),
                'status': record.status,
                'time': record.time
            })
        
        return {
            '_id': str(self.id),
            'name': self.name,
            'class': self.class_name,
            'image': self.image,
            'mobileNumber': self.mobile_number,
            'address': self.address,
            'present': self.present,
            'absent': self.absent,
            'history': history
        }
    
    @staticmethod
    def create(user_id, name, class_name=None, image=None, mobile_number=None, address=None):
        """Create a new student"""
        student = Student(
            name=name.strip(),
            class_name=class_name,
            image=image,
            mobile_number=mobile_number,
            address=address,
            user_id=user_id
        )
        db.session.add(student)
        db.session.commit()
        return student
    
    @staticmethod
    def find_by_id(student_id, user_id):
        """Find student by ID"""
        return Student.query.filter_by(id=student_id, user_id=user_id).first()
    
    @staticmethod
    def find_all_by_user(user_id, search=None):
        """Find all students for a user"""
        query = Student.query.filter_by(user_id=user_id)
        
        if search:
            query = query.filter(Student.name.ilike(f'%{search}%'))
        
        return query.order_by(Student.created_at.desc()).all()
    
    @staticmethod
    def find_existing(user_id, name):
        """Find existing student by name (case-insensitive)"""
        return Student.query.filter_by(user_id=user_id).filter(
            Student.name.ilike(name)
        ).first()
    
    def update_attendance(self, date, status):
        """Mark attendance for a student"""
        from datetime import datetime as dt
        
        # Convert string date to date object
        if isinstance(date, str):
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        else:
            date_obj = date
        
        # Check if attendance already marked for this date
        existing_record = AttendanceRecord.query.filter_by(
            student_id=self.id,
            date=date_obj
        ).first()
        
        if existing_record:
            # Update existing record
            if existing_record.status == 'present':
                self.present -= 1
            else:
                self.absent -= 1
            
            existing_record.status = status
            existing_record.time = datetime.utcnow().strftime('%H:%M:%S')
        else:
            # Add new record
            record = AttendanceRecord(
                student_id=self.id,
                date=date_obj,
                status=status,
                time=datetime.utcnow().strftime('%H:%M:%S')
            )
            db.session.add(record)
        
        # Update counts
        if status == 'present':
            self.present += 1
        else:
            self.absent += 1
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
        
        return self
    
    @staticmethod
    def delete(student_id, user_id):
        """Delete a student"""
        student = Student.query.filter_by(id=student_id, user_id=user_id).first()
        if student:
            db.session.delete(student)
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def get_stats(user_id):
        """Get attendance statistics for a user"""
        students = Student.query.filter_by(user_id=user_id).all()
        
        total_students = len(students)
        total_present = 0
        total_absent = 0
        total_records = 0
        
        for student in students:
            total_present += student.present
            total_absent += student.absent
            total_records += len(student.attendance_records)
        
        average_attendance = 0
        if total_records > 0:
            average_attendance = round((total_present / total_records) * 100, 2)
        
        return {
            'totalStudents': total_students,
            'totalPresent': total_present,
            'totalAbsent': total_absent,
            'totalRecords': total_records,
            'averageAttendance': average_attendance
        }
    
    @staticmethod
    def get_class_wise_attendance(user_id):
        """Get class-wise attendance grouped by class"""
        students = Student.query.filter_by(user_id=user_id).all()
        
        class_wise_data = {}
        
        for student in students:
            student_class = student.class_name or 'Unassigned'
            
            if student_class not in class_wise_data:
                class_wise_data[student_class] = {
                    'class': student_class,
                    'totalPresent': 0,
                    'totalAbsent': 0,
                    'students': []
                }
            
            student_present = 0
            student_absent = 0
            attendance_records = []
            
            for record in student.attendance_records:
                date_str = record.date.strftime('%d/%m/%Y')
                if record.status == 'present':
                    student_present += 1
                    class_wise_data[student_class]['totalPresent'] += 1
                else:
                    student_absent += 1
                    class_wise_data[student_class]['totalAbsent'] += 1
                
                attendance_records.append({
                    'date': date_str,
                    'status': record.status,
                    'time': record.time or ''
                })
            
            class_wise_data[student_class]['students'].append({
                'studentId': str(student.id),
                'studentName': student.name,
                'studentImage': student.image,
                'mobileNumber': student.mobile_number,
                'address': student.address,
                'present': student_present,
                'absent': student_absent,
                'attendanceRecords': attendance_records
            })
        
        # Convert to list and sort by class name
        class_wise_list = list(class_wise_data.values())
        class_wise_list.sort(key=lambda x: (x['class'] == 'Unassigned', x['class']))
        
        return class_wise_list
