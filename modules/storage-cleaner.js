// storage-cleaner.js - Gestor avanzado de limpieza de almacenamiento

class StorageCleaner {
    constructor() {
        this.analysis = null;
        this.initialize();
    }
    
    initialize() {
        console.log('Inicializando gestor de limpieza de almacenamiento...');
        
        // Agregar eventos a los botones
        this.setupEventListeners();
        
        // Ejecutar análisis inicial cuando se abre la configuración
        this.setupModalListener();
    }
    
    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshStorageAnalysisBtn');
        const cleanDuplicatesBtn = document.getElementById('cleanDuplicatesBtn');
        const cleanOldOrdersBtn = document.getElementById('cleanOldOrdersBtn');
        const cleanAllBtn = document.getElementById('cleanAllBtn');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.analyzeStorage());
        }
        
        if (cleanDuplicatesBtn) {
            cleanDuplicatesBtn.addEventListener('click', () => this.cleanDuplicates());
        }
        
        if (cleanOldOrdersBtn) {
            cleanOldOrdersBtn.addEventListener('click', () => this.cleanOldOrders());
        }
        
        if (cleanAllBtn) {
            cleanAllBtn.addEventListener('click', () => this.cleanAllData());
        }
    }
    
    setupModalListener() {
        const configModal = document.getElementById('configModal');
        if (configModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class' && configModal.classList.contains('active')) {
                        console.log('Modal de configuración abierto, ejecutando análisis...');
                        setTimeout(() => {
                            this.analyzeStorage();
                        }, 500);
                    }
                });
            });
            
            observer.observe(configModal, { attributes: true });
        }
    }
    
    // Análisis completo del almacenamiento
    analyzeStorage() {
        try {
            const analysisContainer = document.getElementById('storageAnalysis');
            const cleanerActions = document.getElementById('cleanerActions');
            
            if (!analysisContainer) return;
            
            // Mostrar loading
            analysisContainer.innerHTML = `
                <div class="analysis-loading">
                    <i class="fas fa-spinner fa-spin"></i> Analizando datos del almacenamiento...
                </div>
            `;
            
            // Ejecutar análisis en el siguiente ciclo de evento para no bloquear la UI
            setTimeout(() => {
                this.performDeepAnalysis();
                
                // Mostrar acciones de limpieza si se encontraron problemas
                if (this.analysis && (this.analysis.duplicates.length > 0 || this.analysis.suspicious.length > 0)) {
                    cleanerActions.style.display = 'block';
                }
            }, 100);
            
        } catch (error) {
            console.error('Error en análisis de almacenamiento:', error);
            this.showError('Error analizando almacenamiento');
        }
    }
    
    // Análisis profundo del almacenamiento
    performDeepAnalysis() {
        try {
            const analysisContainer = document.getElementById('storageAnalysis');
            if (!analysisContainer) return;
            
            console.log('=== ANÁLISIS PROFUNDO DE LOCALSTORAGE ===');
            
            const items = [];
            let totalSize = 0;
            const duplicates = [];
            const suspicious = [];
            
            // Recorrer todo el localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                if (value) {
                    const size = (new Blob([value])).size;
                    totalSize += size;
                    
                    const item = {
                        key,
                        size,
                        formattedSize: formatBytes(size),
                        value: value,
                        isJson: false,
                        jsonData: null,
                        type: this.detectDataType(key, value),
                        timestamp: this.extractTimestamp(key, value),
                        isDuplicate: false,
                        isSuspicious: false
                    };
                    
                    // Intentar parsear como JSON
                    try {
                        item.jsonData = JSON.parse(value);
                        item.isJson = true;
                        
                        // Verificar si es JSON válido pero sospechoso
                        if (this.isSuspiciousData(item)) {
                            item.isSuspicious = true;
                            suspicious.push(item);
                        }
                    } catch (e) {
                        // No es JSON válido
                        item.isSuspicious = true;
                        suspicious.push(item);
                    }
                    
                    items.push(item);
                    
                    console.log(`[${i}] ${key}: ${formatBytes(size)} - ${item.type}`);
                }
            }
            
            // Detectar duplicados (mismos valores)
            const valueMap = new Map();
            items.forEach(item => {
                if (valueMap.has(item.value)) {
                    item.isDuplicate = true;
                    duplicates.push(item);
                } else {
                    valueMap.set(item.value, item);
                }
            });
            
            // Ordenar por tamaño (más grandes primero)
            items.sort((a, b) => b.size - a.size);
            
            this.analysis = {
                items,
                totalSize,
                duplicates,
                suspicious,
                summary: {
                    totalItems: items.length,
                    totalSize: totalSize,
                    duplicatesCount: duplicates.length,
                    suspiciousCount: suspicious.length,
                    largestItem: items.length > 0 ? items[0] : null,
                    averageSize: items.length > 0 ? totalSize / items.length : 0
                }
            };
            
            console.log('Resumen del análisis:', this.analysis.summary);
            console.log('==============================');
            
            // Mostrar resultados
            this.displayAnalysisResults();
            
        } catch (error) {
            console.error('Error en análisis profundo:', error);
            throw error;
        }
    }
    
    // Detectar tipo de dato basado en key y valor
    detectDataType(key, value) {
        // Por key
        if (key.includes('product')) return 'Productos';
        if (key.includes('customer')) return 'Clientes';
        if (key.includes('supplier')) return 'Proveedores';
        if (key.includes('order')) return 'Órdenes';
        if (key.includes('inventory')) return 'Inventario';
        if (key.includes('config') || key.includes('setting')) return 'Configuración';
        if (key.includes('cache')) return 'Cache';
        if (key.includes('session')) return 'Sesión';
        if (key.includes('temp')) return 'Temporal';
        
        // Por contenido (si es JSON)
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                if (parsed.length > 0) {
                    const first = parsed[0];
                    if (first.name && first.price) return 'Productos (inferido)';
                    if (first.name && first.phone) return 'Clientes (inferido)';
                }
                return 'Array de datos';
            }
            if (typeof parsed === 'object') {
                if (parsed.products || parsed.customers) return 'Datos de la aplicación';
                return 'Objeto JSON';
            }
        } catch (e) {
            // No es JSON
        }
        
        // Por tamaño
        if (value.length > 10000) return 'Datos grandes';
        if (value.length < 100) return 'Datos pequeños';
        
        return 'Desconocido';
    }
    
    // Extraer timestamp de key o valor
    extractTimestamp(key, value) {
        // Buscar timestamp en la key
        const timestampMatch = key.match(/(\d{10,13})/);
        if (timestampMatch) {
            return parseInt(timestampMatch[1]);
        }
        
        // Buscar en el valor si es JSON
        try {
            const parsed = JSON.parse(value);
            if (parsed.timestamp) return parsed.timestamp;
            if (parsed.date) return new Date(parsed.date).getTime();
            if (parsed.createdAt) return new Date(parsed.createdAt).getTime();
            if (parsed.updatedAt) return new Date(parsed.updatedAt).getTime();
        } catch (e) {
            // No es JSON o no tiene timestamp
        }
        
        return null;
    }
    
    // Verificar si los datos son sospechosos
    isSuspiciousData(item) {
        if (!item.isJson) return false;
        
        const data = item.jsonData;
        
        // Datos extremadamente grandes para su tipo
        if (item.size > 1000000) return true; // Más de 1MB
        
        // Arrays anidados muy profundos
        if (JSON.stringify(data).length > item.size * 2) return true;
        
        // Valores null o undefined repetidos
        if (typeof data === 'string' && data.includes('null,null,null')) return true;
        
        // Datos de cache antiguos (más de 7 días)
        if (item.timestamp) {
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (item.timestamp < weekAgo && item.type.includes('Cache')) return true;
        }
        
        return false;
    }
    
    // Mostrar resultados del análisis
    displayAnalysisResults() {
        const analysisContainer = document.getElementById('storageAnalysis');
        if (!analysisContainer || !this.analysis) return;
        
        let html = '';
        
        // Resumen
        html += `
            <div class="cleaner-summary">
                <h5><i class="fas fa-chart-pie"></i> Resumen del análisis</h5>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="stat-value">${this.analysis.items.length}</div>
                        <div class="stat-label">Items totales</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value">${formatBytes(this.analysis.totalSize)}</div>
                        <div class="stat-label">Espacio usado</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value ${this.analysis.duplicates.length > 0 ? 'text-danger' : 'text-success'}">
                            ${this.analysis.duplicates.length}
                        </div>
                        <div class="stat-label">Duplicados</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value ${this.analysis.suspicious.length > 0 ? 'text-warning' : 'text-success'}">
                            ${this.analysis.suspicious.length}
                        </div>
                        <div class="stat-label">Sospechosos</div>
                    </div>
                </div>
            </div>
        `;
        
        // Items más grandes (top 10)
        const topItems = this.analysis.items.slice(0, 10);
        html += `<h5 style="margin-top: 20px; margin-bottom: 10px;">Items más grandes:</h5>`;
        
        topItems.forEach((item, index) => {
            const itemClass = item.isDuplicate ? 'duplicate' : 
                            item.isSuspicious ? 'suspicious' : 
                            item.size < 1000 ? 'small' : '';
            
            html += `
                <div class="storage-item-detail ${itemClass}">
                    <div class="item-info">
                        <span class="item-name">${item.key}</span>
                        <div class="item-details">
                            <span>Tipo: ${item.type}</span>
                            <span>Tamaño: ${item.formattedSize}</span>
                            <span class="item-type">${item.isJson ? 'JSON' : 'Texto'}</span>
                            ${item.isDuplicate ? '<span class="badge badge-danger">DUPLICADO</span>' : ''}
                            ${item.isSuspicious ? '<span class="badge badge-warning">SOSPECHOSO</span>' : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-xs btn-secondary" onclick="storageCleaner.viewItemDetails('${item.key.replace(/'/g, "\\'")}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-xs btn-danger" onclick="storageCleaner.deleteItem('${item.key.replace(/'/g, "\\'")}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Mostrar más items si hay pocos
        if (this.analysis.items.length > 10) {
            html += `
                <div style="text-align: center; margin: 10px 0;">
                    <small>... y ${this.analysis.items.length - 10} items más</small>
                </div>
            `;
        }
        
        analysisContainer.innerHTML = html;
    }
    
    // Ver detalles de un item
    viewItemDetails(key) {
        try {
            const value = localStorage.getItem(key);
            if (!value) {
                alert(`La key "${key}" no existe más`);
                return;
            }
            
            let content = value;
            try {
                const parsed = JSON.parse(value);
                content = JSON.stringify(parsed, null, 2);
            } catch (e) {
                // Mantener como texto plano
            }
            
            // Crear modal para mostrar detalles
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
                    <div class="modal-header">
                        <h3>Detalles: ${key}</h3>
                        <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal').remove()">X</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 15px;">
                            <strong>Tamaño:</strong> ${formatBytes((new Blob([value])).size)}<br>
                            <strong>Tipo:</strong> ${typeof value}<br>
                            <strong>Caracteres:</strong> ${value.length}
                        </div>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; max-height: 400px; overflow: auto;">
                            <pre style="margin: 0; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(content.substring(0, 5000))}${content.length > 5000 ? '\n\n... (contenido truncado)' : ''}</pre>
                        </div>
                        <div style="margin-top: 15px; text-align: center;">
                            <button class="btn btn-danger" onclick="storageCleaner.deleteItem('${key.replace(/'/g, "\\'")}'); this.closest('.modal').remove();">
                                <i class="fas fa-trash"></i> Eliminar este item
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error mostrando detalles:', error);
            alert('Error al mostrar detalles');
        }
    }
    
    // Eliminar un item específico
    deleteItem(key) {
        if (!confirm(`¿Eliminar "${key}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            const value = localStorage.getItem(key);
            const size = value ? (new Blob([value])).size : 0;
            
            localStorage.removeItem(key);
            
            console.log(`Eliminado: ${key} (${formatBytes(size)})`);
            showNotification(`Eliminado: ${key}`, 'success');
            
            // Actualizar análisis
            setTimeout(() => {
                this.analyzeStorage();
                updateStorageMeter();
            }, 100);
            
        } catch (error) {
            console.error('Error eliminando item:', error);
            showNotification('Error al eliminar item', 'error');
        }
    }
    
    // Eliminar duplicados
    cleanDuplicates() {
        if (!this.analysis || this.analysis.duplicates.length === 0) {
            alert('No se encontraron duplicados para eliminar');
            return;
        }
        
        const confirmMsg = `Se encontraron ${this.analysis.duplicates.length} items duplicados.\n¿Eliminar todos los duplicados?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        try {
            let freedSpace = 0;
            let deletedCount = 0;
            
            // Eliminar duplicados (mantener el primero de cada valor)
            const valueMap = new Map();
            const toDelete = [];
            
            // Identificar qué items eliminar
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                if (valueMap.has(value)) {
                    toDelete.push({ key, size: (new Blob([value])).size });
                } else {
                    valueMap.set(value, key);
                }
            }
            
            // Eliminar los duplicados identificados
            toDelete.forEach(item => {
                localStorage.removeItem(item.key);
                freedSpace += item.size;
                deletedCount++;
            });
            
            console.log(`Eliminados ${deletedCount} duplicados, liberados ${formatBytes(freedSpace)}`);
            
            showNotification(
                `Eliminados ${deletedCount} duplicados. Espacio liberado: ${formatBytes(freedSpace)}`,
                'success'
            );
            
            // Actualizar análisis
            setTimeout(() => {
                this.analyzeStorage();
                updateStorageMeter();
            }, 100);
            
        } catch (error) {
            console.error('Error eliminando duplicados:', error);
            showNotification('Error eliminando duplicados', 'error');
        }
    }
    
    // Limpiar órdenes antiguas
    cleanOldOrders() {
        try {
            // Obtener órdenes
            const orders = getData('orders') || [];
            if (orders.length === 0) {
                alert('No hay órdenes para limpiar');
                return;
            }
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const oldOrders = orders.filter(order => {
                const orderDate = new Date(order.date || order.createdAt);
                return orderDate < thirtyDaysAgo && order.status === 'completed';
            });
            
            if (oldOrders.length === 0) {
                alert('No hay órdenes completadas con más de 30 días');
                return;
            }
            
            const confirmMsg = `Se encontraron ${oldOrders.length} órdenes completadas con más de 30 días.\n¿Eliminar estas órdenes antiguas?`;
            
            if (!confirm(confirmMsg)) {
                return;
            }
            
            // Mantener solo las órdenes recientes
            const recentOrders = orders.filter(order => {
                const orderDate = new Date(order.date || order.createdAt);
                return orderDate >= thirtyDaysAgo || order.status !== 'completed';
            });
            
            // Guardar cambios
            setData('orders', recentOrders);
            
            // Calcular espacio liberado (estimado)
            const freedSpace = (oldOrders.length * 500); // Estimación: 500 bytes por orden
            
            showNotification(
                `Eliminadas ${oldOrders.length} órdenes antiguas. Espacio liberado: ~${formatBytes(freedSpace)}`,
                'success'
            );
            
            // Actualizar análisis
            setTimeout(() => {
                this.analyzeStorage();
                updateStorageMeter();
            }, 100);
            
        } catch (error) {
            console.error('Error limpiando órdenes antiguas:', error);
            showNotification('Error limpiando órdenes antiguas', 'error');
        }
    }
    
    // Limpieza profunda de todos los datos
    cleanAllData() {
        const confirmMsg = `¿LIMPIEZA PROFUNDA DE TODOS LOS DATOS?\n\n` +
                         `Esta acción eliminará:\n` +
                         `• Datos temporales y de cache\n` +
                         `• Datos duplicados\n` +
                         `• Datos sospechosos\n` +
                         `• Órdenes antiguas\n\n` +
                         `Se mantendrán los datos esenciales (productos, clientes, configuración).\n\n` +
                         `¿Continuar?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        try {
            showNotification('Iniciando limpieza profunda...', 'info');
            
            // 1. Hacer backup antes de limpiar
            this.createBackup();
            
            // 2. Identificar qué limpiar
            const toKeep = new Set();
            const toDelete = [];
            let totalFreed = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = (new Blob([value])).size;
                
                // Mantener datos esenciales
                const keep = 
                    key.includes('product') ||
                    key.includes('customer') ||
                    key.includes('supplier') ||
                    key.includes('business') ||
                    key.includes('config') ||
                    key.includes('setting') ||
                    key === 'products' ||
                    key === 'customers' ||
                    key === 'suppliers' ||
                    key === 'businessConfig';
                
                if (!keep) {
                    toDelete.push({ key, size });
                    totalFreed += size;
                } else {
                    toKeep.add(key);
                }
            }
            
            // 3. Eliminar datos no esenciales
            toDelete.forEach(item => {
                localStorage.removeItem(item.key);
            });
            
            // 4. Limpiar órdenes antiguas
            this.cleanOldOrders();
            
            // 5. Comprimir datos restantes
            this.compressRemainingData();
            
            showNotification(
                `Limpieza profunda completada. Espacio liberado: ${formatBytes(totalFreed)}`,
                'success'
            );
            
            // Actualizar análisis
            setTimeout(() => {
                this.analyzeStorage();
                updateStorageMeter();
            }, 500);
            
        } catch (error) {
            console.error('Error en limpieza profunda:', error);
            showNotification('Error en limpieza profunda', 'error');
        }
    }
    
    // Crear backup antes de limpiar
    createBackup() {
        try {
            const backupData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                try {
                    backupData[key] = JSON.parse(value);
                } catch (e) {
                    backupData[key] = value;
                }
            }
            
            const backupStr = JSON.stringify(backupData, null, 2);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupKey = `backup_before_clean_${timestamp}`;
            
            localStorage.setItem(backupKey, backupStr);
            
            console.log(`Backup creado: ${backupKey} (${formatBytes((new Blob([backupStr])).size)})`);
            
        } catch (error) {
            console.warn('No se pudo crear backup:', error);
        }
    }
    
    // Comprimir datos restantes
    compressRemainingData() {
        try {
            // Comprimir datos de productos
            const products = getData('products') || [];
            if (products.length > 0) {
                const compressedProducts = products.map(p => ({
                    id: p.id,
                    n: p.name,        // nombre abreviado
                    p: p.price,       // precio
                    i: p.image || '', // imagen
                    c: p.category || ''
                }));
                setData('products', compressedProducts);
            }
            
            // Comprimir datos de órdenes
            const orders = getData('orders') || [];
            if (orders.length > 0) {
                const compressedOrders = orders.map(o => ({
                    id: o.id,
                    c: o.customerId,
                    i: o.items,
                    s: o.status,
                    d: o.date
                }));
                setData('orders', compressedOrders);
            }
            
            console.log('Datos comprimidos exitosamente');
            
        } catch (error) {
            console.warn('Error comprimiendo datos:', error);
        }
    }
    
    // Escapar HTML para mostrar en pre
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Mostrar error
    showError(message) {
        const analysisContainer = document.getElementById('storageAnalysis');
        if (analysisContainer) {
            analysisContainer.innerHTML = `
                <div class="storage-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Error</strong>
                        <br><small>${message}</small>
                    </div>
                </div>
            `;
        }
    }
}

// Crear instancia global
const storageCleaner = new StorageCleaner();

// Hacer disponible globalmente
window.storageCleaner = storageCleaner;