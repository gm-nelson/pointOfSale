// Variables globales
let currentStep = 1;
let selectedCustomer = null;
let selectedProducts = {};
let editingProductId = null;
let editingCustomerId = null;
let editingOrderId = null;
let currentReport = null;
let importDataBuffer = null;
let currentEditingRecipeProductId = null;
let currentEditingSupplierId = null;
let currentPurchaseItems = {};
let currentPurchaseSupplierId = null;

// Elementos del DOM
const elements = {
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    newOrderBtn: document.getElementById('newOrderBtn'),
    newProductBtn: document.getElementById('newProductBtn'),
    newCustomerBtn: document.getElementById('newCustomerBtn'),
    newIngredientBtn: document.getElementById('newIngredientBtn'),
    newPurchaseBtn: document.getElementById('newPurchaseBtn'),
    newSupplierBtn: document.getElementById('newSupplierBtn'),
    configBtn: document.getElementById('configBtn'),
    refreshReportsBtn: document.getElementById('refreshReportsBtn'),
    productModal: document.getElementById('productModal'),
    customerModal: document.getElementById('customerModal'),
    ingredientModal: document.getElementById('ingredientModal'),
    purchaseModal: document.getElementById('purchaseModal'),
    recipeIngredientModal: document.getElementById('recipeIngredientModal'),
    orderModal: document.getElementById('orderModal'),
    configModal: document.getElementById('configModal'),
    orderDetailModal: document.getElementById('orderDetailModal'),
    welcomeModal: document.getElementById('welcomeModal'),
    supplierModal: document.getElementById('supplierModal'),
    purchaseOrderModal: document.getElementById('purchaseOrderModal'),
    confirmPurchaseModal: document.getElementById('confirmPurchaseModal'),
    productForm: document.getElementById('productForm'),
    customerForm: document.getElementById('customerForm'),
    ingredientForm: document.getElementById('ingredientForm'),
    purchaseForm: document.getElementById('purchaseForm'),
    recipeIngredientForm: document.getElementById('recipeIngredientForm'),
    configForm: document.getElementById('configForm'),
    welcomeForm: document.getElementById('welcomeForm'),
    supplierForm: document.getElementById('supplierForm'),
    purchaseOrderForm: document.getElementById('purchaseOrderForm'),
    confirmPurchaseForm: document.getElementById('confirmPurchaseForm'),
    ordersTableBody: document.getElementById('ordersTableBody'),
    productsGrid: document.getElementById('productsGrid'),
    customersTableBody: document.getElementById('customersTableBody'),
    suppliersTableBody: document.getElementById('suppliersTableBody'),
    purchaseOrdersTableBody: document.getElementById('purchaseOrdersTableBody'),
    customerSelector: document.getElementById('customerSelector'),
    orderProductsGrid: document.getElementById('orderProductsGrid'),
    orderSelectedProducts: document.getElementById('orderSelectedProducts'),
    orderSummary: document.getElementById('orderSummary'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    purchaseIngredientsGrid: document.getElementById('purchaseIngredientsGrid'),
    purchaseSelectedIngredients: document.getElementById('purchaseSelectedIngredients'),
    purchaseSupplierSelector: document.getElementById('purchaseSupplierSelector')
};

// Datos iniciales
let appData = getDefaultAppData();

// Cargar datos desde localStorage
function loadAppData() {
    const savedData = localStorage.getItem('snackOrdersData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Asegurar que todos los objetos necesarios existan
            appData = {
                business: {
                    ...getDefaultAppData().business,
                    ...(parsedData.business || {})
                },
                products: parsedData.products || [],
                customers: parsedData.customers || [],
                suppliers: parsedData.suppliers || [],
                orders: parsedData.orders || [],
                inventory: {
                    ...getDefaultAppData().inventory,
                    ...(parsedData.inventory || {})
                },
                settings: {
                    ...getDefaultAppData().settings,
                    ...(parsedData.settings || {})
                }
            };
            
            // Asegurar estructuras específicas del inventario
            ensureInventoryStructure();
            updateBusinessInfo();
            showNotification('Datos cargados correctamente', 'success');
        } catch (error) {
            console.error('Error al cargar datos:', error);
            // Si hay error, usar datos por defecto
            appData = getDefaultAppData();
            showNotification('Error al cargar datos. Se usarán datos predeterminados.', 'error');
        }
    } else {
        // Si no hay datos, usar datos por defecto
        appData = getDefaultAppData();
    }
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
            consumptionLogs: []
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
            }
        }
    };
}

function ensureInventoryStructure() {
    // Asegurar que todas las propiedades del inventario existan
    if (!appData.inventory) {
        appData.inventory = {
            ingredients: [],
            recipes: [],
            purchases: [],
            purchaseOrders: [],
            alerts: [],
            consumptionLogs: []
        };
    }
    
    // Asegurar arrays individuales
    if (!Array.isArray(appData.inventory.ingredients)) {
        appData.inventory.ingredients = [];
    }
    if (!Array.isArray(appData.inventory.recipes)) {
        appData.inventory.recipes = [];
    }
    if (!Array.isArray(appData.inventory.purchases)) {
        appData.inventory.purchases = [];
    }
    if (!Array.isArray(appData.inventory.purchaseOrders)) {
        appData.inventory.purchaseOrders = [];
    }
    if (!Array.isArray(appData.inventory.alerts)) {
        appData.inventory.alerts = [];
    }
    if (!Array.isArray(appData.inventory.consumptionLogs)) {
        appData.inventory.consumptionLogs = [];
    }
    
    // Asegurar que cada ingrediente tenga suppliers array
    appData.inventory.ingredients.forEach(ingredient => {
        if (!ingredient.suppliers) {
            ingredient.suppliers = [];
        }
        if (!ingredient.preferredSupplier) {
            ingredient.preferredSupplier = '';
        }
    });
    
    // Asegurar que cada supplier exista
    if (!appData.suppliers) {
        appData.suppliers = [];
    }
}

function getRecipeByProductId(productId) {
    if (!appData.inventory || !appData.inventory.recipes) {
        return null;
    }
    return appData.inventory.recipes.find(r => r.productId === productId);
}

function getIngredientById(ingredientId) {
    if (!appData.inventory || !appData.inventory.ingredients) {
        return null;
    }
    return appData.inventory.ingredients.find(i => i.id === ingredientId);
}

function getSupplierById(supplierId) {
    if (!appData.suppliers) {
        return null;
    }
    return appData.suppliers.find(s => s.id === supplierId);
}

// Guardar datos con validación
function saveAppData() {
    try {
        // Asegurar estructura del inventario antes de guardar
        ensureInventoryStructure();
        
        // Validar datos importantes
        if (!appData.inventory.ingredients) {
            appData.inventory.ingredients = [];
        }
        
        // Guardar en localStorage
        localStorage.setItem('snackOrdersData', JSON.stringify(appData));
        
        // Mostrar confirmación (opcional)
        console.log('Datos guardados correctamente');
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        showNotification('Error al guardar datos', 'error');
        return false;
    }
}

// Aplicar tema de colores
function applyColorTheme() {
    const colors = appData.settings.colors;
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--secondary', colors.secondary);
    document.documentElement.style.setProperty('--background-color', colors.background);
    document.documentElement.style.setProperty('--text-color', colors.text);
    document.documentElement.style.setProperty('--card-background', colors.cardBackground);
    document.documentElement.style.setProperty('--button-text', colors.buttonText);
    const primaryDark = adjustColor(colors.primary, -20);
    document.documentElement.style.setProperty('--primary-dark', primaryDark);
    const primaryRGB = hexToRgb(colors.primary);
    document.documentElement.style.setProperty('--primary-rgb', `${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}`);
}

// Verificar primer uso
function checkFirstUse() {
    if (!localStorage.getItem('snackOrdersData')) {
        elements.welcomeModal.classList.add('active');
    } else {
        elements.welcomeModal.classList.remove('active');
    }
}

