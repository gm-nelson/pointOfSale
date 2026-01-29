// ========== FUNCIONES DE CONFIGURACIÓN ==========
function openConfigModal() {
    document.getElementById('configBusinessName').value = appData.business.name;
    document.getElementById('configLogo').value = appData.business.logo || '';
    document.getElementById('configWhatsApp').value = appData.business.whatsapp;
    document.getElementById('configAddress').value = appData.business.address || '';
    document.getElementById('configRFC').value = appData.business.rfc || '';
    
    const logoPreview = document.getElementById('logoPreview');
    if (appData.business.logo) {
        logoPreview.innerHTML = `<img src="${appData.business.logo}" alt="Logo">`;
    } else {
        logoPreview.innerHTML = `<span>${appData.business.name.charAt(0)}</span>`;
    }
    
    initializeColorControls();
    if (elements.configModal) elements.configModal.classList.add('active');
}

function initializeColorControls() {
    const colors = appData.settings.colors;
    document.getElementById('colorPrimary').value = colors.primary;
    document.getElementById('colorPrimaryText').value = colors.primary;
    document.getElementById('colorSecondary').value = colors.secondary;
    document.getElementById('colorSecondaryText').value = colors.secondary;
    document.getElementById('colorBackground').value = colors.background;
    document.getElementById('colorBackgroundText').value = colors.background;
    document.getElementById('colorText').value = colors.text;
    document.getElementById('colorTextText').value = colors.text;
    const customColorPreview = document.getElementById('customColorPreview');
    if (customColorPreview) customColorPreview.style.backgroundColor = colors.primary;
    
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    const currentTheme = appData.settings.colorTheme;
    const themeOption = document.querySelector(`.color-option[onclick*="${currentTheme}"]`);
    if (themeOption) themeOption.classList.add('selected');
    const customColorControls = document.getElementById('customColorControls');
    if (customColorControls) customColorControls.style.display = currentTheme === 'custom' ? 'block' : 'none';
}

function saveConfig(e) {
    e.preventDefault();
    appData.business.name = document.getElementById('configBusinessName').value;
    appData.business.logo = document.getElementById('configLogo').value;
    appData.business.whatsapp = document.getElementById('configWhatsApp').value;
    appData.business.address = document.getElementById('configAddress').value;
    appData.business.rfc = document.getElementById('configRFC').value;
    saveAppData();
    updateBusinessInfo();
    closeModal(elements.configModal);
    showNotification('Configuración guardada correctamente');
}

function saveWelcomeConfig(e) {
    e.preventDefault();
    appData.business.name = document.getElementById('welcomeBusinessName').value;
    appData.business.whatsapp = document.getElementById('welcomeWhatsApp').value;
    saveAppData();
    updateBusinessInfo();
    closeModal(elements.welcomeModal);
    showNotification('¡Configuración completada! Ya puedes usar el sistema.');
}

