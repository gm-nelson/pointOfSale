// ========== FUNCIONES DE ÓRDENES ==========
function openOrderModal() {
    resetOrderModal();
    if (elements.orderModal) {
        elements.orderModal.classList.add('active');
    } else {
        console.error('Elemento orderModal no encontrado en el DOM');
        showNotification('Error al abrir el modal de orden', 'error');
        return;
    }
    renderCustomerSelector();
}

function openEditOrderModal(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Orden no encontrada', 'error');
        return;
    }
    
    if (order.status === 'completed') {
        if (!confirm('Esta orden ya está completada. ¿Desea editarla de todos modos?')) {
            return;
        }
    }
    
    if (order.status === 'cancelled') {
        if (!confirm('Esta orden está cancelada. ¿Desea reactivarla y editarla?')) {
            return;
        }
    }
    
    resetOrderModal();
    editingOrderId = orderId;
    
    // Cargar datos de la orden
    selectedCustomer = appData.customers.find(c => c.id === order.customerId) || null;
    selectedProducts = {};
    
    // Cargar productos de la orden
    order.items.forEach(item => {
        selectedProducts[item.productId] = {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        };
    });
    
    // Cargar método de pago
    selectedPaymentMethod = order.paymentMethod || 'cash';
    
    // Actualizar título del modal
    const orderModalTitle = document.getElementById('orderModalTitle');
    if (orderModalTitle) {
        orderModalTitle.textContent = `Editar Orden #${orderId}`;
    }
    
    // Configurar botón de guardar
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Orden';
        saveOrderBtn.onclick = () => updateOrder(orderId);
    }
    
    // Ir directamente al paso 2 (productos) si ya hay cliente seleccionado
    if (selectedCustomer) {
        currentStep = 2;
        
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const orderStep1 = document.getElementById('orderStep1');
        const orderStep2 = document.getElementById('orderStep2');
        
        if (step1) {
            step1.classList.remove('active');
            step1.classList.add('completed');
        }
        if (step2) step2.classList.add('active');
        if (orderStep1) orderStep1.style.display = 'none';
        if (orderStep2) orderStep2.style.display = 'block';
        
        renderOrderProducts();
    }
    
    if (elements.orderModal) {
        elements.orderModal.classList.add('active');
    }
    
    renderCustomerSelector();
}

function updateOrder(orderId) {
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    if (productsWithQuantity.length === 0) {
        showNotification('Por favor, agregue al menos un producto a la orden', 'error');
        return;
    }
    
    // Validar pago en efectivo
    if (selectedPaymentMethod === 'cash') {
        const total = calculateOrderTotalFromSelected();
        const paymentAmountInput = document.getElementById('paymentAmount');
        const paymentAmount = paymentAmountInput ? parseFloat(paymentAmountInput.value) || 0 : 0;
        
        if (paymentAmount < total) {
            showNotification(`El monto pagado ($${paymentAmount.toFixed(2)}) es menor al total ($${total.toFixed(2)}). Por favor, ingrese un monto válido.`, 'error');
            return;
        }
    }
    
    const orderIndex = appData.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        showNotification('Orden no encontrada', 'error');
        return;
    }
    
    const order = appData.orders[orderIndex];
    
    // Actualizar datos de la orden
    order.customerId = selectedCustomer.id;
    order.items = productsWithQuantity.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price }));
    order.paymentMethod = selectedPaymentMethod;
    order.totalAmount = calculateOrderTotalFromSelected();
    
    // Si es pago en efectivo, registrar el monto recibido y cambio
    if (selectedPaymentMethod === 'cash') {
        const paymentAmountInput = document.getElementById('paymentAmount');
        const paymentAmount = paymentAmountInput ? parseFloat(paymentAmountInput.value) || 0 : 0;
        order.paymentAmount = paymentAmount;
        order.change = paymentAmount - order.totalAmount;
        order.paymentStatus = 'paid';
    } else {
        // Mantener el estado de pago anterior o establecer como pendiente
        order.paymentStatus = order.paymentStatus || 'pending';
    }
    
    // Si estaba cancelada y se está editando, reactivar
    if (order.status === 'cancelled') {
        order.status = 'process';
    }
    
    saveAppData();
    closeModal(elements.orderModal);
    showNotification(`Orden #${orderId} actualizada correctamente`);
    switchTab('orders');
    
    // Limpiar estado de edición
    editingOrderId = null;
    const orderModalTitle = document.getElementById('orderModalTitle');
    if (orderModalTitle) {
        orderModalTitle.textContent = 'Nueva Orden';
    }
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.innerHTML = '<i class="fas fa-check"></i> Guardar Orden';
        saveOrderBtn.onclick = saveOrder;
    }
}

