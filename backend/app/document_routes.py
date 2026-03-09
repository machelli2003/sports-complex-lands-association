from flask import Blueprint, request, jsonify, send_from_directory
from app.models import ClientDocument
from flask_jwt_extended import jwt_required
from datetime import datetime
import os
from app.file_utils import validate_file

document_bp = Blueprint('document_bp', __name__)

@document_bp.route('/documents', methods=['POST'])
@jwt_required()
def add_document():
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file:
            is_valid, error = validate_file(file)
            if not is_valid:
                return jsonify({'error': error}), 400
                
            filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)

            document = ClientDocument(
                client=request.form['client_id'],
                document_type=request.form['document_type'],
                file_path=filename,
                submission_date=datetime.utcnow(),
                verified=False,
                notes=request.form.get('notes', '')
            )
            document.save()

            return jsonify({
                'message': 'Document uploaded successfully',
                'document_id': str(document.id),
                'filename': filename
            }), 201
    else:
        data = request.json
        document = ClientDocument(
            client=data['client_id'],
            document_type=data['document_type'],
            submission_date=datetime.utcnow(),
            verified=False,
            notes=data.get('notes', '')
        )
        document.save()
        return jsonify({'message': 'Document added', 'document_id': str(document.id)}), 201

@document_bp.route('/documents/<client_id>', methods=['GET'])
@jwt_required()
def get_documents(client_id):
    documents = ClientDocument.objects(client=client_id)
    return jsonify([
        {
            'document_id': str(d.id),
            'document_type': d.document_type,
            'file_path': d.file_path,
            'submission_date': d.submission_date,
            'verified': d.verified,
            'verified_date': d.verified_date,
            'notes': d.notes
        } for d in documents
    ])

@document_bp.route('/documents/<document_id>/verify', methods=['PUT'])
@jwt_required()
def verify_document(document_id):
    document = ClientDocument.objects(id=document_id).first()
    if not document:
        return jsonify({'message': 'Document not found'}), 404

    document.verified = True
    document.verified_date = datetime.utcnow()
    document.save()
    return jsonify({'message': 'Document verified successfully'})

@document_bp.route('/documents/<document_id>/file', methods=['GET'])
@jwt_required()
def get_document_file(document_id):
    """Securely serve document files after authentication"""
    document = ClientDocument.objects(id=document_id).first()
    if not document:
        return jsonify({'message': 'Document not found'}), 404

    if not document.file_path:
        return jsonify({'error': 'No file associated with this document'}), 404
    
    # Securely construct path
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads')
    file_path = os.path.join(uploads_dir, document.file_path)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_from_directory(uploads_dir, document.file_path)

@document_bp.route('/documents/<document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Authenticated endpoint to download documents"""
    document = ClientDocument.objects(id=document_id).first()
    if not document:
        return jsonify({'message': 'Document not found'}), 404

    if not document.file_path:
        return jsonify({'error': 'No file associated with this document'}), 404

    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads')
    return send_from_directory(uploads_dir, document.file_path, as_attachment=True)
