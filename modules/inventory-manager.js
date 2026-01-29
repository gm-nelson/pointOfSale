// ========== FUNCIONES DE INVENTARIO ==========

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
        
        // Obtener nombres de proveedores - FUNCIÓN MEJORADA
        const supplierNames = getIngredientSuppliersText(ingredient);
        
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

// Función auxiliar para obtener texto de proveedores de un ingrediente
function getIngredientSuppliersText(ingredient) {
    if (!ingredient.suppliers || ingredient.suppliers.length === 0) {
        return 'Sin proveedor';
    }
    
    const supplierNames = ingredient.suppliers.map(supplierId => {
        const supplier = getSupplierById(supplierId);
        return supplier ? supplier.name : `Proveedor ${supplierId.substring(0, 4)}`;
    });
    
    return supplierNames.join(', ');
}

// Función auxiliar para editar ingrediente
function editIngredient(ingredientId) {
    openIngredientModal(ingredientId);
}

// Función auxiliar para obtener proveedor por ID
function getSupplierById(supplierId) {
    if (!appData.suppliers || !Array.isArray(appData.suppliers)) return null;
    return appData.suppliers.find(s => s.id === supplierId);
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
            const locationInput = document.getElementById('ingredientLocation');
            if (locationInput) locationInput.value = ingredient.location || '';
            
            // Crear o limpiar el contenedor de selección de proveedores
            const suppliersContainer = document.getElementById('suppliersSelector');
            if (suppliersContainer) {
                suppliersContainer.innerHTML = '';
                
                // Crear checkboxes para cada proveedor
                if (appData.suppliers && appData.suppliers.length > 0) {
                    appData.suppliers.forEach(supplier => {
                        const isSelected = ingredient.suppliers && ingredient.suppliers.includes(supplier.id);
                        const checkboxId = `supplier-checkbox-${supplier.id}`;
                        
                        const checkboxHTML = `
                            <div class="supplier-checkbox">
                                <input type="checkbox" 
                                       id="${checkboxId}" 
                                       value="${supplier.id}"
                                       ${isSelected ? 'checked' : ''}
                                       class="supplier-checkbox-input">
                                <label for="${checkboxId}" class="supplier-checkbox-label">
                                    ${supplier.name}
                                </label>
                            </div>
                        `;
                        
                        suppliersContainer.insertAdjacentHTML('beforeend', checkboxHTML);
                    });
                } else {
                    suppliersContainer.innerHTML = '<p class="text-muted">No hay proveedores registrados. Agrega primero algunos proveedores.</p>';
                }
            }
            
            // Cargar proveedor preferido
            const preferredSupplierSelect = document.getElementById('ingredientPreferredSupplier');
            if (preferredSupplierSelect) {
                // Limpiar opciones
                preferredSupplierSelect.innerHTML = '<option value="">Selecciona un proveedor preferido</option>';
                
                // Agregar opción "Sin proveedor preferido"
                preferredSupplierSelect.innerHTML += '<option value="">Sin proveedor preferido</option>';
                
                // Agregar proveedores
                if (appData.suppliers && appData.suppliers.length > 0) {
                    appData.suppliers.forEach(supplier => {
                        const option = document.createElement('option');
                        option.value = supplier.id;
                        option.textContent = supplier.name;
                        if (ingredient.preferredSupplier === supplier.id) {
                            option.selected = true;
                        }
                        preferredSupplierSelect.appendChild(option);
                    });
                }
            }
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuevo Ingrediente';
        if (form) form.reset();
        const ingredientIdField = document.getElementById('ingredientId');
        if (ingredientIdField) ingredientIdField.value = '';
        
        // Limpiar checkboxes para nuevo ingrediente
        const suppliersContainer = document.getElementById('suppliersSelector');
        if (suppliersContainer) {
            suppliersContainer.innerHTML = '';
            
            if (appData.suppliers && appData.suppliers.length > 0) {
                appData.suppliers.forEach(supplier => {
                    const checkboxId = `supplier-checkbox-${supplier.id}`;
                    
                    const checkboxHTML = `
                        <div class="supplier-checkbox">
                            <input type="checkbox" 
                                   id="${checkboxId}" 
                                   value="${supplier.id}"
                                   class="supplier-checkbox-input">
                            <label for="${checkboxId}" class="supplier-checkbox-label">
                                ${supplier.name}
                            </label>
                        </div>
                    `;
                    
                    suppliersContainer.insertAdjacentHTML('beforeend', checkboxHTML);
                });
            } else {
                suppliersContainer.innerHTML = '<p class="text-muted">No hay proveedores registrados. Agrega primero algunos proveedores.</p>';
            }
        }
        
        // Limpiar proveedor preferido
        const preferredSupplierSelect = document.getElementById('ingredientPreferredSupplier');
        if (preferredSupplierSelect) {
            preferredSupplierSelect.innerHTML = '<option value="">Selecciona un proveedor preferido</option>';
            preferredSupplierSelect.innerHTML += '<option value="" selected>Sin proveedor preferido</option>';
            
            if (appData.suppliers && appData.suppliers.length > 0) {
                appData.suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    preferredSupplierSelect.appendChild(option);
                });
            }
        }
    }
    
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
    const locationInput = document.getElementById('ingredientLocation');
    const preferredSupplierSelect = document.getElementById('ingredientPreferredSupplier');
    
    const location = locationInput ? locationInput.value : '';
    const preferredSupplier = preferredSupplierSelect ? preferredSupplierSelect.value : '';
    
    // Obtener proveedores seleccionados de los checkboxes
    const selectedSuppliers = [];
    const checkboxes = document.querySelectorAll('.supplier-checkbox-input:checked');
    checkboxes.forEach(checkbox => {
        selectedSuppliers.push(checkbox.value);
    });
    
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
        location: location || '',
        suppliers: selectedSuppliers, // Array de IDs de proveedores seleccionados
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
    // Get DOM elements with null checks
    const tbody = document.getElementById('purchasesTableBody');
    const emptyState = document.getElementById('emptyPurchases');
    
    // Exit if DOM elements don't exist
    if (!tbody || !emptyState) {
        console.warn('renderPurchases: Required DOM elements not found');
        return;
    }
    
    // Ensure appData exists
    if (!window.appData) {
        console.error('renderPurchases: appData is not defined');
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    // Ensure inventory structure exists
    ensureInventoryStructure();
    
    // Safely access purchases array with multiple checks
    const purchases = appData.inventory && 
                     appData.inventory.purchases && 
                     Array.isArray(appData.inventory.purchases) 
                     ? appData.inventory.purchases 
                     : [];
    
    // If no purchases or empty array, show empty state
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        
        // Initialize empty array if needed
        if (appData.inventory && !appData.inventory.purchases) {
            appData.inventory.purchases = [];
        }
        return;
    }
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Sort purchases by date (newest first) with safe date handling
    const sortedPurchases = [...purchases].sort((a, b) => {
        try {
            const dateA = a && a.date ? new Date(a.date) : new Date(0);
            const dateB = b && b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        } catch (error) {
            console.warn('Error sorting purchases by date:', error);
            return 0;
        }
    });
    
    // Build HTML for each purchase
    let html = '';
    
    sortedPurchases.forEach((purchase, index) => {
        // Safe property access with fallbacks
        const purchaseId = purchase && purchase.id ? purchase.id : `purchase-${index}`;
        const supplierName = purchase && purchase.supplier ? purchase.supplier : 'Sin proveedor';
        const purchaseDate = purchase && purchase.date ? purchase.date : new Date().toISOString();
        
        // Calculate item count safely
        const items = purchase && purchase.items && Array.isArray(purchase.items) ? purchase.items : [];
        const ingredientCount = items.length;
        
        // Calculate total quantity safely
        const totalQuantity = items.reduce((sum, item) => {
            return sum + (item && item.quantity ? parseFloat(item.quantity) || 0 : 0);
        }, 0);
        
        // Get purchase total with fallback
        const purchaseTotal = purchase && purchase.total ? parseFloat(purchase.total) : 0;
        
        // Format purchase ID for display
        const displayId = purchaseId.length > 8 ? `${purchaseId.substring(0, 8)}...` : purchaseId;
        
        // Build table row HTML
        html += `<tr data-purchase-id="${purchaseId}">
            <td>${escapeHtml(displayId)}</td>
            <td>${escapeHtml(supplierName)}</td>
            <td>${ingredientCount} ${ingredientCount === 1 ? 'ingrediente' : 'ingredientes'}</td>
            <td>${totalQuantity.toFixed(2)}</td>
            <td>$${purchaseTotal.toFixed(2)}</td>
            <td>${formatDate(purchaseDate)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewPurchaseDetail('${purchaseId}')" 
                        title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePurchase('${purchaseId}')" 
                        title="Eliminar compra">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    // Update the table body
    try {
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error updating purchases table:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar las compras</td></tr>';
        if (emptyState) emptyState.style.display = 'block';
    }
    
    // Log for debugging (optional)
    console.log(`renderPurchases: Displayed ${sortedPurchases.length} purchases`);
}

// Helper function to escape HTML (for safety)
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to format date (you should already have this)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.warn('Error formatting date:', error, dateString);
        return 'Fecha inválida';
    }
}

// Make sure ensureInventoryStructure is robust
function ensureInventoryStructure() {
    // Check if appData exists
    if (!window.appData) {
        window.appData = {};
        console.warn('ensureInventoryStructure: Created appData');
    }
    
    // Ensure inventory exists
    if (!appData.inventory) {
        appData.inventory = {};
        console.warn('ensureInventoryStructure: Created inventory object');
    }
    
    // Ensure purchases array exists
    if (!appData.inventory.purchases || !Array.isArray(appData.inventory.purchases)) {
        appData.inventory.purchases = [];
        console.warn('ensureInventoryStructure: Initialized purchases array');
    }
    
    // Ensure other inventory arrays exist too
    const requiredArrays = ['ingredients', 'recipes', 'alerts'];
    requiredArrays.forEach(arrayName => {
        if (!appData.inventory[arrayName] || !Array.isArray(appData.inventory[arrayName])) {
            appData.inventory[arrayName] = [];
            console.warn(`ensureInventoryStructure: Initialized ${arrayName} array`);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initial render with delay to ensure DOM is ready
    setTimeout(() => {
        try {
            renderPurchases();
        } catch (error) {
            console.error('Failed to render purchases on page load:', error);
        }
    }, 100);
});

function openPurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    const form = document.getElementById('purchaseForm');
    
    if (form) form.reset();
    const purchaseDate = document.getElementById('purchaseDate');
    if (purchaseDate) purchaseDate.value = new Date().toISOString().slice(0, 16);
    
    // CORRECCIÓN: Poblar el select de proveedores
    populateSupplierSelect();
    
    // Inicializar con un item vacío
    const purchaseItemsContainer = document.getElementById('purchaseItemsContainer');
    if (purchaseItemsContainer) purchaseItemsContainer.innerHTML = '';
    addPurchaseItem();
    
    if (modal) modal.classList.add('active');
    updatePurchaseSummary();
}

// FUNCIÓN NUEVA: Poblar select de proveedores
function populateSupplierSelect() {
    const supplierSelect = document.getElementById('purchaseSupplier');
    if (!supplierSelect) return;
    
    // Limpiar opciones actuales
    supplierSelect.innerHTML = '<option value="">Selecciona un proveedor</option>';
    
    // Verificar si hay proveedores en appData
    if (!appData.suppliers || !Array.isArray(appData.suppliers) || appData.suppliers.length === 0) {
        supplierSelect.innerHTML += '<option value="" disabled>No hay proveedores registrados</option>';
        return;
    }
    
    // Agregar opciones de proveedores
    appData.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = supplier.name;
        
        // Agregar información adicional si está disponible
        if (supplier.contactInfo || supplier.email) {
            let extraInfo = '';
            if (supplier.contactInfo) extraInfo += ` - ${supplier.contactInfo}`;
            if (supplier.email) extraInfo += ` (${supplier.email})`;
            option.textContent += extraInfo;
        }
        
        supplierSelect.appendChild(option);
    });
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
                    ${(appData.inventory.ingredients || []).map(ing => 
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
    
    // CORRECCIÓN: Asegurarse de que exista inventory.ingredients
    if (!appData.inventory || !appData.inventory.ingredients) return;
    
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
    
    const supplierSelect = document.getElementById('purchaseSupplier');
    if (!supplierSelect) {
        showNotification('Error: No se encontró el campo de proveedor', 'error');
        return;
    }
    
    const supplierId = supplierSelect.value;
    const date = document.getElementById('purchaseDate').value;
    
    if (!supplierId || !date) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Obtener el nombre del proveedor
    const supplier = appData.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        showNotification('Proveedor no encontrado', 'error');
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
        supplier: supplier.name, // CORRECCIÓN: Guardar el nombre del proveedor
        supplierId: supplierId,  // CORRECCIÓN: También guardar el ID para referencia
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
            
            // CORRECCIÓN: Si el ingrediente tiene proveedores, agregar este si no está
            if (ingredient.suppliers && !ingredient.suppliers.includes(supplierId)) {
                ingredient.suppliers.push(supplierId);
            }
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

// Función auxiliar para obtener el nombre de la categoría
function getCategoryName(categoryKey) {
    const categories = {
        'proteina': 'Proteína',
        'lacteo': 'Lácteo',
        'vegetal': 'Vegetal',
        'granos': 'Granos y cereales',
        'condimentos': 'Condimentos',
        'aceites': 'Aceites y grasas',
        'bebidas': 'Bebidas',
        'empaques': 'Empaques',
        'otros': 'Otros'
    };
    
    return categories[categoryKey] || categoryKey;
}

// Función para obtener icono de alerta
function getAlertIcon(type) {
    const icons = {
        'low_stock': '<i class="fas fa-exclamation-triangle"></i>',
        'out_of_stock': '<i class="fas fa-times-circle"></i>',
        'no_recipe': '<i class="fas fa-mortar-pestle"></i>'
    };
    
    return icons[type] || '<i class="fas fa-bell"></i>';
}

// FUNCIÓN PARA MANEJAR RECETA DESDE ALERTA
function manageRecipe(productId) {
    // Asegurarse de que estamos en la pestaña de recetas
    const recipeTab = document.querySelector('[data-inv-tab="recipes"]');
    if (recipeTab) {
        recipeTab.click();
        
        // Cargar la receta después de un breve delay
        setTimeout(() => {
            loadRecipe(productId);
        }, 300);
    }
}