// Actualizar información del negocio
function updateBusinessInfo() {
    const businessNameElement = document.getElementById('business-name');
    const businessContactElement = document.getElementById('business-contact');
    const logoElement = document.getElementById('logo');
    const logoPreview = document.getElementById('logoPreview');
    
    if (businessNameElement) {
        businessNameElement.textContent = appData.business.name;
    }
    
    if (businessContactElement) {
        businessContactElement.innerHTML = `<i class="fab fa-whatsapp"></i> ${appData.business.whatsapp}`;
    }
    
    if (logoElement) {
        if (appData.business.logo) {
            logoElement.innerHTML = `<img src="${appData.business.logo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;padding:5px;">`;
        } else {
            logoElement.textContent = appData.business.name.charAt(0);
        }
    }
    
    if (logoPreview) {
        if (appData.business.logo) {
            logoPreview.innerHTML = `<img src="${appData.business.logo}" alt="Logo">`;
        } else {
            logoPreview.innerHTML = `<span>${appData.business.name.charAt(0)}</span>`;
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadAppData();
    setupEventListeners();
    renderAllData();
    checkFirstUse();
    applyColorTheme();
    initInventoryModule();
    initSuppliersModule();
    updateInventorySummary();
});

// Configurar event listeners
function setupEventListeners() {
    // Tabs principales
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Botones principales
    if (elements.newProductBtn) elements.newProductBtn.addEventListener('click', () => openProductModal());
    if (elements.newCustomerBtn) elements.newCustomerBtn.addEventListener('click', () => openCustomerModal());
    if (elements.newOrderBtn) elements.newOrderBtn.addEventListener('click', () => openOrderModal());
    if (elements.configBtn) elements.configBtn.addEventListener('click', () => openConfigModal());
    if (elements.refreshReportsBtn) elements.refreshReportsBtn.addEventListener('click', () => refreshReports());
    if (elements.newSupplierBtn) elements.newSupplierBtn.addEventListener('click', () => openSupplierModal());

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
    if (elements.productForm) elements.productForm.addEventListener('submit', saveProduct);
    if (elements.customerForm) elements.customerForm.addEventListener('submit', saveCustomer);
    if (elements.configForm) elements.configForm.addEventListener('submit', saveConfig);
    if (elements.welcomeForm) elements.welcomeForm.addEventListener('submit', saveWelcomeConfig);
    if (elements.supplierForm) elements.supplierForm.addEventListener('submit', saveSupplier);
    if (elements.purchaseOrderForm) elements.purchaseOrderForm.addEventListener('submit', generatePurchaseOrders);
    if (elements.confirmPurchaseForm) elements.confirmPurchaseForm.addEventListener('submit', confirmPurchase);

    // Gestión de datos
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
    if (importDataBtn) importDataBtn.addEventListener('click', () => {
        if (importFileInput) importFileInput.click();
        const importOptions = document.getElementById('importOptions');
        if (importOptions) importOptions.style.display = 'block';
    });
    if (clearDataBtn) clearDataBtn.addEventListener('click', clearData);
    if (importFileInput) importFileInput.addEventListener('change', importData);
    if (confirmImportBtn) confirmImportBtn.addEventListener('click', confirmImport);

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
}

// Inicializar módulo de inventario
function initInventoryModule() {
    // Botones principales - verificar existencia
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
    
    // Botones de recetas - verificar existencia
    const addIngredientToRecipeBtn = document.getElementById('addIngredientToRecipe');
    const saveRecipeBtn = document.getElementById('saveRecipeBtn');
    const calculateCostBtn = document.getElementById('calculateCostBtn');
    
    if (addIngredientToRecipeBtn) addIngredientToRecipeBtn.addEventListener('click', () => openRecipeIngredientModal());
    if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', saveRecipe);
    if (calculateCostBtn) calculateCostBtn.addEventListener('click', calculateRecipeCost);
    
    // Búsqueda - verificar existencia
    const searchIngredients = document.getElementById('searchIngredients');
    const searchProductsRecipe = document.getElementById('searchProductsRecipe');
    const searchPurchaseOrders = document.getElementById('searchPurchaseOrders');
    
    if (searchIngredients) searchIngredients.addEventListener('input', filterIngredients);
    if (searchProductsRecipe) searchProductsRecipe.addEventListener('input', filterProductsForRecipe);
    if (searchPurchaseOrders) searchPurchaseOrders.addEventListener('input', filterPurchaseOrders);
}

// Inicializar módulo de proveedores
function initSuppliersModule() {
    // Tabs internas de proveedores
    document.querySelectorAll('.sup-tab').forEach(tab => {
        tab.addEventListener('click', () => switchSupTab(tab.getAttribute('data-sup-tab')));
    });
    
    // Búsqueda de proveedores
    const searchSuppliers = document.getElementById('searchSuppliers');
    if (searchSuppliers) searchSuppliers.addEventListener('input', filterSuppliers);
}

// Cambiar pestaña principal
function switchTab(tabId) {
    elements.tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    elements.tabContents.forEach(content => {
        if (content.id === `${tabId}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

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
    
    // Cargar datos específicos de la pestaña solo si el contenido existe
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

// Renderizar todos los datos
function renderAllData() {
    renderOrders();
    renderProducts();
    renderCustomers();
    renderSuppliers();
    renderIngredients();
    renderPurchases();
    renderAlerts();
    renderPurchaseOrders();
    updateInventorySummary();
}

// ========== FUNCIONES DE PRODUCTOS ==========
function generateId() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}

// ========== FUNCIONES DE COLORES ==========
function selectColorTheme(theme, event) {
    appData.settings.colorTheme = theme;
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
    
    appData.settings.colors = colors;
    applyColorTheme();
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
    appData.settings.colors = colors;
    appData.settings.colorTheme = 'custom';
    applyColorTheme();
    showNotification('Colores personalizados aplicados');
}

// ========== FUNCIONES DE IMPORTACIÓN MEJORADA ==========
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            importDataBuffer = JSON.parse(e.target.result);
            if (importDataBuffer.business || importDataBuffer.products || importDataBuffer.customers || importDataBuffer.orders || importDataBuffer.inventory || importDataBuffer.suppliers) {
                showNotification('Archivo cargado. Selecciona qué datos importar.', 'success');
            } else {
                showNotification('El archivo no tiene un formato válido', 'error');
                importDataBuffer = null;
            }
        } catch (error) {
            showNotification('Error al importar datos: ' + error.message, 'error');
            importDataBuffer = null;
        }
    };
    reader.readAsText(file);
}

function confirmImport() {
    if (!importDataBuffer) {
        showNotification('No hay datos para importar', 'error');
        return;
    }
    
    let importCount = 0;
    const messages = [];
    
    // Importar productos
    if (document.getElementById('importProducts').checked && importDataBuffer.products) {
        importDataBuffer.products.forEach(newProduct => {
            const exists = appData.products.some(p => p.id === newProduct.id || p.name === newProduct.name);
            if (!exists) {
                appData.products.push(newProduct);
                importCount++;
            }
        });
        messages.push(`${importDataBuffer.products.length} productos procesados`);
    }
    
    // Importar clientes
    if (document.getElementById('importCustomers').checked && importDataBuffer.customers) {
        importDataBuffer.customers.forEach(newCustomer => {
            const exists = appData.customers.some(c => c.id === newCustomer.id || 
                (c.phone && newCustomer.phone && c.phone === newCustomer.phone));
            if (!exists) {
                appData.customers.push(newCustomer);
                importCount++;
            }
        });
        messages.push(`${importDataBuffer.customers.length} clientes procesados`);
    }
    
    // Importar proveedores
    if (document.getElementById('importSuppliers').checked && importDataBuffer.suppliers) {
        importDataBuffer.suppliers.forEach(newSupplier => {
            const exists = appData.suppliers.some(s => s.id === newSupplier.id || s.name === newSupplier.name);
            if (!exists) {
                appData.suppliers.push(newSupplier);
                importCount++;
            }
        });
        messages.push(`${importDataBuffer.suppliers.length} proveedores procesados`);
    }
    
    // Importar órdenes
    if (document.getElementById('importOrders').checked && importDataBuffer.orders) {
        importDataBuffer.orders.forEach(newOrder => {
            const exists = appData.orders.some(o => o.id === newOrder.id);
            if (!exists) {
                appData.orders.push(newOrder);
                importCount++;
            }
        });
        messages.push(`${importDataBuffer.orders.length} órdenes procesadas`);
    }
    
    // Importar inventario
    if (document.getElementById('importInventory').checked && importDataBuffer.inventory) {
        // Verificar que inventory exista en los datos importados
        if (importDataBuffer.inventory.ingredients) {
            importDataBuffer.inventory.ingredients.forEach(newIngredient => {
                const exists = appData.inventory.ingredients.some(i => i.id === newIngredient.id || i.name === newIngredient.name);
                if (!exists) {
                    appData.inventory.ingredients.push(newIngredient);
                    importCount++;
                }
            });
            messages.push(`${importDataBuffer.inventory.ingredients.length} ingredientes procesados`);
        }
        
        if (importDataBuffer.inventory.recipes) {
            importDataBuffer.inventory.recipes.forEach(newRecipe => {
                const exists = appData.inventory.recipes.some(r => r.productId === newRecipe.productId);
                if (!exists) {
                    appData.inventory.recipes.push(newRecipe);
                    importCount++;
                }
            });
            messages.push(`${importDataBuffer.inventory.recipes.length} recetas procesadas`);
        }
        
        if (importDataBuffer.inventory.purchaseOrders) {
            importDataBuffer.inventory.purchaseOrders.forEach(newPurchaseOrder => {
                const exists = appData.inventory.purchaseOrders.some(po => po.id === newPurchaseOrder.id);
                if (!exists) {
                    appData.inventory.purchaseOrders.push(newPurchaseOrder);
                    importCount++;
                }
            });
            messages.push(`${importDataBuffer.inventory.purchaseOrders.length} órdenes de compra procesadas`);
        }
    }
    
    // Importar configuración
    if (document.getElementById('importBusiness').checked && importDataBuffer.business) {
        appData.business = {...appData.business, ...importDataBuffer.business};
        messages.push('Configuración del negocio actualizada');
    }
    
    // Asegurar estructura del inventario antes de guardar
    ensureInventoryStructure();
    
    saveAppData();
    renderAllData();
    updateBusinessInfo();
    
    if (importCount > 0) {
        showNotification(`${importCount} nuevos elementos importados. ${messages.join(', ')}`);
    } else {
        showNotification('No se importaron elementos nuevos (posibles duplicados)', 'info');
    }
    
    importDataBuffer = null;
    const importOptions = document.getElementById('importOptions');
    if (importOptions) importOptions.style.display = 'none';
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) importFileInput.value = '';
}

// ========== FUNCIONES DE REPORTES ==========
function refreshReports() {
    if (currentReport) {
        generateReport(currentReport);
    }
    showNotification('Reportes actualizados');
}

function generateReport(type) {
    currentReport = type;
    const container = document.getElementById('reportDetailContainer');
    const detail = document.getElementById('reportDetail');
    
    if (!container || !detail) return;
    
    let reportHTML = '';
    let reportTitle = '';
    
    switch(type) {
        case 'sales':
            reportTitle = 'Reporte de Ventas por Período';
            reportHTML = generateSalesReport();
            break;
        case 'products':
            reportTitle = 'Productos Más Vendidos';
            reportHTML = generateProductsReport();
            break;
        case 'customers':
            reportTitle = 'Clientes Más Frecuentes';
            reportHTML = generateCustomersReport();
            break;
        case 'financial':
            reportTitle = 'Estado Financiero';
            reportHTML = generateFinancialReport();
            break;
        case 'trends':
            reportTitle = 'Tendencias de Ventas';
            reportHTML = generateTrendsReport();
            break;
        case 'suppliers':
            reportTitle = 'Reporte de Proveedores';
            reportHTML = generateSuppliersReport();
            break;
    }
    
    detail.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>${reportTitle}</h3>
            <div>
                <button class="btn btn-sm btn-primary" onclick="exportReport('${type}')" title="Exportar a PDF">
                    <i class="fas fa-file-pdf"></i> Exportar PDF
                </button>
                <button class="btn btn-sm btn-secondary" onclick="printReport()" title="Imprimir reporte">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
        </div>
        ${reportHTML}
    `;
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

function generateSalesReport() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = appData.orders.filter(order => 
        new Date(order.date) >= last30Days && order.status !== 'cancelled'
    );
    
    let totalRevenue = 0;
    let orderCount = 0;
    recentOrders.forEach(order => {
        totalRevenue += calculateOrderTotal(order);
        orderCount++;
    });
    
    return `
        <div class="chart-container">
            <h4>Resumen de Ventas (Últimos 30 días)</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border-radius: var(--border-radius);">
                    <div style="font-size: 24px; font-weight: bold;">${orderCount}</div>
                    <div>Órdenes Totales</div>
                </div>
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, var(--success), #218838); color: white; border-radius: var(--border-radius);">
                    <div style="font-size: 24px; font-weight: bold;">$${totalRevenue.toFixed(2)}</div>
                    <div>Ingresos Totales</div>
                </div>
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, var(--secondary), #003366); color: white; border-radius: var(--border-radius);">
                    <div style="font-size: 24px; font-weight: bold;">$${(totalRevenue / orderCount || 0).toFixed(2)}</div>
                    <div>Ticket Promedio</div>
                </div>
            </div>
            
            <h4 style="margin-top: 30px;">Ventas por Día</h4>
            <div style="overflow-x: auto; margin-top: 20px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Órdenes</th>
                            <th>Ingresos</th>
                            <th>Ticket Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateDailySalesHTML(recentOrders)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateDailySalesHTML(orders) {
    const dailySales = {};
    orders.forEach(order => {
        const date = new Date(order.date).toISOString().split('T')[0];
        const total = calculateOrderTotal(order);
        if (!dailySales[date]) dailySales[date] = { orders: 0, revenue: 0 };
        dailySales[date].orders++;
        dailySales[date].revenue += total;
    });
    
    let html = '';
    Object.keys(dailySales).sort().reverse().forEach(date => {
        const sales = dailySales[date];
        const avgTicket = sales.revenue / sales.orders;
        html += `<tr><td>${formatDate(date + 'T00:00:00')}</td><td>${sales.orders}</td><td>$${sales.revenue.toFixed(2)}</td><td>$${avgTicket.toFixed(2)}</td></tr>`;
    });
    return html;
}

function generateProductsReport() {
    const productSales = {};
    appData.orders.forEach(order => {
        if (order.status !== 'cancelled') {
            order.items.forEach(item => {
                const product = appData.products.find(p => p.id === item.productId);
                if (product) {
                    if (!productSales[product.id]) {
                        productSales[product.id] = { name: product.name, quantity: 0, revenue: 0 };
                    }
                    productSales[product.id].quantity += item.quantity;
                    productSales[product.id].revenue += item.quantity * item.price;
                }
            });
        }
    });
    
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
    
    let html = `
        <div class="chart-container">
            <h4>Top 10 Productos por Ventas</h4>
            <div style="overflow-x: auto; margin-top: 20px;">
                <table style="width: 100%;">
                    <thead><tr><th>Producto</th><th>Cantidad Vendida</th><th>Ingresos Generados</th><th>Porcentaje</th></tr></thead>
                    <tbody>`;
    
    topProducts.forEach((product, index) => {
        const percentage = totalRevenue > 0 ? (product.revenue / totalRevenue * 100).toFixed(1) : 0;
        html += `
            <tr>
                <td>${index + 1}. ${product.name}</td>
                <td>${product.quantity}</td>
                <td>$${product.revenue.toFixed(2)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-dark));"></div>
                        </div>
                        <div>${percentage}%</div>
                    </div>
                </td>
            </tr>`;
    });
    
    html += `</tbody></table></div>
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: var(--border-radius);">
                <strong>Total de ingresos por productos:</strong> $${totalRevenue.toFixed(2)}
            </div>
        </div>`;
    return html;
}

function generateCustomersReport() {
    const customerStats = {};
    appData.customers.forEach(customer => {
        const customerOrders = appData.orders.filter(order => order.customerId === customer.id && order.status !== 'cancelled');
        if (customerOrders.length > 0) {
            let totalSpent = 0;
            customerOrders.forEach(order => totalSpent += calculateOrderTotal(order));
            customerStats[customer.id] = {
                name: customer.name,
                phone: customer.phone || 'No tiene',
                orders: customerOrders.length,
                totalSpent: totalSpent,
                avgOrder: totalSpent / customerOrders.length
            };
        }
    });
    
    const topCustomers = Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
    
    let html = `
        <div class="chart-container">
            <h4>Top 10 Clientes por Valor</h4>
            <div style="overflow-x: auto; margin-top: 20px;">
                <table style="width: 100%;">
                    <thead><tr><th>Cliente</th><th>Teléfono</th><th>Órdenes</th><th>Total Gastado</th><th>Promedio por Orden</th></tr></thead>
                    <tbody>`;
    
    topCustomers.forEach((customer, index) => {
        html += `<tr><td>${index + 1}. ${customer.name}</td><td>${customer.phone}</td><td>${customer.orders}</td><td>$${customer.totalSpent.toFixed(2)}</td><td>$${customer.avgOrder.toFixed(2)}</td></tr>`;
    });
    
    html += `</tbody></table></div>
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: var(--border-radius);">
                <strong>Clientes recurrentes:</strong> ${topCustomers.length} clientes han realizado más de una orden
            </div>
        </div>`;
    return html;
}

function generateFinancialReport() {
    // Calcular métricas de ventas
    let totalRevenue = 0;
    let totalRevenueNet = 0; // Sin IVA
    let completedOrders = 0;
    let cancelledOrders = 0;
    let pendingOrders = 0;
    
    appData.orders.forEach(order => {
        const orderTotal = calculateOrderTotal(order);
        const orderNet = orderTotal / (1 + appData.settings.ivaRate);
        
        if (order.status === 'completed') {
            totalRevenue += orderTotal;
            totalRevenueNet += orderNet;
            completedOrders++;
        } else if (order.status === 'cancelled') {
            cancelledOrders++;
        } else if (order.status === 'process') {
            pendingOrders++;
        }
    });
    
    // Calcular IVA recaudado
    const ivaAmount = totalRevenue - totalRevenueNet;
    
    // Calcular costos de ingredientes basados en ventas
    let totalIngredientCost = 0;
    let totalProductsSold = 0;
    
    appData.orders.forEach(order => {
        if (order.status === 'completed') {
            order.items.forEach(item => {
                totalProductsSold += item.quantity;
                
                // Calcular costo de ingredientes para este producto
                const product = appData.products.find(p => p.id === item.productId);
                const recipe = appData.inventory.recipes?.find(r => r.productId === item.productId);
                
                if (recipe && recipe.ingredients) {
                    recipe.ingredients.forEach(recipeIng => {
                        const ingredient = appData.inventory.ingredients?.find(i => i.id === recipeIng.ingredientId);
                        if (ingredient) {
                            const effectiveQuantity = recipeIng.quantity * (1 + (recipeIng.wastePercentage || 0) / 100);
                            const costPerProduct = effectiveQuantity * ingredient.cost;
                            totalIngredientCost += costPerProduct * item.quantity;
                        }
                    });
                }
            });
        }
    });
    
    // Calcular valor total de compras
    let totalPurchases = 0;
    let totalPurchasesIVA = 0;
    let totalPurchasesNet = 0;
    
    if (appData.inventory.purchases) {
        appData.inventory.purchases.forEach(purchase => {
            totalPurchases += purchase.total;
            totalPurchasesIVA += purchase.iva;
            totalPurchasesNet += purchase.subtotal;
        });
    }
    
    // Calcular valor actual del inventario
    let currentInventoryValue = 0;
    let totalInventoryCost = 0;
    
    if (appData.inventory.ingredients) {
        appData.inventory.ingredients.forEach(ingredient => {
            currentInventoryValue += ingredient.stock * ingredient.cost;
            totalInventoryCost += ingredient.minStock * ingredient.cost; // Costo del stock mínimo
        });
    }
    
    // Calcular métricas financieras
    const grossProfit = totalRevenueNet - totalIngredientCost;
    const grossMargin = totalRevenueNet > 0 ? (grossProfit / totalRevenueNet * 100) : 0;
    
    // Asumir otros gastos operativos (20% de ingresos netos como estimación)
    const operatingExpenses = totalRevenueNet * 0.20;
    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = totalRevenueNet > 0 ? (operatingProfit / totalRevenueNet * 100) : 0;
    
    const netProfit = operatingProfit; // En este modelo simple, ganancia operativa = neta
    const netMargin = totalRevenueNet > 0 ? (netProfit / totalRevenueNet * 100) : 0;
    
    // Análisis de eficiencia
    const revenuePerOrder = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const costPerOrder = completedOrders > 0 ? totalIngredientCost / completedOrders : 0;
    const profitPerOrder = completedOrders > 0 ? grossProfit / completedOrders : 0;
    
    // Rotación de inventario (aproximada)
    const inventoryTurnover = totalIngredientCost > 0 ? (totalIngredientCost / currentInventoryValue).toFixed(2) : 0;
    
    // Días promedio de inventario
    const daysInventory = totalIngredientCost > 0 ? (currentInventoryValue / (totalIngredientCost / 30)).toFixed(1) : 0;
    
    return `
        <div class="chart-container">
            <h4>📊 Estado Financiero Detallado</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
                <!-- Tarjetas principales -->
                <div class="metric-card" style="background: linear-gradient(135deg, var(--success), #218838);">
                    <div class="metric-value">$${totalRevenue.toFixed(2)}</div>
                    <div class="metric-label">Ingresos Totales</div>
                </div>
                
                <div class="metric-card" style="background: linear-gradient(135deg, #dc3545, #c82333);">
                    <div class="metric-value">$${totalIngredientCost.toFixed(2)}</div>
                    <div class="metric-label">Costos de Ingredientes</div>
                </div>
                
                <div class="metric-card" style="background: linear-gradient(135deg, var(--primary), var(--primary-dark));">
                    <div class="metric-value">$${grossProfit.toFixed(2)}</div>
                    <div class="metric-label">Ganancia Bruta</div>
                    <div class="metric-sub">${grossMargin.toFixed(1)}% de margen</div>
                </div>
                
                <div class="metric-card" style="background: linear-gradient(135deg, #6f42c1, #5a32a3);">
                    <div class="metric-value">$${netProfit.toFixed(2)}</div>
                    <div class="metric-label">Ganancia Neta Estimada</div>
                    <div class="metric-sub">${netMargin.toFixed(1)}% de margen neto</div>
                </div>
            </div>
            
            <!-- Análisis detallado -->
            <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Columna izquierda: Ingresos vs Compras -->
                <div>
                    <h5>📈 Análisis de Ingresos vs Compras</h5>
                    <div class="financial-table">
                        <div class="table-row header">
                            <div>Concepto</div>
                            <div>Monto</div>
                            <div>% de Ingresos</div>
                        </div>
                        
                        <div class="table-row">
                            <div>Ingresos Totales (con IVA)</div>
                            <div>$${totalRevenue.toFixed(2)}</div>
                            <div>100.0%</div>
                        </div>
                        
                        <div class="table-row">
                            <div>- IVA Recaudado (${(appData.settings.ivaRate * 100)}%)</div>
                            <div>$${ivaAmount.toFixed(2)}</div>
                            <div>${totalRevenue > 0 ? (ivaAmount / totalRevenue * 100).toFixed(1) : 0}%</div>
                        </div>
                        
                        <div class="table-row">
                            <div><strong>Ingresos Netos (sin IVA)</strong></div>
                            <div><strong>$${totalRevenueNet.toFixed(2)}</strong></div>
                            <div><strong>${totalRevenue > 0 ? (totalRevenueNet / totalRevenue * 100).toFixed(1) : 0}%</strong></div>
                        </div>
                        
                        <div class="table-row separator">
                            <div colspan="3">Costos y Gastos</div>
                        </div>
                        
                        <div class="table-row">
                            <div>Costos de Ingredientes</div>
                            <div>$${totalIngredientCost.toFixed(2)}</div>
                            <div>${totalRevenueNet > 0 ? (totalIngredientCost / totalRevenueNet * 100).toFixed(1) : 0}%</div>
                        </div>
                        
                        <div class="table-row">
                            <div>Gastos Operativos Estimados</div>
                            <div>$${operatingExpenses.toFixed(2)}</div>
                            <div>${totalRevenueNet > 0 ? (operatingExpenses / totalRevenueNet * 100).toFixed(1) : 0}%</div>
                        </div>
                        
                        <div class="table-row total">
                            <div><strong>Ganancia Neta Estimada</strong></div>
                            <div><strong>$${netProfit.toFixed(2)}</strong></div>
                            <div><strong>${netMargin.toFixed(1)}%</strong></div>
                        </div>
                    </div>
                    
                    <!-- Análisis de compras -->
                    <h5 style="margin-top: 25px;">🛒 Análisis de Compras</h5>
                    <div class="financial-table">
                        <div class="table-row">
                            <div>Total Compras Registradas</div>
                            <div>$${totalPurchases.toFixed(2)}</div>
                        </div>
                        <div class="table-row">
                            <div>- IVA en Compras</div>
                            <div>$${totalPurchasesIVA.toFixed(2)}</div>
                        </div>
                        <div class="table-row">
                            <div><strong>Valor Neto de Compras</strong></div>
                            <div><strong>$${totalPurchasesNet.toFixed(2)}</strong></div>
                        </div>
                        <div class="table-row">
                            <div>Relación Compras/Ventas</div>
                            <div>${totalRevenueNet > 0 ? (totalPurchasesNet / totalRevenueNet * 100).toFixed(1) : 0}%</div>
                        </div>
                    </div>
                </div>
                
                <!-- Columna derecha: Métricas de Rentabilidad -->
                <div>
                    <h5>📊 Métricas de Rentabilidad</h5>
                    
                    <div class="metric-box">
                        <div class="metric-header">
                            <span>💰 Por Órden</span>
                        </div>
                        <div class="metric-content">
                            <div class="metric-item">
                                <span>Ingreso promedio:</span>
                                <span class="metric-value">$${revenuePerOrder.toFixed(2)}</span>
                            </div>
                            <div class="metric-item">
                                <span>Costo promedio:</span>
                                <span class="metric-value" style="color: #dc3545;">$${costPerOrder.toFixed(2)}</span>
                            </div>
                            <div class="metric-item">
                                <span>Ganancia promedio:</span>
                                <span class="metric-value" style="color: #28a745;">$${profitPerOrder.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-box">
                        <div class="metric-header">
                            <span>📦 Gestión de Inventario</span>
                        </div>
                        <div class="metric-content">
                            <div class="metric-item">
                                <span>Valor actual inventario:</span>
                                <span class="metric-value">$${currentInventoryValue.toFixed(2)}</span>
                            </div>
                            <div class="metric-item">
                                <span>Rotación de inventario:</span>
                                <span class="metric-value">${inventoryTurnover}x</span>
                            </div>
                            <div class="metric-item">
                                <span>Días de inventario:</span>
                                <span class="metric-value">${daysInventory} días</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-box">
                        <div class="metric-header">
                            <span>📈 Análisis de Rentabilidad</span>
                        </div>
                        <div class="metric-content">
                            <div class="progress-metric">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span>Margen Bruto:</span>
                                    <span>${grossMargin.toFixed(1)}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(grossMargin, 100)}%; background: #28a745;"></div>
                                </div>
                            </div>
                            
                            <div class="progress-metric">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span>Margen Operativo:</span>
                                    <span>${operatingMargin.toFixed(1)}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(operatingMargin, 100)}%; background: #17a2b8;"></div>
                                </div>
                            </div>
                            
                            <div class="progress-metric">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span>Margen Neto:</span>
                                    <span>${netMargin.toFixed(1)}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(netMargin, 100)}%; background: #6f42c1;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resumen estadístico -->
                    <h5 style="margin-top: 25px;">📋 Resumen Estadístico</h5>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Órdenes completadas:</span>
                            <span><strong>${completedOrders}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Productos vendidos:</span>
                            <span><strong>${totalProductsSold}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Ticket promedio:</span>
                            <span><strong>$${revenuePerOrder.toFixed(2)}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Órdenes canceladas:</span>
                            <span><strong>${cancelledOrders}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Órdenes pendientes:</span>
                            <span><strong>${pendingOrders}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recomendaciones basadas en el análisis -->
            <div style="margin-top: 30px; padding: 20px; background-color: #e8f4fd; border-left: 4px solid #17a2b8; border-radius: 4px;">
                <h5>💡 Recomendaciones Financieras</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                    ${getFinancialRecommendations(grossMargin, netMargin, inventoryTurnover, revenuePerOrder)}
                </div>
            </div>
        </div>
        
        <style>
            .metric-card {
                padding: 20px;
                color: white;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .metric-card .metric-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .metric-card .metric-label {
                font-size: 14px;
                opacity: 0.9;
            }
            .metric-card .metric-sub {
                font-size: 12px;
                margin-top: 5px;
                opacity: 0.8;
            }
            .financial-table {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .table-row {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                padding: 12px 15px;
                border-bottom: 1px solid #e9ecef;
            }
            .table-row.header {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #495057;
            }
            .table-row.separator {
                background-color: #e9ecef;
                font-weight: bold;
                text-align: center;
                grid-template-columns: 1fr;
            }
            .table-row.total {
                background-color: #d4edda;
                font-weight: bold;
                color: #155724;
            }
            .metric-box {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 15px;
            }
            .metric-header {
                background-color: #f8f9fa;
                padding: 12px 15px;
                font-weight: bold;
                border-bottom: 1px solid #e9ecef;
            }
            .metric-content {
                padding: 15px;
            }
            .metric-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .progress-metric {
                margin-bottom: 15px;
            }
            .progress-bar {
                height: 8px;
                background-color: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
            }
            .progress-fill {
                height: 100%;
                border-radius: 4px;
            }
        </style>
    `;
}

function getFinancialRecommendations(grossMargin, netMargin, inventoryTurnover, revenuePerOrder) {
    let recommendations = [];
    
    // Análisis de márgenes
    if (grossMargin < 30) {
        recommendations.push(`
            <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #ffc107;">
                <div style="font-weight: bold; color: #856404;">⚠️ Margen Bruto Bajo</div>
                <div style="font-size: 13px; color: #666;">Considera ajustar precios o reducir costos de ingredientes.</div>
            </div>
        `);
    } else if (grossMargin > 60) {
        recommendations.push(`
            <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #28a745;">
                <div style="font-weight: bold; color: #155724;">✅ Margen Bruto Excelente</div>
                <div style="font-size: 13px; color: #666;">Tu negocio tiene buena rentabilidad en productos.</div>
            </div>
        `);
    }
    
    if (netMargin < 10) {
        recommendations.push(`
            <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #dc3545;">
                <div style="font-weight: bold; color: #721c24;">🚨 Margen Neto Crítico</div>
                <div style="font-size: 13px; color: #666;">Revisa gastos operativos para mejorar rentabilidad.</div>
            </div>
        `);
    }
    
    // Análisis de inventario
    if (inventoryTurnover < 2) {
        recommendations.push(`
            <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #17a2b8;">
                <div style="font-weight: bold; color: #0c5460;">📦 Rotación Baja</div>
                <div style="font-size: 13px; color: #666;">Tu inventario se mueve lentamente. Considera ajustar compras.</div>
            </div>
        `);
    }
    
    // Análisis de ticket promedio
    if (revenuePerOrder < 50) {
        recommendations.push(`
            <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #6f42c1;">
                <div style="font-weight: bold; color: #4d2c91;">💡 Aumentar Ticket</div>
                <div style="font-size: 13px; color: #666;">Ofrece combos o productos complementarios para aumentar ventas.</div>
            </div>
        `);
    }
    
    // Recomendación general
    if (recommendations.length === 0) {
        recommendations.push(`
            <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid #28a745;">
                <div style="font-weight: bold; color: #155724;">✅ Situación Favorable</div>
                <div style="font-size: 13px; color: #666;">Tu negocio muestra indicadores financieros saludables.</div>
            </div>
        `);
    }
    
    return recommendations.join('');
}

function generateTrendsReport() {
    const now = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7Days.push(date.toISOString().split('T')[0]);
    }
    
    const dailyData = {};
    last7Days.forEach(date => dailyData[date] = { orders: 0, revenue: 0, items: 0 });
    
    appData.orders.forEach(order => {
        if (order.status === 'completed') {
            const orderDate = new Date(order.date).toISOString().split('T')[0];
            if (dailyData[orderDate]) {
                dailyData[orderDate].orders++;
                dailyData[orderDate].revenue += calculateOrderTotal(order);
                order.items.forEach(item => dailyData[orderDate].items += item.quantity);
            }
        }
    });
    
    let html = `
        <div class="chart-container">
            <h4>Tendencias de Ventas (Últimos 7 días)</h4>
            <div style="overflow-x: auto; margin-top: 20px;">
                <table style="width: 100%;"><thead><tr><th>Fecha</th><th>Órdenes</th><th>Ingresos</th><th>Productos</th><th>Tendencia</th></tr></thead><tbody>`;
    
    last7Days.forEach(date => {
        const data = dailyData[date];
        const dateStr = new Date(date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
        html += `<tr><td>${dateStr}</td><td>${data.orders}</td><td>$${data.revenue.toFixed(2)}</td><td>${data.items}</td>
                <td><div style="display: flex; align-items: center; gap: 5px;">${data.orders > 0 ? '<i class="fas fa-arrow-up text-success"></i><span>Activo</span>' : '<i class="fas fa-minus text-secondary"></i><span>Sin ventas</span>'}</div></td></tr>`;
    });
    
    html += `</tbody></table></div>
            <h4 style="margin-top: 30px;">Recomendaciones</h4>
            <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: var(--border-radius);">
                <ul style="margin-bottom: 0;">
                    <li>Días con más ventas: ${getBestSellingDay(dailyData)}</li>
                    <li>Promedio diario: $${getDailyAverage(dailyData).toFixed(2)}</li>
                    <li>Productos por orden promedio: ${getItemsPerOrder(dailyData).toFixed(1)}</li>
                    <li>Recomendación: ${getRecommendation(dailyData)}</li>
                </ul>
            </div>
        </div>`;
    return html;
}

function generateSuppliersReport() {
    let html = `
        <div class="chart-container">
            <h4>📋 Reporte de Proveedores</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
                <div class="metric-card" style="background: linear-gradient(135deg, var(--primary), var(--primary-dark));">
                    <div class="metric-value">${appData.suppliers.length}</div>
                    <div class="metric-label">Proveedores Registrados</div>
                </div>
                
                <div class="metric-card" style="background: linear-gradient(135deg, #17a2b8, #138496);">
                    <div class="metric-value">${appData.inventory.purchaseOrders.length}</div>
                    <div class="metric-label">Órdenes de Compra</div>
                </div>
                
                <div class="metric-card" style="background: linear-gradient(135deg, #28a745, #218838);">
                    <div class="metric-value">${appData.inventory.purchaseOrders.filter(po => po.status === 'completed').length}</div>
                    <div class="metric-label">Completadas</div>
                </div>
                
                <div class="metric-card" style="background: linear-gradient(135deg, #ffc107, #e0a800);">
                    <div class="metric-value">${appData.inventory.purchaseOrders.filter(po => po.status === 'pending').length}</div>
                    <div class="metric-label">Pendientes</div>
                </div>
            </div>
            
            <h4 style="margin-top: 30px;">📊 Actividad por Proveedor</h4>
            <div style="overflow-x: auto; margin-top: 20px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Proveedor</th>
                            <th>Teléfono</th>
                            <th>Órdenes Total</th>
                            <th>Completadas</th>
                            <th>Pendientes</th>
                            <th>Última Compra</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    appData.suppliers.forEach(supplier => {
        const supplierOrders = appData.inventory.purchaseOrders.filter(po => po.supplierId === supplier.id);
        const completedOrders = supplierOrders.filter(po => po.status === 'completed');
        const pendingOrders = supplierOrders.filter(po => po.status === 'pending');
        
        let lastPurchaseDate = 'Nunca';
        if (completedOrders.length > 0) {
            const lastOrder = completedOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            lastPurchaseDate = formatDate(lastOrder.date);
        }
        
        html += `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.phone || '-'}</td>
                <td>${supplierOrders.length}</td>
                <td>${completedOrders.length}</td>
                <td>${pendingOrders.length}</td>
                <td>${lastPurchaseDate}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            
            <h4 style="margin-top: 30px;">📈 Ingredientes por Proveedor</h4>
            <div style="overflow-x: auto; margin-top: 20px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Proveedor</th>
                            <th>Ingredientes Asociados</th>
                            <th>Proveedor Preferido</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    appData.suppliers.forEach(supplier => {
        const supplierIngredients = appData.inventory.ingredients.filter(ing => 
            ing.suppliers && ing.suppliers.includes(supplier.id)
        );
        const preferredIngredients = appData.inventory.ingredients.filter(ing => 
            ing.preferredSupplier === supplier.id
        );
        
        html += `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplierIngredients.map(ing => ing.name).join(', ') || 'Ninguno'}</td>
                <td>${preferredIngredients.map(ing => ing.name).join(', ') || 'Ninguno'}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

function getBestSellingDay(dailyData) {
    let bestDay = '', bestRevenue = 0;
    Object.keys(dailyData).forEach(date => {
        if (dailyData[date].revenue > bestRevenue) {
            bestRevenue = dailyData[date].revenue;
            bestDay = new Date(date).toLocaleDateString('es-MX', { weekday: 'long' });
        }
    });
    return bestDay || 'No hay datos suficientes';
}

function getDailyAverage(dailyData) {
    const revenues = Object.values(dailyData).map(d => d.revenue);
    return revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
}

function getItemsPerOrder(dailyData) {
    let totalItems = 0, totalOrders = 0;
    Object.values(dailyData).forEach(data => {
        totalItems += data.items;
        totalOrders += data.orders;
    });
    return totalOrders > 0 ? totalItems / totalOrders : 0;
}

function getRecommendation(dailyData) {
    const revenues = Object.values(dailyData).map(d => d.revenue);
    const avgRevenue = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    const minRevenue = Math.min(...revenues);
    const maxRevenue = Math.max(...revenues);
    
    if (maxRevenue - minRevenue > avgRevenue * 0.5) {
        return 'Considera promociones en días de baja venta';
    } else if (avgRevenue < 100) {
        return 'Podrías implementar combos para aumentar el ticket promedio';
    } else {
        return 'Las ventas son estables, considera expandir el horario o menú';
    }
}

function exportReport(type) {
    showNotification('Función de exportación de PDF en desarrollo', 'info');
}

function printReport() {
    window.print();
}

// ========== FUNCIONES UTILITARIAS ==========
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 107, b: 53 };
}

function adjustColor(hex, amount) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) + amount)));
    const g = Math.max(0, Math.min(255, ((num >> 8 & 0x00FF) + amount)));
    const b = Math.max(0, Math.min(255, ((num & 0x0000FF) + amount)));
    return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}

