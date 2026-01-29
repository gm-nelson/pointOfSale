// ========== FUNCIONES DE GESTIÓN DE DATOS ==========

// Cargar datos desde localStorage
function loadAppData() {
    console.log('Cargando datos desde localStorage...');
    const savedData = localStorage.getItem('snackOrdersData');
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Asegurar que window.appData existe
            window.appData = window.appData || {};
            
            // Actualizar appData con los datos guardados, manteniendo estructura
            const defaultData = getDefaultAppData();
            
            window.appData = {
                business: {
                    ...defaultData.business,
                    ...(parsedData.business || {})
                },
                products: Array.isArray(parsedData.products) ? parsedData.products : defaultData.products,
                customers: Array.isArray(parsedData.customers) ? parsedData.customers : defaultData.customers,
                suppliers: Array.isArray(parsedData.suppliers) ? parsedData.suppliers : defaultData.suppliers,
                orders: Array.isArray(parsedData.orders) ? parsedData.orders : defaultData.orders,
                inventory: {
                    ...defaultData.inventory,
                    ...(parsedData.inventory || {})
                },
                settings: {
                    ...defaultData.settings,
                    ...(parsedData.settings || {})
                }
            };
            
            console.log('Datos cargados exitosamente desde localStorage');
            showNotification('Datos cargados correctamente', 'success');
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
            // Si hay error, usar datos por defecto
            window.appData = getDefaultAppData();
            showNotification('Error al cargar datos. Se usarán datos predeterminados.', 'error');
        }
    } else {
        // Si no hay datos, usar datos por defecto
        window.appData = getDefaultAppData();
        console.log('No hay datos guardados. Usando datos por defecto.');
    }
    
    return window.appData;
}

function getDefaultAppData() {
    return {
        business: {
            name: "Snack Orders",
            logo: "",
            whatsapp: "+52 123 456 7890",
            address: "",
            rfc: ""
        },
        products: [],
        customers: [],
        suppliers: [],
        orders: [],
        inventory: {
            ingredients: [],
            recipes: [],
            purchases: [],
            purchaseOrders: [],
            alerts: [],
            consumptionLogs: [],
            suppliers: []
        },
        settings: {
            ivaRate: 0.16,
            currency: "MXN",
            colorTheme: "default",
            colors: {
                primary: "#FF6B35",
                secondary: "#004E89",
                background: "#f5f7fa",
                text: "#212529",
                cardBackground: "white",
                buttonText: "white"
            },
            enableInventoryCheck: true,
            enableLowStockAlerts: true,
            defaultSupplier: ""
        }
    };
}

function ensureInventoryStructure() {
    // Asegurarse de que appData existe
    if (!window.appData) {
        window.appData = getDefaultAppData();
        console.warn('ensureInventoryStructure: appData creado desde cero');
        return window.appData;
    }
    
    // Asegurar que inventory exista
    if (!window.appData.inventory) {
        window.appData.inventory = getDefaultAppData().inventory;
        console.warn('ensureInventoryStructure: inventory creado');
    }
    
    // Asegurar arrays individuales con valores por defecto
    const inventoryDefaults = getDefaultAppData().inventory;
    const inventoryProps = ['ingredients', 'recipes', 'purchases', 'purchaseOrders', 'alerts', 'consumptionLogs', 'suppliers'];
    
    inventoryProps.forEach(prop => {
        if (!window.appData.inventory[prop] || !Array.isArray(window.appData.inventory[prop])) {
            window.appData.inventory[prop] = inventoryDefaults[prop] || [];
            console.warn(`ensureInventoryStructure: ${prop} inicializado`);
        }
    });
    
    // Asegurar que cada ingrediente tenga estructura correcta
    if (window.appData.inventory.ingredients) {
        window.appData.inventory.ingredients.forEach((ingredient, index) => {
            if (!ingredient.suppliers) ingredient.suppliers = [];
            if (!ingredient.preferredSupplier) ingredient.preferredSupplier = '';
            if (!ingredient.lastUpdated) ingredient.lastUpdated = new Date().toISOString();
            if (!ingredient.location) ingredient.location = '';
            
            // Asegurar tipos numéricos
            ingredient.stock = parseFloat(ingredient.stock) || 0;
            ingredient.minStock = parseFloat(ingredient.minStock) || 0;
            ingredient.cost = parseFloat(ingredient.cost) || 0;
        });
    }
    
    // Asegurar que suppliers array exista a nivel raíz
    if (!window.appData.suppliers || !Array.isArray(window.appData.suppliers)) {
        window.appData.suppliers = [];
    }
    
    return window.appData;
}

function getRecipeByProductId(productId) {
    if (!window.appData || !window.appData.inventory || !window.appData.inventory.recipes) {
        return null;
    }
    return window.appData.inventory.recipes.find(r => r.productId === productId);
}

function getIngredientById(ingredientId) {
    if (!window.appData || !window.appData.inventory || !window.appData.inventory.ingredients) {
        return null;
    }
    return window.appData.inventory.ingredients.find(i => i.id === ingredientId);
}

