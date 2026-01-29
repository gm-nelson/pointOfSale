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