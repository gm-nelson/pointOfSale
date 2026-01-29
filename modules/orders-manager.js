// ========== FUNCIONES DE ÓRDENES ==========
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