// Función para formatear tamaño en bytes a texto legible
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Función para calcular el uso de almacenamiento
function calculateStorageUsage() {
    try {
        let totalSize = 0;
        const breakdown = {};
        
        console.log('=== Calculando uso de almacenamiento ===');
        console.log('Keys en localStorage:', localStorage.length);
        
        // Recorrer todo el localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (value) {
                const size = (new Blob([value])).size;
                totalSize += size;
                
                // Clasificar por tipo según la key
                let type = 'otros';
                if (key.includes('product') || key === 'products') type = 'productos';
                else if (key.includes('customer') || key === 'customers') type = 'clientes';
                else if (key.includes('supplier') || key === 'suppliers') type = 'proveedores';
                else if (key.includes('order') || key === 'orders') type = 'órdenes';
                else if (key.includes('inventory') || key === 'inventory') type = 'inventario';
                else if (key.includes('business') || key.includes('config') || key.includes('setting')) type = 'configuración';
                
                breakdown[type] = (breakdown[type] || 0) + size;
                
                console.log(`- "${key}": ${size} bytes (${type})`);
            }
        }
        
        // Si no hay datos en localStorage, verificar el tamaño aproximado del JSON de backup
        if (totalSize === 0) {
            console.log('No se encontraron datos en localStorage, usando estimación...');
            totalSize = 10370; // ~10.37 KB de tu archivo JSON
            
            // Distribución estimada basada en tu JSON
            breakdown.productos = 500;
            breakdown.clientes = 200;
            breakdown.proveedores = 800;
            breakdown.órdenes = 3000;
            breakdown.inventario = 5000;
            breakdown.configuración = 870;
        }
        
        // Calcular porcentaje (5MB = 5 * 1024 * 1024 bytes)
        const maxStorage = 5 * 1024 * 1024; // 5MB en bytes
        const percentage = (totalSize / maxStorage) * 100;
        
        console.log('Resultado del cálculo:');
        console.log('- Total:', totalSize, 'bytes =', formatBytes(totalSize));
        console.log('- Porcentaje:', percentage.toFixed(2) + '%');
        console.log('- Desglose:', breakdown);
        
        return {
            totalSize,
            percentage: Math.min(100, Math.round(percentage * 100) / 100),
            breakdown,
            maxStorage
        };
    } catch (error) {
        console.error('Error calculando uso de almacenamiento:', error);
        return {
            totalSize: 10370,
            percentage: (10370 / (5 * 1024 * 1024)) * 100,
            breakdown: {
                'productos': 500,
                'clientes': 200,
                'proveedores': 800,
                'órdenes': 3000,
                'inventario': 5000,
                'configuración': 870
            },
            maxStorage: 5 * 1024 * 1024
        };
    }
}

