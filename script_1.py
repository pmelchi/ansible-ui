# Create the TOML configuration file and additional supporting files

# Create the java_updater.toml configuration file
toml_config_content = """# Java Installation Wizard Configuration
# This file stores installation packages and profiles

[installation-1]
friendly_name = "Java 21 Linux (OpenJDK)"
version = "21.2"
os = "linux"
filename = "installation/java21-linux.tar.gz"
vendor = "openjdk"
install_command = "tar -xvzf"
checksum = "sha256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f"
size_mb = 185

[installation-2]
friendly_name = "Java 21 Windows (OpenJDK)"
version = "21.2"
os = "windows"
filename = "installation/java21-win.zip"
vendor = "openjdk"
install_command = "unzip"
checksum = "sha256:2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3"
size_mb = 195

[installation-3]
friendly_name = "Java 8 AIX (IBM J9)"
version = "8.0.401"
os = "aix"
filename = "installation/java8-aix.tar.gz"
vendor = "ibm"
install_command = "tar -xvzf"
checksum = "sha256:3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4"
size_mb = 210

[installation-4]
friendly_name = "Java 17 Linux (Azul Zulu)"
version = "17.0.8"
os = "linux"
filename = "installation/java17-azul-linux.tar.gz"
vendor = "azul"
install_command = "tar -xvzf"
checksum = "sha256:4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5"
size_mb = 175

[installation-5]
friendly_name = "Java 11 Windows (Oracle JDK)"
version = "11.0.20"
os = "windows"
filename = "installation/java11-oracle-win.zip"
vendor = "oracle"
install_command = "unzip"
checksum = "sha256:5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6"
size_mb = 165

[profile-1]
friendly_name = "Development Linux Profile"
install_path = "/opt/java"
backup_enabled = true
backup_path = "/opt/java-backup"
base_path = "/opt"
symlink_enabled = true
symlink_path = "/usr/bin/java"
environment_vars = ["JAVA_HOME=/opt/java", "PATH=$PATH:/opt/java/bin"]
os_compatibility = ["linux"]

[profile-2]
friendly_name = "Production Windows Profile"
install_path = "C:\\Program Files\\Java"
backup_enabled = true
backup_path = "C:\\Java-Backup"
base_path = "C:\\Program Files"
symlink_enabled = false
symlink_path = ""
environment_vars = ["JAVA_HOME=C:\\Program Files\\Java", "PATH=%PATH%;C:\\Program Files\\Java\\bin"]
os_compatibility = ["windows"]

[profile-3]
friendly_name = "AIX Production Profile"
install_path = "/usr/java"
backup_enabled = true
backup_path = "/usr/java-backup"
base_path = "/usr"
symlink_enabled = true
symlink_path = "/usr/bin/java"
environment_vars = ["JAVA_HOME=/usr/java", "PATH=$PATH:/usr/java/bin"]
os_compatibility = ["aix"]

[profile-4]
friendly_name = "Development Multi-Platform"
install_path = "/opt/java"
backup_enabled = false
backup_path = ""
base_path = "/opt"
symlink_enabled = true
symlink_path = "/usr/local/bin/java"
environment_vars = ["JAVA_HOME=/opt/java", "PATH=$PATH:/opt/java/bin"]
os_compatibility = ["linux", "aix"]

[profile-5]
friendly_name = "Testing Windows Profile"
install_path = "C:\\Testing\\Java"
backup_enabled = false
backup_path = ""
base_path = "C:\\Testing"
symlink_enabled = false
symlink_path = ""
environment_vars = ["JAVA_HOME=C:\\Testing\\Java", "PATH=%PATH%;C:\\Testing\\Java\\bin"]
os_compatibility = ["windows"]

# Global settings
[settings]
default_timeout = 300
max_concurrent_installations = 5
log_level = "INFO"
enable_notifications = true
notification_email = "admin@company.com"
"""

