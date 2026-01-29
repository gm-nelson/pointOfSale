// Módulo de gestión de respaldos y restauración
class BackupManager {
    constructor() {
        this.dropboxAccessToken = null;
        this.autoBackupInterval = null;
        this.dropboxApiKey = "nnuauuwb7b4su3t";
        this.init();
    }

    init() {
        // Cargar configuración de respaldo
        this.loadBackupConfig();
        this.setupAutoBackup();
    }

    loadBackupConfig() {
        const config = localStorage.getItem('snackOrders_backupConfig');
        if (config) {
            const parsed = JSON.parse(config);
            this.dropboxAccessToken = parsed.dropboxAccessToken;
        }
    }

    saveBackupConfig() {
        const config = {
            dropboxAccessToken: this.dropboxAccessToken,
            lastBackup: localStorage.getItem('snackOrders_lastBackup')
        };
        localStorage.setItem('snackOrders_backupConfig', JSON.stringify(config));
    }

    // Generar nombre de archivo con timestamp
    generateBackupFileName() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0');
        const businessName = appData.business?.name || 'snackorders';
        const sanitizedName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return `backup_${sanitizedName}_${dateStr}_${timeStr}.json`;
    }

    // Exportar datos locales
    exportLocalData() {
        const data = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: appData
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = this.generateBackupFileName();
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Actualizar último respaldo
        localStorage.setItem('snackOrders_lastBackup', new Date().toISOString());
        showNotification('Datos exportados exitosamente');
        
        return data;
    }

    // Importar datos locales
    importLocalData(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validar versión
                    if (!importedData.version) {
                        throw new Error('Archivo de respaldo inválido');
                    }
                    
                    // Si no se especifican opciones, importar todo
                    if (!options.selective) {
                        appData = importedData.data;
                        saveAppData();
                        showNotification('Datos importados exitosamente');
                        renderAllData();
                        resolve(appData);
                        return;
                    }
                    
                    // Importación selectiva
                    const importAll = document.getElementById('importAll').checked;
                    
                    if (importAll || document.getElementById('importProducts').checked) {
                        appData.products = importedData.data.products || [];
                    }
                    
                    if (importAll || document.getElementById('importCustomers').checked) {
                        appData.customers = importedData.data.customers || [];
                    }
                    
                    if (importAll || document.getElementById('importSuppliers').checked) {
                        appData.suppliers = importedData.data.suppliers || [];
                    }
                    
                    if (importAll || document.getElementById('importOrders').checked) {
                        appData.orders = importedData.data.orders || [];
                    }
                    
                    if (importAll || document.getElementById('importInventory').checked) {
                        appData.ingredients = importedData.data.ingredients || [];
                        appData.recipes = importedData.data.recipes || [];
                        appData.purchases = importedData.data.purchases || [];
                    }
                    
                    if (importAll || document.getElementById('importBusiness').checked) {
                        appData.business = importedData.data.business || getDefaultAppData().business;
                    }
                    
                    saveAppData();
                    showNotification('Datos importados selectivamente');
                    renderAllData();
                    resolve(appData);
                    
                } catch (error) {
                    showNotification('Error al importar datos: ' + error.message, 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                showNotification('Error al leer el archivo', 'error');
                reject(new Error('Error al leer el archivo'));
            };
            
            reader.readAsText(file);
        });
    }

    // Backup a Dropbox
    async backupToDropbox() {
        try {
            if (!this.dropboxAccessToken) {
                await this.authenticateDropbox();
                if (!this.dropboxAccessToken) {
                    showNotification('Autenticación de Dropbox cancelada', 'error');
                    return;
                }
            }
            
            showNotification('Subiendo respaldo a Dropbox...', 'info');
            
            const backupData = this.exportLocalData();
            const fileName = this.generateBackupFileName();
            const fileContent = JSON.stringify(backupData);
            
            // Subir a Dropbox
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.dropboxAccessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/${fileName}`,
                        mode: 'add',
                        autorename: true,
                        mute: false
                    })
                },
                body: fileContent
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Guardar en historial de respaldos
                const backupHistory = JSON.parse(localStorage.getItem('snackOrders_backupHistory') || '[]');
                backupHistory.unshift({
                    filename: fileName,
                    timestamp: new Date().toISOString(),
                    size: result.size,
                    path: result.path_display
                });
                
                // Mantener solo los últimos 10 respaldos
                if (backupHistory.length > 10) {
                    backupHistory.pop();
                }
                
                localStorage.setItem('snackOrders_backupHistory', JSON.stringify(backupHistory));
                localStorage.setItem('snackOrders_lastDropboxBackup', new Date().toISOString());
                
                showNotification(`Respaldo subido exitosamente a Dropbox: ${fileName}`);
                this.updateDropboxStatus();
                
            } else {
                throw new Error(`Error de Dropbox: ${response.status}`);
            }
            
        } catch (error) {
            console.error('Error en backup a Dropbox:', error);
            showNotification('Error al subir a Dropbox: ' + error.message, 'error');
        }
    }

    // Restaurar desde Dropbox
    async restoreFromDropbox() {
        try {
            if (!this.dropboxAccessToken) {
                await this.authenticateDropbox();
                if (!this.dropboxAccessToken) {
                    showNotification('Autenticación de Dropbox cancelada', 'error');
                    return;
                }
            }
            
            // Obtener lista de archivos de respaldo
            const listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.dropboxAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: '',
                    recursive: false
                })
            });
            
            if (!listResponse.ok) {
                throw new Error('Error al listar archivos de Dropbox');
            }
            
            const listResult = await listResponse.json();
            const backupFiles = listResult.entries.filter(file => 
                file.name.startsWith('backup_') && file.name.endsWith('.json')
            ).sort((a, b) => new Date(b.server_modified) - new Date(a.server_modified));
            
            if (backupFiles.length === 0) {
                showNotification('No se encontraron respaldos en Dropbox', 'warning');
                return;
            }
            
            // Mostrar selector de respaldos
            this.showBackupSelector(backupFiles);
            
        } catch (error) {
            console.error('Error al restaurar desde Dropbox:', error);
            showNotification('Error al acceder a Dropbox: ' + error.message, 'error');
        }
    }

    // Mostrar selector de respaldos
    showBackupSelector(backupFiles) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Seleccionar Respaldo</h2>
                    <button class="btn btn-secondary btn-sm close-btn" title="Cerrar">X</button>
                </div>
                <div class="modal-body">
                    <h3>Respaldos disponibles en Dropbox</h3>
                    <div class="backup-list" style="max-height: 300px; overflow-y: auto; margin: 20px 0;">
                        ${backupFiles.map((file, index) => `
                            <div class="backup-item ${index === 0 ? 'selected' : ''}" data-path="${file.path_lower}">
                                <div class="backup-info">
                                    <strong>${file.name}</strong>
                                    <small>${new Date(file.server_modified).toLocaleString()}</small>
                                    <small>${this.formatFileSize(file.size)}</small>
                                </div>
                                <button class="btn btn-sm btn-primary restore-btn">Restaurar</button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary close-btn">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.querySelectorAll('.backup-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('restore-btn')) {
                    modal.querySelectorAll('.backup-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            });
            
            item.querySelector('.restore-btn').addEventListener('click', async () => {
                const path = item.dataset.path;
                await this.downloadAndRestoreBackup(path);
                modal.remove();
            });
        });
    }

    // Descargar y restaurar respaldo
    async downloadAndRestoreBackup(path) {
        try {
            showNotification('Descargando respaldo desde Dropbox...', 'info');
            
            const downloadResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.dropboxAccessToken}`,
                    'Dropbox-API-Arg': JSON.stringify({ path })
                }
            });
            
            if (!downloadResponse.ok) {
                throw new Error('Error al descargar el respaldo');
            }
            
            const backupData = await downloadResponse.json();
            
            // Confirmar restauración
            if (confirm('¿Estás seguro de restaurar este respaldo? Se sobrescribirán los datos actuales.')) {
                appData = backupData.data;
                saveAppData();
                renderAllData();
                showNotification('Datos restaurados exitosamente desde Dropbox');
            }
            
        } catch (error) {
            console.error('Error al restaurar respaldo:', error);
            showNotification('Error al restaurar: ' + error.message, 'error');
        }
    }

    // Autenticación con Dropbox
    async authenticateDropbox() {
        return new Promise((resolve) => {
            // Para desarrollo, usar access token directamente
            // En producción, usar OAuth flow
            
            const token = prompt('Ingresa tu Access Token de Dropbox:');
            if (token) {
                this.dropboxAccessToken = token;
                this.saveBackupConfig();
                this.updateDropboxStatus();
                showNotification('Dropbox conectado exitosamente');
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    // Configurar respaldo automático
    setupAutoBackup() {
        // Limpiar intervalo anterior
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }
        
        const enabled = localStorage.getItem('snackOrders_autoBackupEnabled') === 'true';
        const intervalHours = parseInt(localStorage.getItem('snackOrders_autoBackupInterval') || '24');
        
        if (enabled && intervalHours > 0) {
            const intervalMs = intervalHours * 60 * 60 * 1000;
            
            this.autoBackupInterval = setInterval(() => {
                this.performAutoBackup();
            }, intervalMs);
            
            // Realizar respaldo inmediato si ha pasado mucho tiempo desde el último
            const lastBackup = localStorage.getItem('snackOrders_lastAutoBackup');
            if (!lastBackup || (new Date() - new Date(lastBackup)) > intervalMs) {
                setTimeout(() => this.performAutoBackup(), 5000);
            }
        }
    }

    // Realizar respaldo automático
    async performAutoBackup() {
        try {
            console.log('Realizando respaldo automático...');
            
            // Exportar datos localmente
            this.exportLocalData();
            
            // Intentar subir a Dropbox si está configurado
            if (this.dropboxAccessToken) {
                await this.backupToDropbox();
            }
            
            localStorage.setItem('snackOrders_lastAutoBackup', new Date().toISOString());
            
        } catch (error) {
            console.error('Error en respaldo automático:', error);
        }
    }

    // Formatear tamaño de archivo
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Actualizar estado de Dropbox en la UI
    updateDropboxStatus() {
        const statusElement = document.getElementById('dropboxStatus');
        if (statusElement) {
            if (this.dropboxAccessToken) {
                const lastBackup = localStorage.getItem('snackOrders_lastDropboxBackup');
                const lastBackupStr = lastBackup ? 
                    new Date(lastBackup).toLocaleString() : 'Nunca';
                statusElement.innerHTML = `Estado: Conectado | Último respaldo: ${lastBackupStr}`;
                statusElement.style.color = '#28a745';
            } else {
                statusElement.innerHTML = 'Estado: No conectado';
                statusElement.style.color = '#666';
            }
        }
    }

    // Obtener información del último respaldo
    getLastBackupInfo() {
        const lastBackup = localStorage.getItem('snackOrders_lastBackup');
        if (lastBackup) {
            return new Date(lastBackup).toLocaleString();
        }
        return 'Nunca';
    }
}

// Inicializar manager de respaldos
let backupManager = new BackupManager();

// Funciones globales para la UI
function backupToDropbox() {
    backupManager.backupToDropbox();
}

function restoreFromDropbox() {
    backupManager.restoreFromDropbox();
}

function toggleAutoBackupSettings() {
    const enabled = document.getElementById('autoBackupEnabled').checked;
    const settingsDiv = document.getElementById('autoBackupSettings');
    
    if (enabled) {
        settingsDiv.style.display = 'block';
    } else {
        settingsDiv.style.display = 'none';
    }
    
    localStorage.setItem('snackOrders_autoBackupEnabled', enabled);
    backupManager.setupAutoBackup();
}

function updateAutoBackupInterval() {
    const interval = document.getElementById('autoBackupInterval').value;
    localStorage.setItem('snackOrders_autoBackupInterval', interval);
    backupManager.setupAutoBackup();
}

// Inicializar controles de respaldo en la configuración
function initBackupControls() {
    const autoBackupEnabled = localStorage.getItem('snackOrders_autoBackupEnabled') === 'true';
    const autoBackupInterval = localStorage.getItem('snackOrders_autoBackupInterval') || '24';
    const lastBackupInfo = backupManager.getLastBackupInfo();
    
    if (document.getElementById('autoBackupEnabled')) {
        document.getElementById('autoBackupEnabled').checked = autoBackupEnabled;
        document.getElementById('autoBackupInterval').value = autoBackupInterval;
        document.getElementById('lastBackupInfo').textContent = lastBackupInfo;
        
        if (autoBackupEnabled) {
            document.getElementById('autoBackupSettings').style.display = 'block';
        }
        
        // Event listeners
        document.getElementById('autoBackupEnabled').addEventListener('change', toggleAutoBackupSettings);
        document.getElementById('autoBackupInterval').addEventListener('change', updateAutoBackupInterval);
    }
    
    // Actualizar estado de Dropbox
    backupManager.updateDropboxStatus();
}