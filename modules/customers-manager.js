// ========== FUNCIONES DE CLIENTES ==========
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

function editCustomer(customerId) {
    openCustomerModal(customerId);
}