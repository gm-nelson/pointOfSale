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

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return dateString;
    }
}

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

function calculateOrderTotal(order) {
    let subtotal = 0;
    order.items.forEach(item => subtotal += item.quantity * item.price);
    return subtotal + (subtotal * appData.settings.ivaRate);
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
                    message: `No hay suficiente ${ingredient.name} (necesitas ${effectiveQuantity.toFixed(2)} ${ingredient.unit}, tienes ${ingredient.stock} ${ingredient.unit})`
                };
            }
        }
    }
    
    return { success: true, message: 'Stock suficiente' };
}

function deductIngredientsForOrder(order) {
    ensureInventoryStructure();
    
    const deductionLog = [];
    
    for (const item of order.items) {
        const product = appData.products.find(p => p.id === item.productId);
        if (!product) continue;
        
        const recipe = getRecipeByProductId(item.productId);
        if (!recipe) continue;
        
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            continue;
        }
        
        for (const recipeIng of recipe.ingredients) {
            const ingredient = getIngredientById(recipeIng.ingredientId);
            if (!ingredient) continue;
            
            const requiredQuantity = recipeIng.quantity * item.quantity;
            const effectiveQuantity = requiredQuantity * (1 + (recipeIng.wastePercentage || 0) / 100);
            
            if (ingredient.stock >= effectiveQuantity) {
                ingredient.stock -= effectiveQuantity;
                ingredient.lastUpdated = new Date().toISOString();
                
                deductionLog.push({
                    ingredientId: ingredient.id,
                    ingredientName: ingredient.name,
                    quantityUsed: effectiveQuantity,
                    unit: ingredient.unit,
                    productName: product.name,
                    orderId: order.id
                });
            } else {
                return {
                    success: false,
                    message: `Error: No hay suficiente ${ingredient.name} para completar la orden`
                };
            }
        }
    }
    
    // Registrar en el log de consumo
    deductionLog.forEach(log => {
        const consumptionLog = {
            ...log,
            date: new Date().toISOString(),
            type: 'order_consumption'
        };
        
        if (!appData.inventory.consumptionLogs) {
            appData.inventory.consumptionLogs = [];
        }
        appData.inventory.consumptionLogs.push(consumptionLog);
    });
    
    saveAppData();
    return { success: true, message: 'Ingredientes descontados correctamente' };
}

function generateConsumptionReport(order) {
    // Esta función genera un reporte de consumo para la orden
    const report = {
        orderId: order.id,
        date: new Date().toISOString(),
        itemsConsumed: [],
        totalCost: 0
    };
    
    for (const item of order.items) {
        const product = appData.products.find(p => p.id === item.productId);
        if (!product) continue;
        
        const recipe = getRecipeByProductId(item.productId);
        if (!recipe) continue;
        
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            continue;
        }
        
        let productCost = 0;
        const ingredientsUsed = [];
        
        for (const recipeIng of recipe.ingredients) {
            const ingredient = getIngredientById(recipeIng.ingredientId);
            if (!ingredient) continue;
            
            const requiredQuantity = recipeIng.quantity * item.quantity;
            const effectiveQuantity = requiredQuantity * (1 + (recipeIng.wastePercentage || 0) / 100);
            const ingredientCost = effectiveQuantity * ingredient.cost;
            
            productCost += ingredientCost;
            ingredientsUsed.push({
                name: ingredient.name,
                quantity: effectiveQuantity,
                unit: ingredient.unit,
                cost: ingredientCost
            });
        }
        
        report.itemsConsumed.push({
            productName: product.name,
            quantity: item.quantity,
            ingredients: ingredientsUsed,
            totalCost: productCost
        });
        
        report.totalCost += productCost;
    }
    
    // Guardar reporte (puede ser en un array de reportes o mostrarlo)
    console.log('Reporte de consumo generado:', report);
    return report;
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

function getAlertIcon(type) {
    const icons = {
        'low_stock': '<i class="fas fa-exclamation-triangle"></i>',
        'out_of_stock': '<i class="fas fa-times-circle"></i>',
        'no_recipe': '<i class="fas fa-clipboard-question"></i>'
    };
    return icons[type] || '<i class="fas fa-bell"></i>';
}

// En utilities.js, asegúrate de tener:
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Asegurar que esté disponible globalmente
window.formatBytes = formatBytes;