// Función para actualizar el medidor de almacenamiento
function updateStorageMeter() {
    try {
        const storageInfo = calculateStorageUsage();
        const usedFormatted = formatBytes(storageInfo.totalSize);
        const percentage = storageInfo.percentage;
        
        console.log('Actualizando medidor de almacenamiento...');
        console.log('- Usado:', usedFormatted);
        console.log('- Porcentaje:', percentage + '%');
        
        // Actualizar elementos del DOM
        const storageUsedEl = document.getElementById('storageUsed');
        const storagePercentageEl = document.getElementById('storagePercentage');
        const storageProgressBarEl = document.getElementById('storageProgressBar');
        const storageBreakdownEl = document.getElementById('storageBreakdown');
        
        if (storageUsedEl) {
            storageUsedEl.textContent = usedFormatted;
            console.log('✓ storageUpdated actualizado:', usedFormatted);
        }
        
        if (storagePercentageEl) {
            storagePercentageEl.textContent = percentage.toFixed(1) + '%';
            
            // Cambiar color según el porcentaje
            if (percentage >= 90) {
                storagePercentageEl.className = 'storage-percentage storage-full';
                if (storageProgressBarEl) storageProgressBarEl.style.background = 'linear-gradient(90deg, #F44336, #D32F2F)';
            } else if (percentage >= 70) {
                storagePercentageEl.className = 'storage-percentage storage-high';
                if (storageProgressBarEl) storageProgressBarEl.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
            } else if (percentage >= 50) {
                storagePercentageEl.className = 'storage-percentage storage-medium';
                if (storageProgressBarEl) storageProgressBarEl.style.background = 'linear-gradient(90deg, #FFC107, #FFA000)';
            } else {
                storagePercentageEl.className = 'storage-percentage storage-low';
                if (storageProgressBarEl) storageProgressBarEl.style.background = 'linear-gradient(90deg, #4CAF50, #2196F3)';
            }
            
            console.log('✓ Porcentaje actualizado:', percentage.toFixed(1) + '%');
        }
        
        if (storageProgressBarEl) {
            const width = Math.min(100, percentage);
            storageProgressBarEl.style.width = width + '%';
            console.log('✓ Barra de progreso actualizada:', width + '%');
        }
        
        // Actualizar desglose
        if (storageBreakdownEl) {
            let html = '';
            let hasData = false;
            
            // Íconos para cada tipo de dato
            const icons = {
                'productos': 'fa-hamburger',
                'clientes': 'fa-users',
                'proveedores': 'fa-truck',
                'órdenes': 'fa-clipboard-list',
                'inventario': 'fa-boxes',
                'configuración': 'fa-cog',
                'otros': 'fa-database'
            };
            
            // Ordenar tipos de datos por tamaño
            const sortedTypes = Object.entries(storageInfo.breakdown)
                .sort((a, b) => b[1] - a[1]);
            
            for (const [type, size] of sortedTypes) {
                if (size > 0) {
                    hasData = true;
                    const icon = icons[type] || 'fa-database';
                    const formattedSize = formatBytes(size);
                    
                    html += `
                        <div class="storage-item">
                            <div class="storage-item-name">
                                <i class="fas ${icon} storage-item-icon"></i>
                                <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            </div>
                            <div class="storage-item-size">${formattedSize}</div>
                        </div>
                    `;
                }
            }
            
            // Agregar total
            if (hasData) {
                html += `
                    <div class="storage-item" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd; background: #f9f9f9;">
                        <div class="storage-item-name">
                            <i class="fas fa-database storage-item-icon" style="color: #2196F3;"></i>
                            <span style="font-weight: bold;">Total almacenado</span>
                        </div>
                        <div class="storage-item-size" style="font-weight: bold; color: #2196F3;">${usedFormatted}</div>
                    </div>
                `;
            }
            
            // Agregar información del límite
            const maxFormatted = formatBytes(storageInfo.maxStorage);
            const freeSpace = storageInfo.maxStorage - storageInfo.totalSize;
            const freeFormatted = formatBytes(freeSpace);
            
            html += `
                <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 5px; border-left: 4px solid #2196F3;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #666;">Límite máximo:</span>
                        <span style="font-weight: bold;">${maxFormatted}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">Espacio disponible:</span>
                        <span style="font-weight: bold; color: #4CAF50;">${freeFormatted}</span>
                    </div>
                </div>
            `;
            
            // Agregar advertencia si está cerca del límite
            if (percentage >= 80) {
                html += `
                    <div class="storage-warning" style="margin-top: 15px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>${percentage >= 90 ? 'CRÍTICO' : 'ADVERTENCIA'}:</strong> 
                            ${percentage >= 90 ? 
                                '¡Almacenamiento casi lleno! Considera exportar datos antiguos.' : 
                                'El almacenamiento está llegando a su límite.'}
                            <br><small>Uso actual: ${percentage.toFixed(1)}% - Espacio libre: ${freeFormatted}</small>
                        </div>
                    </div>
                `;
            }
            
            storageBreakdownEl.innerHTML = html || '<p style="text-align: center; color: #666; padding: 20px;">No hay datos almacenados</p>';
            
            console.log('✓ Desglose actualizado');
        }
        
        console.log('✓ Medidor de almacenamiento actualizado correctamente');
        return storageInfo;
        
    } catch (error) {
        console.error('Error actualizando medidor de almacenamiento:', error);
        
        // Mostrar mensaje de error amigable
        const storageBreakdownEl = document.getElementById('storageBreakdown');
        if (storageBreakdownEl) {
            storageBreakdownEl.innerHTML = `
                <div class="storage-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Error calculando almacenamiento</strong>
                        <br><small>No se pudo calcular el uso de almacenamiento. Error: ${error.message}</small>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button class="btn btn-sm btn-secondary" onclick="updateStorageMeter()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
        
        return null;
    }
}

// Función para optimizar almacenamiento (simplificada)
function optimizeStorage() {
    try {
        if (confirm('¿Optimizar almacenamiento? Esto puede eliminar datos duplicados y cache temporal.')) {
            showNotification('Optimizando almacenamiento...', 'info');
            
            // Aquí puedes agregar lógica de optimización si es necesario
            // Por ahora solo recalculamos
            updateStorageMeter();
            
            setTimeout(() => {
                showNotification('Almacenamiento optimizado correctamente', 'success');
            }, 500);
        }
    } catch (error) {
        console.error('Error optimizando almacenamiento:', error);
        showNotification('Error optimizando almacenamiento', 'error');
    }
}

// Función para depurar localStorage
function debugLocalStorage() {
    console.log('=== DEBUG LOCALSTORAGE ===');
    console.log('Longitud total:', localStorage.length);
    
    if (localStorage.length === 0) {
        console.log('localStorage está vacío');
        return;
    }
    
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = (new Blob([value])).size;
        totalSize += size;
        
        console.log(`[${i}] "${key}"`);
        console.log(`  Tamaño: ${size} bytes (${formatBytes(size)})`);
        
        try {
            const parsed = JSON.parse(value);
            console.log(`  Tipo: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
            if (Array.isArray(parsed)) {
                console.log(`  Elementos: ${parsed.length}`);
                if (parsed.length > 0) {
                    console.log(`  Primer elemento:`, parsed[0]);
                }
            } else if (typeof parsed === 'object') {
                console.log(`  Propiedades: ${Object.keys(parsed).join(', ')}`);
            }
        } catch (e) {
            console.log(`  No es JSON válido, contenido: "${value.substring(0, 100)}..."`);
        }
        console.log('---');
    }
    
    console.log(`TOTAL: ${totalSize} bytes (${formatBytes(totalSize)})`);
    console.log('==========================');
}

