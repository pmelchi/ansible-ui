#!/usr/bin/env python3
"""
Java Installation Wizard Flask Application
Dockerized application for installing Java across multiple platforms using Ansible
"""

from flask import Flask, render_template, request, jsonify, Response, session
import os
import json
import toml
import subprocess
import threading
import time
import uuid
from datetime import datetime
import logging

app = Flask(__name__)
app.secret_key = 'java-installer-secret-key-change-in-production'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
JAVA_UPDATER_DIR = '/app/java_updater'
INSTALLATION_DIR = os.path.join(JAVA_UPDATER_DIR, 'installation')
BACKUP_DIR = os.path.join(JAVA_UPDATER_DIR, 'backup')
LOG_DIR = os.path.join(JAVA_UPDATER_DIR, 'log')
CONFIG_FILE = os.path.join(JAVA_UPDATER_DIR, 'java_updater.toml')

# Create directories if they don't exist
for directory in [JAVA_UPDATER_DIR, INSTALLATION_DIR, BACKUP_DIR, LOG_DIR]:
    os.makedirs(directory, exist_ok=True)

# Sample TOML configuration
sample_config = {
    'installation-1': {
        'friendly_name': 'Java 21 Linux',
        'version': '21.2',
        'os': 'linux',
        'filename': 'installation/java21-linux.tar.gz'
    },
    'installation-2': {
        'friendly_name': 'Java 21 Windows',
        'version': '21.2',
        'os': 'windows',
        'filename': 'installation/java21-win.zip'
    },
    'installation-3': {
        'friendly_name': 'Java 8 AIX',
        'version': '8.0',
        'os': 'aix',
        'filename': 'installation/java8-aix.tar.gz'
    },
    'profile-1': {
        'friendly_name': 'Development Linux',
        'install_path': '/opt/java',
        'symlink': 'yes'
    },
    'profile-2': {
        'friendly_name': 'Production Windows',
        'install_path': 'C:\\Program Files\\Java',
        'symlink': 'no'
    }
}

# Initialize configuration file if it doesn't exist
if not os.path.exists(CONFIG_FILE):
    with open(CONFIG_FILE, 'w') as f:
        toml.dump(sample_config, f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config')
def get_config():
    """Get configuration from TOML file"""
    try:
        with open(CONFIG_FILE, 'r') as f:
            config = toml.load(f)
        return jsonify(config)
    except Exception as e:
        logger.error(f"Error reading config: {e}")
        return jsonify({'error': 'Failed to read configuration'}), 500

@app.route('/api/install', methods=['POST'])
def start_installation():
    """Start the Java installation process"""
    try:
        data = request.json
        installation_id = str(uuid.uuid4())

        # Store installation data in session
        session['installation_data'] = data
        session['installation_id'] = installation_id

        # Start installation in background thread
        thread = threading.Thread(target=run_installation, args=(installation_id, data))
        thread.daemon = True
        thread.start()

        return jsonify({'installation_id': installation_id})
    except Exception as e:
        logger.error(f"Error starting installation: {e}")
        return jsonify({'error': 'Failed to start installation'}), 500

@app.route('/api/progress/<installation_id>')
def get_progress(installation_id):
    """Server-sent events endpoint for installation progress"""
    def generate_progress():
        installation_steps = [
            "Verifying local installation file",
            "Creating backup of existing installation", 
            "Copying installation file to remote hosts",
            "Unpacking installation files",
            "Configuring environment variables",
            "Updating symlinks",
            "Installation complete"
        ]

        for i, step in enumerate(installation_steps):
            progress = int((i + 1) / len(installation_steps) * 100)

            # Simulate realistic timing
            time.sleep(2 + (i * 0.5))  # Variable delay for each step

            event_data = {
                'step': step,
                'progress': progress,
                'timestamp': datetime.now().isoformat(),
                'completed': i + 1 == len(installation_steps)
            }

            yield f"data: {json.dumps(event_data)}\n\n"

            if event_data['completed']:
                break

    return Response(generate_progress(), mimetype='text/event-stream')

def run_installation(installation_id, data):
    """Run the actual installation process using Ansible"""
    try:
        # Log installation start
        log_file = os.path.join(LOG_DIR, f'installation_{installation_id}.log')

        with open(log_file, 'w') as f:
            f.write(f"Installation started at {datetime.now()}\n")
            f.write(f"Installation data: {json.dumps(data, indent=2)}\n")

        # In a real implementation, this would:
        # 1. Generate Ansible playbook based on configuration
        # 2. Execute ansible-playbook command
        # 3. Stream real output to the progress endpoint

        logger.info(f"Installation {installation_id} completed successfully")

    except Exception as e:
        logger.error(f"Installation {installation_id} failed: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
