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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Snack Orders System...');
    
    // Inicializar appData global
    window.appData = window.appData || {};
    
    // Cargar datos desde localStorage
    loadAppData();
    
    // Configurar listeners de UI
    setupEventListeners();
    
    // Asegurar estructura del inventario
    ensureInventoryStructure();
    
    // Renderizar todos los datos
    renderAllData();
    
    // Verificar primer uso
    checkFirstUse();
    
    // Aplicar tema de colores
    if (window.appData && window.appData.settings && window.appData.settings.colors) {
        applyColorTheme();
    }
    
    // Inicializar módulos
    initInventoryModule();
    initSuppliersModule();
    
    // Actualizar resumen de inventario
    updateInventorySummary();

        // Inicializar medidor de almacenamiento cuando se abre configuración
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', function() {
            // ... código existente ...
            
            // Actualizar medidor de almacenamiento
            setTimeout(() => {
                updateStorageMeter();
            }, 100);
        });
    }
    
    console.log('Sistema inicializado correctamente');
});