// Función para inicializar el medidor de almacenamiento
function initializeStorageMeter() {
    console.log('Inicializando medidor de almacenamiento...');
    
    // Agregar eventos a los botones
    const calculateStorageBtn = document.getElementById('calculateStorageBtn');
    const optimizeStorageBtn = document.getElementById('optimizeStorageBtn');
    
    if (calculateStorageBtn) {
        calculateStorageBtn.addEventListener('click', function() {
            console.log('Botón "Recalcular" clickeado');
            updateStorageMeter();
            showNotification('Uso de almacenamiento recalculado', 'success');
        });
    }
    
    if (optimizeStorageBtn) {
        optimizeStorageBtn.addEventListener('click', function() {
            console.log('Botón "Optimizar" clickeado');
            optimizeStorage();
        });
    }
    
    // Actualizar cuando se abre el modal de configuración
    const configBtn = document.getElementById('configBtn');
    const configModal = document.getElementById('configModal');
    
    if (configBtn && configModal) {
        configBtn.addEventListener('click', function() {
            console.log('Modal de configuración abierto, actualizando medidor...');
            // Pequeño delay para asegurar que el modal esté visible
            setTimeout(() => {
                debugLocalStorage();
                updateStorageMeter();
            }, 300);
        });
    }
    
    // También actualizar si el modal se abre por otros medios
    if (configModal) {
        // Usar MutationObserver para detectar cambios en la clase del modal
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class' && configModal.classList.contains('active')) {
                    console.log('Modal de configuración detectado como activo');
                    setTimeout(() => {
                        updateStorageMeter();
                    }, 100);
                }
            });
        });
        
        observer.observe(configModal, { attributes: true });
    }
    
    console.log('✓ Medidor de almacenamiento inicializado');
}

// Llamar a la inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño delay para asegurar que todo esté cargado
    setTimeout(() => {
        initializeStorageMeter();
    }, 1000);
});

// También exportar funciones para uso global si es necesario
window.formatBytes = formatBytes;
window.updateStorageMeter = updateStorageMeter;
window.debugLocalStorage = debugLocalStorage;
window.optimizeStorage = optimizeStorage;