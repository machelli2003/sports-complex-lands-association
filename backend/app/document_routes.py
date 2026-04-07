from flask import Blueprint, request, jsonify, send_file
from app.models import ClientDocument
from flask_jwt_extended import jwt_required
from datetime import datetime
import gridfs
import io
from pymongo import MongoClient
from bson import ObjectId
import os
from app.file_utils import validate_file

document_bp = Blueprint('document_bp', __name__)

# GridFS setup — reuse your existing MongoDB connection string
MONGO_URI = os.environ.get("MONGODB_URI")  # make sure this env var is set on Render
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_default_database()
fs = gridfs.GridFS(db)


@document_bp.route('/documents', methods=['POST'])
@jwt_required()
def add_document():
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        is_valid, error = validate_file(file)
        if not is_valid:
            return jsonify({'error': error}), 400

        # Save file into MongoDB GridFS instead of disk
        filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        grid_file_id = fs.put(
            file.read(),
            filename=filename,
            content_type=file.content_type
        )

        document = ClientDocument(
            client=request.form['client_id'],
            document_type=request.form['document_type'],
            file_path=str(grid_file_id),  # store GridFS ID instead of disk path
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
    document = ClientDocument.objects(id=document_id).first()
    if not document:
        return jsonify({'message': 'Document not found'}), 404

    if not document.file_path:
        return jsonify({'error': 'No file associated with this document'}), 404

    try:
        grid_file = fs.get(ObjectId(document.file_path))
        return send_file(
            io.BytesIO(grid_file.read()),
            mimetype=grid_file.content_type,
            download_name=grid_file.filename
        )
    except Exception as e:
        return jsonify({'error': f'File not found in storage: {str(e)}'}), 404


@document_bp.route('/documents/<document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    document = ClientDocument.objects(id=document_id).first()
    if not document:
        return jsonify({'message': 'Document not found'}), 404

    if not document.file_path:
        return jsonify({'error': 'No file associated with this document'}), 404

    try:
        grid_file = fs.get(ObjectId(document.file_path))
        return send_file(
            io.BytesIO(grid_file.read()),
            mimetype=grid_file.content_type,
            download_name=grid_file.filename,
            as_attachment=True
        )
    except Exception as e:
        return jsonify({'error': f'File not found in storage: {str(e)}'}), 404