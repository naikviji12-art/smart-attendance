from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import db, connect_db
from routes_auth import auth_bp
from routes_students import students_bp

# Initialize Flask app
app = Flask(__name__)

# Configure app
app.config.from_object(Config)

# Enable CORS
CORS(app)

# Connect to database
connect_db(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(students_bp)

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'message': 'Server is running'}), 200

# Error handler
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Route not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'message': 'Internal Server Error'}), 500

if __name__ == '__main__':
    port = Config.PORT
    print(f'Starting server on http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