// ========== FUNCIONES DE GESTIÓN DE DATOS ==========
function renderOrders() {
    const ordersTableBody = elements.ordersTableBody;
    const emptyOrders = document.getElementById('emptyOrders');
    
    if (!ordersTableBody || !emptyOrders) return;
    
    if (appData.orders.length === 0) {
        ordersTableBody.innerHTML = '';
        emptyOrders.style.display = 'block';
        return;
    }
    
    emptyOrders.style.display = 'none';
    const sortedOrders = [...appData.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    let html = '';
    sortedOrders.forEach(order => {
        const customer = appData.customers.find(c => c.id === order.customerId) || { name: 'Cliente no encontrado' };
        const total = calculateOrderTotal(order);
        const statusClass = `status-${order.status}`;
        const statusText = order.status === 'process' ? 'En proceso' : order.status === 'completed' ? 'Completada' : 'Cancelada';
        html += `<tr><td>${order.id}</td><td>${customer.name}</td><td>${order.items.length} productos</td><td>$${total.toFixed(2)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td><td>${formatDate(order.date)}</td>
                <td class="actions"><button class="btn btn-sm btn-secondary" onclick="viewOrderDetail('${order.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')"><i class="fas fa-trash"></i></button>
                ${order.status === 'process' ? `<button class="btn btn-sm btn-success" onclick="completeOrder('${order.id}')"><i class="fas fa-check"></i></button>
                <button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.id}')"><i class="fas fa-times"></i></button>` : ''}</td></tr>`;
    });
    ordersTableBody.innerHTML = html;
}

function renderProducts() {
    const productsGrid = elements.productsGrid;
    const emptyProducts = document.getElementById('emptyProducts');
    
    if (!productsGrid || !emptyProducts) return;
    
    if (appData.products.length === 0) {
        productsGrid.innerHTML = '';
        emptyProducts.style.display = 'block';
        return;
    }
    
    emptyProducts.style.display = 'none';
    let html = '';
    appData.products.forEach(product => {
        // Verificar si el producto tiene receta en el inventario
        const hasRecipeInInventory = appData.inventory && 
                                    appData.inventory.recipes && 
                                    appData.inventory.recipes.some(r => r.productId === product.id);
        
        const recipeBadge = hasRecipeInInventory ? 
            '<span class="recipe-badge" style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">✓ Receta</span>' : 
            '<span class="recipe-badge" style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">Sin receta</span>';
        
        html += `<div class="product-card" data-id="${product.id}">
            <div class="product-img">${product.image ? 
                `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 
                `<i class="fas fa-hamburger"></i>`}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name} ${recipeBadge}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-secondary" onclick="editProduct('${product.id}')" style="flex:1;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewRecipe('${product.id}')" style="flex:1;" title="Ver receta">
                        <i class="fas fa-utensils"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="manageRecipe('${product.id}')" style="flex:1;" title="Gestionar receta">
                        <i class="fas fa-utensils"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')" style="flex:1;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    });
    productsGrid.innerHTML = html;
}

function checkProductAvailability(productId, quantity) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) return { available: false, reason: 'Producto no encontrado' };
    
    // Usar la función helper segura
    const recipe = getRecipeByProductId(productId);
    if (!recipe) return { available: true, reason: 'Sin receta, disponible sin restricciones' };
    
    let missingIngredients = [];
    
    // Verificar que recipe.ingredients exista
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return { available: true, reason: 'Receta vacía' };
    }
    
    for (const recipeIng of recipe.ingredients) {
        // Usar función helper segura
        const ingredient = getIngredientById(recipeIng.ingredientId);
        if (!ingredient) continue;
        
        const requiredQuantity = recipeIng.quantity * quantity;
        const effectiveQuantity = requiredQuantity * (1 + (recipeIng.wastePercentage || 0) / 100);
        
        if (ingredient.stock < effectiveQuantity) {
            missingIngredients.push({
                name: ingredient.name,
                required: effectiveQuantity,
                available: ingredient.stock,
                unit: ingredient.unit
            });
        }
    }
    
    if (missingIngredients.length > 0) {
        return {
            available: false,
            reason: 'Stock insuficiente',
            missing: missingIngredients
        };
    }
    
    return { available: true, reason: 'Disponible' };
}

