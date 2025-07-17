// Java Installation Wizard JavaScript
class JavaInstallationWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.wizardData = {
            installation: {},
            ansible: {},
            profile: {},
            summary: {}
        };
        
        // Sample data from requirements
        this.sampleInstallations = [
            {
                id: "installation-1",
                friendly_name: "Java 21 Linux",
                version: "21.2",
                os: "linux",
                filename: "installation/java21-linux.tar.gz",
                exists: true,
                command: "tar -xvzf"
            },
            {
                id: "installation-2", 
                friendly_name: "Java 21 Windows",
                version: "21.2",
                os: "windows",
                filename: "installation/java21-win.zip",
                exists: true,
                command: "unzip"
            },
            {
                id: "installation-3",
                friendly_name: "Java 8 AIX",
                version: "8.0",
                os: "aix",
                filename: "installation/java8-aix.tar.gz",
                exists: false,
                command: "tar -xvzf"
            }
        ];
        
        this.sampleProfiles = [
            {
                id: "profile-1",
                friendly_name: "Development Linux",
                install_path: "/opt/java",
                backup_enabled: true,
                backup_path: "/opt/java-backup",
                base_path: "/opt",
                symlink_enabled: true,
                symlink_path: "/usr/bin/java",
                os: "linux"
            },
            {
                id: "profile-2",
                friendly_name: "Production Windows",
                install_path: "C:\\Program Files\\Java",
                backup_enabled: true,
                backup_path: "C:\\Java-Backup",
                base_path: "C:\\Program Files",
                symlink_enabled: false,
                os: "windows"
            },
            {
                id: "profile-3",
                friendly_name: "AIX Production",
                install_path: "/usr/java",
                backup_enabled: false,
                backup_path: "",
                base_path: "/usr",
                symlink_enabled: true,
                symlink_path: "/usr/bin/java",
                os: "aix"
            }
        ];
        
        this.installationSteps = [
            "Verifying local installation file",
            "Creating backup of existing installation",
            "Copying installation file to remote hosts",
            "Unpacking installation files",
            "Configuring environment variables",
            "Updating symlinks",
            "Installation complete"
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.populateSelects();
        this.updateBreadcrumbs();
        this.updateNavigation();
        this.setupFileUpload();
        this.setupBreadcrumbNavigation();
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousStep());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('startBtn').addEventListener('click', () => this.startInstallation());
        
        // Step 1 - Installation selection
        document.querySelectorAll('input[name="installationSource"]').forEach(radio => {
            radio.addEventListener('change', () => this.handleInstallationSourceChange());
        });
        
        document.getElementById('existingInstallSelect').addEventListener('change', () => this.handleExistingInstallChange());
        document.getElementById('deleteConfigBtn').addEventListener('click', () => this.deleteConfiguration());
        document.getElementById('osSelect').addEventListener('change', () => this.handleOSChange());
        
        // Step 2 - Ansible configuration
        document.querySelectorAll('input[name="authMethod"]').forEach(radio => {
            radio.addEventListener('change', () => this.handleAuthMethodChange());
        });
        
        // Step 3 - Profile configuration
        document.querySelectorAll('input[name="profileSource"]').forEach(radio => {
            radio.addEventListener('change', () => this.handleProfileSourceChange());
        });
        
        document.getElementById('existingProfileSelect').addEventListener('change', () => this.handleExistingProfileChange());
        document.getElementById('backupEnabled').addEventListener('change', () => this.handleBackupEnabledChange());
        document.getElementById('symlinkEnabled').addEventListener('change', () => this.handleSymlinkEnabledChange());
    }
    
    setupBreadcrumbNavigation() {
        document.querySelectorAll('.breadcrumb-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const targetStep = index + 1;
                // Allow navigation to any step for testing purposes
                this.currentStep = targetStep;
                this.showStep(this.currentStep);
                this.updateBreadcrumbs();
                this.updateNavigation();
                
                if (this.currentStep === 4) {
                    this.collectWizardData();
                    this.updateSummary();
                }
            });
        });
    }
    
    populateSelects() {
        // Populate existing installations
        const existingInstallSelect = document.getElementById('existingInstallSelect');
        existingInstallSelect.innerHTML = '<option value="">Choose an installation...</option>';
        
        this.sampleInstallations.forEach(installation => {
            const option = document.createElement('option');
            option.value = installation.id;
            option.textContent = `${installation.friendly_name} (${installation.version}) - ${installation.os}`;
            option.dataset.exists = installation.exists;
            existingInstallSelect.appendChild(option);
        });
        
        // Populate existing profiles
        const existingProfileSelect = document.getElementById('existingProfileSelect');
        existingProfileSelect.innerHTML = '<option value="">Choose a profile...</option>';
        
        this.sampleProfiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = `${profile.friendly_name} (${profile.os})`;
            existingProfileSelect.appendChild(option);
        });
    }
    
    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileUpload');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    handleFileUpload(file) {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div class="uploaded-file">
                <i class="bi bi-file-earmark-zip"></i>
                <span>${file.name}</span>
                <i class="bi bi-check-circle text-success"></i>
            </div>
        `;
        
        // Auto-detect OS and command based on file extension
        const osSelect = document.getElementById('osSelect');
        const installCommand = document.getElementById('installCommand');
        
        if (file.name.endsWith('.zip')) {
            osSelect.value = 'windows';
            installCommand.value = 'unzip';
        } else if (file.name.endsWith('.tar.gz') || file.name.endsWith('.tar')) {
            if (!osSelect.value) {
                osSelect.value = 'linux';
            }
            installCommand.value = 'tar -xvzf';
        }
        
        this.wizardData.installation.uploadedFile = file;
        this.validateStep1();
    }
    
    handleInstallationSourceChange() {
        const source = document.querySelector('input[name="installationSource"]:checked')?.value;
        const existingSection = document.getElementById('existingInstallSection');
        const uploadSection = document.getElementById('uploadInstallSection');
        
        if (source === 'existing') {
            existingSection.classList.remove('hidden');
            uploadSection.classList.add('hidden');
        } else if (source === 'upload') {
            existingSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
        }
        
        this.validateStep1();
    }
    
    handleExistingInstallChange() {
        const select = document.getElementById('existingInstallSelect');
        const selectedValue = select.value;
        const missingFileAlert = document.getElementById('missingFileAlert');
        
        if (selectedValue) {
            const installation = this.sampleInstallations.find(i => i.id === selectedValue);
            if (installation) {
                this.wizardData.installation.selectedInstallation = installation;
                this.updateAnsibleConfigForOS(installation.os);
                
                if (!installation.exists) {
                    missingFileAlert.classList.remove('hidden');
                } else {
                    missingFileAlert.classList.add('hidden');
                }
            }
        } else {
            missingFileAlert.classList.add('hidden');
        }
        
        this.validateStep1();
    }
    
    handleOSChange() {
        const os = document.getElementById('osSelect').value;
        const installCommand = document.getElementById('installCommand');
        
        if (os === 'windows') {
            installCommand.value = 'unzip';
        } else if (os === 'linux' || os === 'aix') {
            installCommand.value = 'tar -xvzf';
        }
        
        this.updateAnsibleConfigForOS(os);
        this.validateStep1();
    }
    
    updateAnsibleConfigForOS(os) {
        const unixAuthSection = document.getElementById('unixAuthSection');
        const windowsAuthSection = document.getElementById('windowsAuthSection');
        
        if (os === 'windows') {
            unixAuthSection.classList.add('hidden');
            windowsAuthSection.classList.remove('hidden');
        } else {
            unixAuthSection.classList.remove('hidden');
            windowsAuthSection.classList.add('hidden');
        }
    }
    
    handleAuthMethodChange() {
        const authMethod = document.querySelector('input[name="authMethod"]:checked')?.value;
        const sshKeySection = document.getElementById('sshKeySection');
        const sshPasswordSection = document.getElementById('sshPasswordSection');
        
        if (authMethod === 'key') {
            sshKeySection.classList.remove('hidden');
            sshPasswordSection.classList.add('hidden');
        } else if (authMethod === 'password') {
            sshKeySection.classList.add('hidden');
            sshPasswordSection.classList.remove('hidden');
        }
    }
    
    handleProfileSourceChange() {
        const source = document.querySelector('input[name="profileSource"]:checked')?.value;
        const existingSection = document.getElementById('existingProfileSection');
        const newSection = document.getElementById('newProfileSection');
        
        if (source === 'existing') {
            existingSection.classList.remove('hidden');
            newSection.classList.add('hidden');
        } else if (source === 'new') {
            existingSection.classList.add('hidden');
            newSection.classList.remove('hidden');
            this.updateProfileFormForOS();
        }
    }
    
    handleExistingProfileChange() {
        const select = document.getElementById('existingProfileSelect');
        const profileDetails = document.getElementById('profileDetails');
        const profileDetailsContent = document.getElementById('profileDetailsContent');
        
        if (select.value) {
            const profile = this.sampleProfiles.find(p => p.id === select.value);
            if (profile) {
                profileDetails.classList.remove('hidden');
                
                profileDetailsContent.innerHTML = `
                    <div class="profile-detail-item">
                        <span class="profile-detail-label">Install Path:</span>
                        <span class="profile-detail-value">${profile.install_path}</span>
                    </div>
                    <div class="profile-detail-item">
                        <span class="profile-detail-label">Base Path:</span>
                        <span class="profile-detail-value">${profile.base_path}</span>
                    </div>
                    <div class="profile-detail-item">
                        <span class="profile-detail-label">Backup Enabled:</span>
                        <span class="profile-detail-value">${profile.backup_enabled ? 'Yes' : 'No'}</span>
                    </div>
                    ${profile.backup_enabled ? `
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Backup Path:</span>
                            <span class="profile-detail-value">${profile.backup_path}</span>
                        </div>
                    ` : ''}
                    <div class="profile-detail-item">
                        <span class="profile-detail-label">Symlink Enabled:</span>
                        <span class="profile-detail-value">${profile.symlink_enabled ? 'Yes' : 'No'}</span>
                    </div>
                    ${profile.symlink_enabled ? `
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Symlink Path:</span>
                            <span class="profile-detail-value">${profile.symlink_path}</span>
                        </div>
                    ` : ''}
                `;
                
                this.wizardData.profile.selectedProfile = profile;
            }
        } else {
            profileDetails.classList.add('hidden');
        }
    }
    
    updateProfileFormForOS() {
        const os = this.getCurrentOS();
        const symlinkSection = document.getElementById('symlinkSection');
        
        if (os === 'windows') {
            symlinkSection.classList.add('hidden');
        } else {
            symlinkSection.classList.remove('hidden');
        }
    }
    
    handleBackupEnabledChange() {
        const backupEnabled = document.getElementById('backupEnabled').checked;
        const backupSection = document.getElementById('backupSection');
        
        if (backupEnabled) {
            backupSection.classList.remove('hidden');
        } else {
            backupSection.classList.add('hidden');
        }
    }
    
    handleSymlinkEnabledChange() {
        const symlinkEnabled = document.getElementById('symlinkEnabled').checked;
        const symlinkPathSection = document.getElementById('symlinkPathSection');
        
        if (symlinkEnabled) {
            symlinkPathSection.classList.remove('hidden');
        } else {
            symlinkPathSection.classList.add('hidden');
        }
    }
    
    getCurrentOS() {
        const installationSource = document.querySelector('input[name="installationSource"]:checked')?.value;
        
        if (installationSource === 'existing') {
            const selectedInstallation = this.wizardData.installation.selectedInstallation;
            return selectedInstallation ? selectedInstallation.os : 'linux';
        } else {
            return document.getElementById('osSelect').value || 'linux';
        }
    }
    
    validateStep1() {
        const installationSource = document.querySelector('input[name="installationSource"]:checked')?.value;
        let isValid = false;
        
        if (installationSource === 'existing') {
            const existingInstallSelect = document.getElementById('existingInstallSelect');
            const selectedInstallation = this.wizardData.installation.selectedInstallation;
            isValid = existingInstallSelect.value && selectedInstallation && selectedInstallation.exists;
        } else if (installationSource === 'upload') {
            const osSelect = document.getElementById('osSelect');
            const friendlyName = document.getElementById('friendlyName');
            const installCommand = document.getElementById('installCommand');
            
            // Allow progression without file for testing purposes
            isValid = osSelect.value && 
                     friendlyName.value.trim() && 
                     installCommand.value.trim();
        }
        
        return isValid;
    }
    
    validateStep2() {
        const inventory = document.getElementById('inventory').value.trim();
        const username = document.getElementById('username').value.trim();
        const os = this.getCurrentOS();
        
        if (!inventory || !username) return false;
        
        if (os === 'windows') {
            const password = document.getElementById('winrmPassword').value.trim();
            return password.length > 0;
        } else {
            const authMethod = document.querySelector('input[name="authMethod"]:checked')?.value;
            if (authMethod === 'key') {
                const sshKey = document.getElementById('sshKeyFile').value.trim();
                return sshKey.length > 0;
            } else if (authMethod === 'password') {
                const password = document.getElementById('sshPasswordInput').value.trim();
                return password.length > 0;
            }
        }
        
        return false;
    }
    
    validateStep3() {
        const profileSource = document.querySelector('input[name="profileSource"]:checked')?.value;
        
        if (profileSource === 'existing') {
            const existingProfileSelect = document.getElementById('existingProfileSelect');
            return existingProfileSelect.value;
        } else if (profileSource === 'new') {
            const profileName = document.getElementById('profileName').value.trim();
            const installPath = document.getElementById('installPath').value.trim();
            const basePath = document.getElementById('basePath').value.trim();
            
            return profileName && installPath && basePath;
        }
        
        return false;
    }
    
    collectWizardData() {
        // Step 1 - Installation data
        const installationSource = document.querySelector('input[name="installationSource"]:checked')?.value;
        
        if (installationSource === 'existing') {
            const selectedInstallation = this.wizardData.installation.selectedInstallation;
            this.wizardData.installation = {
                source: 'existing',
                installation: selectedInstallation || this.sampleInstallations[0]
            };
        } else {
            this.wizardData.installation = {
                source: 'upload',
                file: this.wizardData.installation.uploadedFile || { name: 'java-sample.tar.gz' },
                os: document.getElementById('osSelect').value || 'linux',
                friendlyName: document.getElementById('friendlyName').value || 'Sample Java Installation',
                command: document.getElementById('installCommand').value || 'tar -xvzf'
            };
        }
        
        // Step 2 - Ansible data
        const os = this.getCurrentOS();
        const inventoryText = document.getElementById('inventory').value || 'host1.example.com\nhost2.example.com';
        this.wizardData.ansible = {
            inventory: inventoryText.split('\n').filter(line => line.trim()),
            username: document.getElementById('username').value || 'admin',
            os: os
        };
        
        if (os === 'windows') {
            this.wizardData.ansible.password = document.getElementById('winrmPassword').value || '***';
        } else {
            const authMethod = document.querySelector('input[name="authMethod"]:checked')?.value || 'password';
            this.wizardData.ansible.authMethod = authMethod;
            
            if (authMethod === 'key') {
                this.wizardData.ansible.sshKey = document.getElementById('sshKeyFile').value || '***';
            } else {
                this.wizardData.ansible.password = document.getElementById('sshPasswordInput').value || '***';
            }
        }
        
        // Step 3 - Profile data
        const profileSource = document.querySelector('input[name="profileSource"]:checked')?.value;
        
        if (profileSource === 'existing') {
            this.wizardData.profile = {
                source: 'existing',
                profile: this.wizardData.profile.selectedProfile || this.sampleProfiles[0]
            };
        } else {
            this.wizardData.profile = {
                source: 'new',
                profileName: document.getElementById('profileName').value || 'New Profile',
                installPath: document.getElementById('installPath').value || '/opt/java',
                basePath: document.getElementById('basePath').value || '/opt',
                backupEnabled: document.getElementById('backupEnabled').checked,
                backupPath: document.getElementById('backupPath').value || '',
                symlinkEnabled: document.getElementById('symlinkEnabled').checked,
                symlinkPath: document.getElementById('symlinkPath').value || ''
            };
        }
    }
    
    updateSummary() {
        const summarySection = document.getElementById('installationSummary');
        
        const installation = this.wizardData.installation;
        const ansible = this.wizardData.ansible;
        const profile = this.wizardData.profile;
        
        summarySection.innerHTML = `
            <div class="summary-group">
                <h6><i class="bi bi-box-seam"></i> Installation Details</h6>
                <div class="summary-item">
                    <span class="summary-label">Source:</span>
                    <span class="summary-value">${installation.source === 'existing' ? 'Existing Configuration' : 'New Upload'}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Name:</span>
                    <span class="summary-value">${installation.source === 'existing' ? installation.installation.friendly_name : installation.friendlyName}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">OS:</span>
                    <span class="summary-value">${installation.source === 'existing' ? installation.installation.os : installation.os}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Command:</span>
                    <span class="summary-value">${installation.source === 'existing' ? installation.installation.command : installation.command}</span>
                </div>
            </div>
            
            <div class="summary-group">
                <h6><i class="bi bi-gear"></i> Ansible Configuration</h6>
                <div class="summary-item">
                    <span class="summary-label">Hosts:</span>
                    <span class="summary-value">${ansible.inventory.length} host(s)</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Username:</span>
                    <span class="summary-value">${ansible.username}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Auth Method:</span>
                    <span class="summary-value">${ansible.os === 'windows' ? 'Password' : (ansible.authMethod || 'password')}</span>
                </div>
            </div>
            
            <div class="summary-group">
                <h6><i class="bi bi-folder"></i> Installation Profile</h6>
                <div class="summary-item">
                    <span class="summary-label">Profile:</span>
                    <span class="summary-value">${profile.source === 'existing' ? profile.profile.friendly_name : profile.profileName}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Install Path:</span>
                    <span class="summary-value">${profile.source === 'existing' ? profile.profile.install_path : profile.installPath}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Backup:</span>
                    <span class="summary-value">${profile.source === 'existing' ? (profile.profile.backup_enabled ? 'Yes' : 'No') : (profile.backupEnabled ? 'Yes' : 'No')}</span>
                </div>
                ${((profile.source === 'existing' && profile.profile.symlink_enabled) || (profile.source === 'new' && profile.symlinkEnabled)) ? `
                    <div class="summary-item">
                        <span class="summary-label">Symlink:</span>
                        <span class="summary-value">${profile.source === 'existing' ? profile.profile.symlink_path : profile.symlinkPath}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            // Validate current step
            let isValid = true;
            
            if (this.currentStep === 1) {
                isValid = this.validateStep1();
            } else if (this.currentStep === 2) {
                isValid = this.validateStep2();
            } else if (this.currentStep === 3) {
                isValid = this.validateStep3();
            }
            
            if (!isValid) {
                this.showValidationError();
                return;
            }
            
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateBreadcrumbs();
            this.updateNavigation();
            
            if (this.currentStep === 4) {
                this.collectWizardData();
                this.updateSummary();
            }
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateBreadcrumbs();
            this.updateNavigation();
        }
    }
    
    showStep(stepNumber) {
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.remove('active');
        });
        
        document.getElementById(`step-${stepNumber}`).classList.add('active');
    }
    
    updateBreadcrumbs() {
        document.querySelectorAll('.breadcrumb-item').forEach((item, index) => {
            const stepNumber = index + 1;
            
            item.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                item.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                item.classList.add('completed');
            }
        });
    }
    
    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const startBtn = document.getElementById('startBtn');
        
        prevBtn.disabled = this.currentStep === 1;
        
        if (this.currentStep === this.totalSteps) {
            nextBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            startBtn.classList.add('hidden');
        }
    }
    
    showValidationError() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        const existingAlert = currentStepElement.querySelector('.status-message.error');
        
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const errorAlert = document.createElement('div');
        errorAlert.className = 'status-message error';
        errorAlert.innerHTML = `
            <i class="bi bi-exclamation-triangle"></i>
            Please complete all required fields before proceeding.
        `;
        
        currentStepElement.querySelector('.card__body').insertBefore(errorAlert, currentStepElement.querySelector('.card__body').firstChild);
        
        setTimeout(() => {
            errorAlert.remove();
        }, 5000);
    }
    
    async startInstallation() {
        const progressSection = document.getElementById('installationProgress');
        const startBtn = document.getElementById('startBtn');
        
        progressSection.classList.remove('hidden');
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Installing...';
        
        const progressBar = document.getElementById('progressBar');
        const currentStep = document.getElementById('currentStep');
        const logContent = document.getElementById('logContent');
        
        let currentStepIndex = 0;
        const totalSteps = this.installationSteps.length;
        
        for (let i = 0; i < totalSteps; i++) {
            const step = this.installationSteps[i];
            const progress = ((i + 1) / totalSteps) * 100;
            
            currentStep.textContent = step;
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${Math.round(progress)}%`;
            
            // Add log entry
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-timestamp">[${timestamp}]</span> 
                ${step}${i === totalSteps - 1 ? ' ✓' : '...'}
            `;
            
            if (i === totalSteps - 1) {
                logEntry.classList.add('success');
            }
            
            logContent.appendChild(logEntry);
            logContent.scrollTop = logContent.scrollHeight;
            
            // Simulate realistic timing
            const delay = i === 0 ? 1000 : (i === totalSteps - 1 ? 2000 : 1500 + Math.random() * 1000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Installation complete
        startBtn.innerHTML = '<i class="bi bi-check-circle"></i> Installation Complete';
        startBtn.classList.remove('btn--primary');
        startBtn.classList.add('btn--success');
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'status-message success';
        successMessage.innerHTML = `
            <i class="bi bi-check-circle"></i>
            Java installation completed successfully on ${this.wizardData.ansible.inventory.length} host(s)!
        `;
        
        progressSection.appendChild(successMessage);
    }
    
    deleteConfiguration() {
        const select = document.getElementById('existingInstallSelect');
        const selectedId = select.value;
        
        if (selectedId) {
            // Remove from sample data
            this.sampleInstallations = this.sampleInstallations.filter(i => i.id !== selectedId);
            
            // Remove from select
            const option = select.querySelector(`option[value="${selectedId}"]`);
            if (option) {
                option.remove();
            }
            
            // Hide alert
            document.getElementById('missingFileAlert').classList.add('hidden');
            
            // Reset selection
            select.value = '';
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'status-message success';
            successMessage.innerHTML = `
                <i class="bi bi-check-circle"></i>
                Configuration deleted successfully.
            `;
            
            document.getElementById('existingInstallSection').appendChild(successMessage);
            
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        }
    }
}

// Initialize the wizard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JavaInstallationWizard();
});