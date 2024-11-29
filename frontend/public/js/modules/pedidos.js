class PedidosModule {
    constructor() {
        this.newPedidoBtn = document.getElementById('newPedidoBtn');
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.initializeEvents();
    }

    initializeEvents() {
        this.newPedidoBtn.addEventListener('click', () => {
            this.showPedidoForm();
        });
    }

    async loadPedidos() {
        try {
            const pedidos = await api.request('/pedidos');
            this.renderPaginatedPedidos(pedidos);
        } catch (error) {
            modal.showAlert('Error al cargar pedidos', 'error');
        }
    }

    renderPaginatedPedidos(pedidos) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedPedidos = pedidos.slice(startIndex, endIndex);
        const totalPages = Math.ceil(pedidos.length / this.itemsPerPage);

        this.renderPedidosTable(paginatedPedidos);
        this.renderPagination(totalPages);
    }

    renderPedidosTable(pedidos) {
        const tbody = document.querySelector('#pedidosTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        pedidos.forEach(pedido => {
            tbody.innerHTML += `
                <tr>
                    <td>${pedido.cliente_nombre}</td>
                    <td>${formatDate(pedido.fecha_entrega)} ${pedido.hora_entrega}</td>
                    <td>${formatCurrency(pedido.total)}</td>
                    <td>
                        <span class="estado-badge ${pedido.estado}">
                            ${this.formatEstado(pedido.estado)}
                        </span>
                    </td>
                    <td>${pedido.modo_entrega === 'delivery' ? 'Delivery' : 'Retira en local'}</td>
                    <td>
                        <button onclick="pedidosModule.verDetalles(${pedido.id})" class="btn-view">
                            Ver Detalles
                        </button>
                        <button onclick="pedidosModule.cambiarEstado(${pedido.id})" class="btn-edit">
                            Cambiar Estado
                        </button>
                    </td>
                </tr>
            `;
        });
    }



    formatEstado(estado) {
        const estados = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En Proceso',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return estados[estado] || estado;
    }

    async showPedidoForm(pedidoData = null) {
        // Cargar clientes y productos primero
        try {
            const [clientes, productos] = await Promise.all([
                api.request('/clientes'),
                api.request('/productos')
            ]);

            const content = `
                <div class="modal-content pedido-form">
                    <h2>${pedidoData ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
                    <form id="pedidoForm">
                        ${pedidoData ? `<input type="hidden" name="id" value="${pedidoData.id}">` : ''}
                        
                        <!-- Selector de Cliente -->
                        <div class="form-group">
                            <label for="cliente_id">Cliente *</label>
                            <select id="cliente_id" name="cliente_id" required>
                                <option value="">Seleccionar cliente</option>
                                ${clientes.map(cliente => `
                                    <option value="${cliente.id}" ${pedidoData?.cliente_id === cliente.id ? 'selected' : ''}>
                                        ${cliente.nombre_apellido} - ${cliente.telefono}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Fecha y Hora de Entrega -->
                        <div class="form-group">
                            <label for="fecha_entrega">Fecha de Entrega *</label>
                            <input type="date" id="fecha_entrega" name="fecha_entrega" required
                                min="${new Date().toISOString().split('T')[0]}"
                                value="${pedidoData?.fecha_entrega?.split('T')[0] || ''}">
                        </div>

                        <div class="form-group">
                            <label for="hora_entrega">Hora de Entrega *</label>
                            <input type="time" id="hora_entrega" name="hora_entrega" required
                                value="${pedidoData?.hora_entrega || ''}">
                        </div>

                        <!-- Modo de Entrega -->
                        <div class="form-group">
                            <label for="modo_entrega">Modo de Entrega *</label>
                            <select id="modo_entrega" name="modo_entrega" required>
                                <option value="retira" ${pedidoData?.modo_entrega === 'retira' ? 'selected' : ''}>
                                    Retira en local
                                </option>
                                <option value="delivery" ${pedidoData?.modo_entrega === 'delivery' ? 'selected' : ''}>
                                    Delivery
                                </option>
                            </select>
                        </div>

                        <!-- Selector de Productos -->
                        <div class="form-group productos-list">
                            <label>Productos *</label>
                            <div id="productosContainer">
                                <div class="producto-row">
                                    <select name="productos[0][producto_id]" required>
                                        <option value="">Seleccionar producto</option>
                                        ${productos.map(producto => `
                                            <option value="${producto.id}" data-precio="${producto.precio}">
                                                ${producto.nombre} - ${formatCurrency(producto.precio)}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <input type="number" name="productos[0][cantidad]" min="1" required
                                        placeholder="Cantidad" class="cantidad-input">
                                    <span class="subtotal">$0.00</span>
                                </div>
                            </div>
                            <button type="button" class="btn-secondary" onclick="pedidosModule.addProductoRow()">
                                + Agregar Producto
                            </button>
                        </div>

                        <!-- Total -->
                        <div class="form-group total-section">
                            <h3>Total: <span id="totalPedido">$0.00</span></h3>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="modal.close()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                ${pedidoData ? 'Actualizar' : 'Crear'} Pedido
                            </button>
                        </div>
                    </form>
                </div>
            `;

            modal.show(content);
            this.initializeFormHandlers();

        } catch (error) {
            modal.showAlert('Error al cargar datos necesarios', 'error');
        }
    }

    updateTotals() {
        let total = 0;
        const rows = document.querySelectorAll('.producto-row');

        rows.forEach(row => {
            const select = row.querySelector('select');
            const cantidad = row.querySelector('.cantidad-input').value;
            const option = select.selectedOptions[0];

            if (option && option.value && cantidad) {
                const precio = parseFloat(option.dataset.precio);
                const subtotal = precio * parseInt(cantidad);
                total += subtotal;
                row.querySelector('.subtotal').textContent = formatCurrency(subtotal);
            }
        });

        document.getElementById('totalPedido').textContent = formatCurrency(total);
    }

    validatePedido() {
        const productos = document.querySelectorAll('.producto-row');
        if (productos.length === 0) {
            modal.showAlert('Debe agregar al menos un producto', 'error');
            return false;
        }

        return true;
    }

    collectPedidoData() {
        const formData = new FormData(document.getElementById('pedidoForm'));
        const pedidoData = {
            cliente_id: formData.get('cliente_id'),
            fecha_entrega: formData.get('fecha_entrega'),
            hora_entrega: formData.get('hora_entrega'),
            modo_entrega: formData.get('modo_entrega'),
            productos: []
        };

        // Recolectar productos
        const productos = document.querySelectorAll('.producto-row');
        productos.forEach((row, index) => {
            const producto_id = formData.get(`productos[${index}][producto_id]`);
            const cantidad = formData.get(`productos[${index}][cantidad]`);
            
            if (producto_id && cantidad) {
                pedidoData.productos.push({
                    producto_id: parseInt(producto_id),
                    cantidad: parseInt(cantidad)
                });
            }
        });

        return pedidoData;
    }

    initializeFormHandlers() {
        const form = document.getElementById('pedidoForm');
        const productosContainer = document.getElementById('productosContainer');

        // Manejar cambios en productos y cantidades
        productosContainer.addEventListener('change', (e) => {
            if (e.target.matches('select') || e.target.matches('.cantidad-input')) {
                this.updateTotals();
            }
        });

        // Manejar envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validatePedido()) {
                return;
            }

            const pedidoData = this.collectPedidoData();

            try {
                await api.request('/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(pedidoData)
                });

                modal.close();
                modal.showAlert('Pedido creado exitosamente', 'success');
                this.loadPedidos();
            } catch (error) {
                modal.showAlert(error.message, 'error');
            }
        });
    }

    renderProductoRow(index = 0) {
        return `
            <div class="producto-row" data-index="${index}">
                <div class="form-group">
                    <select name="productos[${index}][producto_id]" class="producto-select" required>
                        <option value="">Seleccione un producto</option>
                        ${this.productosList.map(producto => 
                            `<option value="${producto.id}" 
                                data-precio="${producto.precio}"
                                data-stock="${producto.stock}">
                                ${producto.nombre} (Stock: ${producto.stock})
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <input type="number" name="productos[${index}][cantidad]" 
                        class="cantidad-input" min="1" required placeholder="Cantidad">
                </div>
                <div class="subtotal">$0.00</div>
                <button type="button" class="btn-delete" onclick="pedidosModule.removeProductoRow(${index})">
                    ×
                </button>
            </div>
        `;
    }

    addProductoRow() {
        const container = document.getElementById('productosContainer');
        const index = container.children.length;
        const productosSelect = container.querySelector('select').cloneNode(true);
        
        const row = document.createElement('div');
        row.className = 'producto-row';
        row.innerHTML = `
            <select name="productos[${index}][producto_id]" required>
                ${productosSelect.innerHTML}
            </select>
            <input type="number" name="productos[${index}][cantidad]" min="1" required
                placeholder="Cantidad" class="cantidad-input">
            <span class="subtotal">$0.00</span>
            <button type="button" class="btn-delete" onclick="this.parentElement.remove(); pedidosModule.updateTotals()">
                ×
            </button>
        `;

        container.appendChild(row);
    }

    removeProductoRow(index) {
        const row = document.querySelector(`.producto-row[data-index="${index}"]`);
        if (row) {
            row.remove();
            this.updatePedidoTotal();
        }
    }

    initializePedidoForm() {
        const form = document.getElementById('pedidoForm');

        form.addEventListener('change', (e) => {
            if (e.target.classList.contains('producto-select') || 
                e.target.classList.contains('cantidad-input')) {
                this.updatePedidoTotal();
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const pedidoData = {
                cliente_id: formData.get('cliente_id'),
                detalles: []
            };

            // Procesar productos
            const productosContainer = document.getElementById('productosContainer');
            const productoRows = productosContainer.children;
            
            for (let row of productoRows) {
                const index = row.dataset.index;
                const productoId = formData.get(`productos[${index}][producto_id]`);
                const cantidad = formData.get(`productos[${index}][cantidad]`);
                
                if (productoId && cantidad) {
                    pedidoData.detalles.push({
                        producto_id: parseInt(productoId),
                        cantidad: parseInt(cantidad)
                    });
                }
            }

            try {
                await api.request('/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(pedidoData)
                });

                modal.close();
                this.loadPedidos();
                alert('Pedido creado exitosamente');
            } catch (error) {
                alert('Error al crear pedido: ' + error.message);
            }
        });
    }

    updatePedidoTotal() {
        let total = 0;
        const rows = document.querySelectorAll('.producto-row');

        rows.forEach(row => {
            const select = row.querySelector('.producto-select');
            const cantidad = row.querySelector('.cantidad-input').value;
            const option = select.selectedOptions[0];

            if (option && option.value && cantidad) {
                const precio = parseFloat(option.dataset.precio);
                const subtotal = precio * parseInt(cantidad);
                total += subtotal;
                row.querySelector('.subtotal').textContent = formatCurrency(subtotal);
            }
        });

        document.getElementById('totalPedido').textContent = formatCurrency(total);
    }

    async verDetalles(id) {
        try {
            const pedido = await api.request(`/pedidos/${id}`);
            
            const content = `
                <div class="modal-content">
                    <h2>Detalles del Pedido #${pedido.id}</h2>
                    <div class="pedido-detalles">
                        <p><strong>Cliente:</strong> ${pedido.cliente_nombre}</p>
                        <p><strong>Fecha de Entrega:</strong> ${formatDate(pedido.fecha_entrega)}</p>
                        <p><strong>Hora de Entrega:</strong> ${pedido.hora_entrega}</p>
                        <p><strong>Modo de Entrega:</strong> ${pedido.modo_entrega === 'delivery' ? 'Delivery' : 'Retira en local'}</p>
                        <p><strong>Estado:</strong> ${this.formatEstado(pedido.estado)}</p>
                        
                        <h3>Productos</h3>
                        <table class="detalles-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pedido.detalles.map(detalle => `
                                    <tr>
                                        <td>${detalle.producto_nombre}</td>
                                        <td>${detalle.cantidad}</td>
                                        <td>${formatCurrency(detalle.precio_unitario)}</td>
                                        <td>${formatCurrency(detalle.subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td><strong>${formatCurrency(pedido.total)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="modal.close()">Cerrar</button>
                    </div>
                </div>
            `;
            
            modal.show(content);
        } catch (error) {
            modal.showAlert('Error al cargar detalles del pedido', 'error');
        }
    }

    async cambiarEstado(id) {
        try {
            const pedido = await api.request(`/pedidos/${id}`);
            
            const content = `
                <div class="modal-content">
                    <h2>Cambiar Estado del Pedido</h2>
                    <form id="estadoForm">
                        <div class="form-group">
                            <label for="estado">Nuevo Estado</label>
                            <select id="estado" name="estado" required>
                                <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="en_proceso" ${pedido.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                                <option value="completado" ${pedido.estado === 'completado' ? 'selected' : ''}>Completado</option>
                                <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="modal.close()">Cancelar</button>
                            <button type="submit" class="btn-primary">Actualizar Estado</button>
                        </div>
                    </form>
                </div>
            `;
            
            modal.show(content);

            document.getElementById('estadoForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const estado = document.getElementById('estado').value;

                try {
                    await api.request(`/pedidos/${id}/estado`, {
                        method: 'PATCH',
                        body: JSON.stringify({ estado })
                    });

                    modal.close();
                    this.loadPedidos();
                    modal.showAlert('Estado actualizado exitosamente', 'success');
                } catch (error) {
                    modal.showAlert('Error al actualizar estado', 'error');
                }
            });
        } catch (error) {
            modal.showAlert('Error al cargar pedido', 'error');
        }
    }
}

const pedidosModule = new PedidosModule();

// Agregar estilos necesarios para los pedidos
const pedidosStyles = `
    .producto-row {
        display: grid;
        grid-template-columns: 3fr 1fr 1fr auto;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .estado-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .estado-badge.pendiente {
        background-color: #fef3c7;
        color: #92400e;
    }

    .estado-badge.en_proceso {
        background-color: #dbeafe;
        color: #1e40af;
    }

    .estado-badge.completado {
        background-color: #dcfce7;
        color: #166534;
    }

    .estado-badge.cancelado {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .detalles-table {
        width: 100%;
        margin: 1rem 0;
        border-collapse: collapse;
    }

    .detalles-table th,
    .detalles-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }

    .total-section {
        background-color: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-top: 1rem;
    }

    .pedido-detalles {
        margin: 1rem 0;
    }

    .pedido-detalles p {
        margin: 0.5rem 0;
    }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = pedidosStyles;
document.head.appendChild(styleSheet);
