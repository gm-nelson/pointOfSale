// ========== CONFIGURACIÓN DE EVENT LISTENERS ==========

function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Tabs principales
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Botones principales
    if (elements.newProductBtn) {
        elements.newProductBtn.addEventListener('click', () => openProductModal());
    }
    if (elements.newCustomerBtn) {
        elements.newCustomerBtn.addEventListener('click', () => openCustomerModal());
    }
    if (elements.newOrderBtn) {
        elements.newOrderBtn.addEventListener('click', () => openOrderModal());
    }
    if (elements.configBtn) {
        elements.configBtn.addEventListener('click', () => openConfigModal());
    }
    if (elements.refreshReportsBtn) {
        elements.refreshReportsBtn.addEventListener('click', () => refreshReports());
    }
    if (elements.newSupplierBtn) {
        elements.newSupplierBtn.addEventListener('click', () => openSupplierModal());
    }

    // Cerrar modales
    const closeButtons = {
        'closeProductModal': elements.productModal,
        'closeCustomerModal': elements.customerModal,
        'closeIngredientModal': document.getElementById('ingredientModal'),
        'closePurchaseModal': document.getElementById('purchaseModal'),
        'closeRecipeIngredientModal': document.getElementById('recipeIngredientModal'),
        'closeOrderModal': elements.orderModal,
        'closeConfigModal': elements.configModal,
        'closeOrderDetailModal': elements.orderDetailModal,
        'closeSupplierModal': document.getElementById('supplierModal'),
        'closePurchaseOrderModal': document.getElementById('purchaseOrderModal'),
        'closeConfirmPurchaseModal': document.getElementById('confirmPurchaseModal')
    };

    Object.keys(closeButtons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn && closeButtons[btnId]) {
            btn.addEventListener('click', () => closeModal(closeButtons[btnId]));
        }
    });

    // Formularios
    if (elements.productForm) {
        elements.productForm.addEventListener('submit', saveProduct);
    }
    if (elements.customerForm) {
        elements.customerForm.addEventListener('submit', saveCustomer);
    }
    if (elements.configForm) {
        elements.configForm.addEventListener('submit', saveConfig);
    }
    if (elements.welcomeForm) {
        elements.welcomeForm.addEventListener('submit', saveWelcomeConfig);
    }
    if (elements.supplierForm) {
        elements.supplierForm.addEventListener('submit', saveSupplier);
    }
    if (elements.purchaseOrderForm) {
        elements.purchaseOrderForm.addEventListener('submit', generatePurchaseOrders);
    }
    if (elements.confirmPurchaseForm) {
        elements.confirmPurchaseForm.addEventListener('submit', confirmPurchase);
    }

    // Gestión de datos
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
    if (importDataBtn) importDataBtn.addEventListener('click', () => {
        if (importFileInput) importFileInput.click();
        const importOptions = document.getElementById('importOptions');
        if (importOptions) importOptions.style.display = 'block';
    });
    if (clearDataBtn) clearDataBtn.addEventListener('click', clearData);
    if (importFileInput) importFileInput.addEventListener('change', handleImportFile);

    // Orden - Paso 1: Cliente
    const selectCustomerBtn = document.getElementById('selectCustomerBtn');
    const newCustomerInOrderBtn = document.getElementById('newCustomerInOrderBtn');
    
    if (selectCustomerBtn) selectCustomerBtn.addEventListener('click', goToStep2);
    if (newCustomerInOrderBtn) newCustomerInOrderBtn.addEventListener('click', () => {
        closeModal(elements.orderModal);
        openCustomerModal();
    });

    // Orden - Paso 2: Productos
    const backToStep1Btn = document.getElementById('backToStep1Btn');
    const goToStep3Btn = document.getElementById('goToStep3Btn');
    
    if (backToStep1Btn) backToStep1Btn.addEventListener('click', goToStep1);
    if (goToStep3Btn) goToStep3Btn.addEventListener('click', goToStep3);

    // Orden - Paso 3: Confirmación
    const backToStep2Btn = document.getElementById('backToStep2Btn');
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    
    if (backToStep2Btn) backToStep2Btn.addEventListener('click', goToStep2FromStep3);
    if (saveOrderBtn) saveOrderBtn.addEventListener('click', saveOrder);

    // Controladores de color
    document.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('input', function() {
            const textId = this.id + 'Text';
            const textInput = document.getElementById(textId);
            if (textInput) textInput.value = this.value;
        });
    });

    document.querySelectorAll('input[type="text"][id$="Text"]').forEach(input => {
        input.addEventListener('input', function() {
            const colorId = this.id.replace('Text', '');
            const colorInput = document.getElementById(colorId);
            if (colorInput) colorInput.value = this.value;
        });
    });

    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    console.log('Event listeners configurados correctamente');
}