function getSupplierById(supplierId) {
    if (!window.appData || !window.appData.suppliers) {
        return null;
    }
    return window.appData.suppliers.find(s => s.id === supplierId);
}

// Guardar datos con validación
function saveAppData() {
    try {
        // Asegurar estructura antes de guardar
        ensureInventoryStructure();
        
        // Validar datos importantes
        if (!window.appData.inventory.ingredients) {
            window.appData.inventory.ingredients = [];
        }
        
        // Guardar en localStorage
        localStorage.setItem('snackOrdersData', JSON.stringify(window.appData));
        
        console.log('Datos guardados correctamente en localStorage');
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        showNotification('Error al guardar datos: ' + error.message, 'error');
        return false;
    }
}

// Función auxiliar para obtener los datos actuales
function getAppData() {
    if (!window.appData) {
        return loadAppData();
    }
    return window.appData;
}

// ========== FUNCIONES DE IMPORTACIÓN/EXPORTACIÓN ==========

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar estructura básica
            if (typeof importedData !== 'object') {
                throw new Error('El archivo no contiene datos válidos');
            }
            
            // Mostrar diálogo de confirmación
            showImportConfirmationDialog(importedData);
        } catch (error) {
            console.error('Error al leer el archivo:', error);
            showNotification('Error: El archivo no es válido. ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('Error al leer el archivo', 'error');
    };
    
    reader.readAsText(file);
}