function resetOrderModal() {
    currentStep = 1;
    selectedCustomer = null;
    selectedProducts = {};
    selectedPaymentMethod = 'cash';
    editingOrderId = null;
    
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    const orderStep1 = document.getElementById('orderStep1');
    const orderStep2 = document.getElementById('orderStep2');
    const orderStep3 = document.getElementById('orderStep3');
    const orderStep4 = document.getElementById('orderStep4');
    const selectCustomerBtn = document.getElementById('selectCustomerBtn');
    
    if (step1) step1.classList.add('active');
    if (step2) {
        step2.classList.remove('active');
        step2.classList.remove('completed');
    }
    if (step3) {
        step3.classList.remove('active');
        step3.classList.remove('completed');
    }
    if (step4) {
        step4.classList.remove('active');
        step4.classList.remove('completed');
    }
    if (orderStep1) orderStep1.style.display = 'block';
    if (orderStep2) orderStep2.style.display = 'none';
    if (orderStep3) orderStep3.style.display = 'none';
    if (orderStep4) orderStep4.style.display = 'none';
    if (selectCustomerBtn) selectCustomerBtn.disabled = true;
    
    const orderModalTitle = document.getElementById('orderModalTitle');
    if (orderModalTitle) {
        orderModalTitle.textContent = 'Nueva Orden';
    }
    
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.innerHTML = '<i class="fas fa-check"></i> Guardar Orden';
        saveOrderBtn.onclick = saveOrder;
    }
    
    updateOrderSummary();
}

function renderCustomerSelector() {
    const customerSelector = elements.customerSelector;
    if (!customerSelector) {
        console.error('Elemento customerSelector no encontrado');
        return;
    }
    
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
    
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const orderStep1 = document.getElementById('orderStep1');
    const orderStep2 = document.getElementById('orderStep2');
    
    if (step1) {
        step1.classList.remove('active');
        step1.classList.add('completed');
    }
    if (step2) step2.classList.add('active');
    if (orderStep1) orderStep1.style.display = 'none';
    if (orderStep2) orderStep2.style.display = 'block';
    
    renderOrderProducts();
}

// ========== SISTEMA DE GESTIÓN DE CANTIDADES ==========

