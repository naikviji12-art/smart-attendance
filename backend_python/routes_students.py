from flask import Blueprint, request, jsonify
from database import db
from models import Student
from auth import protect

students_bp = Blueprint('students', __name__, url_prefix='/api/students')

@students_bp.route('/add', methods=['POST'])
@protect
def add_student():
    """Add a new student"""
    try:
        data = request.get_json()
        user_id = request.user['id']
        
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'message': 'Student name is required'}), 400
        
        # Check if student already exists
        if Student.find_existing(user_id, name):
            return jsonify({'message': 'Student already exists'}), 409
        
        # Create student
        student = Student.create(
            user_id,
            name,
            class_name=data.get('class'),
            image=data.get('image'),
            mobile_number=data.get('mobileNumber'),
            address=data.get('address')
        )
        
        return jsonify({
            'message': 'Student added successfully',
            'student': student.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@students_bp.route('/', methods=['GET'])
@protect
def get_students():
    """Get all students for a user"""
    try:
        user_id = request.user['id']
        search = request.args.get('search', '')
        
        students = Student.find_all_by_user(user_id, search)
        
        # Calculate total stats
        total_present = 0
        total_absent = 0
        
        for student in students:
            total_present += student.present
            total_absent += student.absent
        
        # Format response
        formatted_students = [student.to_dict() for student in students]
        
        return jsonify({
            'success': True,
            'count': len(formatted_students),
            'totalPresent': total_present,
            'totalAbsent': total_absent,
            'students': formatted_students
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@students_bp.route('/<int:student_id>', methods=['GET'])
@protect
def get_student(student_id):
    """Get a single student"""
    try:
        user_id = request.user['id']
        
        student = Student.find_by_id(student_id, user_id)
        
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'student': student.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@students_bp.route('/<int:student_id>/attendance', methods=['POST'])
@protect
def mark_attendance(student_id):
    """Mark attendance for a student"""
    try:
        data = request.get_json()
        user_id = request.user['id']
        
        date = data.get('date')
        status = data.get('status')
        
        if not date or not status:
            return jsonify({'message': 'Date and status are required'}), 400
        
        if status not in ['present', 'absent']:
            return jsonify({'message': 'Status must be present or absent'}), 400
        
        student = Student.find_by_id(student_id, user_id)
        
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        
        student.update_attendance(date, status)
        
        return jsonify({
            'message': 'Attendance marked successfully',
            'student': student.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@students_bp.route('/<int:student_id>', methods=['DELETE'])
@protect
def delete_student(student_id):
    """Delete a student"""
    try:
        user_id = request.user['id']
        
        if not Student.delete(student_id, user_id):
            return jsonify({'message': 'Student not found'}), 404
        
        return jsonify({
            'message': 'Student deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@students_bp.route('/stats', methods=['GET'])
@protect
def get_stats():
    """Get attendance statistics"""
    try:
        user_id = request.user['id']
        
        stats = Student.get_stats(user_id)
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@students_bp.route('/class-wise', methods=['GET'])
@protect
def get_class_wise_attendance():
    """Get class-wise attendance"""
    try:
        user_id = request.user['id']
        
        class_wise_data = Student.get_class_wise_attendance(user_id)
        
        return jsonify({
            'success': True,
            'data': class_wise_data
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500