function manageRecipe(productId) {
    // Cambiar a la pestaña de inventario
    switchTab('inventory');
    
    // Cambiar a la subtab de recetas
    setTimeout(() => {
        switchInvTab('recipes');
        
        // Cargar la receta del producto
        setTimeout(() => {
            loadRecipe(productId);
            
            // Desplazar a la sección de recetas
            const recipeSection = document.getElementById('recipeEditor');
            if (recipeSection) {
                recipeSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }, 100);
    
    showNotification('Redirigiendo a la gestión de recetas...', 'info');
}

function renderCustomers() {
    const customersTableBody = elements.customersTableBody;
    const emptyCustomers = document.getElementById('emptyCustomers');
    
    if (!customersTableBody || !emptyCustomers) return;
    
    if (appData.customers.length === 0) {
        customersTableBody.innerHTML = '';
        emptyCustomers.style.display = 'block';
        return;
    }
    
    emptyCustomers.style.display = 'none';
    let html = '';
    appData.customers.forEach(customer => {
        const orderCount = appData.orders.filter(order => order.customerId === customer.id).length;
        html += `<tr><td>${customer.name}</td><td>${customer.phone || '-'}</td><td>${orderCount} órdenes</td>
                <td class="actions"><button class="btn btn-sm btn-secondary" onclick="editCustomer('${customer.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    customersTableBody.innerHTML = html;
}

// ========== FUNCIONES DE PROVEEDORES ==========
function renderSuppliers() {
    const suppliersTableBody = elements.suppliersTableBody;
    const emptySuppliers = document.getElementById('emptySuppliers');
    
    if (!suppliersTableBody || !emptySuppliers) return;
    
    if (appData.suppliers.length === 0) {
        suppliersTableBody.innerHTML = '';
        emptySuppliers.style.display = 'block';
        return;
    }
    
    emptySuppliers.style.display = 'none';
    let html = '';
    appData.suppliers.forEach(supplier => {
        // Contar ingredientes asociados
        const ingredientCount = appData.inventory.ingredients.filter(ing => 
            ing.suppliers && ing.suppliers.includes(supplier.id)
        ).length;
        
        // Contar órdenes de compra
        const purchaseOrderCount = appData.inventory.purchaseOrders.filter(po => 
            po.supplierId === supplier.id
        ).length;
        
        html += `<tr>
            <td>${supplier.name}</td>
            <td>${supplier.phone || '-'}</td>
            <td>${supplier.email || '-'}</td>
            <td>${ingredientCount}</td>
            <td>${purchaseOrderCount}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editSupplier('${supplier.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${supplier.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    suppliersTableBody.innerHTML = html;
}

function openSupplierModal(supplierId = null) {
    currentEditingSupplierId = supplierId;
    const modal = document.getElementById('supplierModal');
    const modalTitle = document.getElementById('supplierModalTitle');
    const form = document.getElementById('supplierForm');
    
    if (supplierId) {
        if (modalTitle) modalTitle.textContent = 'Editar Proveedor';
        const supplier = appData.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            document.getElementById('supplierId').value = supplier.id;
            document.getElementById('supplierName').value = supplier.name;
            document.getElementById('supplierPhone').value = supplier.phone || '';
            document.getElementById('supplierEmail').value = supplier.email || '';
            document.getElementById('supplierAddress').value = supplier.address || '';
            document.getElementById('supplierNotes').value = supplier.notes || '';
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuevo Proveedor';
        if (form) form.reset();
        const supplierIdField = document.getElementById('supplierId');
        if (supplierIdField) supplierIdField.value = '';
    }
    
    if (modal) modal.classList.add('active');
}

function saveSupplier(e) {
    e.preventDefault();
    
    const id = document.getElementById('supplierId').value || generateId();
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const email = document.getElementById('supplierEmail').value;
    const address = document.getElementById('supplierAddress').value;
    const notes = document.getElementById('supplierNotes').value;
    
    if (!name) {
        showNotification('Por favor, ingrese el nombre del proveedor', 'error');
        return;
    }
    
    const supplier = {
        id,
        name,
        phone: phone || '',
        email: email || '',
        address: address || '',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (currentEditingSupplierId) {
        const index = appData.suppliers.findIndex(s => s.id === currentEditingSupplierId);
        if (index !== -1) {
            // Mantener fecha de creación
            supplier.createdAt = appData.suppliers[index].createdAt;
            appData.suppliers[index] = supplier;
        }
    } else {
        appData.suppliers.push(supplier);
    }
    
    saveAppData();
    renderSuppliers();
    closeModal(document.getElementById('supplierModal'));
    showNotification(`Proveedor ${currentEditingSupplierId ? 'actualizado' : 'agregado'} correctamente`);
    
    // Actualizar selects en otros módulos
    updateSupplierSelects();
}

function deleteSupplier(supplierId) {
    // Verificar si el proveedor está en uso
    const usedInIngredients = appData.inventory.ingredients.some(ing => 
        ing.suppliers && ing.suppliers.includes(supplierId)
    );
    
    const usedInPurchaseOrders = appData.inventory.purchaseOrders.some(po => 
        po.supplierId === supplierId
    );
    
    if (usedInIngredients || usedInPurchaseOrders) {
        showNotification('No se puede eliminar: este proveedor está en uso en ingredientes u órdenes de compra', 'error');
        return;
    }
    
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
        appData.suppliers = appData.suppliers.filter(s => s.id !== supplierId);
        saveAppData();
        renderSuppliers();
        showNotification('Proveedor eliminado correctamente');
    }
}

function filterSuppliers() {
    const searchInput = document.getElementById('searchSuppliers');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#suppliersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ========== FUNCIONES DE MODALES ==========
function openProductModal(productId = null) {
    editingProductId = productId;
    const modalTitle = document.getElementById('productModalTitle');
    const form = elements.productForm;
    
    if (productId) {
        if (modalTitle) modalTitle.textContent = 'Editar Producto';
        const product = appData.products.find(p => p.id === productId);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productImage').value = product.image || '';
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuevo Producto';
        if (form) form.reset();
        const productIdField = document.getElementById('productId');
        if (productIdField) productIdField.value = '';
    }
    if (elements.productModal) elements.productModal.classList.add('active');
}

function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value || generateId();
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value;
    
    if (!name || isNaN(price)) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Nueva estructura del producto que incluye indicador de si tiene receta
    const product = { 
        id, 
        name, 
        price, 
        image,
        hasRecipe: false // Por defecto
    };
    
    if (editingProductId) {
        const index = appData.products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            // Mantener el estado de la receta si ya existía
            const oldProduct = appData.products[index];
            product.hasRecipe = oldProduct.hasRecipe || false;
            appData.products[index] = product;
        }
    } else {
        appData.products.push(product);
    }
    
    saveAppData();
    renderProducts();
    closeModal(elements.productModal);
    showNotification(`Producto ${editingProductId ? 'actualizado' : 'agregado'} correctamente`);
    
    // Si estamos en la vista de recetas, actualizar
    if (document.querySelector('.inv-tab.active') && 
        document.querySelector('.inv-tab.active').getAttribute('data-inv-tab') === 'recipes') {
        renderProductsForRecipes();
    }
}

function deleteProduct(productId) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        appData.products = appData.products.filter(p => p.id !== productId);
        saveAppData();
        renderProducts();
        showNotification('Producto eliminado correctamente');
    }
}

function openCustomerModal(customerId = null) {
    editingCustomerId = customerId;
    const modalTitle = document.getElementById('customerModalTitle');
    const form = elements.customerForm;
    
    if (customerId) {
        if (modalTitle) modalTitle.textContent = 'Editar Cliente';
        const customer = appData.customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('customerId').value = customer.id;
            document.getElementById('customerName').value = customer.name;
            document.getElementById('customerPhone').value = customer.phone || '';
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuevo Cliente';
        if (form) form.reset();
        const customerIdField = document.getElementById('customerId');
        if (customerIdField) customerIdField.value = '';
    }
    if (elements.customerModal) elements.customerModal.classList.add('active');
}

function saveCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('customerId').value || generateId();
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    
    if (!name) {
        showNotification('Por favor, complete el nombre del cliente', 'error');
        return;
    }
    
    const customer = { id, name, phone };
    if (editingCustomerId) {
        const index = appData.customers.findIndex(c => c.id === editingCustomerId);
        if (index !== -1) appData.customers[index] = customer;
    } else {
        appData.customers.push(customer);
    }
    
    saveAppData();
    renderCustomers();
    closeModal(elements.customerModal);
    showNotification(`Cliente ${editingCustomerId ? 'actualizado' : 'agregado'} correctamente`);
    if (elements.orderModal && elements.orderModal.classList.contains('active')) {
        renderCustomerSelector();
    }
}

function deleteCustomer(customerId) {
    const hasOrders = appData.orders.some(order => order.customerId === customerId);
    const message = hasOrders ? 'Este cliente tiene órdenes asociadas. ¿Está seguro de eliminar?' : '¿Está seguro de eliminar este cliente?';
    if (!confirm(message)) return;
    
    appData.customers = appData.customers.filter(c => c.id !== customerId);
    saveAppData();
    renderCustomers();
    showNotification('Cliente eliminado correctamente');
}

function openOrderModal() {
    resetOrderModal();
    if (elements.orderModal) elements.orderModal.classList.add('active');
    renderCustomerSelector();
}

function resetOrderModal() {
    currentStep = 1;
    selectedCustomer = null;
    selectedProducts = {};
    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step2').classList.remove('completed');
    document.getElementById('step3').classList.remove('completed');
    document.getElementById('orderStep1').style.display = 'block';
    document.getElementById('orderStep2').style.display = 'none';
    document.getElementById('orderStep3').style.display = 'none';
    const selectCustomerBtn = document.getElementById('selectCustomerBtn');
    if (selectCustomerBtn) selectCustomerBtn.disabled = true;
    updateOrderSummary();
}

function renderCustomerSelector() {
    const customerSelector = elements.customerSelector;
    if (!customerSelector) return;
    
    if (appData.customers.length === 0) {
        customerSelector.innerHTML = '<p>No hay clientes registrados. Crea uno nuevo.</p>';
        return;
    }
    
    let html = '';
    appData.customers.forEach(customer => {
        const isSelected = selectedCustomer && selectedCustomer.id === customer.id;
        html += `<div class="customer-card ${isSelected ? 'selected' : ''}" data-id="${customer.id}">
                <div class="customer-name">${customer.name}</div><div class="customer-phone">${customer.phone || 'Sin teléfono'}</div></div>`;
    });
    customerSelector.innerHTML = html;
    document.querySelectorAll('.customer-card').forEach(card => {
        card.addEventListener('click', () => selectCustomer(card.getAttribute('data-id')));
    });
}

function selectCustomer(customerId) {
    const customer = appData.customers.find(c => c.id === customerId);
    if (customer) {
        selectedCustomer = customer;
        document.querySelectorAll('.customer-card').forEach(card => {
            if (card.getAttribute('data-id') === customerId) card.classList.add('selected');
            else card.classList.remove('selected');
        });
        const selectCustomerBtn = document.getElementById('selectCustomerBtn');
        if (selectCustomerBtn) selectCustomerBtn.disabled = false;
    }
}

function goToStep2() {
    if (!selectedCustomer) {
        showNotification('Por favor, seleccione un cliente', 'error');
        return;
    }
    currentStep = 2;
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
    document.getElementById('orderStep1').style.display = 'none';
    document.getElementById('orderStep2').style.display = 'block';
    renderOrderProducts();
}

function renderOrderProducts() {
    const orderProductsGrid = elements.orderProductsGrid;
    if (!orderProductsGrid) return;
    
    if (appData.products.length === 0) {
        orderProductsGrid.innerHTML = '<p>No hay productos disponibles. Agrega productos primero.</p>';
        return;
    }
    
    let html = '';
    appData.products.forEach(product => {
        const quantity = selectedProducts[product.id] ? selectedProducts[product.id].quantity : 0;
        const isSelected = quantity > 0;
        
        // Verificar disponibilidad
        const availability = checkProductAvailability(product.id, quantity + 1);
        const isAvailable = availability.available;
        
        const availabilityBadge = isAvailable ? 
            '<span class="badge" style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">Disponible</span>' : 
            '<span class="badge" style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">Sin stock</span>';
        
        html += `<div class="product-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}" data-id="${product.id}">
            <div class="product-img">${product.image ? 
                `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 
                `<i class="fas fa-hamburger"></i>`}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name} ${availabilityBadge}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="quantity-control" style="margin-top: 10px;">
                    <button class="quantity-btn" onclick="decreaseProductQuantity('${product.id}')" ${quantity === 0 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${quantity}" min="0" 
                           onchange="updateProductQuantityManual('${product.id}', this.value)"
                           oninput="validateProductQuantity('${product.id}', this)"
                           style="width: 60px; text-align: center;">
                    <button class="quantity-btn" onclick="increaseProductQuantity('${product.id}')" ${!isAvailable ? 'disabled' : ''}>+</button>
                </div>
            </div>
        </div>`;
    });
    orderProductsGrid.innerHTML = html;
    
    // Añadir CSS para productos no disponibles
    const style = document.createElement('style');
    style.textContent = `
        .product-card.unavailable {
            opacity: 0.7;
            filter: grayscale(50%);
        }
        .product-card.unavailable .quantity-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .quantity-input {
            -moz-appearance: textfield; /* Firefox */
        }
        .quantity-input::-webkit-outer-spin-button,
        .quantity-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    `;
    document.head.appendChild(style);
    
    updateSelectedProductsList();
    updateOrderSummary();
}

function updateProductQuantityManual(productId, value) {
    const quantity = parseInt(value) || 0;
    
    if (quantity < 0) {
        showNotification('La cantidad no puede ser negativa', 'error');
        return;
    }
    
    if (quantity > 0) {
        // Verificar disponibilidad
        const availability = checkProductAvailability(productId, quantity);
        
        if (!availability.available) {
            let message = `No hay suficiente stock para "${appData.products.find(p => p.id === productId)?.name}" x${quantity}.`;
            
            if (availability.missing) {
                message += "\nFalta:\n";
                availability.missing.forEach(item => {
                    message += `• ${item.name}: Necesitas ${item.required.toFixed(2)} ${item.unit}, tienes ${item.available} ${item.unit}\n`;
                });
            }
            
            alert(message);
            // Restaurar valor anterior
            const card = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (card) {
                const input = card.querySelector('.quantity-input');
                const previousQuantity = selectedProducts[productId] ? selectedProducts[productId].quantity : 0;
                if (input) input.value = previousQuantity;
            }
            return;
        }
        
        if (!selectedProducts[productId]) selectedProducts[productId] = { productId, quantity: 0, price: 0 };
        selectedProducts[productId].quantity = quantity;
        const product = appData.products.find(p => p.id === productId);
        if (product) selectedProducts[productId].price = product.price;
    } else {
        // Si la cantidad es 0, eliminar el producto
        delete selectedProducts[productId];
    }
    
    updateProductCard(productId);
    updateSelectedProductsList();
    updateOrderSummary();
}

function validateProductQuantity(productId, input) {
    // Permitir solo números enteros
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Limitar a 3 dígitos (máximo 999)
    if (input.value.length > 3) {
        input.value = input.value.slice(0, 3);
    }
}

function increaseProductQuantity(productId) {
    const currentQuantity = selectedProducts[productId] ? selectedProducts[productId].quantity : 0;
    const newQuantity = currentQuantity + 1;
    
    // Verificar disponibilidad
    const availability = checkProductAvailability(productId, newQuantity);
    
    if (!availability.available) {
        let message = `No hay suficiente stock para "${appData.products.find(p => p.id === productId)?.name}" x${newQuantity}.`;
        
        if (availability.missing) {
            message += "\nFalta:\n";
            availability.missing.forEach(item => {
                message += `• ${item.name}: Necesitas ${item.required.toFixed(2)} ${item.unit}, tienes ${item.available} ${item.unit}\n`;
            });
        }
        
        alert(message);
        return;
    }
    
    if (!selectedProducts[productId]) selectedProducts[productId] = { productId, quantity: 0, price: 0 };
    selectedProducts[productId].quantity++;
    const product = appData.products.find(p => p.id === productId);
    if (product) selectedProducts[productId].price = product.price;
    updateProductCard(productId);
    updateSelectedProductsList();
    updateOrderSummary();
}

function decreaseProductQuantity(productId) {
    if (selectedProducts[productId] && selectedProducts[productId].quantity > 0) {
        selectedProducts[productId].quantity--;
        if (selectedProducts[productId].quantity === 0) delete selectedProducts[productId];
        updateProductCard(productId);
        updateSelectedProductsList();
        updateOrderSummary();
    }
}

function updateProductCard(productId) {
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const quantity = selectedProducts[productId] ? selectedProducts[productId].quantity : 0;
        const input = card.querySelector('.quantity-input');
        if (input) input.value = quantity;
        if (quantity > 0) card.classList.add('selected');
        else card.classList.remove('selected');
    }
}

function updateSelectedProductsList() {
    const orderSelectedProducts = elements.orderSelectedProducts;
    if (!orderSelectedProducts) return;
    
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    
    if (productsWithQuantity.length === 0) {
        orderSelectedProducts.innerHTML = '<p>No hay productos seleccionados. Agrega productos a la orden.</p>';
        return;
    }
    
    let html = '';
    productsWithQuantity.forEach(item => {
        const product = appData.products.find(p => p.id === item.productId);
        if (product) {
            const subtotal = item.quantity * product.price;
            html += `<div class="product-order-item"><div class="product-order-info"><div><strong>${product.name}</strong></div>
                    <div>$${product.price.toFixed(2)} x ${item.quantity} = $${subtotal.toFixed(2)}</div></div>
                    <div><button class="btn btn-sm btn-danger" onclick="removeProductFromOrder('${item.productId}')"><i class="fas fa-trash"></i></button></div></div>`;
        }
    });
    orderSelectedProducts.innerHTML = html;
}

function removeProductFromOrder(productId) {
    delete selectedProducts[productId];
    updateProductCard(productId);
    updateSelectedProductsList();
    updateOrderSummary();
}

function updateOrderSummary() {
    let subtotal = 0;
    Object.values(selectedProducts).forEach(item => {
        const product = appData.products.find(p => p.id === item.productId);
        if (product) subtotal += item.quantity * product.price;
    });
    
    const iva = subtotal * appData.settings.ivaRate;
    const total = subtotal + iva;
    const subtotalElem = document.getElementById('subtotal');
    const ivaElem = document.getElementById('iva');
    const totalElem = document.getElementById('total');
    const confirmSubtotalElem = document.getElementById('confirmSubtotal');
    const confirmIvaElem = document.getElementById('confirmIva');
    const confirmTotalElem = document.getElementById('confirmTotal');
    const goToStep3Btn = document.getElementById('goToStep3Btn');
    
    if (subtotalElem) subtotalElem.textContent = `$${subtotal.toFixed(2)}`;
    if (ivaElem) ivaElem.textContent = `$${iva.toFixed(2)}`;
    if (totalElem) totalElem.textContent = `$${total.toFixed(2)}`;
    if (confirmSubtotalElem) confirmSubtotalElem.textContent = `$${subtotal.toFixed(2)}`;
    if (confirmIvaElem) confirmIvaElem.textContent = `$${iva.toFixed(2)}`;
    if (confirmTotalElem) confirmTotalElem.textContent = `$${total.toFixed(2)}`;
    if (goToStep3Btn) goToStep3Btn.disabled = subtotal === 0;
}

function goToStep3() {
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    if (productsWithQuantity.length === 0) {
        showNotification('Por favor, agregue al menos un producto a la orden', 'error');
        return;
    }
    
    currentStep = 3;
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step2').classList.add('completed');
    document.getElementById('step3').classList.add('active');
    document.getElementById('orderStep2').style.display = 'none';
    document.getElementById('orderStep3').style.display = 'block';
    updateConfirmationInfo();
}

function updateConfirmationInfo() {
    const confirmCustomerName = document.getElementById('confirmCustomerName');
    const confirmCustomerPhone = document.getElementById('confirmCustomerPhone');
    const confirmProductsList = document.getElementById('confirmProductsList');
    
    if (confirmCustomerName) confirmCustomerName.textContent = selectedCustomer.name;
    if (confirmCustomerPhone) confirmCustomerPhone.textContent = selectedCustomer.phone || '-';
    
    if (confirmProductsList) {
        let html = '';
        Object.values(selectedProducts).forEach(item => {
            if (item.quantity > 0) {
                const product = appData.products.find(p => p.id === item.productId);
                if (product) {
                    const subtotal = item.quantity * product.price;
                    html += `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <div>${product.name} (${item.quantity} x $${product.price.toFixed(2)})</div><div>$${subtotal.toFixed(2)}</div></div>`;
                }
            }
        });
        confirmProductsList.innerHTML = html;
    }
}

function goToStep1() {
    currentStep = 1;
    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step2').classList.remove('completed');
    document.getElementById('orderStep1').style.display = 'block';
    document.getElementById('orderStep2').style.display = 'none';
}

function goToStep2FromStep3() {
    currentStep = 2;
    document.getElementById('step2').classList.add('active');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step3').classList.remove('completed');
    document.getElementById('orderStep2').style.display = 'block';
    document.getElementById('orderStep3').style.display = 'none';
}

function saveOrder() {
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    if (productsWithQuantity.length === 0) {
        showNotification('Por favor, agregue al menos un producto a la orden', 'error');
        return;
    }
    
    const orderId = generateId();
    const order = {
        id: orderId,
        customerId: selectedCustomer.id,
        items: productsWithQuantity.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
        status: 'process',
        date: new Date().toISOString()
    };
    
    appData.orders.push(order);
    saveAppData();
    closeModal(elements.orderModal);
    showNotification(`Orden #${orderId} creada correctamente`);
    switchTab('orders');
    setTimeout(() => generateOrderPDF(orderId), 500);
}

function viewOrderDetail(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const customer = appData.customers.find(c => c.id === order.customerId) || { name: 'Cliente no encontrado', phone: '' };
    const total = calculateOrderTotal(order);
    const detailOrderId = document.getElementById('detailOrderId');
    const orderDetailContent = document.getElementById('orderDetailContent');
    
    if (detailOrderId) detailOrderId.textContent = orderId;
    
    if (!orderDetailContent) return;
    
    let html = `<div class="order-detail-card"><h4>Cliente: ${customer.name}</h4>
            <p>Teléfono: ${customer.phone || '-'}</p><p>Fecha: ${formatDate(order.date)}</p>
            <p>Estado: <span class="status status-${order.status}">${order.status === 'process' ? 'En proceso' : order.status === 'completed' ? 'Completada' : 'Cancelada'}</span></p>
            <h4 style="margin-top: 20px;">Productos:</h4>`;
    
    order.items.forEach(item => {
        const product = appData.products.find(p => p.id === item.productId) || { name: 'Producto no encontrado', price: 0 };
        const itemTotal = item.quantity * item.price;
        html += `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <div>${product.name} (${item.quantity} x $${item.price.toFixed(2)})</div><div>$${itemTotal.toFixed(2)}</div></div>`;
    });
    
    const subtotal = total / (1 + appData.settings.ivaRate);
    const iva = subtotal * appData.settings.ivaRate;
    html += `<div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0;"><div>Subtotal:</div><div>$${subtotal.toFixed(2)}</div></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;"><div>IVA (${(appData.settings.ivaRate * 100)}%):</div><div>$${iva.toFixed(2)}</div></div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; font-size: 18px; color: var(--primary);">
            <div>Total:</div><div>$${total.toFixed(2)}</div></div></div></div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-primary" onclick="generateOrderPDF('${orderId}')"><i class="fas fa-file-pdf"></i> Generar PDF</button>
            ${order.status === 'process' ? `<button class="btn btn-success" onclick="completeOrder('${orderId}')"><i class="fas fa-check"></i> Marcar como Completada</button>
            <button class="btn btn-danger" onclick="cancelOrder('${orderId}')"><i class="fas fa-times"></i> Cancelar Orden</button>` : ''}</div>`;
    
    orderDetailContent.innerHTML = html;
    if (elements.orderDetailModal) elements.orderDetailModal.classList.add('active');
}

function completeOrder(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        // Verificar stock antes de completar
        const hasEnoughStock = checkStockForOrder(order);
        
        if (!hasEnoughStock.success) {
            showNotification(`No hay suficiente stock para completar la orden: ${hasEnoughStock.message}`, 'error');
            return;
        }
        
        // Descontar ingredientes
        const deductionResult = deductIngredientsForOrder(order);
        
        if (!deductionResult.success) {
            showNotification(deductionResult.message, 'error');
            return;
        }
        
        // Marcar como completada
        order.status = 'completed';
        saveAppData();
        renderOrders();
        
        if (elements.orderDetailModal && elements.orderDetailModal.classList.contains('active')) {
            viewOrderDetail(orderId);
        }
        
        showNotification(`Orden #${orderId} completada y stock actualizado`);
        
        // Actualizar resumen de inventario
        updateInventorySummary();
        
        // Generar reporte de consumo
        generateConsumptionReport(order);
    }
}

function cancelOrder(orderId) {
    if (confirm('¿Está seguro de cancelar esta orden?')) {
        const order = appData.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'cancelled';
            saveAppData();
            renderOrders();
            if (elements.orderDetailModal && elements.orderDetailModal.classList.contains('active')) viewOrderDetail(orderId);
            showNotification(`Orden #${orderId} cancelada`);
        }
    }
}

function deleteOrder(orderId) {
    if (confirm('¿Está seguro de eliminar esta orden?')) {
        appData.orders = appData.orders.filter(o => o.id !== orderId);
        saveAppData();
        renderOrders();
        showNotification('Orden eliminada correctamente');
    }
}

function generateOrderPDF(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const customer = appData.customers.find(c => c.id === order.customerId) || { name: 'Cliente no encontrado', phone: '' };
    const total = calculateOrderTotal(order);
    const subtotal = total / (1 + appData.settings.ivaRate);
    const iva = subtotal * appData.settings.ivaRate;
    
    // Obtener colores actuales del tema
    const colors = appData.settings.colors;
    const primaryColor = colors.primary;
    const secondaryColor = colors.secondary;
    const primaryDark = adjustColor(primaryColor, -20);
    
    // Formatear fecha más legible
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Generar ID más estético
    const shortOrderId = orderId.slice(-8).toUpperCase();
    const orderNumber = `ORD-${shortOrderId}`;
    
    const pdfContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cotización ${orderNumber} - ${appData.business.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: #f8f9fa;
                    padding: 30px;
                }
                
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                
                /* Header */
                .invoice-header {
                    background: linear-gradient(135deg, ${primaryColor}, ${primaryDark});
                    color: white;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                }
                
                .invoice-header::before {
                    content: '';
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    width: 200px;
                    height: 200px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                }
                
                .invoice-header::after {
                    content: '';
                    position: absolute;
                    bottom: -80px;
                    left: -80px;
                    width: 250px;
                    height: 250px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 50%;
                }
                
                .business-info {
                    position: relative;
                    z-index: 2;
                }
                
                .business-name {
                    font-family: 'Poppins', sans-serif;
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    letter-spacing: -0.5px;
                }
                
                .business-tagline {
                    font-size: 16px;
                    opacity: 0.9;
                    margin-bottom: 25px;
                    font-weight: 300;
                }
                
                .contact-info {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .contact-item i {
                    font-size: 16px;
                }
                
                /* Order Info */
                .order-info-section {
                    background: white;
                    padding: 30px 40px;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .order-number {
                    font-family: 'Poppins', sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    color: ${primaryColor};
                    letter-spacing: 1px;
                }
                
                .order-status {
                    background: ${order.status === 'completed' ? '#10b981' : 
                                order.status === 'process' ? '#f59e0b' : '#ef4444'};
                    color: white;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .order-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }
                
                .detail-group h4 {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .detail-value {
                    font-size: 16px;
                    font-weight: 500;
                    color: #1e293b;
                }
                
                /* Products Table */
                .products-section {
                    padding: 30px 40px;
                }
                
                .section-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid ${secondaryColor};
                    display: inline-block;
                }
                
                .products-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                
                .products-table thead {
                    background: ${secondaryColor};
                    color: white;
                }
                
                .products-table th {
                    padding: 16px 20px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .products-table tbody tr {
                    border-bottom: 1px solid #e2e8f0;
                    transition: background-color 0.2s;
                }
                
                .products-table tbody tr:hover {
                    background-color: #f8fafc;
                }
                
                .products-table td {
                    padding: 16px 20px;
                    font-size: 15px;
                }
                
                .product-name {
                    font-weight: 500;
                    color: #1e293b;
                }
                
                .unit-price, .quantity, .subtotal {
                    text-align: right;
                    font-family: 'Inter', sans-serif;
                }
                
                .quantity {
                    color: ${primaryColor};
                    font-weight: 600;
                }
                
                /* Summary */
                .summary-section {
                    padding: 30px 40px;
                    background: #f8fafc;
                    border-top: 1px solid #eaeaea;
                }
                
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                
                .summary-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    text-align: center;
                }
                
                .summary-label {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .summary-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: ${primaryColor};
                    font-family: 'Poppins', sans-serif;
                }
                
                .iva-breakdown {
                    margin-top: 20px;
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                
                .iva-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                
                .iva-row:last-child {
                    border-bottom: none;
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 18px;
                }
                
                .iva-total {
                    color: ${primaryColor} !important;
                    font-family: 'Poppins', sans-serif;
                }
                
                /* Footer */
                .invoice-footer {
                    background: linear-gradient(135deg, ${secondaryColor}, #003366);
                    color: white;
                    padding: 30px 40px;
                    text-align: center;
                }
                
                .footer-content {
                    position: relative;
                    z-index: 2;
                }
                
                .footer-logo {
                    font-family: 'Poppins', sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    letter-spacing: 1px;
                }
                
                .footer-contact {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                
                .footer-contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .footer-message {
                    font-size: 14px;
                    opacity: 0.8;
                    margin-top: 15px;
                    font-style: italic;
                }
                
                .thank-you {
                    font-size: 18px;
                    font-weight: 500;
                    margin-top: 20px;
                    color: rgba(255, 255, 255, 0.95);
                }
                
                /* Watermark */
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 100px;
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.03);
                    z-index: 1;
                    white-space: nowrap;
                    user-select: none;
                    pointer-events: none;
                }
                
                /* Print styles */
                @media print {
                    body {
                        padding: 0;
                        background: white;
                    }
                    
                    .invoice-container {
                        box-shadow: none;
                        border-radius: 0;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header -->
                <div class="invoice-header">
                    <div class="watermark">${appData.business.name.toUpperCase()}</div>
                    <div class="business-info">
                        <h1 class="business-name">${appData.business.name}</h1>
                        <p class="business-tagline">Delicias que endulzan tu día</p>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-phone-alt"></i>
                                <span>${appData.business.whatsapp}</span>
                            </div>
                            ${appData.business.address ? `
                            <div class="contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${appData.business.address}</span>
                            </div>
                            ` : ''}
                            ${appData.business.rfc ? `
                            <div class="contact-item">
                                <i class="fas fa-id-card"></i>
                                <span>RFC: ${appData.business.rfc}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Order Info -->
                <div class="order-info-section">
                    <div class="order-header">
                        <div>
                            <div class="order-number">${orderNumber}</div>
                            <div style="color: #64748b; font-size: 14px; margin-top: 5px;">${formattedDate}</div>
                        </div>
                        <div class="order-status">
                            ${order.status === 'process' ? 'EN PROCESO' : 
                              order.status === 'completed' ? 'COMPLETADA' : 'CANCELADA'}
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <div class="detail-group">
                            <h4>Cliente</h4>
                            <div class="detail-value">${customer.name}</div>
                            ${customer.phone ? `<div style="color: #64748b; font-size: 14px; margin-top: 4px;">${customer.phone}</div>` : ''}
                        </div>
                        
                        <div class="detail-group">
                            <h4>Información de Pago</h4>
                            <div class="detail-value">Cotización</div>
                            <div style="color: #64748b; font-size: 14px; margin-top: 4px;">
                                IVA incluido ${(appData.settings.ivaRate * 100)}%
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Products -->
                <div class="products-section">
                    <h3 class="section-title">Productos Cotizados</h3>
                    <table class="products-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th style="text-align: right;">Precio Unitario</th>
                                <th style="text-align: right;">Cantidad</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => {
                                const product = appData.products.find(p => p.id === item.productId) || { name: 'Producto no encontrado', price: 0 };
                                const itemSubtotal = item.quantity * item.price;
                                return `
                                    <tr>
                                        <td class="product-name">${product.name}</td>
                                        <td class="unit-price">$${item.price.toFixed(2)}</td>
                                        <td class="quantity">${item.quantity}</td>
                                        <td class="subtotal">$${itemSubtotal.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Summary -->
                <div class="summary-section">
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-label">Subtotal</div>
                            <div class="summary-value">$${subtotal.toFixed(2)}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">IVA ${(appData.settings.ivaRate * 100)}%</div>
                            <div class="summary-value">$${iva.toFixed(2)}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total</div>
                            <div class="summary-value" style="color: ${primaryColor};">$${total.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="iva-breakdown" style="margin-top: 30px;">
                        <h4 style="margin-bottom: 15px; color: #1e293b; font-family: 'Poppins', sans-serif;">Desglose</h4>
                        <div class="iva-row">
                            <span>Subtotal:</span>
                            <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="iva-row">
                            <span>IVA (${(appData.settings.ivaRate * 100)}%):</span>
                            <span>$${iva.toFixed(2)}</span>
                        </div>
                        <div class="iva-row iva-total">
                            <span>Total a pagar:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: ${primaryColor}15; border-radius: 10px; border-left: 4px solid ${primaryColor};">
                        <p style="color: #1e293b; margin: 0; font-size: 14px;">
                            <i class="fas fa-info-circle" style="color: ${primaryColor}; margin-right: 8px;"></i>
                            <strong>Nota:</strong> Esta cotización es válida por 7 días a partir de la fecha de emisión.
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="invoice-footer">
                    <div class="footer-content">
                        <div class="footer-logo">${appData.business.name}</div>
                        
                        <div class="footer-contact">
                            <div class="footer-contact-item">
                                <i class="fab fa-whatsapp"></i>
                                <span>${appData.business.whatsapp}</span>
                            </div>
                            ${appData.business.address ? `
                            <div class="footer-contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${appData.business.address}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        ${appData.business.rfc ? `
                        <div class="footer-contact-item" style="justify-content: center;">
                            <i class="fas fa-id-card"></i>
                            <span>RFC: ${appData.business.rfc}</span>
                        </div>
                        ` : ''}
                        
                        <div class="footer-message">
                            "La calidad en cada bocado, la excelencia en cada servicio"
                        </div>
                        
                        <div class="thank-you">
                            <i class="fas fa-heart" style="color: #ff6b6b; margin-right: 8px;"></i>
                            ¡Gracias por su preferencia!
                        </div>
                        
                        <div style="margin-top: 20px; font-size: 12px; opacity: 0.6;">
                            Documento generado automáticamente • ${new Date().toLocaleDateString('es-MX')}
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    // Auto-imprimir al cargar
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;
    
    // Abrir en nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    showNotification('PDF generado correctamente. Se abrirá automáticamente para imprimir.', 'success');
}

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

function exportData() {
    try {
        ensureInventoryStructure();
        const dataStr = JSON.stringify(appData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `snack-orders-backup-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showNotification('Datos exportados correctamente');
    } catch (error) {
        console.error('Error al exportar datos:', error);
        showNotification('Error al exportar datos', 'error');
    }
}

function clearData() {
    if (confirm('¿Está seguro de borrar todos los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('snackOrdersData');
        appData = getDefaultAppData();
        renderAllData();
        updateBusinessInfo();
        showNotification('Todos los datos han sido borrados');
    }
}

function closeModal(modal) {
    if (modal) modal.classList.remove('active');
}

function showNotification(message, type = 'success') {
    if (!elements.notificationText || !elements.notification) return;
    
    elements.notificationText.textContent = message;
    elements.notification.className = 'notification';
    elements.notification.classList.add(type);
    elements.notification.classList.add('show');
    setTimeout(() => {
        if (elements.notification) elements.notification.classList.remove('show');
    }, 3000);
}

function calculateOrderTotal(order) {
    let subtotal = 0;
    order.items.forEach(item => subtotal += item.quantity * item.price);
    return subtotal + (subtotal * appData.settings.ivaRate);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return dateString;
    }
}

// ========== FUNCIONES DE GESTIÓN DE INVENTARIO ==========

function updateInventorySummary() {
    ensureInventoryStructure();
    
    // Verificar que inventory.ingredients exista
    const ingredients = appData.inventory.ingredients || [];
    const lowStockCount = ingredients.filter(ing => ing.stock <= ing.minStock).length;
    const totalIngredients = ingredients.length;
    const inventoryValue = ingredients.reduce((total, ing) => total + (ing.stock * ing.cost), 0);
    const pendingOrders = appData.orders ? appData.orders.filter(order => order.status === 'process').length : 0;
    
    // Actualizar elementos del DOM solo si existen
    const lowStockCountElem = document.getElementById('lowStockCount');
    const totalIngredientsElem = document.getElementById('totalIngredients');
    const inventoryValueElem = document.getElementById('inventoryValue');
    const pendingOrdersElem = document.getElementById('pendingOrders');
    
    if (lowStockCountElem) lowStockCountElem.textContent = lowStockCount;
    if (totalIngredientsElem) totalIngredientsElem.textContent = totalIngredients;
    if (inventoryValueElem) inventoryValueElem.textContent = `$${inventoryValue.toFixed(2)}`;
    if (pendingOrdersElem) pendingOrdersElem.textContent = pendingOrders;
    
    // Actualizar alertas
    checkInventoryAlerts();
}

function checkInventoryAlerts() {
    ensureInventoryStructure();
    
    appData.inventory.alerts = [];
    
    // Alertas de stock bajo - verificar que ingredients exista
    const ingredients = appData.inventory.ingredients || [];
    ingredients.forEach(ingredient => {
        if (ingredient.stock <= ingredient.minStock) {
            appData.inventory.alerts.push({
                type: 'low_stock',
                message: `${ingredient.name} tiene stock bajo (${ingredient.stock} ${ingredient.unit})`,
                ingredientId: ingredient.id,
                priority: ingredient.stock <= (ingredient.minStock * 0.5) ? 'high' : 'medium',
                date: new Date().toISOString()
            });
        }
        
        if (ingredient.stock <= 0) {
            appData.inventory.alerts.push({
                type: 'out_of_stock',
                message: `${ingredient.name} está agotado`,
                ingredientId: ingredient.id,
                priority: 'high',
                date: new Date().toISOString()
            });
        }
    });
    
    // Alertas de productos sin receta - verificar que recipes y products existan
    const recipes = appData.inventory.recipes || [];
    const products = appData.products || [];
    
    products.forEach(product => {
        const hasRecipe = recipes.find(r => r.productId === product.id);
        if (!hasRecipe) {
            appData.inventory.alerts.push({
                type: 'no_recipe',
                message: `${product.name} no tiene receta definida`,
                productId: product.id,
                priority: 'low',
                date: new Date().toISOString()
            });
        }
    });
    
    // Guardar y mostrar
    saveAppData();
    if (document.querySelector('.inv-tab.active') && document.querySelector('.inv-tab.active').getAttribute('data-inv-tab') === 'alerts') {
        renderAlerts();
    }
}

// ========== FUNCIONES DE INGREDIENTES ==========

function renderIngredients() {
    const tbody = document.getElementById('ingredientsTableBody');
    const emptyState = document.getElementById('emptyIngredients');
    
    // Verificar que los elementos existan
    if (!tbody || !emptyState) return;
    
    // Verificar que inventory.ingredients exista
    if (!appData.inventory || !appData.inventory.ingredients || appData.inventory.ingredients.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    let html = '';
    
    appData.inventory.ingredients.forEach(ingredient => {
        const inventoryValue = ingredient.stock * ingredient.cost;
        const isLowStock = ingredient.stock <= ingredient.minStock;
        const rowClass = isLowStock ? 'low-stock' : '';
        
        // Obtener nombres de proveedores
        const supplierNames = ingredient.suppliers && ingredient.suppliers.length > 0
            ? ingredient.suppliers.map(supplierId => {
                const supplier = getSupplierById(supplierId);
                return supplier ? supplier.name : 'Desconocido';
            }).join(', ')
            : 'Sin proveedor';
        
        html += `<tr class="${rowClass}">
            <td>${ingredient.name}</td>
            <td>${getCategoryName(ingredient.category)}</td>
            <td>${ingredient.stock} ${ingredient.unit}</td>
            <td>${ingredient.unit}</td>
            <td>${ingredient.minStock} ${ingredient.unit}</td>
            <td>$${ingredient.cost.toFixed(2)}/${ingredient.unit}</td>
            <td>$${inventoryValue.toFixed(2)}</td>
            <td>${supplierNames}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editIngredient('${ingredient.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteIngredient('${ingredient.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="addStockQuick('${ingredient.id}')">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

function getCategoryName(categoryKey) {
    const categories = {
        'proteina': 'Proteína',
        'lacteo': 'Lácteo',
        'vegetal': 'Vegetal',
        'granos': 'Granos',
        'condimentos': 'Condimentos',
        'aceites': 'Aceites',
        'bebidas': 'Bebidas',
        'empaques': 'Empaques',
        'otros': 'Otros'
    };
    return categories[categoryKey] || categoryKey;
}

function openIngredientModal(ingredientId = null) {
    const modal = document.getElementById('ingredientModal');
    const modalTitle = document.getElementById('ingredientModalTitle');
    const form = document.getElementById('ingredientForm');
    
    if (ingredientId) {
        if (modalTitle) modalTitle.textContent = 'Editar Ingrediente';
        const ingredient = appData.inventory.ingredients.find(i => i.id === ingredientId);
        if (ingredient) {
            document.getElementById('ingredientId').value = ingredient.id;
            document.getElementById('ingredientName').value = ingredient.name;
            document.getElementById('ingredientCategory').value = ingredient.category;
            document.getElementById('ingredientUnit').value = ingredient.unit;
            document.getElementById('ingredientStock').value = ingredient.stock;
            document.getElementById('ingredientMinStock').value = ingredient.minStock;
            document.getElementById('ingredientCost').value = ingredient.cost;
            
            // Solo establecer valores si los elementos existen
            const supplierInput = document.getElementById('ingredientSupplier');
            const locationInput = document.getElementById('ingredientLocation');
            if (supplierInput) supplierInput.value = ingredient.supplier || '';
            if (locationInput) locationInput.value = ingredient.location || '';
            
            // Cargar proveedores seleccionados
            const suppliersSelect = document.getElementById('ingredientSuppliers');
            if (suppliersSelect && ingredient.suppliers) {
                Array.from(suppliersSelect.options).forEach(option => {
                    option.selected = ingredient.suppliers.includes(option.value);
                });
            }
            
            // Cargar proveedor preferido
            const preferredSupplierSelect = document.getElementById('ingredientPreferredSupplier');
            if (preferredSupplierSelect) {
                preferredSupplierSelect.value = ingredient.preferredSupplier || '';
            }
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuevo Ingrediente';
        if (form) form.reset();
        const ingredientIdField = document.getElementById('ingredientId');
        if (ingredientIdField) ingredientIdField.value = '';
    }
    
    // Actualizar selects de proveedores solo si existen
    updateSupplierSelects();
    
    // Mejorar los inputs numéricos
    setTimeout(() => {
        const stockInput = document.getElementById('ingredientStock');
        const minStockInput = document.getElementById('ingredientMinStock');
        const costInput = document.getElementById('ingredientCost');
        
        if (stockInput) {
            stockInput.type = 'text';
            stockInput.pattern = '[0-9]*\\.?[0-9]*';
            stockInput.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9.]/g, '');
                // Permitir solo un punto decimal
                if ((this.value.match(/\./g) || []).length > 1) {
                    this.value = this.value.substring(0, this.value.lastIndexOf('.'));
                }
            });
        }
        
        if (minStockInput) {
            minStockInput.type = 'text';
            minStockInput.pattern = '[0-9]*\\.?[0-9]*';
            minStockInput.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9.]/g, '');
                if ((this.value.match(/\./g) || []).length > 1) {
                    this.value = this.value.substring(0, this.value.lastIndexOf('.'));
                }
            });
        }
        
        if (costInput) {
            costInput.type = 'text';
            costInput.pattern = '[0-9]*\\.?[0-9]*';
            costInput.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9.]/g, '');
                if ((this.value.match(/\./g) || []).length > 1) {
                    this.value = this.value.substring(0, this.value.lastIndexOf('.'));
                }
            });
        }
    }, 100);
    
    if (modal) modal.classList.add('active');
}

function saveIngredient(e) {
    e.preventDefault();
    
    const id = document.getElementById('ingredientId').value || generateId();
    const name = document.getElementById('ingredientName').value;
    const category = document.getElementById('ingredientCategory').value;
    const unit = document.getElementById('ingredientUnit').value;
    
    // Parsear valores con manejo de entrada de texto
    const stockInput = document.getElementById('ingredientStock');
    const minStockInput = document.getElementById('ingredientMinStock');
    const costInput = document.getElementById('ingredientCost');
    
    const stockValue = stockInput ? stockInput.value.replace(/[^0-9.]/g, '') : '0';
    const minStockValue = minStockInput ? minStockInput.value.replace(/[^0-9.]/g, '') : '0';
    const costValue = costInput ? costInput.value.replace(/[^0-9.]/g, '') : '0';
    
    const stock = parseFloat(stockValue) || 0;
    const minStock = parseFloat(minStockValue) || 0;
    const cost = parseFloat(costValue) || 0;
    
    // Manejar elementos que podrían no existir en el HTML
    const supplierInput = document.getElementById('ingredientSupplier');
    const locationInput = document.getElementById('ingredientLocation');
    const preferredSupplierInput = document.getElementById('ingredientPreferredSupplier');
    const suppliersSelect = document.getElementById('ingredientSuppliers');
    
    const supplier = supplierInput ? supplierInput.value : '';
    const location = locationInput ? locationInput.value : '';
    const preferredSupplier = preferredSupplierInput ? preferredSupplierInput.value : '';
    
    // Obtener proveedores seleccionados (múltiples)
    const selectedSuppliers = suppliersSelect ? 
        Array.from(suppliersSelect.selectedOptions).map(option => option.value) : [];
    
    if (!name || !category || !unit || isNaN(stock) || isNaN(minStock) || isNaN(cost)) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    const ingredient = {
        id,
        name,
        category,
        unit,
        stock,
        minStock,
        cost,
        supplier: supplier || '',
        location: location || '',
        suppliers: selectedSuppliers,
        preferredSupplier: preferredSupplier || '',
        lastUpdated: new Date().toISOString()
    };
    
    ensureInventoryStructure();
    
    const existingIndex = appData.inventory.ingredients.findIndex(i => i.id === id);
    if (existingIndex !== -1) {
        appData.inventory.ingredients[existingIndex] = ingredient;
    } else {
        appData.inventory.ingredients.push(ingredient);
    }
    
    saveAppData();
    renderIngredients();
    updateInventorySummary();
    closeModal(document.getElementById('ingredientModal'));
    showNotification(`Ingrediente ${id ? 'actualizado' : 'agregado'} correctamente`);
    
    // Actualizar selects en otros módulos
    updateIngredientSelects();
    updateSupplierSelects();
}

function updateIngredientSelects() {
    // Actualizar selects en todos los módulos que usen ingredientes
    const selects = document.querySelectorAll('select.ingredient-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecciona ingrediente</option>';
        
        appData.inventory.ingredients.forEach(ingredient => {
            const option = document.createElement('option');
            option.value = ingredient.id;
            option.textContent = `${ingredient.name} (${ingredient.unit})`;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

function updateSupplierSelects() {
    // Actualizar selects en todos los módulos que usen proveedores
    const selects = document.querySelectorAll('select.supplier-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecciona proveedor</option>';
        
        appData.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
    
    // Actualizar select múltiple de proveedores en ingredientes
    const suppliersMultiSelect = document.getElementById('ingredientSuppliers');
    if (suppliersMultiSelect && appData.suppliers) {
        const currentValues = Array.from(suppliersMultiSelect.selectedOptions).map(opt => opt.value);
        suppliersMultiSelect.innerHTML = '';
        appData.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            option.selected = currentValues.includes(supplier.id);
            suppliersMultiSelect.appendChild(option);
        });
    }
    
    // Actualizar proveedor preferido
    const preferredSupplierSelect = document.getElementById('ingredientPreferredSupplier');
    if (preferredSupplierSelect && appData.suppliers) {
        const currentValue = preferredSupplierSelect.value;
        preferredSupplierSelect.innerHTML = '<option value="">Ninguno (selecciona)</option>';
        
        appData.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            preferredSupplierSelect.appendChild(option);
        });
        
        preferredSupplierSelect.value = currentValue;
    }
}

function deleteIngredient(ingredientId) {
    ensureInventoryStructure();
    
    // Verificar si el ingrediente está en uso en alguna receta
    const recipes = appData.inventory.recipes || [];
    const usedInRecipes = recipes.some(recipe => 
        recipe.ingredients && recipe.ingredients.some(ing => ing.ingredientId === ingredientId)
    );
    
    if (usedInRecipes) {
        showNotification('No se puede eliminar: este ingrediente está en uso en una o más recetas', 'error');
        return;
    }
    
    if (confirm('¿Está seguro de eliminar este ingrediente?')) {
        appData.inventory.ingredients = appData.inventory.ingredients.filter(i => i.id !== ingredientId);
        saveAppData();
        renderIngredients();
        updateInventorySummary();
        showNotification('Ingrediente eliminado correctamente');
    }
}

function addStockQuick(ingredientId) {
    const ingredient = appData.inventory.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;
    
    const quantity = prompt(`Agregar stock a ${ingredient.name} (en ${ingredient.unit}):`, "0");
    if (quantity && !isNaN(parseFloat(quantity))) {
        ingredient.stock += parseFloat(quantity);
        ingredient.lastUpdated = new Date().toISOString();
        saveAppData();
        renderIngredients();
        updateInventorySummary();
        showNotification(`Stock actualizado: ${ingredient.stock} ${ingredient.unit}`);
    }
}

function filterIngredients() {
    const searchInput = document.getElementById('searchIngredients');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#ingredientsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ========== FUNCIONES DE RECETAS ==========

function renderProductsForRecipes() {
    const container = document.getElementById('recipeProductList');
    if (!container) return;
    
    ensureInventoryStructure();
    
    let html = '';
    
    appData.products.forEach(product => {
        // Verificar si el producto tiene receta
        const hasRecipe = appData.inventory.recipes.some(r => r.productId === product.id);
        const recipeStatus = hasRecipe ? '<span class="badge success">Con receta</span>' : '<span class="badge warning">Sin receta</span>';
        
        html += `<div class="product-recipe-item" data-product-id="${product.id}" onclick="loadRecipe('${product.id}')">
            <div class="product-recipe-name">${product.name}</div>
            <div class="product-recipe-price">$${product.price.toFixed(2)}</div>
            <div class="product-recipe-status">${recipeStatus}</div>
        </div>`;
    });
    
    container.innerHTML = html || '<p>No hay productos para mostrar.</p>';
}

function filterProductsForRecipe() {
    const searchInput = document.getElementById('searchProductsRecipe');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const items = document.querySelectorAll('.product-recipe-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function loadRecipe(productId) {
    currentEditingRecipeProductId = productId;
    const product = appData.products.find(p => p.id === productId);
    if (!product) return;
    
    const noRecipeSelected = document.getElementById('noRecipeSelected');
    const recipeEditor = document.getElementById('recipeEditor');
    const recipeProductName = document.getElementById('recipeProductName');
    
    if (noRecipeSelected) noRecipeSelected.style.display = 'none';
    if (recipeEditor) recipeEditor.style.display = 'block';
    if (recipeProductName) recipeProductName.textContent = product.name;
    
    // Cargar receta existente o crear una nueva
    let recipe = appData.inventory.recipes.find(r => r.productId === productId);
    if (!recipe) {
        recipe = {
            productId: productId,
            ingredients: []
        };
    }
    
    // Mostrar ingredientes de la receta
    renderRecipeIngredients(recipe.ingredients);
    
    // Calcular costo automáticamente
    calculateRecipeCost();
}

function renderRecipeIngredients(ingredients) {
    const container = document.getElementById('recipeIngredientsList');
    if (!container) return;
    
    if (!ingredients || ingredients.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay ingredientes en esta receta.</p>';
        return;
    }
    
    let html = '<h4>Ingredientes:</h4>';
    ingredients.forEach((ing, index) => {
        const ingredient = appData.inventory.ingredients.find(i => i.id === ing.ingredientId);
        if (!ingredient) return;
        
        const effectiveQuantity = ing.quantity * (1 + (ing.wastePercentage || 0) / 100);
        const ingredientCost = effectiveQuantity * ingredient.cost;
        
        html += `<div class="recipe-ingredient-item">
            <div class="recipe-ingredient-info">
                <strong>${ingredient.name}</strong>
                <div>${ing.quantity} ${ingredient.unit} + ${ing.wastePercentage || 0}% merma = ${effectiveQuantity.toFixed(3)} ${ingredient.unit}</div>
                <div>Costo: $${ingredientCost.toFixed(2)}</div>
            </div>
            <div>
                <button class="btn btn-sm btn-danger" onclick="removeIngredientFromRecipe(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function openRecipeIngredientModal() {
    if (!currentEditingRecipeProductId) {
        showNotification('Primero selecciona un producto', 'error');
        return;
    }
    
    const select = document.getElementById('selectRecipeIngredient');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona un ingrediente</option>';
    
    appData.inventory.ingredients.forEach(ingredient => {
        select.innerHTML += `<option value="${ingredient.id}">${ingredient.name} (${ingredient.unit})</option>`;
    });
    
    const modal = document.getElementById('recipeIngredientModal');
    if (modal) modal.classList.add('active');
}

function addIngredientToRecipe(e) {
    e.preventDefault();
    
    const ingredientId = document.getElementById('selectRecipeIngredient').value;
    const quantity = parseFloat(document.getElementById('recipeIngredientQuantity').value);
    const wastePercentage = parseFloat(document.getElementById('recipeIngredientWaste').value) || 0;
    
    if (!ingredientId || isNaN(quantity) || quantity <= 0) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    ensureInventoryStructure();
    
    // Buscar o crear receta
    let recipe = appData.inventory.recipes.find(r => r.productId === currentEditingRecipeProductId);
    if (!recipe) {
        recipe = {
            productId: currentEditingRecipeProductId,
            ingredients: []
        };
        appData.inventory.recipes.push(recipe);
    }
    
    // Asegurar que ingredients en la receta exista
    if (!recipe.ingredients) {
        recipe.ingredients = [];
    }
    
    // Verificar si el ingrediente ya está en la receta
    const existingIndex = recipe.ingredients.findIndex(i => i.ingredientId === ingredientId);
    if (existingIndex !== -1) {
        // Actualizar cantidad existente
        recipe.ingredients[existingIndex].quantity += quantity;
    } else {
        // Agregar nuevo ingrediente
        recipe.ingredients.push({
            ingredientId,
            quantity,
            wastePercentage
        });
    }
    
    // Actualizar visualización
    renderRecipeIngredients(recipe.ingredients);
    calculateRecipeCost();
    closeModal(document.getElementById('recipeIngredientModal'));
    showNotification('Ingrediente agregado a la receta');
}

function removeIngredientFromRecipe(index) {
    const recipe = appData.inventory.recipes.find(r => r.productId === currentEditingRecipeProductId);
    if (recipe && recipe.ingredients && recipe.ingredients[index]) {
        recipe.ingredients.splice(index, 1);
        renderRecipeIngredients(recipe.ingredients);
        calculateRecipeCost();
        showNotification('Ingrediente removido de la receta');
    }
}

function calculateRecipeCost() {
    if (!appData.inventory || !appData.inventory.recipes) return;
    
    const recipe = appData.inventory.recipes.find(r => r.productId === currentEditingRecipeProductId);
    const product = appData.products ? appData.products.find(p => p.id === currentEditingRecipeProductId) : null;
    
    if (!recipe || !product) {
        const recipeSummary = document.getElementById('recipeSummary');
        if (recipeSummary) recipeSummary.style.display = 'none';
        return;
    }
    
    let totalCost = 0;
    const ingredients = recipe.ingredients || [];
    const inventoryIngredients = appData.inventory.ingredients || [];
    
    ingredients.forEach(ing => {
        const ingredient = inventoryIngredients.find(i => i.id === ing.ingredientId);
        if (ingredient) {
            const effectiveQuantity = ing.quantity * (1 + (ing.wastePercentage || 0) / 100);
            totalCost += effectiveQuantity * ingredient.cost;
        }
    });
    
    const margin = product.price > 0 ? ((product.price - totalCost) / product.price * 100) : 0;
    
    const recipeTotalCostElem = document.getElementById('recipeTotalCost');
    const recipeMarginElem = document.getElementById('recipeMargin');
    const recipeSummaryElem = document.getElementById('recipeSummary');
    
    if (recipeTotalCostElem) recipeTotalCostElem.textContent = `$${totalCost.toFixed(2)}`;
    if (recipeMarginElem) recipeMarginElem.textContent = `${margin.toFixed(1)}%`;
    if (recipeSummaryElem) recipeSummaryElem.style.display = 'block';
}

function saveRecipe() {
    if (!currentEditingRecipeProductId) return;
    
    // Asegurar que la receta se guarda correctamente
    let recipe = appData.inventory.recipes.find(r => r.productId === currentEditingRecipeProductId);
    const product = appData.products.find(p => p.id === currentEditingRecipeProductId);
    
    if (!recipe && document.getElementById('recipeIngredientsList').innerHTML.includes('No hay ingredientes')) {
        showNotification('Agrega al menos un ingrediente a la receta antes de guardar', 'error');
        return;
    }
    
    saveAppData();
    
    // Actualizar estado del producto
    if (product) {
        product.hasRecipe = recipe ? recipe.ingredients.length > 0 : false;
        saveAppData();
    }
    
    showNotification('Receta guardada correctamente');
    
    // Actualizar lista de productos
    renderProducts();
    renderProductsForRecipes();
}

// ========== FUNCIONES DE COMPRAS ==========

function renderPurchases() {
    const tbody = document.getElementById('purchasesTableBody');
    const emptyState = document.getElementById('emptyPurchases');
    
    // Verificar que los elementos existan
    if (!tbody || !emptyState) return;
    
    // Verificar que inventory.purchases exista
    if (!appData.inventory || !appData.inventory.purchases || appData.inventory.purchases.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    let html = '';
    
    // Ordenar por fecha (más reciente primero)
    const sortedPurchases = [...appData.inventory.purchases].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedPurchases.forEach(purchase => {
        const ingredientCount = purchase.items.length;
        const totalQuantity = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
        
        html += `<tr>
            <td>${purchase.id.substring(0, 8)}...</td>
            <td>${purchase.supplier}</td>
            <td>${ingredientCount} ingredientes</td>
            <td>${totalQuantity.toFixed(2)}</td>
            <td>$${purchase.total.toFixed(2)}</td>
            <td>${formatDate(purchase.date)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewPurchaseDetail('${purchase.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePurchase('${purchase.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

function openPurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    const form = document.getElementById('purchaseForm');
    
    if (form) form.reset();
    const purchaseDate = document.getElementById('purchaseDate');
    if (purchaseDate) purchaseDate.value = new Date().toISOString().slice(0, 16);
    
    // Inicializar con un item vacío
    const purchaseItemsContainer = document.getElementById('purchaseItemsContainer');
    if (purchaseItemsContainer) purchaseItemsContainer.innerHTML = '';
    addPurchaseItem();
    
    if (modal) modal.classList.add('active');
    updatePurchaseSummary();
}

function addPurchaseItem() {
    const container = document.getElementById('purchaseItemsContainer');
    if (!container) return;
    
    const itemId = `item-${Date.now()}`;
    
    const itemHTML = `
        <div class="purchase-item" id="${itemId}">
            <div class="purchase-item-row">
                <select class="purchase-ingredient-select form-control" required onchange="updatePurchaseItemInfo('${itemId}')">
                    <option value="">Selecciona ingrediente</option>
                    ${appData.inventory.ingredients.map(ing => 
                        `<option value="${ing.id}">${ing.name} (${ing.unit})</option>`
                    ).join('')}
                </select>
                <input type="number" class="purchase-quantity form-control" min="0.01" step="0.01" 
                       placeholder="Cantidad" required oninput="updatePurchaseItemTotal('${itemId}')">
                <input type="number" class="purchase-unit-cost form-control" min="0" step="0.01" 
                       placeholder="Costo unitario" required oninput="updatePurchaseItemTotal('${itemId}')">
                <button type="button" class="btn btn-sm btn-danger remove-purchase-item" 
                        onclick="removePurchaseItem(this)">X</button>
            </div>
            <div class="purchase-item-info">
                <span class="item-name"></span>
                <span class="item-total">Total: $0.00</span>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    updatePurchaseSummary();
}

function removePurchaseItem(button) {
    const item = button.closest('.purchase-item');
    if (item) {
        item.remove();
        updatePurchaseSummary();
    }
}

function updatePurchaseItemInfo(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;
    
    const select = item.querySelector('.purchase-ingredient-select');
    const ingredientId = select.value;
    const ingredient = appData.inventory.ingredients.find(i => i.id === ingredientId);
    
    if (ingredient) {
        const infoDiv = item.querySelector('.purchase-item-info');
        if (infoDiv) {
            const itemName = infoDiv.querySelector('.item-name');
            if (itemName) itemName.textContent = ingredient.name;
        }
        
        // Establecer costo sugerido
        const costInput = item.querySelector('.purchase-unit-cost');
        if (costInput && (!costInput.value || parseFloat(costInput.value) === 0)) {
            costInput.value = ingredient.cost;
            updatePurchaseItemTotal(itemId);
        }
    }
    
    updatePurchaseSummary();
}

function updatePurchaseItemTotal(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;
    
    const quantity = parseFloat(item.querySelector('.purchase-quantity').value) || 0;
    const unitCost = parseFloat(item.querySelector('.purchase-unit-cost').value) || 0;
    const total = quantity * unitCost;
    
    const infoDiv = item.querySelector('.purchase-item-info');
    if (infoDiv) {
        const itemTotal = infoDiv.querySelector('.item-total');
        if (itemTotal) itemTotal.textContent = `Total: $${total.toFixed(2)}`;
    }
    
    updatePurchaseSummary();
}

function updatePurchaseSummary() {
    let subtotal = 0;
    
    document.querySelectorAll('.purchase-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.purchase-quantity').value) || 0;
        const unitCost = parseFloat(item.querySelector('.purchase-unit-cost').value) || 0;
        subtotal += quantity * unitCost;
    });
    
    const iva = subtotal * 0.16; // 16% IVA
    const total = subtotal + iva;
    
    const purchaseSubtotal = document.getElementById('purchaseSubtotal');
    const purchaseIva = document.getElementById('purchaseIva');
    const purchaseTotal = document.getElementById('purchaseTotal');
    
    if (purchaseSubtotal) purchaseSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (purchaseIva) purchaseIva.textContent = `$${iva.toFixed(2)}`;
    if (purchaseTotal) purchaseTotal.textContent = `$${total.toFixed(2)}`;
}

function savePurchase(e) {
    e.preventDefault();
    
    const supplier = document.getElementById('purchaseSupplier').value;
    const date = document.getElementById('purchaseDate').value;
    
    if (!supplier || !date) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Recolectar items
    const items = [];
    let isValid = true;
    
    document.querySelectorAll('.purchase-item').forEach(item => {
        const ingredientId = item.querySelector('.purchase-ingredient-select').value;
        const quantity = parseFloat(item.querySelector('.purchase-quantity').value);
        const unitCost = parseFloat(item.querySelector('.purchase-unit-cost').value);
        
        if (!ingredientId || isNaN(quantity) || quantity <= 0 || isNaN(unitCost) || unitCost <= 0) {
            isValid = false;
            return;
        }
        
        ensureInventoryStructure();
        
        const ingredient = appData.inventory.ingredients.find(i => i.id === ingredientId);
        if (!ingredient) {
            isValid = false;
            return;
        }
        
        items.push({
            ingredientId,
            ingredientName: ingredient.name,
            quantity,
            unit: ingredient.unit,
            unitCost,
            total: quantity * unitCost
        });
    });
    
    if (!isValid || items.length === 0) {
        showNotification('Por favor, complete todos los items correctamente', 'error');
        return;
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    
    const purchase = {
        id: generateId(),
        supplier,
        date: new Date(date).toISOString(),
        items,
        subtotal,
        iva,
        total
    };
    
    ensureInventoryStructure();
    
    // Registrar compra
    appData.inventory.purchases.push(purchase);
    
    // Actualizar stock de ingredientes y costo
    items.forEach(item => {
        const ingredient = appData.inventory.ingredients.find(i => i.id === item.ingredientId);
        if (ingredient) {
            ingredient.stock += item.quantity;
            // Actualizar último costo
            ingredient.cost = item.unitCost;
            ingredient.lastUpdated = new Date().toISOString();
        }
    });
    
    saveAppData();
    renderIngredients();
    renderPurchases();
    updateInventorySummary();
    closeModal(document.getElementById('purchaseModal'));
    showNotification(`Compra registrada correctamente. Stock actualizado.`);
}

function viewPurchaseDetail(purchaseId) {
    const purchase = appData.inventory.purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    let detailHTML = `
        <div class="purchase-detail">
            <h3>Compra #${purchase.id.substring(0, 8)}</h3>
            <p><strong>Proveedor:</strong> ${purchase.supplier}</p>
            <p><strong>Fecha:</strong> ${formatDate(purchase.date)}</p>
            
            <h4>Items comprados:</h4>
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Cantidad</th>
                        <th>Costo Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    purchase.items.forEach(item => {
        detailHTML += `
            <tr>
                <td>${item.ingredientName}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>$${item.unitCost.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    detailHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 20px;">
                <p><strong>Subtotal:</strong> $${purchase.subtotal.toFixed(2)}</p>
                <p><strong>IVA (16%):</strong> $${purchase.iva.toFixed(2)}</p>
                <p><strong>Total:</strong> $${purchase.total.toFixed(2)}</p>
            </div>
        </div>
    `;
    
    // Mostrar en un modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Detalle de Compra</h2>
                <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal').remove()">X</button>
            </div>
            <div class="modal-body">
                ${detailHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function deletePurchase(purchaseId) {
    if (!confirm('¿Está seguro de eliminar esta compra? Esta acción revertirá el stock agregado.')) {
        return;
    }
    
    const purchase = appData.inventory.purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    // Revertir stock
    purchase.items.forEach(item => {
        const ingredient = appData.inventory.ingredients.find(i => i.id === item.ingredientId);
        if (ingredient) {
            ingredient.stock -= item.quantity;
            if (ingredient.stock < 0) ingredient.stock = 0;
        }
    });
    
    // Eliminar compra
    appData.inventory.purchases = appData.inventory.purchases.filter(p => p.id !== purchaseId);
    
    saveAppData();
    renderPurchases();
    renderIngredients();
    updateInventorySummary();
    showNotification('Compra eliminada y stock revertido');
}

// ========== FUNCIONES DE ÓRDENES DE COMPRA POR PROVEEDOR ==========

function openPurchaseOrderModal() {
    const modal = document.getElementById('purchaseOrderModal');
    
    // Resetear datos
    currentPurchaseItems = {};
    currentPurchaseSupplierId = null;
    
    // Renderizar ingredientes para compra
    renderPurchaseIngredients();
    
    if (modal) modal.classList.add('active');
}

function renderPurchaseIngredients() {
    const ingredientsGrid = elements.purchaseIngredientsGrid;
    if (!ingredientsGrid) return;
    
    ensureInventoryStructure();
    
    if (appData.inventory.ingredients.length === 0) {
        ingredientsGrid.innerHTML = '<p>No hay ingredientes disponibles. Agrega ingredientes primero.</p>';
        return;
    }
    
    let html = '';
    appData.inventory.ingredients.forEach(ingredient => {
        const quantity = currentPurchaseItems[ingredient.id] ? currentPurchaseItems[ingredient.id].quantity : 0;
        const isSelected = quantity > 0;
        const isLowStock = ingredient.stock <= ingredient.minStock;
        const stockClass = isLowStock ? 'low-stock' : '';
        
        // Obtener proveedores disponibles
        const availableSuppliers = ingredient.suppliers && ingredient.suppliers.length > 0
            ? ingredient.suppliers.map(supplierId => {
                const supplier = getSupplierById(supplierId);
                return supplier ? supplier.name : '';
            }).filter(name => name).join(', ')
            : 'Sin proveedor';
        
        html += `<div class="ingredient-card ${isSelected ? 'selected' : ''} ${stockClass}" data-id="${ingredient.id}">
            <div class="ingredient-img">
                <i class="fas fa-box"></i>
            </div>
            <div class="ingredient-info">
                <div class="ingredient-name">${ingredient.name}</div>
                <div class="ingredient-details">
                    <div>Stock: ${ingredient.stock} ${ingredient.unit}</div>
                    <div>Mínimo: ${ingredient.minStock} ${ingredient.unit}</div>
                    <div>Proveedores: ${availableSuppliers}</div>
                </div>
                <div class="quantity-control" style="margin-top: 10px;">
                    <button class="quantity-btn" onclick="decreasePurchaseIngredientQuantity('${ingredient.id}')" ${quantity === 0 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${quantity}" min="0" 
                           onchange="updatePurchaseIngredientQuantityManual('${ingredient.id}', this.value)"
                           style="width: 60px; text-align: center;">
                    <button class="quantity-btn" onclick="increasePurchaseIngredientQuantity('${ingredient.id}')">+</button>
                </div>
            </div>
        </div>`;
    });
    
    ingredientsGrid.innerHTML = html;
    updatePurchaseSelectedIngredients();
}

function increasePurchaseIngredientQuantity(ingredientId) {
    if (!currentPurchaseItems[ingredientId]) {
        currentPurchaseItems[ingredientId] = { ingredientId, quantity: 0 };
    }
    currentPurchaseItems[ingredientId].quantity++;
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
}

function decreasePurchaseIngredientQuantity(ingredientId) {
    if (currentPurchaseItems[ingredientId] && currentPurchaseItems[ingredientId].quantity > 0) {
        currentPurchaseItems[ingredientId].quantity--;
        if (currentPurchaseItems[ingredientId].quantity === 0) {
            delete currentPurchaseItems[ingredientId];
        }
        updatePurchaseIngredientCard(ingredientId);
        updatePurchaseSelectedIngredients();
    }
}

function updatePurchaseIngredientQuantityManual(ingredientId, value) {
    const quantity = parseInt(value) || 0;
    
    if (quantity < 0) {
        showNotification('La cantidad no puede ser negativa', 'error');
        return;
    }
    
    if (quantity > 0) {
        if (!currentPurchaseItems[ingredientId]) {
            currentPurchaseItems[ingredientId] = { ingredientId, quantity: 0 };
        }
        currentPurchaseItems[ingredientId].quantity = quantity;
    } else {
        delete currentPurchaseItems[ingredientId];
    }
    
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
}

function updatePurchaseIngredientCard(ingredientId) {
    const card = document.querySelector(`.ingredient-card[data-id="${ingredientId}"]`);
    if (card) {
        const quantity = currentPurchaseItems[ingredientId] ? currentPurchaseItems[ingredientId].quantity : 0;
        const input = card.querySelector('.quantity-input');
        if (input) input.value = quantity;
        if (quantity > 0) card.classList.add('selected');
        else card.classList.remove('selected');
    }
}

function updatePurchaseSelectedIngredients() {
    const selectedContainer = elements.purchaseSelectedIngredients;
    if (!selectedContainer) return;
    
    const itemsWithQuantity = Object.values(currentPurchaseItems).filter(item => item.quantity > 0);
    
    if (itemsWithQuantity.length === 0) {
        selectedContainer.innerHTML = '<p>No hay ingredientes seleccionados. Agrega ingredientes a la orden.</p>';
        return;
    }
    
    let html = '';
    itemsWithQuantity.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (ingredient) {
            html += `<div class="ingredient-order-item">
                <div class="ingredient-order-info">
                    <div><strong>${ingredient.name}</strong></div>
                    <div>${item.quantity} ${ingredient.unit}</div>
                </div>
                <div>
                    <button class="btn btn-sm btn-danger" onclick="removePurchaseIngredientFromOrder('${item.ingredientId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }
    });
    
    selectedContainer.innerHTML = html;
}

function removePurchaseIngredientFromOrder(ingredientId) {
    delete currentPurchaseItems[ingredientId];
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
}

function generatePurchaseOrders(e) {
    e.preventDefault();
    
    const itemsWithQuantity = Object.values(currentPurchaseItems).filter(item => item.quantity > 0);
    
    if (itemsWithQuantity.length === 0) {
        showNotification('Por favor, seleccione al menos un ingrediente', 'error');
        return;
    }
    
    // Agrupar ingredientes por proveedor
    const supplierGroups = {};
    
    itemsWithQuantity.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (!ingredient) return;
        
        // Determinar proveedor para este ingrediente
        let supplierId = ingredient.preferredSupplier;
        
        // Si no hay proveedor preferido, usar el primero de la lista
        if (!supplierId && ingredient.suppliers && ingredient.suppliers.length > 0) {
            supplierId = ingredient.suppliers[0];
        }
        
        // Si aún no hay proveedor, asignar a "Sin proveedor"
        if (!supplierId) {
            supplierId = 'sin-proveedor';
        }
        
        if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = {
                supplierId: supplierId,
                items: []
            };
        }
        
        supplierGroups[supplierId].items.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: item.quantity,
            unit: ingredient.unit,
            currentStock: ingredient.stock,
            minStock: ingredient.minStock
        });
    });
    
    // Crear órdenes de compra por proveedor
    Object.keys(supplierGroups).forEach(supplierId => {
        const group = supplierGroups[supplierId];
        
        let supplierName = 'Sin proveedor';
        let supplierPhone = '';
        
        if (supplierId !== 'sin-proveedor') {
            const supplier = getSupplierById(supplierId);
            if (supplier) {
                supplierName = supplier.name;
                supplierPhone = supplier.phone;
            }
        }
        
        const purchaseOrder = {
            id: generateId(),
            supplierId: supplierId,
            supplierName: supplierName,
            supplierPhone: supplierPhone,
            date: new Date().toISOString(),
            items: group.items,
            status: 'pending',
            notes: document.getElementById('purchaseOrderNotes').value || ''
        };
        
        ensureInventoryStructure();
        appData.inventory.purchaseOrders.push(purchaseOrder);
        
        // Generar PDF y WhatsApp para esta orden
        generatePurchaseOrderPDF(purchaseOrder);
        
        if (supplierPhone) {
            sendPurchaseOrderWhatsApp(purchaseOrder);
        }
    });
    
    saveAppData();
    renderPurchaseOrders();
    closeModal(document.getElementById('purchaseOrderModal'));
    showNotification(`Se generaron ${Object.keys(supplierGroups).length} órdenes de compra`);
}

function renderPurchaseOrders() {
    const tbody = elements.purchaseOrdersTableBody;
    const emptyState = document.getElementById('emptyPurchaseOrders');
    
    if (!tbody || !emptyState) return;
    
    ensureInventoryStructure();
    
    if (!appData.inventory.purchaseOrders || appData.inventory.purchaseOrders.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Ordenar por fecha (más reciente primero)
    const sortedOrders = [...appData.inventory.purchaseOrders].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    let html = '';
    sortedOrders.forEach(order => {
        const itemCount = order.items.length;
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const statusClass = `status-${order.status}`;
        const statusText = order.status === 'pending' ? 'Pendiente' : order.status === 'completed' ? 'Completada' : 'Cancelada';
        
        html += `<tr class="${statusClass}">
            <td>${order.id.substring(0, 8)}...</td>
            <td>${order.supplierName}</td>
            <td>${itemCount} ingredientes</td>
            <td>${totalQuantity.toFixed(2)}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${formatDate(order.date)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewPurchaseOrderDetail('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${order.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="openConfirmPurchaseModal('${order.id}')">
                    <i class="fas fa-check"></i> Confirmar
                </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="deletePurchaseOrder('${order.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

function viewPurchaseOrderDetail(orderId) {
    const order = appData.inventory.purchaseOrders.find(po => po.id === orderId);
    if (!order) return;
    
    let detailHTML = `
        <div class="purchase-order-detail">
            <h3>Orden de Compra #${order.id.substring(0, 8)}</h3>
            <p><strong>Proveedor:</strong> ${order.supplierName}</p>
            <p><strong>Teléfono:</strong> ${order.supplierPhone || 'No disponible'}</p>
            <p><strong>Fecha:</strong> ${formatDate(order.date)}</p>
            <p><strong>Estado:</strong> <span class="status status-${order.status}">${order.status === 'pending' ? 'Pendiente' : 'Completada'}</span></p>
            
            ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
            
            <h4>Ingredientes solicitados:</h4>
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    order.items.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        const currentStock = ingredient ? ingredient.stock : item.currentStock;
        const minStock = ingredient ? ingredient.minStock : item.minStock;
        
        detailHTML += `
            <tr>
                <td>${item.ingredientName}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${currentStock} ${item.unit}</td>
                <td>${minStock} ${item.unit}</td>
            </tr>
        `;
    });
    
    detailHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="generatePurchaseOrderPDF('${order.id}')">
                    <i class="fas fa-file-pdf"></i> Ver PDF
                </button>
                ${order.supplierPhone ? `
                <button class="btn btn-success" onclick="sendPurchaseOrderWhatsApp('${order.id}')">
                    <i class="fab fa-whatsapp"></i> Enviar WhatsApp
                </button>
                ` : ''}
                ${order.status === 'pending' ? `
                <button class="btn btn-success" onclick="openConfirmPurchaseModal('${order.id}')">
                    <i class="fas fa-check"></i> Confirmar Recepción
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Mostrar en un modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>Detalle de Orden de Compra</h2>
                <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal').remove()">X</button>
            </div>
            <div class="modal-body">
                ${detailHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generatePurchaseOrderPDF(orderId) {
    const order = appData.inventory.purchaseOrders.find(po => po.id === orderId);
    if (!order) return;
    
    // Obtener colores actuales del tema
    const colors = appData.settings.colors;
    const primaryColor = colors.primary;
    const secondaryColor = colors.secondary;
    const primaryDark = adjustColor(primaryColor, -20);
    
    // Formatear fecha más legible
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Generar ID más estético
    const shortOrderId = orderId.slice(-8).toUpperCase();
    const orderNumber = `OC-${shortOrderId}`;
    
    const pdfContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Orden de Compra ${orderNumber} - ${appData.business.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: #f8f9fa;
                    padding: 30px;
                }
                
                .purchase-order-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                
                /* Header */
                .purchase-order-header {
                    background: linear-gradient(135deg, ${primaryColor}, ${primaryDark});
                    color: white;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                }
                
                .purchase-order-header::before {
                    content: '';
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    width: 200px;
                    height: 200px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                }
                
                .business-info {
                    position: relative;
                    z-index: 2;
                }
                
                .business-name {
                    font-family: 'Poppins', sans-serif;
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    letter-spacing: -0.5px;
                }
                
                .business-tagline {
                    font-size: 16px;
                    opacity: 0.9;
                    margin-bottom: 25px;
                    font-weight: 300;
                }
                
                .contact-info {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .contact-item i {
                    font-size: 16px;
                }
                
                /* Order Info */
                .order-info-section {
                    background: white;
                    padding: 30px 40px;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .order-number {
                    font-family: 'Poppins', sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    color: ${primaryColor};
                    letter-spacing: 1px;
                }
                
                .order-status {
                    background: ${order.status === 'completed' ? '#10b981' : '#f59e0b'};
                    color: white;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .order-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }
                
                .detail-group h4 {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .detail-value {
                    font-size: 16px;
                    font-weight: 500;
                    color: #1e293b;
                }
                
                /* Items Table */
                .items-section {
                    padding: 30px 40px;
                }
                
                .section-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid ${secondaryColor};
                    display: inline-block;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                
                .items-table thead {
                    background: ${secondaryColor};
                    color: white;
                }
                
                .items-table th {
                    padding: 16px 20px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .items-table tbody tr {
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .items-table td {
                    padding: 16px 20px;
                    font-size: 15px;
                }
                
                .item-name {
                    font-weight: 500;
                    color: #1e293b;
                }
                
                .quantity, .unit {
                    text-align: center;
                }
                
                /* Footer */
                .purchase-order-footer {
                    background: linear-gradient(135deg, ${secondaryColor}, #003366);
                    color: white;
                    padding: 30px 40px;
                    text-align: center;
                }
                
                .footer-content {
                    position: relative;
                    z-index: 2;
                }
                
                .footer-logo {
                    font-family: 'Poppins', sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    letter-spacing: 1px;
                }
                
                .instructions {
                    margin-top: 20px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    text-align: left;
                }
                
                .instructions h4 {
                    margin-bottom: 10px;
                    font-family: 'Poppins', sans-serif;
                }
                
                .instructions ul {
                    padding-left: 20px;
                    margin-bottom: 0;
                }
                
                .instructions li {
                    margin-bottom: 5px;
                }
                
                /* Watermark */
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 100px;
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.03);
                    z-index: 1;
                    white-space: nowrap;
                    user-select: none;
                    pointer-events: none;
                }
                
                /* Print styles */
                @media print {
                    body {
                        padding: 0;
                        background: white;
                    }
                    
                    .purchase-order-container {
                        box-shadow: none;
                        border-radius: 0;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body>
            <div class="purchase-order-container">
                <!-- Header -->
                <div class="purchase-order-header">
                    <div class="watermark">${appData.business.name.toUpperCase()}</div>
                    <div class="business-info">
                        <h1 class="business-name">${appData.business.name}</h1>
                        <p class="business-tagline">Orden de Compra</p>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-phone-alt"></i>
                                <span>${appData.business.whatsapp}</span>
                            </div>
                            ${appData.business.address ? `
                            <div class="contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${appData.business.address}</span>
                            </div>
                            ` : ''}
                            ${appData.business.rfc ? `
                            <div class="contact-item">
                                <i class="fas fa-id-card"></i>
                                <span>RFC: ${appData.business.rfc}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Order Info -->
                <div class="order-info-section">
                    <div class="order-header">
                        <div>
                            <div class="order-number">${orderNumber}</div>
                            <div style="color: #64748b; font-size: 14px; margin-top: 5px;">${formattedDate}</div>
                        </div>
                        <div class="order-status">
                            ${order.status === 'completed' ? 'COMPLETADA' : 'PENDIENTE'}
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <div class="detail-group">
                            <h4>Proveedor</h4>
                            <div class="detail-value">${order.supplierName}</div>
                            ${order.supplierPhone ? `<div style="color: #64748b; font-size: 14px; margin-top: 4px;">${order.supplierPhone}</div>` : ''}
                        </div>
                        
                        <div class="detail-group">
                            <h4>Para atención de</h4>
                            <div class="detail-value">Departamento de Compras</div>
                            <div style="color: #64748b; font-size: 14px; margin-top: 4px;">
                                Favor de entregar según especificaciones
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Items -->
                <div class="items-section">
                    <h3 class="section-title">Materiales Solicitados</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Cantidad</th>
                                <th>Unidad</th>
                                <th>Especificaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => {
                                return `
                                    <tr>
                                        <td class="item-name">${item.ingredientName}</td>
                                        <td class="quantity">${item.quantity}</td>
                                        <td class="unit">${item.unit}</td>
                                        <td>Entrega a más tardar 48 horas después de confirmación</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    
                    ${order.notes ? `
                    <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 10px; border-left: 4px solid ${primaryColor};">
                        <h4 style="color: #1e293b; margin-bottom: 10px;">Notas Especiales:</h4>
                        <p style="margin: 0; color: #64748b;">${order.notes}</p>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Footer -->
                <div class="purchase-order-footer">
                    <div class="footer-content">
                        <div class="footer-logo">${appData.business.name}</div>
                        
                        <div class="instructions">
                            <h4>Instrucciones de Entrega:</h4>
                            <ul>
                                <li>Favor de confirmar recepción de esta orden</li>
                                <li>Notificar cualquier inconveniente con disponibilidad</li>
                                <li>Entregar factura junto con el material</li>
                                <li>Máximo 48 horas para entrega después de confirmación</li>
                                <li>Contactar para cualquier duda: ${appData.business.whatsapp}</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 20px; font-size: 12px; opacity: 0.6;">
                            Documento generado automáticamente • ${new Date().toLocaleDateString('es-MX')}
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    // Auto-imprimir al cargar
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;
    
    // Abrir en nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    showNotification('PDF de orden de compra generado correctamente', 'success');
}

function sendPurchaseOrderWhatsApp(orderId) {
    const order = appData.inventory.purchaseOrders.find(po => po.id === orderId);
    if (!order || !order.supplierPhone) {
        showNotification('No hay número de teléfono para enviar WhatsApp', 'error');
        return;
    }
    
    // Formatear mensaje
    let message = `*ORDEN DE COMPRA ${order.id.substring(0, 8).toUpperCase()}*\n`;
    message += `*${appData.business.name}*\n\n`;
    message += `*Proveedor:* ${order.supplierName}\n`;
    message += `*Fecha:* ${formatDate(order.date)}\n\n`;
    message += `*Materiales solicitados:*\n`;
    
    order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.ingredientName}: ${item.quantity} ${item.unit}\n`;
    });
    
    if (order.notes) {
        message += `\n*Notas:* ${order.notes}\n`;
    }
    
    message += `\nFavor de confirmar recepción y disponibilidad.\n`;
    message += `Gracias.`;
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    const phone = order.supplierPhone.replace(/\D/g, ''); // Solo números
    
    // Crear enlace de WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    showNotification('WhatsApp preparado para enviar', 'success');
}

function openConfirmPurchaseModal(orderId) {
    const order = appData.inventory.purchaseOrders.find(po => po.id === orderId);
    if (!order) return;
    
    // Guardar ID de orden actual
    document.getElementById('confirmPurchaseOrderId').value = orderId;
    
    // Renderizar items para confirmación
    const itemsContainer = document.getElementById('confirmPurchaseItems');
    if (itemsContainer) {
        let html = '';
        order.items.forEach((item, index) => {
            const ingredient = getIngredientById(item.ingredientId);
            const currentStock = ingredient ? ingredient.stock : 0;
            
            html += `
                <div class="confirm-purchase-item">
                    <div class="confirm-item-info">
                        <h5>${item.ingredientName}</h5>
                        <div>Solicitado: ${item.quantity} ${item.unit}</div>
                        <div>Stock actual: ${currentStock} ${item.unit}</div>
                    </div>
                    <div class="confirm-item-controls">
                        <div class="form-group">
                            <label>Cantidad recibida:</label>
                            <input type="number" 
                                   class="form-control received-quantity" 
                                   data-ingredient-id="${item.ingredientId}"
                                   data-original-quantity="${item.quantity}"
                                   value="${item.quantity}"
                                   min="0" 
                                   step="0.01"
                                   required>
                            <small class="form-text text-muted">${item.unit}</small>
                        </div>
                        <div class="form-group">
                            <label>Notas (opcional):</label>
                            <input type="text" 
                                   class="form-control received-notes"
                                   data-ingredient-id="${item.ingredientId}"
                                   placeholder="Ej: Cambio de unidad, producto diferente">
                        </div>
                    </div>
                </div>
            `;
        });
        
        itemsContainer.innerHTML = html;
    }
    
    // Mostrar modal
    const modal = document.getElementById('confirmPurchaseModal');
    if (modal) modal.classList.add('active');
}

function confirmPurchase(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('confirmPurchaseOrderId').value;
    const order = appData.inventory.purchaseOrders.find(po => po.id === orderId);
    if (!order) return;
    
    // Recolectar cantidades recibidas
    const receivedItems = [];
    const receivedQuantities = document.querySelectorAll('.received-quantity');
    const receivedNotes = document.querySelectorAll('.received-notes');
    
    let isValid = true;
    
    receivedQuantities.forEach(input => {
        const ingredientId = input.getAttribute('data-ingredient-id');
        const originalQuantity = parseFloat(input.getAttribute('data-original-quantity'));
        const receivedQuantity = parseFloat(input.value) || 0;
        
        if (isNaN(receivedQuantity) || receivedQuantity < 0) {
            isValid = false;
            return;
        }
        
        // Encontrar notas correspondientes
        let notes = '';
        receivedNotes.forEach(noteInput => {
            if (noteInput.getAttribute('data-ingredient-id') === ingredientId) {
                notes = noteInput.value || '';
            }
        });
        
        receivedItems.push({
            ingredientId,
            originalQuantity,
            receivedQuantity,
            notes
        });
    });
    
    if (!isValid) {
        showNotification('Por favor, ingrese cantidades válidas', 'error');
        return;
    }
    
    // Actualizar inventario
    receivedItems.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (ingredient) {
            // Convertir unidades si es necesario
            const quantityToAdd = convertQuantityIfNeeded(
                item.receivedQuantity, 
                order.items.find(i => i.ingredientId === item.ingredientId)?.unit || ingredient.unit,
                ingredient.unit
            );
            
            ingredient.stock += quantityToAdd;
            ingredient.lastUpdated = new Date().toISOString();
            
            // Registrar en el log de compras
            const purchaseLog = {
                orderId: orderId,
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                quantity: quantityToAdd,
                unit: ingredient.unit,
                cost: ingredient.cost,
                date: new Date().toISOString(),
                notes: item.notes
            };
            
            ensureInventoryStructure();
            if (!appData.inventory.purchases) {
                appData.inventory.purchases = [];
            }
            appData.inventory.purchases.push(purchaseLog);
        }
    });
    
    // Actualizar estado de la orden
    order.status = 'completed';
    order.completedDate = new Date().toISOString();
    order.receivedItems = receivedItems;
    
    saveAppData();
    
    // Actualizar vistas
    renderIngredients();
    renderPurchaseOrders();
    renderPurchases();
    updateInventorySummary();
    
    // Cerrar modal y mostrar notificación
    closeModal(document.getElementById('confirmPurchaseModal'));
    showNotification(`Orden de compra #${orderId.substring(0, 8)} confirmada. Inventario actualizado.`);
}

function convertQuantityIfNeeded(quantity, fromUnit, toUnit) {
    // Tabla de conversiones básicas
    const conversions = {
        'kg': { 'g': 1000, 'kg': 1 },
        'g': { 'kg': 0.001, 'g': 1 },
        'l': { 'ml': 1000, 'l': 1 },
        'ml': { 'l': 0.001, 'ml': 1 },
        'unidad': { 'unidad': 1 },
        'pieza': { 'pieza': 1 },
        'paquete': { 'paquete': 1 },
        'botella': { 'botella': 1 }
    };
    
    // Si las unidades son iguales, no hay conversión
    if (fromUnit === toUnit) {
        return quantity;
    }
    
    // Buscar conversión
    if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
        return quantity * conversions[fromUnit][toUnit];
    }
    
    // Si no hay conversión disponible, devolver la cantidad original
    console.warn(`No se encontró conversión de ${fromUnit} a ${toUnit}`);
    return quantity;
}

function deletePurchaseOrder(orderId) {
    if (!confirm('¿Está seguro de eliminar esta orden de compra?')) {
        return;
    }
    
    ensureInventoryStructure();
    appData.inventory.purchaseOrders = appData.inventory.purchaseOrders.filter(po => po.id !== orderId);
    
    saveAppData();
    renderPurchaseOrders();
    showNotification('Orden de compra eliminada');
}

function filterPurchaseOrders() {
    const searchInput = document.getElementById('searchPurchaseOrders');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#purchaseOrdersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ========== FUNCIONES DE ALERTAS ==========

function renderAlerts() {
    const container = document.getElementById('alertsList');
    const emptyState = document.getElementById('emptyAlerts');
    
    // Verificar que los elementos existan
    if (!container || !emptyState) return;
    
    // Verificar que inventory.alerts exista
    if (!appData.inventory || !appData.inventory.alerts || appData.inventory.alerts.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Ordenar por prioridad (alta primero) y fecha
    const sortedAlerts = [...appData.inventory.alerts].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || 
               new Date(b.date) - new Date(a.date);
    });
    
    let html = '';
    sortedAlerts.forEach(alert => {
        const priorityClass = `alert-${alert.priority}`;
        const icon = getAlertIcon(alert.type);
        
        html += `
            <div class="alert-item ${priorityClass}">
                <div class="alert-icon">${icon}</div>
                <div class="alert-content">
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-date">${formatDate(alert.date)}</div>
                </div>
                <div class="alert-actions">
                    ${alert.ingredientId ? 
                        `<button class="btn btn-sm btn-primary" onclick="quickRestock('${alert.ingredientId}')">
                            <i class="fas fa-shopping-cart"></i> Reabastecer
                        </button>` : ''}
                    ${alert.productId ? 
                        `<button class="btn btn-sm btn-info" onclick="manageRecipe('${alert.productId}')">
                            <i class="fas fa-utensils"></i> Crear Receta
                        </button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="dismissAlert('${alert.date}', '${alert.type}', '${alert.ingredientId || alert.productId}')">
                        <i class="fas fa-times"></i> Descartar
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getAlertIcon(type) {
    const icons = {
        'low_stock': '<i class="fas fa-exclamation-triangle"></i>',
        'out_of_stock': '<i class="fas fa-times-circle"></i>',
        'no_recipe': '<i class="fas fa-clipboard-question"></i>'
    };
    return icons[type] || '<i class="fas fa-bell"></i>';
}

function quickRestock(ingredientId) {
    const ingredient = appData.inventory.ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
        const suggestedAmount = ingredient.minStock * 2;
        const amount = prompt(`¿Cuánto ${ingredient.name} deseas agregar? (${ingredient.unit})`, suggestedAmount.toString());
        
        if (amount && !isNaN(parseFloat(amount))) {
            ingredient.stock += parseFloat(amount);
            saveAppData();
            updateInventorySummary();
            renderAlerts();
            showNotification(`${ingredient.name} reabastecido`);
        }
    }
}

function dismissAlert(date, type, targetId) {
    // Eliminar la alerta específica
    appData.inventory.alerts = appData.inventory.alerts.filter(alert => 
        !(alert.date === date && alert.type === type && 
          (alert.ingredientId === targetId || alert.productId === targetId))
    );
    
    saveAppData();
    renderAlerts();
}

// ========== FUNCIÓN PARA DESCONTAR INGREDIENTES AL PROCESAR ORDEN ==========

function checkStockForOrder(order) {
    ensureInventoryStructure();
    
    for (const item of order.items) {
        const product = appData.products.find(p => p.id === item.productId);
        if (!product) continue;
        
        // Usar función helper segura
        const recipe = getRecipeByProductId(item.productId);
        if (!recipe) continue;
        
        // Verificar que recipe.ingredients exista
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            continue;
        }
        
        for (const recipeIng of recipe.ingredients) {
            // Usar función helper segura
            const ingredient = getIngredientById(recipeIng.ingredientId);
            if (!ingredient) continue;
            
            const requiredQuantity = recipeIng.quantity * item.quantity;
            const effectiveQuantity = requiredQuantity * (1 + (recipeIng.wastePercentage || 0) / 100);
            
            if (ingredient.stock < effectiveQuantity) {
                return {
                    success: false,
                    message: `Falta ${ingredient.name} (necesitas ${effectiveQuantity.toFixed(2)} ${ingredient.unit}, tienes ${ingredient.stock} ${ingredient.unit})`
                };
            }
        }
    }
    
    return { success: true };
}

function deductIngredientsForOrder(order) {
    try {
        ensureInventoryStructure();
        
        let deductionLog = [];
        
        for (const item of order.items) {
            const product = appData.products.find(p => p.id === item.productId);
            if (!product) continue;
            
            // Usar función helper segura
            const recipe = getRecipeByProductId(item.productId);
            if (!recipe) {
                showNotification(`Advertencia: El producto "${product.name}" no tiene receta definida.`, 'warning');
                continue;
            }
            
            // Verificar que recipe.ingredients exista
            if (!recipe.ingredients || recipe.ingredients.length === 0) {
                continue;
            }
            
            for (const recipeIng of recipe.ingredients) {
                // Usar función helper segura
                const ingredient = getIngredientById(recipeIng.ingredientId);
                if (!ingredient) continue;
                
                // Calcular cantidad requerida
                const requiredQuantity = recipeIng.quantity * item.quantity;
                const effectiveQuantity = requiredQuantity * (1 + (recipeIng.wastePercentage || 0) / 100);
                
                // Redondear según la unidad
                const roundedQuantity = roundQuantityByUnit(effectiveQuantity, ingredient.unit);
                
                // Verificar stock suficiente
                if (ingredient.stock < roundedQuantity) {
                    return {
                        success: false,
                        message: `Stock insuficiente de ${ingredient.name}. Necesitas ${roundedQuantity} ${ingredient.unit}, tienes ${ingredient.stock} ${ingredient.unit}`
                    };
                }
                
                // Descontar
                const oldStock = ingredient.stock;
                ingredient.stock -= roundedQuantity;
                
                // Registrar en el log
                deductionLog.push({
                    ingredient: ingredient.name,
                    oldStock: oldStock,
                    newStock: ingredient.stock,
                    deducted: roundedQuantity,
                    unit: ingredient.unit
                });
                
                ingredient.lastUpdated = new Date().toISOString();
                
                // Si queda poco stock, mostrar advertencia
                if (ingredient.stock <= ingredient.minStock) {
                    showNotification(`Advertencia: ${ingredient.name} tiene stock bajo (${ingredient.stock} ${ingredient.unit})`, 'warning');
                }
            }
        }
        
        // Guardar log de consumo
        if (deductionLog.length > 0) {
            saveConsumptionLog(order.id, deductionLog);
        }
        
        return { success: true, log: deductionLog };
        
    } catch (error) {
        console.error('Error al descontar ingredientes:', error);
        return { success: false, message: 'Error al procesar el descuento de ingredientes' };
    }
}

function roundQuantityByUnit(quantity, unit) {
    // Definir precisión según la unidad
    const precisionMap = {
        'kg': 3,      // 3 decimales para kilos
        'g': 0,       // 0 decimales para gramos
        'l': 3,       // 3 decimales para litros
        'ml': 0,      // 0 decimales para mililitros
        'unidad': 0,  // 0 decimales para unidades
        'pieza': 0,   // 0 decimales para piezas
        'paquete': 0, // 0 decimales para paquetes
        'botella': 0  // 0 decimales para botellas
    };
    
    const precision = precisionMap[unit] || 2; // Por defecto 2 decimales
    return parseFloat(quantity.toFixed(precision));
}

function saveConsumptionLog(orderId, deductionLog) {
    ensureInventoryStructure();
    
    // Crear o inicializar el array de logs
    if (!appData.inventory.consumptionLogs) {
        appData.inventory.consumptionLogs = [];
    }
    
    const logEntry = {
        orderId: orderId,
        date: new Date().toISOString(),
        deductions: deductionLog,
        totalItems: deductionLog.length
    };
    
    appData.inventory.consumptionLogs.push(logEntry);
    saveAppData();
}

function generateConsumptionReport(order) {
    const consumptionLog = appData.inventory.consumptionLogs?.find(log => log.orderId === order.id);
    
    if (!consumptionLog) return;
    
    let reportHTML = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <h4 style="margin-top: 0;">📊 Consumo de Inventario</h4>
            <p>Orden #${order.id}</p>
            <table style="width: 100%; font-size: 14px;">
                <thead>
                    <tr style="background-color: #e9ecef;">
                        <th style="padding: 8px; text-align: left;">Ingrediente</th>
                        <th style="padding: 8px; text-align: right;">Consumido</th>
                        <th style="padding: 8px; text-align: right;">Stock Anterior</th>
                        <th style="padding: 8px; text-align: right;">Stock Actual</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    consumptionLog.deductions.forEach(item => {
        reportHTML += `
            <tr>
                <td style="padding: 8px;">${item.ingredient}</td>
                <td style="padding: 8px; text-align: right;">${item.deducted} ${item.unit}</td>
                <td style="padding: 8px; text-align: right;">${item.oldStock} ${item.unit}</td>
                <td style="padding: 8px; text-align: right;">${item.newStock} ${item.unit}</td>
            </tr>
        `;
    });
    
    reportHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    // Mostrar en una notificación emergente
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification info';
    notificationDiv.innerHTML = reportHTML;
    notificationDiv.style.position = 'fixed';
    notificationDiv.style.bottom = '20px';
    notificationDiv.style.right = '20px';
    notificationDiv.style.zIndex = '9999';
    notificationDiv.style.maxWidth = '500px';
    notificationDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    document.body.appendChild(notificationDiv);
    
    // Auto-eliminar después de 10 segundos
    setTimeout(() => {
        if (notificationDiv.parentNode) {
            notificationDiv.remove();
        }
    }, 10000);
}

function viewRecipe(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) return;
    
    // Usar función helper segura
    const recipe = getRecipeByProductId(productId);
    
    let modalHTML = `
        <div class="modal active">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>📋 Receta: ${product.name}</h2>
                    <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal').remove()">X</button>
                </div>
                <div class="modal-body">
    `;
    
    // Verificar que recipe y recipe.ingredients existan
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        modalHTML += `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-utensils" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>No hay receta definida</h3>
                <p>Este producto no tiene una receta configurada.</p>
                <button class="btn btn-primary" onclick="manageRecipe('${productId}'); this.closest('.modal').remove();">
                    <i class="fas fa-plus"></i> Crear Receta
                </button>
            </div>
        `;
    } else {
        modalHTML += `
            <div style="margin-bottom: 20px;">
                <p><strong>Producto:</strong> ${product.name}</p>
                <p><strong>Precio:</strong> $${product.price.toFixed(2)}</p>
            </div>
            
            <h4>Ingredientes:</h4>
            <table style="width: 100%;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 10px; text-align: left;">Ingrediente</th>
                        <th style="padding: 10px; text-align: right;">Cantidad por unidad</th>
                        <th style="padding: 10px; text-align: right;">Merma</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalCost = 0;
        recipe.ingredients.forEach(ing => {
            // Usar función helper segura
            const ingredient = getIngredientById(ing.ingredientId);
            if (ingredient) {
                const effectiveQuantity = ing.quantity * (1 + (ing.wastePercentage || 0) / 100);
                const cost = effectiveQuantity * ingredient.cost;
                totalCost += cost;
                
                modalHTML += `
                    <tr>
                        <td style="padding: 8px;">${ingredient.name}</td>
                        <td style="padding: 8px; text-align: right;">${ing.quantity} ${ingredient.unit}</td>
                        <td style="padding: 8px; text-align: right;">${ing.wastePercentage || 0}%</td>
                    </tr>
                `;
            }
        });
        
        modalHTML += `
                </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                <p><strong>Costo total de ingredientes por unidad:</strong> $${totalCost.toFixed(2)}</p>
                <p><strong>Margen:</strong> ${product.price > 0 ? ((product.price - totalCost) / product.price * 100).toFixed(1) : 0}%</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-secondary" onclick="manageRecipe('${productId}'); this.closest('.modal').remove();">
                    <i class="fas fa-edit"></i> Editar Receta
                </button>
            </div>
        `;
    }
    
    modalHTML += `
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ========== FUNCIONES UTILITARIAS ==========

function exportInventoryData() {
    try {
        ensureInventoryStructure();
        const inventoryData = {
            ingredients: appData.inventory.ingredients,
            recipes: appData.inventory.recipes,
            purchases: appData.inventory.purchases,
            purchaseOrders: appData.inventory.purchaseOrders,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(inventoryData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = `inventario-snack-orders-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showNotification('Datos de inventario exportados correctamente');
    } catch (error) {
        console.error('Error al exportar inventario:', error);
        showNotification('Error al exportar inventario', 'error');
    }
}

// ========== EXPORTAR FUNCIONES AL SCOPE GLOBAL ==========

window.editProduct = function(productId) { openProductModal(productId); };
window.deleteProduct = deleteProduct;
window.editCustomer = function(customerId) { openCustomerModal(customerId); };
window.deleteCustomer = deleteCustomer;
window.editSupplier = function(supplierId) { openSupplierModal(supplierId); };
window.deleteSupplier = deleteSupplier;
window.viewOrderDetail = viewOrderDetail;
window.completeOrder = completeOrder;
window.cancelOrder = cancelOrder;
window.deleteOrder = deleteOrder;
window.generateOrderPDF = generateOrderPDF;
window.increaseProductQuantity = increaseProductQuantity;
window.decreaseProductQuantity = decreaseProductQuantity;
window.removeProductFromOrder = removeProductFromOrder;
window.generateReport = generateReport;
window.exportReport = exportReport;
window.printReport = printReport;
window.selectColorTheme = selectColorTheme;
window.applyCustomColors = applyCustomColors;
window.editIngredient = function(ingredientId) { openIngredientModal(ingredientId); };
window.deleteIngredient = deleteIngredient;
window.addStockQuick = addStockQuick;
window.removePurchaseItem = removePurchaseItem;
window.updatePurchaseItemInfo = updatePurchaseItemInfo;
window.updatePurchaseItemTotal = updatePurchaseItemTotal;
window.viewPurchaseDetail = viewPurchaseDetail;
window.deletePurchase = deletePurchase;
window.loadRecipe = loadRecipe;
window.removeIngredientFromRecipe = removeIngredientFromRecipe;
window.quickRestock = quickRestock;
window.dismissAlert = dismissAlert;
window.manageRecipe = manageRecipe;
window.viewRecipe = viewRecipe;
window.increasePurchaseIngredientQuantity = increasePurchaseIngredientQuantity;
window.decreasePurchaseIngredientQuantity = decreasePurchaseIngredientQuantity;
window.removePurchaseIngredientFromOrder = removePurchaseIngredientFromOrder;
window.updatePurchaseIngredientQuantityManual = updatePurchaseIngredientQuantityManual;
window.viewPurchaseOrderDetail = viewPurchaseOrderDetail;
window.generatePurchaseOrderPDF = generatePurchaseOrderPDF;
window.sendPurchaseOrderWhatsApp = sendPurchaseOrderWhatsApp;
window.openConfirmPurchaseModal = openConfirmPurchaseModal;
window.deletePurchaseOrder = deletePurchaseOrder;