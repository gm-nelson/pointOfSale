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
    if (preferredSupplierSelect) {
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

function editSupplier(supplierId) {
    openSupplierModal(supplierId);
}