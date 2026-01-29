// ========== FUNCIONES DE ÓRDENES DE COMPRA POR PROVEEDOR ==========

// Variables globales para el módulo

function initPurchaseOrderModule() {
    // Obtener referencias a elementos
    elements.purchaseIngredientsGrid = document.getElementById('purchaseIngredientsGrid');
    elements.purchaseSelectedIngredients = document.getElementById('purchaseSelectedIngredients');
    elements.purchaseOrdersTableBody = document.getElementById('purchaseOrdersTableBody');
    elements.supplierOrdersPreview = document.getElementById('supplierOrdersPreview');
    elements.selectedCount = document.getElementById('selectedCount');
    elements.totalQuantity = document.getElementById('totalQuantity');
    elements.supplierCount = document.getElementById('supplierCount');
    
    // Inicializar botón de apertura del modal
    openPurchaseOrderModalBtn = document.getElementById('openPurchaseOrderModalBtn');
    
    if (openPurchaseOrderModalBtn) {
        openPurchaseOrderModalBtn.addEventListener('click', openPurchaseOrderModal);
    }
    
    // Inicializar botón de cierre del modal
    const closePurchaseOrderModalBtn = document.getElementById('closePurchaseOrderModal');
    if (closePurchaseOrderModalBtn) {
        closePurchaseOrderModalBtn.addEventListener('click', function() {
            closeModal(document.getElementById('purchaseOrderModal'));
        });
    }
    
    // Inicializar buscador de ingredientes
    const searchPurchaseIngredients = document.getElementById('searchPurchaseIngredients');
    if (searchPurchaseIngredients) {
        searchPurchaseIngredients.addEventListener('input', filterPurchaseIngredients);
    }
    
    // Inicializar buscador de órdenes de compra
    const searchPurchaseOrders = document.getElementById('searchPurchaseOrders');
    if (searchPurchaseOrders) {
        searchPurchaseOrders.addEventListener('input', filterPurchaseOrders);
    }
    
    console.log('Módulo de órdenes de compra inicializado');
}