function renderOrderProducts() {
    const orderProductsGrid = elements.orderProductsGrid;
    if (!orderProductsGrid) {
        console.error('Elemento orderProductsGrid no encontrado');
        return;
    }
    
    if (appData.products.length === 0) {
        orderProductsGrid.innerHTML = '<p>No hay productos disponibles. Agrega productos primero.</p>';
        return;
    }
    
    let html = '';
    appData.products.forEach(product => {
        const quantity = selectedProducts[product.id] ? selectedProducts[product.id].quantity : 0;
        const isSelected = quantity > 0;
        
        // Verificar disponibilidad para agregar uno más
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
                <div class="quantity-control" style="margin-top: 10px;" data-product-id="${product.id}">
                    <button class="quantity-btn minus-btn" ${quantity === 0 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${quantity}" min="0" 
                           style="width: 60px; text-align: center;">
                    <button class="quantity-btn plus-btn" ${!isAvailable ? 'disabled' : ''}>+</button>
                </div>
            </div>
        </div>`;
    });
    
    orderProductsGrid.innerHTML = html;
    
    // Agregar event listeners usando event delegation
    orderProductsGrid.addEventListener('click', handleQuantityButtonClick);
    orderProductsGrid.addEventListener('input', handleQuantityInputChange);
    orderProductsGrid.addEventListener('change', handleQuantityInputChange);
    
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
            -moz-appearance: textfield;
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

function handleQuantityButtonClick(event) {
    const target = event.target;
    
    if (target.classList.contains('quantity-btn')) {
        event.preventDefault();
        event.stopPropagation();
        
        const quantityControl = target.closest('.quantity-control');
        if (!quantityControl) return;
        
        const productId = quantityControl.getAttribute('data-product-id');
        const input = quantityControl.querySelector('.quantity-input');
        
        if (!input || !productId) return;
        
        let currentValue = parseInt(input.value) || 0;
        
        if (target.classList.contains('plus-btn')) {
            handleIncreaseQuantity(productId, currentValue);
        } else if (target.classList.contains('minus-btn')) {
            handleDecreaseQuantity(productId, currentValue);
        }
    }
}

function handleQuantityInputChange(event) {
    const target = event.target;
    
    if (target.classList.contains('quantity-input')) {
        const quantityControl = target.closest('.quantity-control');
        if (!quantityControl) return;
        
        const productId = quantityControl.getAttribute('data-product-id');
        const value = target.value.trim();
        
        // Limpiar el valor: solo números, máximo 3 dígitos
        let cleanValue = value.replace(/[^0-9]/g, '');
        if (cleanValue.length > 3) {
            cleanValue = cleanValue.slice(0, 3);
        }
        
        // Si está vacío, establecer a 0
        if (cleanValue === '') {
            cleanValue = '0';
        }
        
        // Actualizar el input con el valor limpio
        target.value = cleanValue;
        
        const quantity = parseInt(cleanValue) || 0;
        handleManualQuantityUpdate(productId, quantity);
    }
}

function handleIncreaseQuantity(productId, currentQuantity) {
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
    
    // Actualizar cantidad
    if (!selectedProducts[productId]) {
        selectedProducts[productId] = { 
            productId, 
            quantity: 0, 
            price: appData.products.find(p => p.id === productId)?.price || 0 
        };
    }
    
    selectedProducts[productId].quantity = newQuantity;
    updateProductUI(productId, newQuantity);
}

function handleDecreaseQuantity(productId, currentQuantity) {
    if (currentQuantity > 0) {
        const newQuantity = currentQuantity - 1;
        
        if (newQuantity === 0) {
            delete selectedProducts[productId];
        } else {
            selectedProducts[productId].quantity = newQuantity;
        }
        
        updateProductUI(productId, newQuantity);
    }
}

function handleManualQuantityUpdate(productId, quantity) {
    if (quantity < 0) {
        showNotification('La cantidad no puede ser negativa', 'error');
        restorePreviousQuantity(productId);
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
            restorePreviousQuantity(productId);
            return;
        }
        
        if (!selectedProducts[productId]) {
            selectedProducts[productId] = { 
                productId, 
                quantity: 0, 
                price: appData.products.find(p => p.id === productId)?.price || 0 
            };
        }
        
        selectedProducts[productId].quantity = quantity;
    } else {
        // Si la cantidad es 0, eliminar el producto
        delete selectedProducts[productId];
    }
    
    updateProductUI(productId, quantity);
}

function restorePreviousQuantity(productId) {
    const quantity = selectedProducts[productId] ? selectedProducts[productId].quantity : 0;
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const input = card.querySelector('.quantity-input');
        if (input) input.value = quantity;
    }
}

function updateProductUI(productId, quantity) {
    // Actualizar input
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const input = card.querySelector('.quantity-input');
        if (input) input.value = quantity;
        
        // Actualizar botón menos
        const minusBtn = card.querySelector('.minus-btn');
        if (minusBtn) {
            minusBtn.disabled = quantity === 0;
        }
        
        // Actualizar botón más y disponibilidad
        const plusBtn = card.querySelector('.plus-btn');
        if (plusBtn) {
            const availability = checkProductAvailability(productId, quantity + 1);
            plusBtn.disabled = !availability.available;
            
            // Actualizar badge de disponibilidad
            const productNameDiv = card.querySelector('.product-name');
            if (productNameDiv) {
                const availabilityBadge = availability.available ? 
                    '<span class="badge" style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">Disponible</span>' : 
                    '<span class="badge" style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">Sin stock</span>';
                
                const product = appData.products.find(p => p.id === productId);
                if (product) {
                    productNameDiv.innerHTML = `${product.name} ${availabilityBadge}`;
                }
            }
        }
        
        // Actualizar estado visual de la tarjeta
        if (quantity > 0) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    }
    
    // Actualizar lista de productos seleccionados y resumen
    updateSelectedProductsList();
    updateOrderSummary();
}

function updateSelectedProductsList() {
    const orderSelectedProducts = elements.orderSelectedProducts;
    if (!orderSelectedProducts) {
        console.error('Elemento orderSelectedProducts no encontrado');
        return;
    }
    
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
            html += `<div class="product-order-item">
                <div class="product-order-info">
                    <div><strong>${product.name}</strong></div>
                    <div>$${product.price.toFixed(2)} x ${item.quantity} = $${subtotal.toFixed(2)}</div>
                </div>
                <div>
                    <button class="btn btn-sm btn-danger" onclick="removeProductFromOrder('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }
    });
    orderSelectedProducts.innerHTML = html;
}

function removeProductFromOrder(productId) {
    delete selectedProducts[productId];
    updateProductUI(productId, 0);
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
    const paymentTotalElem = document.getElementById('paymentTotal');
    const paymentChangeElem = document.getElementById('paymentChange');
    const goToStep3Btn = document.getElementById('goToStep3Btn');
    
    if (subtotalElem) subtotalElem.textContent = `$${subtotal.toFixed(2)}`;
    if (ivaElem) ivaElem.textContent = `$${iva.toFixed(2)}`;
    if (totalElem) totalElem.textContent = `$${total.toFixed(2)}`;
    if (confirmSubtotalElem) confirmSubtotalElem.textContent = `$${subtotal.toFixed(2)}`;
    if (confirmIvaElem) confirmIvaElem.textContent = `$${iva.toFixed(2)}`;
    if (confirmTotalElem) confirmTotalElem.textContent = `$${total.toFixed(2)}`;
    if (paymentTotalElem) paymentTotalElem.textContent = `$${total.toFixed(2)}`;
    if (paymentChangeElem) paymentChangeElem.textContent = `$0.00`;
    if (goToStep3Btn) goToStep3Btn.disabled = subtotal === 0;
    
    if (selectedPaymentMethod === 'cash') {
        updatePaymentChange();
    }
}

// ========== FUNCIONES RESTANTES (sin cambios mayores) ==========

function goToStep3() {
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    if (productsWithQuantity.length === 0) {
        showNotification('Por favor, agregue al menos un producto a la orden', 'error');
        return;
    }
    
    currentStep = 3;
    
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const orderStep2 = document.getElementById('orderStep2');
    const orderStep3 = document.getElementById('orderStep3');
    
    if (step2) {
        step2.classList.remove('active');
        step2.classList.add('completed');
    }
    if (step3) step3.classList.add('active');
    if (orderStep2) orderStep2.style.display = 'none';
    if (orderStep3) orderStep3.style.display = 'block';
    
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

function goToStep4() {
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    if (productsWithQuantity.length === 0) {
        showNotification('Por favor, agregue al menos un producto a la orden', 'error');
        return;
    }
    
    currentStep = 4;
    
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    const orderStep3 = document.getElementById('orderStep3');
    const orderStep4 = document.getElementById('orderStep4');
    
    if (step3) {
        step3.classList.remove('active');
        step3.classList.add('completed');
    }
    if (step4) step4.classList.add('active');
    if (orderStep3) orderStep3.style.display = 'none';
    if (orderStep4) orderStep4.style.display = 'block';
    
    const paymentAmountInput = document.getElementById('paymentAmount');
    if (paymentAmountInput) paymentAmountInput.value = '';
    selectedPaymentMethod = 'cash';
    updatePaymentMethodDisplay();
    updatePaymentChange();
}

function updatePaymentMethodDisplay() {
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        const method = btn.getAttribute('data-method');
        if (method === selectedPaymentMethod) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const paymentAmountGroup = document.getElementById('paymentAmountGroup');
    if (paymentAmountGroup) {
        if (selectedPaymentMethod === 'cash') {
            paymentAmountGroup.style.display = 'block';
            const paymentAmountInput = document.getElementById('paymentAmount');
            if (paymentAmountInput) paymentAmountInput.value = '';
            updatePaymentChange();
        } else {
            paymentAmountGroup.style.display = 'none';
            const paymentChangeElem = document.getElementById('paymentChange');
            if (paymentChangeElem) paymentChangeElem.textContent = '$0.00';
        }
    }
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    updatePaymentMethodDisplay();
}

function updatePaymentChange() {
    const total = calculateOrderTotalFromSelected();
    const paymentAmountInput = document.getElementById('paymentAmount');
    const paymentChangeElem = document.getElementById('paymentChange');
    
    if (!paymentAmountInput || !paymentChangeElem) return;
    
    const paymentAmount = parseFloat(paymentAmountInput.value) || 0;
    
    if (paymentAmount < total) {
        paymentChangeElem.textContent = `-$${(total - paymentAmount).toFixed(2)}`;
        paymentChangeElem.style.color = '#dc3545';
        paymentChangeElem.innerHTML = `-$${(total - paymentAmount).toFixed(2)} <small style="color: #666; font-size: 12px;">(Falta)</small>`;
    } else {
        const change = paymentAmount - total;
        paymentChangeElem.textContent = `$${change.toFixed(2)}`;
        paymentChangeElem.style.color = '#28a745';
        paymentChangeElem.innerHTML = `$${change.toFixed(2)} <small style="color: #666; font-size: 12px;">(Cambio)</small>`;
    }
}

function calculateOrderTotalFromSelected() {
    let subtotal = 0;
    Object.values(selectedProducts).forEach(item => {
        const product = appData.products.find(p => p.id === item.productId);
        if (product) subtotal += item.quantity * product.price;
    });
    const iva = subtotal * appData.settings.ivaRate;
    return subtotal + iva;
}

function goToStep1() {
    currentStep = 1;
    
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    const orderStep1 = document.getElementById('orderStep1');
    const orderStep2 = document.getElementById('orderStep2');
    const orderStep3 = document.getElementById('orderStep3');
    const orderStep4 = document.getElementById('orderStep4');
    
    if (step1) step1.classList.add('active');
    if (step2) {
        step2.classList.remove('active');
        step2.classList.remove('completed');
    }
    if (step3) {
        step3.classList.remove('active');
        step3.classList.remove('completed');
    }
    if (step4) {
        step4.classList.remove('active');
        step4.classList.remove('completed');
    }
    if (orderStep1) orderStep1.style.display = 'block';
    if (orderStep2) orderStep2.style.display = 'none';
    if (orderStep3) orderStep3.style.display = 'none';
    if (orderStep4) orderStep4.style.display = 'none';
}

function goToStep2FromStep3() {
    currentStep = 2;
    
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const orderStep2 = document.getElementById('orderStep2');
    const orderStep3 = document.getElementById('orderStep3');
    
    if (step2) step2.classList.add('active');
    if (step3) {
        step3.classList.remove('active');
        step3.classList.remove('completed');
    }
    if (orderStep2) orderStep2.style.display = 'block';
    if (orderStep3) orderStep3.style.display = 'none';
}

function goToStep3FromStep4() {
    currentStep = 3;
    
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    const orderStep3 = document.getElementById('orderStep3');
    const orderStep4 = document.getElementById('orderStep4');
    
    if (step3) step3.classList.add('active');
    if (step4) {
        step4.classList.remove('active');
        step4.classList.remove('completed');
    }
    if (orderStep3) orderStep3.style.display = 'block';
    if (orderStep4) orderStep4.style.display = 'none';
}

function saveOrder() {
    const productsWithQuantity = Object.values(selectedProducts).filter(item => item.quantity > 0);
    if (productsWithQuantity.length === 0) {
        showNotification('Por favor, agregue al menos un producto a la orden', 'error');
        return;
    }
    
    if (selectedPaymentMethod === 'cash') {
        const total = calculateOrderTotalFromSelected();
        const paymentAmountInput = document.getElementById('paymentAmount');
        const paymentAmount = paymentAmountInput ? parseFloat(paymentAmountInput.value) || 0 : 0;
        
        if (paymentAmount < total) {
            showNotification(`El monto pagado ($${paymentAmount.toFixed(2)}) es menor al total ($${total.toFixed(2)}). Por favor, ingrese un monto válido.`, 'error');
            return;
        }
    }
    
    const orderId = generateId();
    const order = {
        id: orderId,
        customerId: selectedCustomer.id,
        items: productsWithQuantity.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
        status: 'process',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: selectedPaymentMethod === 'cash' ? 'paid' : 'pending',
        totalAmount: calculateOrderTotalFromSelected(),
        date: new Date().toISOString()
    };
    
    if (selectedPaymentMethod === 'cash') {
        const paymentAmountInput = document.getElementById('paymentAmount');
        const paymentAmount = paymentAmountInput ? parseFloat(paymentAmountInput.value) || 0 : 0;
        order.paymentAmount = paymentAmount;
        order.change = paymentAmount - order.totalAmount;
    }
    
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
    
    if (!ordersTableBody || !emptyOrders) {
        console.error('Elementos de tabla de órdenes no encontrados');
        return;
    }
    
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
        const total = order.totalAmount || calculateOrderTotal(order);
        const statusClass = `status-${order.status}`;
        const statusText = order.status === 'process' ? 'En proceso' : order.status === 'completed' ? 'Completada' : 'Cancelada';
        
        const paymentMethodText = order.paymentMethod === 'cash' ? 'Efectivo' : 
                                 order.paymentMethod === 'credit' ? 'Crédito' : 
                                 order.paymentMethod === 'debit' ? 'Débito' : 'Transferencia';
        
        html += `<tr>
                <td>${order.id}</td>
                <td>${customer.name}</td>
                <td>${order.items.length} productos</td>
                <td>$${total.toFixed(2)}</td>
                <td><span class="payment-badge payment-${order.paymentMethod}">${paymentMethodText}</span></td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>${formatDate(order.date)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="viewOrderDetail('${order.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-info" onclick="openEditOrderModal('${order.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')"><i class="fas fa-trash"></i></button>
                    ${order.status === 'process' ? 
                        `<button class="btn btn-sm btn-success" onclick="completeOrder('${order.id}')"><i class="fas fa-check"></i></button>
                         <button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.id}')"><i class="fas fa-times"></i></button>` : 
                        ''}
                </td>
            </tr>`;
    });
    ordersTableBody.innerHTML = html;
}

function viewOrderDetail(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const customer = appData.customers.find(c => c.id === order.customerId) || { name: 'Cliente no encontrado', phone: '' };
    const total = order.totalAmount || calculateOrderTotal(order);
    const detailOrderId = document.getElementById('detailOrderId');
    const orderDetailContent = document.getElementById('orderDetailContent');
    
    if (detailOrderId) detailOrderId.textContent = orderId;
    
    if (!orderDetailContent) return;
    
    const paymentMethodText = order.paymentMethod === 'cash' ? 'Efectivo' : 
                             order.paymentMethod === 'credit' ? 'Tarjeta de Crédito' : 
                             order.paymentMethod === 'debit' ? 'Tarjeta de Débito' : 'Transferencia Bancaria';
    
    let html = `<div class="order-detail-card">
            <h4>Cliente: ${customer.name}</h4>
            <p>Teléfono: ${customer.phone || '-'}</p>
            <p>Fecha: ${formatDate(order.date)}</p>
            <p>Estado: <span class="status status-${order.status}">${order.status === 'process' ? 'En proceso' : order.status === 'completed' ? 'Completada' : 'Cancelada'}</span></p>
            <p>Método de Pago: <span class="payment-badge payment-${order.paymentMethod}">${paymentMethodText}</span></p>
            <p>Estado de Pago: <span class="status status-${order.paymentStatus || 'pending'}">${order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}</span></p>`;
    
    if (order.paymentMethod === 'cash' && order.paymentAmount) {
        html += `<p>Monto Recibido: $${order.paymentAmount.toFixed(2)}</p>
                <p>Cambio: $${order.change ? order.change.toFixed(2) : '0.00'}</p>`;
    }
    
    html += `<h4 style="margin-top: 20px;">Productos:</h4>`;
    
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
            <button class="btn btn-info" onclick="openEditOrderModal('${orderId}')"><i class="fas fa-edit"></i> Modificar Orden</button>`;
    
    if (order.status === 'process') {
        html += `<button class="btn btn-success" onclick="completeOrder('${orderId}')"><i class="fas fa-check"></i> Marcar como Completada</button>
                <button class="btn btn-danger" onclick="cancelOrder('${orderId}')"><i class="fas fa-times"></i> Cancelar Orden</button>`;
    }
    
    if (order.paymentStatus === 'pending' && order.status !== 'cancelled') {
        html += `<button class="btn btn-warning" onclick="markAsPaid('${orderId}')"><i class="fas fa-money-check-alt"></i> Marcar como Pagado</button>`;
    }
    
    html += `</div>`;
    
    orderDetailContent.innerHTML = html;
    if (elements.orderDetailModal) {
        elements.orderDetailModal.classList.add('active');
    }
}

function markAsPaid(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.paymentStatus = 'paid';
        saveAppData();
        showNotification(`Orden #${orderId} marcada como pagada`);
        viewOrderDetail(orderId);
    }
}

function completeOrder(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        const hasEnoughStock = checkStockForOrder(order);
        
        if (!hasEnoughStock.success) {
            showNotification(`No hay suficiente stock para completar la orden: ${hasEnoughStock.message}`, 'error');
            return;
        }
        
        const deductionResult = deductIngredientsForOrder(order);
        
        if (!deductionResult.success) {
            showNotification(deductionResult.message, 'error');
            return;
        }
        
        order.status = 'completed';
        saveAppData();
        renderOrders();
        
        if (elements.orderDetailModal && elements.orderDetailModal.classList.contains('active')) {
            viewOrderDetail(orderId);
        }
        
        showNotification(`Orden #${orderId} completada y stock actualizado`);
        updateInventorySummary();
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

// Variable global para controlar la edición
let editingOrderId = null;