# Create Ansible role structure for better organization
ansible_linux_role_content = """---
# tasks/main.yml for Linux Java installation role
- name: Check if Java is already installed
  command: java -version
  register: java_check
  ignore_errors: yes

- name: Display current Java version if exists
  debug:
    msg: "Current Java version: {{ java_check.stderr }}"
  when: java_check.rc == 0

- name: Create Java installation directory
  file:
    path: "{{ java_install_path }}"
    state: directory
    owner: root
    group: root
    mode: '0755'

- name: Backup existing Java installation
  archive:
    path: "{{ java_install_path }}"
    dest: "{{ java_backup_path }}/java_backup_{{ ansible_date_time.epoch }}.tar.gz"
    format: gz
  when: java_backup_enabled and java_check.rc == 0

- name: Download Java installation package
  get_url:
    url: "{{ java_download_url }}"
    dest: "/tmp/{{ java_package_name }}"
    mode: '0644'
  when: java_download_url is defined

- name: Copy Java installation package from local
  copy:
    src: "{{ java_local_package }}"
    dest: "/tmp/{{ java_package_name }}"
    mode: '0644'
  when: java_local_package is defined

- name: Extract Java installation package
  unarchive:
    src: "/tmp/{{ java_package_name }}"
    dest: "{{ java_install_path }}"
    remote_src: yes
    extra_opts: [--strip-components=1]
  notify: restart java services

- name: Set ownership of Java installation
  file:
    path: "{{ java_install_path }}"
    owner: root
    group: root
    recurse: yes

- name: Create Java symlink
  file:
    src: "{{ java_install_path }}/bin/java"
    dest: "{{ java_symlink_path }}"
    state: link
    force: yes
  when: java_symlink_enabled

- name: Configure JAVA_HOME in /etc/environment
  lineinfile:
    path: /etc/environment
    regexp: '^JAVA_HOME='
    line: 'JAVA_HOME={{ java_install_path }}'
    create: yes

- name: Update PATH in /etc/environment
  lineinfile:
    path: /etc/environment
    regexp: '^PATH='
    line: 'PATH={{ ansible_env.PATH }}:{{ java_install_path }}/bin'
    create: yes

- name: Create Java profile script
  template:
    src: java.sh.j2
    dest: /etc/profile.d/java.sh
    mode: '0644'
  notify: reload profile

- name: Verify Java installation
  command: "{{ java_install_path }}/bin/java -version"
  register: java_verify
  changed_when: false

- name: Display verification results
  debug:
    msg: "Java installation verified: {{ java_verify.stderr }}"
"""

ansible_windows_role_content = """---
# tasks/main.yml for Windows Java installation role
- name: Check if Java is already installed
  win_command: java -version
  register: java_check
  ignore_errors: yes

- name: Display current Java version if exists
  debug:
    msg: "Current Java version: {{ java_check.stdout }}"
  when: java_check.rc == 0

- name: Create Java installation directory
  win_file:
    path: "{{ java_install_path }}"
    state: directory

- name: Backup existing Java installation
  win_shell: |
    if (Test-Path "{{ java_install_path }}") {
      Compress-Archive -Path "{{ java_install_path }}" -DestinationPath "{{ java_backup_path }}\\java_backup_{{ ansible_date_time.epoch }}.zip" -Force
    }
  when: java_backup_enabled and java_check.rc == 0

- name: Download Java installation package
  win_get_url:
    url: "{{ java_download_url }}"
    dest: "C:\\temp\\{{ java_package_name }}"
  when: java_download_url is defined

- name: Copy Java installation package from local
  win_copy:
    src: "{{ java_local_package }}"
    dest: "C:\\temp\\{{ java_package_name }}"
  when: java_local_package is defined

- name: Extract Java installation package
  win_unzip:
    src: "C:\\temp\\{{ java_package_name }}"
    dest: "{{ java_install_path }}"
    creates: "{{ java_install_path }}\\bin\\java.exe"

- name: Set JAVA_HOME environment variable
  win_environment:
    name: JAVA_HOME
    value: "{{ java_install_path }}"
    level: machine

- name: Update PATH environment variable
  win_environment:
    name: PATH
    value: "{{ java_install_path }}\\bin;{{ ansible_env.PATH }}"
    level: machine

- name: Create Java batch script
  win_template:
    src: java.bat.j2
    dest: "C:\\Windows\\System32\\java.bat"

- name: Verify Java installation
  win_command: "{{ java_install_path }}\\bin\\java.exe -version"
  register: java_verify
  changed_when: false

- name: Display verification results
  debug:
    msg: "Java installation verified: {{ java_verify.stdout }}"
"""

ansible_aix_role_content = """---
# tasks/main.yml for AIX Java installation role
- name: Check if Java is already installed
  command: java -version
  register: java_check
  ignore_errors: yes

- name: Display current Java version if exists
  debug:
    msg: "Current Java version: {{ java_check.stderr }}"
  when: java_check.rc == 0

- name: Check AIX version
  command: oslevel
  register: aix_version
  changed_when: false

- name: Display AIX version
  debug:
    msg: "AIX version: {{ aix_version.stdout }}"

- name: Create Java installation directory
  file:
    path: "{{ java_install_path }}"
    state: directory
    owner: root
    group: system
    mode: '0755'

- name: Backup existing Java installation
  command: tar -czf {{ java_backup_path }}/java_backup_{{ ansible_date_time.epoch }}.tar.gz -C {{ java_install_path }} .
  when: java_backup_enabled and java_check.rc == 0

- name: Copy Java installation package
  copy:
    src: "{{ java_local_package }}"
    dest: "/tmp/{{ java_package_name }}"
    mode: '0644'

- name: Extract Java installation package
  unarchive:
    src: "/tmp/{{ java_package_name }}"
    dest: "{{ java_install_path }}"
    remote_src: yes
    extra_opts: [--strip-components=1]

- name: Set ownership of Java installation
  file:
    path: "{{ java_install_path }}"
    owner: root
    group: system
    recurse: yes

- name: Create Java symlink
  file:
    src: "{{ java_install_path }}/bin/java"
    dest: "{{ java_symlink_path }}"
    state: link
    force: yes
  when: java_symlink_enabled

- name: Configure JAVA_HOME in /etc/environment
  lineinfile:
    path: /etc/environment
    regexp: '^JAVA_HOME='
    line: 'JAVA_HOME={{ java_install_path }}'
    create: yes

- name: Update PATH in /etc/environment
  lineinfile:
    path: /etc/environment
    regexp: '^PATH='
    line: 'PATH={{ ansible_env.PATH }}:{{ java_install_path }}/bin'
    create: yes

- name: Create Java profile script
  template:
    src: java.sh.j2
    dest: /etc/profile.d/java.sh
    mode: '0644'

- name: Verify Java installation using installp (for IBM Java)
  command: lslpp -l | grep -i java
  register: java_packages
  ignore_errors: yes
  when: java_vendor == "ibm"

- name: Display installed Java packages
  debug:
    msg: "Installed Java packages: {{ java_packages.stdout_lines }}"
  when: java_packages is defined and java_packages.rc == 0

- name: Verify Java installation
  command: "{{ java_install_path }}/bin/java -version"
  register: java_verify
  changed_when: false

- name: Display verification results
  debug:
    msg: "Java installation verified: {{ java_verify.stderr }}"
"""