// ========== FUNCIONES DE NAVEGACIÓN ==========

// Cambiar pestaña principal
function switchTab(tabId) {
    // Actualizar tabs activos
    elements.tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Mostrar contenido correspondiente
    elements.tabContents.forEach(content => {
        if (content.id === `${tabId}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Cargar datos específicos de la pestaña
    if (tabId === 'orders') {
        renderOrders();
    } else if (tabId === 'products') {
        renderProducts();
    } else if (tabId === 'customers') {
        renderCustomers();
    } else if (tabId === 'suppliers') {
        renderSuppliers();
        renderPurchaseOrders();
    } else if (tabId === 'inventory') {
        ensureInventoryStructure();
        renderIngredients();
        updateInventorySummary();
    } else if (tabId === 'reports') {
        const reportDetailContainer = document.getElementById('reportDetailContainer');
        if (reportDetailContainer) reportDetailContainer.style.display = 'none';
    }
    
    console.log(`Cambiado a pestaña: ${tabId}`);
}

// Cambiar pestaña de inventario
function switchInvTab(tabId) {
    // Actualizar tabs activos
    document.querySelectorAll('.inv-tab').forEach(tab => {
        if (tab.getAttribute('data-inv-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Mostrar contenido correspondiente
    document.querySelectorAll('.inv-tab-content').forEach(content => {
        if (content.id === `${tabId}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Cargar datos específicos de la pestaña
    const contentElement = document.getElementById(`${tabId}-content`);
    if (!contentElement) return;
    
    if (tabId === 'ingredients') {
        renderIngredients();
    } else if (tabId === 'recipes') {
        renderProductsForRecipes();
    } else if (tabId === 'purchases') {
        renderPurchases();
    } else if (tabId === 'alerts') {
        renderAlerts();
    } else if (tabId === 'purchase-orders') {
        renderPurchaseOrders();
    }
}

// Cambiar pestaña de proveedores
function switchSupTab(tabId) {
    // Actualizar tabs activos
    document.querySelectorAll('.sup-tab').forEach(tab => {
        if (tab.getAttribute('data-sup-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Mostrar contenido correspondiente
    document.querySelectorAll('.sup-tab-content').forEach(content => {
        if (content.id === `${tabId}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Cargar datos específicos
    const contentElement = document.getElementById(`${tabId}-content`);
    if (!contentElement) return;
    
    if (tabId === 'suppliers-list') {
        renderSuppliers();
    } else if (tabId === 'supplier-orders') {
        renderPurchaseOrders();
    }
}

// ========== FUNCIONES DE INTERFAZ ==========

// Aplicar tema de colores
function applyColorTheme() {
    if (!window.appData || !window.appData.settings || !window.appData.settings.colors) {
        console.warn('No se puede aplicar tema de colores: datos no disponibles');
        return;
    }
    
    const colors = window.appData.settings.colors;
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--secondary', colors.secondary);
    document.documentElement.style.setProperty('--background-color', colors.background);
    document.documentElement.style.setProperty('--text-color', colors.text);
    document.documentElement.style.setProperty('--card-background', colors.cardBackground);
    document.documentElement.style.setProperty('--button-text', colors.buttonText);
    
    // Calcular variantes de color
    const primaryDark = adjustColor(colors.primary, -20);
    document.documentElement.style.setProperty('--primary-dark', primaryDark);
    
    const primaryRGB = hexToRgb(colors.primary);
    document.documentElement.style.setProperty('--primary-rgb', `${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}`);
    
    console.log('Tema de colores aplicado');
}

// Verificar primer uso
function checkFirstUse() {
    const savedData = localStorage.getItem('snackOrdersData');
    if (!savedData) {
        if (elements.welcomeModal) {
            elements.welcomeModal.classList.add('active');
        }
        console.log('Primer uso detectado - Mostrando pantalla de bienvenida');
    } else {
        if (elements.welcomeModal) {
            elements.welcomeModal.classList.remove('active');
        }
    }
}

// Actualizar información del negocio en la interfaz
function updateBusinessInfo() {
    if (!window.appData || !window.appData.business) {
        console.warn('No se puede actualizar información del negocio: datos no disponibles');
        return;
    }
    
    const businessNameElement = document.getElementById('business-name');
    const businessContactElement = document.getElementById('business-contact');
    const logoElement = document.getElementById('logo');
    const logoPreview = document.getElementById('logoPreview');
    
    if (businessNameElement) {
        businessNameElement.textContent = window.appData.business.name;
    }
    
    if (businessContactElement) {
        businessContactElement.innerHTML = `<i class="fab fa-whatsapp"></i> ${window.appData.business.whatsapp}`;
    }
    
    if (logoElement) {
        if (window.appData.business.logo) {
            logoElement.innerHTML = `<img src="${window.appData.business.logo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;padding:5px;">`;
        } else {
            logoElement.textContent = window.appData.business.name.charAt(0);
        }
    }
    
    if (logoPreview) {
        if (window.appData.business.logo) {
            logoPreview.innerHTML = `<img src="${window.appData.business.logo}" alt="Logo">`;
        } else {
            logoPreview.innerHTML = `<span>${window.appData.business.name.charAt(0)}</span>`;
        }
    }
    
    console.log('Información del negocio actualizada');
}

// Cerrar modal
function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        console.log('Modal cerrado');
    }
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    if (!elements.notificationText || !elements.notification) {
        console.warn('No se puede mostrar notificación: elementos no encontrados');
        return;
    }
    
    elements.notificationText.textContent = message;
    elements.notification.className = 'notification';
    elements.notification.classList.add(type);
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        if (elements.notification) {
            elements.notification.classList.remove('show');
        }
    }, 3000);
    
    console.log(`Notificación: ${message} (${type})`);
}

// ========== FUNCIONES DE COLORES ==========

function selectColorTheme(theme, event) {
    if (!window.appData || !window.appData.settings) {
        console.warn('No se puede cambiar tema: datos no disponibles');
        return;
    }
    
    window.appData.settings.colorTheme = theme;
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }
    
    const customControls = document.getElementById('customColorControls');
    if (theme === 'custom') {
        if (customControls) customControls.style.display = 'block';
        return;
    } else {
        if (customControls) customControls.style.display = 'none';
    }
    
    let colors;
    switch(theme) {
        case 'professional':
            colors = {primary: "#2C3E50", secondary: "#34495E", background: "#ECF0F1", text: "#2C3E50", cardBackground: "white", buttonText: "white"};
            break;
        case 'modern':
            colors = {primary: "#3498DB", secondary: "#2980B9", background: "#F7F9FA", text: "#2C3E50", cardBackground: "white", buttonText: "white"};
            break;
        case 'vibrant':
            colors = {primary: "#9B59B6", secondary: "#8E44AD", background: "#F4ECF7", text: "#2C3E50", cardBackground: "white", buttonText: "white"};
            break;
        case 'dark':
            colors = {primary: "#34495E", secondary: "#2C3E50", background: "#1C2833", text: "#ECF0F1", cardBackground: "#2C3E50", buttonText: "white"};
            break;
        default:
            colors = {primary: "#FF6B35", secondary: "#004E89", background: "#f5f7fa", text: "#212529", cardBackground: "white", buttonText: "white"};
    }
    
    window.appData.settings.colors = colors;
    applyColorTheme();
    saveAppData();
    showNotification('Tema de colores aplicado correctamente');
}

function applyCustomColors() {
    const colors = {
        primary: document.getElementById('colorPrimary').value,
        secondary: document.getElementById('colorSecondary').value,
        background: document.getElementById('colorBackground').value,
        text: document.getElementById('colorText').value,
        cardBackground: "white",
        buttonText: "white"
    };
    
    window.appData.settings.colors = colors;
    window.appData.settings.colorTheme = 'custom';
    applyColorTheme();
    saveAppData();
    showNotification('Colores personalizados aplicados');
}

// Renderizar todos los datos
function renderAllData() {
    console.log('Renderizando todos los datos...');
    
    // Verificar que appData exista
    if (!window.appData) {
        console.warn('No se puede renderizar datos: appData no disponible');
        return;
    }
    
    renderOrders();
    renderProducts();
    renderCustomers();
    renderSuppliers();
    renderIngredients();
    renderPurchases();
    renderAlerts();
    renderPurchaseOrders();
    updateInventorySummary();
    
    console.log('Todos los datos renderizados');
}

// ========== INICIALIZACIÓN DE MÓDULOS ==========

// Inicializar módulo de inventario
function initInventoryModule() {
    console.log('Inicializando módulo de inventario...');
    
    // Botones principales
    const newIngredientBtn = document.getElementById('newIngredientBtn');
    const newPurchaseBtn = document.getElementById('newPurchaseBtn');
    const exportInventoryBtn = document.getElementById('exportInventoryBtn');
    const generatePurchaseOrderBtn = document.getElementById('generatePurchaseOrderBtn');
    
    if (newIngredientBtn) newIngredientBtn.addEventListener('click', () => openIngredientModal());
    if (newPurchaseBtn) newPurchaseBtn.addEventListener('click', () => openPurchaseModal());
    if (exportInventoryBtn) exportInventoryBtn.addEventListener('click', exportInventoryData);
    if (generatePurchaseOrderBtn) generatePurchaseOrderBtn.addEventListener('click', () => openPurchaseOrderModal());
    
    // Tabs internas de inventario
    document.querySelectorAll('.inv-tab').forEach(tab => {
        tab.addEventListener('click', () => switchInvTab(tab.getAttribute('data-inv-tab')));
    });
    
    // Modal de ingrediente
    const ingredientForm = document.getElementById('ingredientForm');
    if (ingredientForm) ingredientForm.addEventListener('submit', saveIngredient);
    
    // Modal de compra
    const addPurchaseItemBtn = document.getElementById('addPurchaseItemBtn');
    const purchaseForm = document.getElementById('purchaseForm');
    if (addPurchaseItemBtn) addPurchaseItemBtn.addEventListener('click', addPurchaseItem);
    if (purchaseForm) purchaseForm.addEventListener('submit', savePurchase);
    
    // Modal de ingrediente para receta
    const recipeIngredientForm = document.getElementById('recipeIngredientForm');
    if (recipeIngredientForm) recipeIngredientForm.addEventListener('submit', addIngredientToRecipe);
    
    // Botones de recetas
    const addIngredientToRecipeBtn = document.getElementById('addIngredientToRecipe');
    const saveRecipeBtn = document.getElementById('saveRecipeBtn');
    const calculateCostBtn = document.getElementById('calculateCostBtn');
    
    if (addIngredientToRecipeBtn) addIngredientToRecipeBtn.addEventListener('click', () => openRecipeIngredientModal());
    if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', saveRecipe);
    if (calculateCostBtn) calculateCostBtn.addEventListener('click', calculateRecipeCost);
    
    // Búsqueda
    const searchIngredients = document.getElementById('searchIngredients');
    const searchProductsRecipe = document.getElementById('searchProductsRecipe');
    const searchPurchaseOrders = document.getElementById('searchPurchaseOrders');
    
    if (searchIngredients) searchIngredients.addEventListener('input', filterIngredients);
    if (searchProductsRecipe) searchProductsRecipe.addEventListener('input', filterProductsForRecipe);
    if (searchPurchaseOrders) searchPurchaseOrders.addEventListener('input', filterPurchaseOrders);
    
    console.log('Módulo de inventario inicializado');
}

// Inicializar módulo de proveedores
function initSuppliersModule() {
    console.log('Inicializando módulo de proveedores...');
    
    // Tabs internas de proveedores
    document.querySelectorAll('.sup-tab').forEach(tab => {
        tab.addEventListener('click', () => switchSupTab(tab.getAttribute('data-sup-tab')));
    });
    
    // Búsqueda de proveedores
    const searchSuppliers = document.getElementById('searchSuppliers');
    if (searchSuppliers) searchSuppliers.addEventListener('input', filterSuppliers);
    
    // Botón para abrir modal de orden de compra
    const openPurchaseOrderModalBtn = document.getElementById('openPurchaseOrderModalBtn');
    if (openPurchaseOrderModalBtn) {
        openPurchaseOrderModalBtn.addEventListener('click', () => openPurchaseOrderModal());
    }
    
    console.log('Módulo de proveedores inicializado');
}

// ========== FUNCIONES AUXILIARES ==========

// Ajustar color (claro/oscuro)
function adjustColor(color, amount) {
    if (!color || color === '') return color;
    
    try {
        let usePound = false;
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        
        r = Math.min(Math.max(0, r), 255);
        g = Math.min(Math.max(0, g), 255);
        b = Math.min(Math.max(0, b), 255);
        
        return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    } catch (error) {
        console.error('Error ajustando color:', error, color);
        return color;
    }
}

// Convertir HEX a RGB
function hexToRgb(hex) {
    // Expandir formato corto (#RGB a #RRGGBB)
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
}

// Generar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}