function openPurchaseOrderModal() {
    const modal = document.getElementById('purchaseOrderModal');
    
    // Resetear datos
    currentPurchaseItems = {};
    
    // Renderizar ingredientes para compra
    renderPurchaseIngredients();
    
    // Actualizar estadísticas
    updatePurchaseStats();
    
    // Limpiar vista previa
    if (elements.supplierOrdersPreview) {
        elements.supplierOrdersPreview.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-info-circle"></i>
                <p>Agrega ingredientes y asigna proveedores para ver la vista previa.</p>
            </div>
        `;
    }
    
    // Limpiar notas
    const notesTextarea = document.getElementById('purchaseOrderNotes');
    if (notesTextarea) {
        notesTextarea.value = '';
    }
    
    if (modal) modal.classList.add('active');
}

function renderPurchaseIngredients() {
    const ingredientsGrid = elements.purchaseIngredientsGrid;
    if (!ingredientsGrid) return;
    
    ensureInventoryStructure();
    
    if (appData.inventory.ingredients.length === 0) {
        ingredientsGrid.innerHTML = '<p class="empty-message">No hay ingredientes disponibles. Agrega ingredientes primero.</p>';
        return;
    }
    
    let html = '';
    appData.inventory.ingredients.forEach(ingredient => {
        const purchaseItem = currentPurchaseItems[ingredient.id];
        const quantity = purchaseItem ? purchaseItem.quantity : 0;
        const selectedSupplierId = purchaseItem ? purchaseItem.supplierId : null;
        const isSelected = quantity > 0;
        const isLowStock = ingredient.stock <= ingredient.minStock;
        const stockClass = isLowStock ? 'low-stock' : '';
        const stockPercentage = (ingredient.stock / ingredient.minStock) * 100;
        
        // Obtener proveedores disponibles para este ingrediente
        const availableSuppliers = getAvailableSuppliersForIngredient(ingredient);
        
        // Calcular cantidad sugerida basada en stock mínimo
        const suggestedQuantity = Math.max(ingredient.minStock * 2 - ingredient.stock, ingredient.minStock * 0.5);
        
        html += `<div class="ingredient-card ${isSelected ? 'selected' : ''} ${stockClass}" data-id="${ingredient.id}">
            <div class="ingredient-card-header">
                <div class="ingredient-img">
                    <i class="fas fa-box"></i>
                </div>
                <div class="ingredient-name">${ingredient.name}</div>
                ${isLowStock ? '<span class="low-stock-badge"><i class="fas fa-exclamation-triangle"></i> Bajo Stock</span>' : ''}
            </div>
            <div class="ingredient-info">
                <div class="stock-info">
                    <div class="stock-bar">
                        <div class="stock-fill" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                    </div>
                    <div class="stock-numbers">
                        <span>Stock: ${ingredient.stock} ${ingredient.unit}</span>
                        <span>Mínimo: ${ingredient.minStock} ${ingredient.unit}</span>
                    </div>
                </div>
                
                <div class="supplier-selection">
                    <label><i class="fas fa-truck"></i> Proveedor:</label>
                    <div class="supplier-select-container">
                        <select class="supplier-select" data-ingredient-id="${ingredient.id}" 
                                onchange="updateIngredientSupplier('${ingredient.id}', this.value)">
                            <option value="">Seleccionar proveedor</option>`;
        
        // Opción para cada proveedor disponible
        availableSuppliers.forEach(supplier => {
            const selected = selectedSupplierId === supplier.id ? 'selected' : '';
            html += `<option value="${supplier.id}" ${selected}>${supplier.name} (${supplier.phone})</option>`;
        });
        
        // Si no hay proveedores o el usuario quiere asignar manualmente
        if (availableSuppliers.length === 0) {
            html += `<option value="" disabled>Sin proveedores asignados</option>`;
        }
        
        html += `</select>
                        ${selectedSupplierId ? `<div class="selected-supplier-indicator"><i class="fas fa-check-circle"></i> Asignado</div>` : ''}
                    </div>
                    <small>${availableSuppliers.length > 0 ? `${availableSuppliers.length} proveedor(es) disponible(s)` : 'Agrega proveedores a este ingrediente'}</small>
                </div>
                
                <div class="suggested-quantity">
                    <small><i class="fas fa-lightbulb"></i> Sugerido: ${suggestedQuantity.toFixed(2)} ${ingredient.unit}</small>
                </div>
                
                <div class="quantity-controls">
                    <button class="quantity-btn decrease" onclick="decreasePurchaseIngredientQuantity('${ingredient.id}')" ${quantity === 0 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                           class="quantity-input" 
                           value="${quantity}" 
                           min="0" 
                           step="0.01"
                           onchange="updatePurchaseIngredientQuantityManual('${ingredient.id}', this.value)"
                           onkeyup="updatePurchaseIngredientQuantityManual('${ingredient.id}', this.value)">
                    <button class="quantity-btn increase" onclick="increasePurchaseIngredientQuantity('${ingredient.id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="setSuggestedQuantity('${ingredient.id}', ${suggestedQuantity})">
                        Sugerido
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    ingredientsGrid.innerHTML = html;
    updatePurchaseSelectedIngredients();
    updateSupplierOrdersPreview();
}

function getAvailableSuppliersForIngredient(ingredient) {
    const availableSuppliers = [];
    
    // Si el ingrediente tiene proveedores asignados
    if (ingredient.suppliers && ingredient.suppliers.length > 0) {
        ingredient.suppliers.forEach(supplierId => {
            const supplier = getSupplierById(supplierId);
            if (supplier) {
                availableSuppliers.push(supplier);
            }
        });
    }
    
    // Si no tiene proveedores, mostrar todos los proveedores disponibles
    if (availableSuppliers.length === 0) {
        ensureInventoryStructure();
        if (appData.inventory.suppliers) {
            appData.inventory.suppliers.forEach(supplier => {
                availableSuppliers.push(supplier);
            });
        }
    }
    
    return availableSuppliers;
}

function updateIngredientSupplier(ingredientId, supplierId) {
    if (!currentPurchaseItems[ingredientId]) {
        currentPurchaseItems[ingredientId] = { 
            ingredientId, 
            quantity: 0,
            supplierId: supplierId || null 
        };
    } else {
        currentPurchaseItems[ingredientId].supplierId = supplierId || null;
    }
    
    // Actualizar la interfaz
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
    updateSupplierOrdersPreview();
    updatePurchaseStats();
}

function filterPurchaseIngredients() {
    const searchInput = document.getElementById('searchPurchaseIngredients');
    if (!searchInput || !elements.purchaseIngredientsGrid) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const cards = elements.purchaseIngredientsGrid.querySelectorAll('.ingredient-card');
    
    cards.forEach(card => {
        const ingredientName = card.querySelector('.ingredient-name').textContent.toLowerCase();
        const ingredientId = card.getAttribute('data-id');
        const ingredient = getIngredientById(ingredientId);
        
        let matches = ingredientName.includes(searchTerm);
        
        // También buscar en proveedores seleccionados
        if (ingredient && currentPurchaseItems[ingredientId]) {
            const purchaseItem = currentPurchaseItems[ingredientId];
            if (purchaseItem.supplierId) {
                const supplier = getSupplierById(purchaseItem.supplierId);
                if (supplier && supplier.name.toLowerCase().includes(searchTerm)) {
                    matches = true;
                }
            }
        }
        
        card.style.display = matches ? '' : 'none';
    });
}

function increasePurchaseIngredientQuantity(ingredientId) {
    if (!currentPurchaseItems[ingredientId]) {
        currentPurchaseItems[ingredientId] = { 
            ingredientId, 
            quantity: 0,
            supplierId: null 
        };
    }
    currentPurchaseItems[ingredientId].quantity = (currentPurchaseItems[ingredientId].quantity || 0) + 1;
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
    updateSupplierOrdersPreview();
    updatePurchaseStats();
}

function decreasePurchaseIngredientQuantity(ingredientId) {
    if (currentPurchaseItems[ingredientId] && currentPurchaseItems[ingredientId].quantity > 0) {
        currentPurchaseItems[ingredientId].quantity--;
        if (currentPurchaseItems[ingredientId].quantity === 0) {
            // No eliminar el item si tiene proveedor asignado
            if (!currentPurchaseItems[ingredientId].supplierId) {
                delete currentPurchaseItems[ingredientId];
            }
        }
        updatePurchaseIngredientCard(ingredientId);
        updatePurchaseSelectedIngredients();
        updateSupplierOrdersPreview();
        updatePurchaseStats();
    }
}

function setSuggestedQuantity(ingredientId, suggestedQuantity) {
    if (suggestedQuantity > 0) {
        if (!currentPurchaseItems[ingredientId]) {
            currentPurchaseItems[ingredientId] = { 
                ingredientId, 
                quantity: 0,
                supplierId: null 
            };
        }
        currentPurchaseItems[ingredientId].quantity = suggestedQuantity;
        updatePurchaseIngredientCard(ingredientId);
        updatePurchaseSelectedIngredients();
        updateSupplierOrdersPreview();
        updatePurchaseStats();
    }
}

function updatePurchaseIngredientQuantityManual(ingredientId, value) {
    const quantity = parseFloat(value) || 0;
    
    if (quantity < 0) {
        showNotification('La cantidad no puede ser negativa', 'error');
        return;
    }
    
    if (quantity > 0) {
        if (!currentPurchaseItems[ingredientId]) {
            currentPurchaseItems[ingredientId] = { 
                ingredientId, 
                quantity: 0,
                supplierId: null 
            };
        }
        currentPurchaseItems[ingredientId].quantity = quantity;
    } else {
        // No eliminar si tiene proveedor asignado
        if (currentPurchaseItems[ingredientId] && !currentPurchaseItems[ingredientId].supplierId) {
            delete currentPurchaseItems[ingredientId];
        } else if (currentPurchaseItems[ingredientId]) {
            currentPurchaseItems[ingredientId].quantity = 0;
        }
    }
    
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
    updateSupplierOrdersPreview();
    updatePurchaseStats();
}

function updatePurchaseIngredientCard(ingredientId) {
    const card = document.querySelector(`.ingredient-card[data-id="${ingredientId}"]`);
    if (card) {
        const purchaseItem = currentPurchaseItems[ingredientId];
        const quantity = purchaseItem ? purchaseItem.quantity : 0;
        const input = card.querySelector('.quantity-input');
        if (input) input.value = quantity;
        
        // Actualizar selector de proveedor
        const supplierSelect = card.querySelector('.supplier-select');
        if (supplierSelect && purchaseItem && purchaseItem.supplierId) {
            supplierSelect.value = purchaseItem.supplierId;
        }
        
        // Actualizar indicador de proveedor asignado
        const indicator = card.querySelector('.selected-supplier-indicator');
        if (indicator) {
            indicator.style.display = purchaseItem && purchaseItem.supplierId ? 'flex' : 'none';
        }
        
        if (quantity > 0) {
            card.classList.add('selected');
            card.querySelector('.decrease').disabled = false;
        } else {
            card.classList.remove('selected');
            card.querySelector('.decrease').disabled = true;
        }
    }
}

function updatePurchaseSelectedIngredients() {
    const selectedContainer = elements.purchaseSelectedIngredients;
    if (!selectedContainer) return;
    
    const itemsWithQuantity = Object.values(currentPurchaseItems)
        .filter(item => item.quantity > 0 || item.supplierId);
    
    if (itemsWithQuantity.length === 0) {
        selectedContainer.innerHTML = '<p class="empty-message">No hay ingredientes seleccionados. Agrega ingredientes a la orden.</p>';
        return;
    }
    
    let html = '<div class="selected-items-list">';
    
    itemsWithQuantity.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (ingredient) {
            // Información del proveedor
            let supplierInfo = 'Sin proveedor asignado';
            let supplierClass = 'no-supplier';
            
            if (item.supplierId) {
                const supplier = getSupplierById(item.supplierId);
                if (supplier) {
                    supplierInfo = `<strong>${supplier.name}</strong>`;
                    supplierClass = 'has-supplier';
                }
            }
            
            html += `<div class="selected-item ${supplierClass}">
                <div class="item-info">
                    <div class="item-name">${ingredient.name}</div>
                    <div class="item-details">
                        ${item.quantity > 0 ? `<span class="quantity"><i class="fas fa-weight-hanging"></i> ${item.quantity} ${ingredient.unit}</span>` : ''}
                        <span class="supplier"><i class="fas fa-truck"></i> ${supplierInfo}</span>
                    </div>
                </div>
                <div class="item-actions">
                    ${item.quantity === 0 ? `
                    <button class="btn btn-sm btn-warning" onclick="setSuggestedQuantity('${item.ingredientId}', ${Math.max(ingredient.minStock * 2 - ingredient.stock, ingredient.minStock * 0.5)})" title="Agregar cantidad sugerida">
                        <i class="fas fa-bolt"></i>
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="removePurchaseIngredientFromOrder('${item.ingredientId}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }
    });
    
    html += '</div>';
    selectedContainer.innerHTML = html;
}

function removePurchaseIngredientFromOrder(ingredientId) {
    delete currentPurchaseItems[ingredientId];
    updatePurchaseIngredientCard(ingredientId);
    updatePurchaseSelectedIngredients();
    updateSupplierOrdersPreview();
    updatePurchaseStats();
}

function clearPurchaseOrder() {
    if (confirm('¿Estás seguro de que quieres limpiar toda la orden de compra?')) {
        currentPurchaseItems = {};
        renderPurchaseIngredients();
        updatePurchaseSelectedIngredients();
        updateSupplierOrdersPreview();
        updatePurchaseStats();
        showNotification('Orden de compra limpiada', 'success');
    }
}

function autoAssignSuppliers() {
    let assignedCount = 0;
    
    Object.keys(currentPurchaseItems).forEach(ingredientId => {
        const purchaseItem = currentPurchaseItems[ingredientId];
        const ingredient = getIngredientById(ingredientId);
        
        if (ingredient && !purchaseItem.supplierId) {
            // Intentar asignar proveedor preferido
            if (ingredient.preferredSupplier) {
                purchaseItem.supplierId = ingredient.preferredSupplier;
                assignedCount++;
            }
            // Si no hay preferido, usar el primero de la lista
            else if (ingredient.suppliers && ingredient.suppliers.length > 0) {
                purchaseItem.supplierId = ingredient.suppliers[0];
                assignedCount++;
            }
        }
    });
    
    if (assignedCount > 0) {
        renderPurchaseIngredients();
        updatePurchaseSelectedIngredients();
        updateSupplierOrdersPreview();
        updatePurchaseStats();
        showNotification(`Se asignaron ${assignedCount} proveedores automáticamente`, 'success');
    } else {
        showNotification('No se pudieron asignar proveedores automáticamente', 'info');
    }
}

function clearSupplierAssignments() {
    if (confirm('¿Estás seguro de que quieres limpiar todas las asignaciones de proveedores?')) {
        Object.keys(currentPurchaseItems).forEach(ingredientId => {
            if (currentPurchaseItems[ingredientId]) {
                currentPurchaseItems[ingredientId].supplierId = null;
            }
        });
        
        renderPurchaseIngredients();
        updatePurchaseSelectedIngredients();
        updateSupplierOrdersPreview();
        updatePurchaseStats();
        showNotification('Asignaciones de proveedores limpiadas', 'success');
    }
}

function updatePurchaseStats() {
    if (!elements.selectedCount || !elements.totalQuantity || !elements.supplierCount) return;
    
    const itemsWithQuantity = Object.values(currentPurchaseItems).filter(item => item.quantity > 0);
    const itemsWithSupplier = Object.values(currentPurchaseItems).filter(item => item.supplierId);
    
    // Contar proveedores únicos
    const uniqueSuppliers = new Set();
    itemsWithSupplier.forEach(item => {
        if (item.supplierId) {
            uniqueSuppliers.add(item.supplierId);
        }
    });
    
    // Calcular cantidad total
    const totalQuantity = itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);
    
    // Actualizar estadísticas
    elements.selectedCount.textContent = itemsWithQuantity.length;
    elements.totalQuantity.textContent = totalQuantity.toFixed(2);
    elements.supplierCount.textContent = uniqueSuppliers.size;
}