# Create .gitignore file
gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Flask
instance/
.webassets-cache

# Environment variables
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.dockerignore

# Logs
*.log
logs/

# Java updater data (contains sensitive information)
java_updater/
!java_updater/.gitkeep

# Ansible
*.retry
ansible.cfg
host_vars/
group_vars/

# SSL certificates and keys
*.pem
*.key
*.crt
*.p12
*.pfx

# Backup files
*.bak
*.backup
*.tmp
"""

# Create .dockerignore file
dockerignore_content = """# Git
.git/
.gitignore
.gitattributes

# Documentation
README.md
*.md

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Environment
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
logs/

# Tests
tests/
test/
*_test.py
test_*.py

# Docker
Dockerfile
docker-compose.yml
.dockerignore

# Development files
dev/
development/
"""

# Create additional files
additional_files = [
    ('java_updater.toml', toml_config_content),
    ('ansible/roles/java-linux/tasks/main.yml', ansible_linux_role_content),
    ('ansible/roles/java-windows/tasks/main.yml', ansible_windows_role_content),
    ('ansible/roles/java-aix/tasks/main.yml', ansible_aix_role_content),
    ('.gitignore', gitignore_content),
    ('.dockerignore', dockerignore_content)
]

for filename, content in additional_files:
    # Create directory if it doesn't exist
    directory = os.path.dirname(filename)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
    
    with open(filename, 'w') as f:
        f.write(content)

print("Created additional files:")
for filename, _ in additional_files:
    print(f"  ✓ {filename}")

# Create a deployment script
deployment_script = """#!/bin/bash
# deploy.sh - Deployment script for Java Installation Wizard

set -e

echo "🚀 Starting Java Installation Wizard deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p java_updater/{installation,backup,log}

# Set permissions
echo "🔒 Setting permissions..."
chmod 755 java_updater
chmod 755 java_updater/installation
chmod 755 java_updater/backup  
chmod 755 java_updater/log

# Copy configuration file if it doesn't exist
if [ ! -f java_updater/java_updater.toml ]; then
    echo "📄 Creating configuration file..."
    cp java_updater.toml java_updater/java_updater.toml
fi

# Build and start the application
echo "🏗️ Building Docker image..."
docker-compose build

echo "🚀 Starting application..."
docker-compose up -d

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
timeout=30
counter=0
while ! curl -f http://localhost:5000 > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Application failed to start within $timeout seconds"
        docker-compose logs
        exit 1
    fi
    echo "   Waiting... ($counter/$timeout)"
    sleep 1
    ((counter++))
done

echo "✅ Java Installation Wizard is now running!"
echo "🌐 Open your browser to: http://localhost:5000"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
"""

with open('deploy.sh', 'w') as f:
    f.write(deployment_script)

# Make deployment script executable
import stat
st = os.stat('deploy.sh')
os.chmod('deploy.sh', st.st_mode | stat.S_IEXEC)

print("  ✓ deploy.sh (executable)")
print()
print("✨ All files have been created successfully!")
print()
print("📁 Project structure:")
print("java-installer-wizard/")
print("├── Dockerfile")
print("├── docker-compose.yml")
print("├── requirements.txt")
print("├── app.py")
print("├── deploy.sh")
print("├── java_updater.toml")
print("├── .gitignore")
print("├── .dockerignore")
print("├── README.md")
print("├── ansible/")
print("│   ├── java-install.yml")
print("│   ├── inventory.ini")
print("│   └── roles/")
print("│       ├── java-linux/")
print("│       ├── java-windows/")
print("│       └── java-aix/")
print("└── java_updater/")
print("    ├── installation/")
print("    ├── backup/")
print("    └── log/")