function showImportConfirmationDialog(importedData) {
    // Crear modal de confirmación
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal active';
    confirmModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Confirmar Importación de Datos</h2>
                <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal').remove()" title="Cerrar">X</button>
            </div>
            <div class="modal-body">
                <p>Se van a importar los siguientes datos:</p>
                
                <div class="import-summary" style="margin: 20px 0;">
                    ${importedData.business ? `<div>✓ Información del negocio: ${importedData.business.name || 'Sin nombre'}</div>` : ''}
                    ${importedData.products ? `<div>✓ Productos: ${importedData.products.length}</div>` : ''}
                    ${importedData.customers ? `<div>✓ Clientes: ${importedData.customers.length}</div>` : ''}
                    ${importedData.suppliers ? `<div>✓ Proveedores: ${importedData.suppliers.length}</div>` : ''}
                    ${importedData.orders ? `<div>✓ Órdenes: ${importedData.orders.length}</div>` : ''}
                    ${importedData.inventory ? `
                        <div>✓ Ingredientes: ${importedData.inventory.ingredients ? importedData.inventory.ingredients.length : 0}</div>
                        <div>✓ Recetas: ${importedData.inventory.recipes ? importedData.inventory.recipes.length : 0}</div>
                        <div>✓ Compras: ${importedData.inventory.purchases ? importedData.inventory.purchases.length : 0}</div>
                    ` : ''}
                    ${importedData.settings ? `<div>✓ Configuración del sistema</div>` : ''}
                </div>
                
                <div class="alert alert-warning" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>¡ADVERTENCIA!</strong>
                    <p>Esta acción sobrescribirá los datos existentes. Se recomienda hacer una copia de seguridad primero.</p>
                </div>
                
                <p><strong>Selecciona qué datos quieres importar:</strong></p>
                
                <div class="import-options-list" style="margin: 15px 0;">
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportBusiness" ${importedData.business ? 'checked' : 'disabled'} ${!importedData.business ? 'disabled' : ''}>
                        <label for="confirmImportBusiness">Información del negocio</label>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportProducts" ${importedData.products ? 'checked' : 'disabled'} ${!importedData.products ? 'disabled' : ''}>
                        <label for="confirmImportProducts">Productos (${importedData.products ? importedData.products.length : 0})</label>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportCustomers" ${importedData.customers ? 'checked' : 'disabled'} ${!importedData.customers ? 'disabled' : ''}>
                        <label for="confirmImportCustomers">Clientes (${importedData.customers ? importedData.customers.length : 0})</label>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportSuppliers" ${importedData.suppliers ? 'checked' : 'disabled'} ${!importedData.suppliers ? 'disabled' : ''}>
                        <label for="confirmImportSuppliers">Proveedores (${importedData.suppliers ? importedData.suppliers.length : 0})</label>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportOrders" ${importedData.orders ? 'checked' : 'disabled'} ${!importedData.orders ? 'disabled' : ''}>
                        <label for="confirmImportOrders">Órdenes (${importedData.orders ? importedData.orders.length : 0})</label>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportInventory" ${importedData.inventory ? 'checked' : 'disabled'} ${!importedData.inventory ? 'disabled' : ''}>
                        <label for="confirmImportInventory">Inventario completo</label>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="confirmImportSettings" ${importedData.settings ? 'checked' : 'disabled'} ${!importedData.settings ? 'disabled' : ''}>
                        <label for="confirmImportSettings">Configuración del sistema</label>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn btn-primary" onclick="confirmImportFromDialog(${JSON.stringify(importedData).replace(/"/g, '&quot;')})">
                        <i class="fas fa-check"></i> Importar Datos Seleccionados
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
}

// Función renombrada para evitar conflicto
function confirmImportFromDialog(importedData) {
    // Obtener selecciones del usuario
    const importBusiness = document.getElementById('confirmImportBusiness')?.checked || false;
    const importProducts = document.getElementById('confirmImportProducts')?.checked || false;
    const importCustomers = document.getElementById('confirmImportCustomers')?.checked || false;
    const importSuppliers = document.getElementById('confirmImportSuppliers')?.checked || false;
    const importOrders = document.getElementById('confirmImportOrders')?.checked || false;
    const importInventory = document.getElementById('confirmImportInventory')?.checked || false;
    const importSettings = document.getElementById('confirmImportSettings')?.checked || false;
    
    // Validar que al menos una opción esté seleccionada
    const anySelected = importBusiness || importProducts || importCustomers || importSuppliers || 
                       importOrders || importInventory || importSettings;
    
    if (!anySelected) {
        showNotification('Por favor selecciona al menos un tipo de dato para importar', 'error');
        return;
    }
    
    // Obtener datos actuales
    let currentData = getAppData();
    
    // Actualizar solo las secciones seleccionadas
    if (importBusiness && importedData.business) {
        currentData.business = {
            ...currentData.business,
            ...importedData.business
        };
    }
    
    if (importProducts && importedData.products) {
        currentData.products = importedData.products;
    }
    
    if (importCustomers && importedData.customers) {
        currentData.customers = importedData.customers;
    }
    
    if (importSuppliers && importedData.suppliers) {
        currentData.suppliers = importedData.suppliers;
    }
    
    if (importOrders && importedData.orders) {
        currentData.orders = importedData.orders;
    }
    
    if (importInventory && importedData.inventory) {
        // Asegurarse de que la estructura de inventario exista
        if (!currentData.inventory) {
            currentData.inventory = getDefaultAppData().inventory;
        }
        
        // Importar cada sección del inventario
        if (importedData.inventory.ingredients) {
            currentData.inventory.ingredients = importedData.inventory.ingredients;
        }
        
        if (importedData.inventory.recipes) {
            currentData.inventory.recipes = importedData.inventory.recipes;
        }
        
        if (importedData.inventory.purchases) {
            currentData.inventory.purchases = importedData.inventory.purchases;
        }
        
        if (importedData.inventory.purchaseOrders) {
            currentData.inventory.purchaseOrders = importedData.inventory.purchaseOrders;
        }
        
        if (importedData.inventory.alerts) {
            currentData.inventory.alerts = importedData.inventory.alerts;
        }
        
        if (importedData.inventory.consumptionLogs) {
            currentData.inventory.consumptionLogs = importedData.inventory.consumptionLogs;
        }
        
        if (importedData.inventory.suppliers) {
            currentData.inventory.suppliers = importedData.inventory.suppliers;
        }
    }
    
    if (importSettings && importedData.settings) {
        currentData.settings = {
            ...currentData.settings,
            ...importedData.settings
        };
    }
    
    // Guardar datos actualizados
    window.appData = currentData;
    if (saveAppData()) {
        // Cerrar modal
        const modal = document.querySelector('.modal.active:last-child');
        if (modal) modal.remove();
        
        // Mostrar notificación
        showNotification('Datos importados correctamente', 'success');
        
        // Actualizar la UI
        updateBusinessInfo();
        applyColorTheme();
        renderAllData();
    }
    
    // Limpiar input de archivo
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) importFileInput.value = '';
}

// Exportar todos los datos
function exportData() {
    const data = getAppData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `snack-orders-backup-${date}.json`;
    
    // Crear enlace de descarga
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showNotification('Datos exportados correctamente', 'success');
}

// Borrar todos los datos
function clearData() {
    if (!confirm('¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) {
        return;
    }
    
    // Reiniciar datos a valores por defecto
    const defaultData = getDefaultAppData();
    
    window.appData = defaultData;
    if (saveAppData()) {
        showNotification('Todos los datos han sido borrados', 'success');
        
        // Actualizar UI
        updateBusinessInfo();
        applyColorTheme();
        renderAllData();
        
        // Mostrar pantalla de bienvenida
        if (elements.welcomeModal) {
            elements.welcomeModal.classList.add('active');
        }
    }
}

function exportInventoryData() {
    try {
        ensureInventoryStructure();
        const inventoryData = {
            ingredients: window.appData.inventory.ingredients,
            recipes: window.appData.inventory.recipes,
            purchases: window.appData.inventory.purchases,
            purchaseOrders: window.appData.inventory.purchaseOrders
        };
        
        const dataStr = JSON.stringify(inventoryData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `inventory-backup-${date}.json`;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showNotification('Datos de inventario exportados correctamente');
    } catch (error) {
        console.error('Error al exportar inventario:', error);
        showNotification('Error al exportar inventario', 'error');
    }
}