function updateSupplierOrdersPreview() {
    const previewContainer = elements.supplierOrdersPreview;
    if (!previewContainer) return;
    
    // Filtrar items con proveedor asignado y cantidad > 0
    const itemsWithSupplier = Object.values(currentPurchaseItems)
        .filter(item => item.supplierId && item.quantity > 0);
    
    if (itemsWithSupplier.length === 0) {
        previewContainer.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-info-circle"></i>
                <p>Agrega ingredientes y asigna proveedores para ver la vista previa.</p>
            </div>
        `;
        return;
    }
    
    // Agrupar ingredientes por proveedor
    const supplierGroups = {};
    
    itemsWithSupplier.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (!ingredient || !item.supplierId) return;
        
        if (!supplierGroups[item.supplierId]) {
            supplierGroups[item.supplierId] = {
                supplierId: item.supplierId,
                items: [],
                totalQuantity: 0,
                totalCost: 0
            };
        }
        
        const cost = ingredient.cost || 0;
        const itemCost = item.quantity * cost;
        
        supplierGroups[item.supplierId].items.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: item.quantity,
            unit: ingredient.unit,
            currentStock: ingredient.stock,
            minStock: ingredient.minStock,
            cost: cost,
            itemCost: itemCost
        });
        
        supplierGroups[item.supplierId].totalQuantity += item.quantity;
        supplierGroups[item.supplierId].totalCost += itemCost;
    });
    
    // Generar HTML de vista previa
    let html = '<h4><i class="fas fa-eye"></i> Vista Previa de Órdenes</h4>';
    
    Object.keys(supplierGroups).forEach(supplierId => {
        const group = supplierGroups[supplierId];
        
        let supplierName = 'Proveedor Desconocido';
        let supplierPhone = '';
        let supplierEmail = '';
        let supplierInfo = '';
        
        const supplier = getSupplierById(supplierId);
        if (supplier) {
            supplierName = supplier.name;
            supplierPhone = supplier.phone;
            supplierEmail = supplier.email || '';
            supplierInfo = `${supplier.phone} ${supplierEmail ? '| ' + supplierEmail : ''}`;
        }
        
        html += `
        <div class="supplier-order-preview">
            <div class="supplier-header">
                <div class="supplier-title">
                    <h5><i class="fas fa-truck"></i> ${supplierName}</h5>
                    <span class="order-badge">${group.items.length} items</span>
                </div>
                ${supplierInfo ? `<small><i class="fas fa-phone"></i> ${supplierInfo}</small>` : ''}
            </div>
            <div class="supplier-items">
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Ingrediente</th>
                            <th>Cantidad</th>
                            <th>Unidad</th>
                            <th>Stock Actual</th>
                            <th>Costo Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        group.items.forEach(item => {
            html += `
                <tr>
                    <td class="item-name">${item.ingredientName}</td>
                    <td class="quantity">${item.quantity}</td>
                    <td class="unit">${item.unit}</td>
                    <td class="stock">${item.currentStock} ${item.unit}</td>
                    <td class="cost">$${item.cost.toFixed(2)}</td>
                    <td class="subtotal">$${item.itemCost.toFixed(2)}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Total:</strong></td>
                            <td><strong>${group.totalQuantity.toFixed(2)} unidades</strong></td>
                            <td colspan="2" style="text-align: right;">
                                <strong class="total-cost">$${group.totalCost.toFixed(2)}</strong>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>`;
    });
    
    previewContainer.innerHTML = html;
}

function generatePurchaseOrders(e) {
    if (e) e.preventDefault();
    
    // Filtrar items con proveedor asignado y cantidad > 0
    const itemsWithSupplier = Object.values(currentPurchaseItems)
        .filter(item => item.supplierId && item.quantity > 0);
    
    if (itemsWithSupplier.length === 0) {
        showNotification('Por favor, asigne proveedores y cantidades a los ingredientes', 'error');
        return;
    }
    
    // Verificar que todos los ingredientes tengan proveedor
    const itemsWithoutSupplier = Object.values(currentPurchaseItems)
        .filter(item => item.quantity > 0 && !item.supplierId);
    
    if (itemsWithoutSupplier.length > 0) {
        if (!confirm(`${itemsWithoutSupplier.length} ingredientes no tienen proveedor asignado. ¿Desea continuar sin ellos?`)) {
            return;
        }
    }
    
    // Agrupar ingredientes por proveedor
    const supplierGroups = {};
    
    itemsWithSupplier.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (!ingredient || !item.supplierId) return;
        
        if (!supplierGroups[item.supplierId]) {
            supplierGroups[item.supplierId] = {
                supplierId: item.supplierId,
                items: []
            };
        }
        
        supplierGroups[item.supplierId].items.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: item.quantity,
            unit: ingredient.unit,
            currentStock: ingredient.stock,
            minStock: ingredient.minStock,
            cost: ingredient.cost || 0
        });
    });
    
    // Crear órdenes de compra por proveedor
    let ordersCreated = 0;
    const notes = document.getElementById('purchaseOrderNotes').value || '';
    
    Object.keys(supplierGroups).forEach(supplierId => {
        const group = supplierGroups[supplierId];
        
        let supplierName = 'Proveedor Desconocido';
        let supplierPhone = '';
        let supplierEmail = '';
        let supplierAddress = '';
        
        const supplier = getSupplierById(supplierId);
        if (supplier) {
            supplierName = supplier.name;
            supplierPhone = supplier.phone;
            supplierEmail = supplier.email || '';
            supplierAddress = supplier.address || '';
        }
        
        const purchaseOrder = {
            id: generateId(),
            supplierId: supplierId,
            supplierName: supplierName,
            supplierPhone: supplierPhone,
            supplierEmail: supplierEmail,
            supplierAddress: supplierAddress,
            date: new Date().toISOString(),
            items: group.items,
            status: 'pending',
            notes: notes,
            totalQuantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
            estimatedCost: group.items.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0),
            userAssigned: true // Indicador de que fue asignado manualmente
        };
        
        ensureInventoryStructure();
        appData.inventory.purchaseOrders.push(purchaseOrder);
        ordersCreated++;
        
        // Generar PDF para esta orden
        generatePurchaseOrderPDF(purchaseOrder);
        
        // Enviar WhatsApp si hay teléfono
        if (supplierPhone) {
            sendPurchaseOrderWhatsApp(purchaseOrder);
        }
    });
    
    // Guardar datos y actualizar vistas
    saveAppData();
    renderPurchaseOrders();
    
    // Cerrar modal y limpiar datos
    closeModal(document.getElementById('purchaseOrderModal'));
    currentPurchaseItems = {};
    
    // Mostrar notificación
    showNotification(`Se generaron ${ordersCreated} órdenes de compra`, 'success');
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
        const totalQuantity = order.totalQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0);
        const statusClass = `status-${order.status}`;
        const statusText = order.status === 'pending' ? 'Pendiente' : 
                          order.status === 'completed' ? 'Completada' : 'Cancelada';
        const statusIcon = order.status === 'pending' ? 'fa-clock' : 
                          order.status === 'completed' ? 'fa-check-circle' : 'fa-times-circle';
        
        // Verificar si fue asignado manualmente
        const assignmentBadge = order.userAssigned ? '<span class="user-assigned-badge" title="Asignado manualmente"><i class="fas fa-user-edit"></i></span>' : '';
        
        html += `<tr class="${statusClass}">
            <td>${order.id.substring(0, 8)}...${assignmentBadge}</td>
            <td>${order.supplierName}</td>
            <td>${itemCount} ingredientes</td>
            <td>${totalQuantity.toFixed(2)}</td>
            <td>
                <span class="status ${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${statusText}
                </span>
            </td>
            <td>${formatDate(order.date)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewPurchaseOrderDetail('${order.id}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="generatePurchaseOrderPDF('${order.id}')" title="Generar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
                ${order.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="openConfirmPurchaseModal('${order.id}')" title="Confirmar recepción">
                    <i class="fas fa-check"></i>
                </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="deletePurchaseOrder('${order.id}')" title="Eliminar">
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
            <div class="order-info">
                <p><strong>Proveedor:</strong> ${order.supplierName}</p>
                ${order.supplierPhone ? `<p><strong>Teléfono:</strong> ${order.supplierPhone}</p>` : ''}
                ${order.supplierEmail ? `<p><strong>Email:</strong> ${order.supplierEmail}</p>` : ''}
                ${order.supplierAddress ? `<p><strong>Dirección:</strong> ${order.supplierAddress}</p>` : ''}
                <p><strong>Fecha:</strong> ${formatDate(order.date)}</p>
                <p><strong>Estado:</strong> <span class="status status-${order.status}">${order.status === 'pending' ? 'Pendiente' : 'Completada'}</span></p>
                ${order.userAssigned ? `<p><strong><i class="fas fa-user-edit"></i> Asignado manualmente</strong></p>` : ''}
                
                ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
            </div>
            
            <h4>Ingredientes solicitados:</h4>
            <table class="detail-table">
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Costo Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>`;
    
    let totalCost = 0;
    order.items.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        const currentStock = ingredient ? ingredient.stock : item.currentStock;
        const minStock = ingredient ? ingredient.minStock : item.minStock;
        const cost = item.cost || 0;
        const subtotal = item.quantity * cost;
        totalCost += subtotal;
        
        detailHTML += `
            <tr>
                <td>${item.ingredientName}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${currentStock} ${item.unit}</td>
                <td>${minStock} ${item.unit}</td>
                <td>$${cost.toFixed(2)}</td>
                <td>$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    detailHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="6" style="text-align: right;"><strong>Total estimado:</strong></td>
                        <td><strong>$${totalCost.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="order-actions">
                <button class="btn btn-primary" onclick="generatePurchaseOrderPDF('${order.id}')">
                    <i class="fas fa-file-pdf"></i> Ver/Imprimir PDF
                </button>
                ${order.supplierPhone ? `
                <button class="btn btn-success" onclick="sendPurchaseOrderWhatsApp('${order.id}')">
                    <i class="fab fa-whatsapp"></i> Enviar WhatsApp
                </button>
                ` : ''}
                ${order.status === 'pending' ? `
                <button class="btn btn-warning" onclick="openConfirmPurchaseModal('${order.id}')">
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
        <div class="modal-content" style="max-width: 1000px;">
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
    if (!order) {
        showNotification('Orden no encontrada', 'error');
        return;
    }
    
    // Obtener colores actuales del tema
    const colors = appData.settings.colors;
    const primaryColor = colors.primary || '#FF6B35';
    const secondaryColor = colors.secondary || '#004E89';
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
    
    // Calcular totales
    let totalQuantity = 0;
    let totalCost = 0;
    
    order.items.forEach(item => {
        totalQuantity += item.quantity;
        totalCost += (item.cost || 0) * item.quantity;
    });
    
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
                
                .quantity, .unit, .cost, .subtotal {
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
                
                /* Summary */
                .order-summary {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .summary-total {
                    font-size: 20px;
                    font-weight: 700;
                    color: ${primaryColor};
                    border-top: 2px solid #e2e8f0;
                    padding-top: 10px;
                    margin-top: 10px;
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
                            ${order.supplierEmail ? `<div style="color: #64748b; font-size: 14px; margin-top: 4px;">${order.supplierEmail}</div>` : ''}
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
                                <th>Costo Unitario</th>
                                <th>Subtotal</th>
                                <th>Especificaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => {
                                const cost = item.cost || 0;
                                const subtotal = item.quantity * cost;
                                return `
                                    <tr>
                                        <td class="item-name">${item.ingredientName}</td>
                                        <td class="quantity">${item.quantity}</td>
                                        <td class="unit">${item.unit}</td>
                                        <td class="cost">$${cost.toFixed(2)}</td>
                                        <td class="subtotal">$${subtotal.toFixed(2)}</td>
                                        <td>Entrega a más tardar 48 horas después de confirmación</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Total de Items:</span>
                            <span>${order.items.length}</span>
                        </div>
                        <div class="summary-row">
                            <span>Cantidad Total:</span>
                            <span>${totalQuantity} unidades</span>
                        </div>
                        <div class="summary-row summary-total">
                            <span>Total Estimado:</span>
                            <span>$${totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                    
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
    
    // Calcular total estimado
    const totalCost = order.items.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0);
    message += `\n*Total estimado:* $${totalCost.toFixed(2)}\n`;
    
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
    
    // Mostrar información de la orden
    const orderInfo = document.getElementById('confirmPurchaseOrderInfo');
    if (orderInfo) {
        orderInfo.innerHTML = `
            <div class="order-info-card">
                <p><strong>Proveedor:</strong> ${order.supplierName}</p>
                <p><strong>Fecha de orden:</strong> ${formatDate(order.date)}</p>
                <p><strong>Estado:</strong> <span class="status status-pending">Pendiente</span></p>
            </div>
        `;
    }
    
    // Renderizar items para confirmación
    const itemsContainer = document.getElementById('confirmPurchaseItems');
    if (itemsContainer) {
        let html = '<div class="confirm-items-list">';
        order.items.forEach((item, index) => {
            const ingredient = getIngredientById(item.ingredientId);
            const currentStock = ingredient ? ingredient.stock : 0;
            
            html += `
                <div class="confirm-purchase-item">
                    <div class="confirm-item-header">
                        <h5>${item.ingredientName}</h5>
                        <small class="text-muted">Solicitado: ${item.quantity} ${item.unit}</small>
                    </div>
                    <div class="confirm-item-controls">
                        <div class="form-group">
                            <label>Cantidad recibida:</label>
                            <div class="input-group">
                                <input type="number" 
                                       class="form-control received-quantity" 
                                       data-ingredient-id="${item.ingredientId}"
                                       data-original-quantity="${item.quantity}"
                                       value="${item.quantity}"
                                       min="0" 
                                       step="0.01"
                                       required>
                                <div class="input-group-append">
                                    <span class="input-group-text">${item.unit}</span>
                                </div>
                            </div>
                            <small class="form-text">Stock actual: ${currentStock} ${item.unit}</small>
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
        
        html += '</div>';
        itemsContainer.innerHTML = html;
    }
    
    // Limpiar notas anteriores
    const notesTextarea = document.getElementById('confirmPurchaseNotes');
    if (notesTextarea) {
        notesTextarea.value = '';
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
    let hasChanges = false;
    
    receivedQuantities.forEach(input => {
        const ingredientId = input.getAttribute('data-ingredient-id');
        const originalQuantity = parseFloat(input.getAttribute('data-original-quantity'));
        const receivedQuantity = parseFloat(input.value) || 0;
        
        if (isNaN(receivedQuantity) || receivedQuantity < 0) {
            isValid = false;
            showNotification('Por favor, ingrese cantidades válidas', 'error');
            return;
        }
        
        if (receivedQuantity !== originalQuantity) {
            hasChanges = true;
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
        return;
    }
    
    // Obtener notas generales
    const generalNotes = document.getElementById('confirmPurchaseNotes').value || '';
    
    // Actualizar inventario
    receivedItems.forEach(item => {
        const ingredient = getIngredientById(item.ingredientId);
        if (ingredient) {
            // Encontrar el item original en la orden
            const orderItem = order.items.find(i => i.ingredientId === item.ingredientId);
            
            // Convertir unidades si es necesario
            const quantityToAdd = convertQuantityIfNeeded(
                item.receivedQuantity, 
                orderItem?.unit || ingredient.unit,
                ingredient.unit
            );
            
            // Actualizar stock
            ingredient.stock += quantityToAdd;
            ingredient.lastUpdated = new Date().toISOString();
            
            // Actualizar costo si hay diferencia significativa
            if (orderItem && orderItem.cost && orderItem.cost > 0) {
                ingredient.cost = orderItem.cost;
            }
            
            // Registrar en el log de compras
            const purchaseLog = {
                orderId: orderId,
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                quantity: quantityToAdd,
                unit: ingredient.unit,
                cost: ingredient.cost,
                date: new Date().toISOString(),
                notes: item.notes || generalNotes,
                status: 'completed'
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
    order.receivedNotes = generalNotes;
    order.receivedBy = appData.business.name;
    
    saveAppData();
    
    // Actualizar vistas
    renderIngredients();
    renderPurchaseOrders();
    renderPurchases();
    updateInventorySummary();
    
    // Cerrar modal y mostrar notificación
    closeModal(document.getElementById('confirmPurchaseModal'));
    showNotification(`Orden de compra #${orderId.substring(0, 8)} confirmada. Inventario actualizado.`, 'success');
}

function deletePurchaseOrder(orderId) {
    if (!confirm('¿Está seguro de eliminar esta orden de compra? Esta acción no se puede deshacer.')) {
        return;
    }
    
    ensureInventoryStructure();
    appData.inventory.purchaseOrders = appData.inventory.purchaseOrders.filter(po => po.id !== orderId);
    
    saveAppData();
    renderPurchaseOrders();
    showNotification('Orden de compra eliminada', 'success');
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

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un momento para asegurar que otros módulos estén cargados
    setTimeout(initPurchaseOrderModule, 100);
});