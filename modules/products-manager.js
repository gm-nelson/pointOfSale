// ========== FUNCIONES DE PRODUCTOS ==========
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

function editProduct(productId) {
    openProductModal(productId);
}

function viewRecipe(productId) {
    // Esta función podría implementarse para mostrar la receta del producto
    showNotification('Función de visualización de receta en desarrollo', 'info');
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