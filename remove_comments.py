#!/usr/bin/env python3
import os
import re

def remove_python_comments(content):
    lines = content.split('\n')
    result = []
    in_docstring = False
    
    for line in lines:
        if '"""' in line or "'''" in line:
            delimiter = '"""' if '"""' in line else "'''"
            count = line.count(delimiter)
            if count % 2 == 1:
                in_docstring = not in_docstring
        
        if in_docstring or (line.lstrip().startswith('#')):
            result.append(line if in_docstring else '')
        elif '#' in line:
            code_part = line.split('#')[0].rstrip()
            result.append(code_part)
        else:
            result.append(line)
    
    cleaned = '\n'.join(result)
    while '\n\n\n' in cleaned:
        cleaned = cleaned.replace('\n\n\n', '\n\n')
    
    return cleaned.strip() + '\n'

def remove_js_comments(content):
    lines = content.split('\n')
    result = []
    in_block = False
    
    for line in lines:
        if in_block:
            if '*/' in line:
                in_block = False
                after = line.split('*/')[1] if '*/' in line else ''
                if after.strip():
                    result.append(after.rstrip())
            continue
        
        if '/*' in line:
            before = line.split('/*')[0]
            if '*/' not in line:
                in_block = True
            else:
                after = line.split('*/')[1] if '*/' in line else ''
                result.append((before + after).rstrip())
            if before.strip() and '/*' not in line:
                result.append(before.rstrip())
            continue
        
        if line.strip().startswith('//'):
            continue
        
        if '//' in line:
            code = line.split('//')[0].rstrip()
            result.append(code)
        else:
            result.append(line)
    
    cleaned = '\n'.join(result)
    while '\n\n\n' in cleaned:
        cleaned = cleaned.replace('\n\n\n', '\n\n')
    
    return cleaned.strip() + '\n'

workspace = os.getcwd()

backend_files = [
    'backend/check_data.py',
    'backend/check_client.py',
    'backend/main.py',
    'backend/seed_data.py',
    'backend/stages_check.py',
    'backend/setup_payment_types.py',
    'backend/fix_payment_types.py',
    'backend/cleanup_payment_types.py',
    'backend/create_db.py',
    'backend/config.py',
    'backend/extensions.py',
    'backend/app/__init__.py',
    'backend/app/models.py',
    'backend/app/user_routes.py',
    'backend/app/client_routes.py',
    'backend/app/payment_routes.py',
    'backend/app/stage_routes.py',
    'backend/app/document_routes.py',
    'backend/app/report_routes.py',
    'backend/app/association_routes.py',
    'backend/app/payment_type_routes.py',
]

frontend_files = [
    'frontend/src/index.js',
    'frontend/src/App.js',
    'frontend/src/api.js',
    'frontend/src/contexts/AuthContext.js',
    'frontend/src/pages/LoginPage.js',
    'frontend/src/pages/AdminPanel.js',
    'frontend/src/pages/ClientProfile.js',
    'frontend/src/pages/ClientSearch.js',
    'frontend/src/pages/Dashboard.js',
    'frontend/src/pages/Documents.js',
    'frontend/src/pages/NewRegistration.js',
    'frontend/src/pages/Payments.js',
    'frontend/src/pages/Reports.js',
    'frontend/src/components/Navbar.js',
    'frontend/src/components/Sidebar.js',
    'frontend/src/components/PasswordProtection.js',
    'frontend/src/components/PrintableRegistrationForm.js',
]

print("Processing Python files...")
for file_path in backend_files:
    full_path = os.path.join(workspace, file_path)
    if os.path.exists(full_path):
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            cleaned = remove_python_comments(content)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(cleaned)
            print(f"  ✓ {file_path}")
        except Exception as e:
            print(f"  ✗ {file_path}: {str(e)}")

print("\nProcessing JavaScript files...")
for file_path in frontend_files:
    full_path = os.path.join(workspace, file_path)
    if os.path.exists(full_path):
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            cleaned = remove_js_comments(content)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(cleaned)
            print(f"  ✓ {file_path}")
        except Exception as e:
            print(f"  ✗ {file_path}: {str(e)}")

print("\nDone!")
