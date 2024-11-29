class ProductosModule {
    constructor() {
        this.newProductoBtn = document.getElementById('newProductoBtn');
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.initializeEvents();
    }

    initializeEvents() {
        this.newProductoBtn.addEventListener('click', () => {
            this.showProductoForm();
        });
    }

    showProductoForm(productoData = null) {
        const title = productoData ? 'Editar Producto' : 'Nuevo Producto';
        const content = `
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="productoForm">
                    ${productoData ? `<input type="hidden" name="id" value="${productoData.id}">` : ''}
                    <div class="form-group">
                        <label for="nombre">Nombre *</label>
                        <input type="text" id="nombre" name="nombre" required 
                            value="${productoData?.nombre || ''}">
                    </div>
                    <div class="form-group">
                        <label for="precio">Precio *</label>
                        <input type="number" id="precio" name="precio" step="0.01" required
                            value="${productoData?.precio || ''}">
                    </div>
                    <div class="form-group">
                        <label for="descripcion">Descripción *</label>
                        <textarea id="descripcion" name="descripcion" required rows="4">${productoData?.descripcion || ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="modal.close()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            ${productoData ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        modal.show(content);

        document.getElementById('productoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const productoData = Object.fromEntries(formData.entries());

            try {
                if (productoData.id) {
                    await api.request(`/productos/${productoData.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(productoData)
                    });
                } else {
                    await api.request('/productos', {
                        method: 'POST',
                        body: JSON.stringify(productoData)
                    });
                }

                modal.close();
                modal.showAlert(
                    `Producto ${productoData.id ? 'actualizado' : 'creado'} exitosamente`, 
                    'success'
                );
                this.loadProductos();
            } catch (error) {
                modal.showAlert(error.message, 'error');
            }
        });
    }

    async loadProductos() {
        try {
            const productos = await api.request('/productos');
            this.renderPaginatedProductos(productos);
        } catch (error) {
            modal.showAlert('Error al cargar productos', 'error');
        }
    }

    renderPaginatedProductos(productos) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProductos = productos.slice(startIndex, endIndex);
        const totalPages = Math.ceil(productos.length / this.itemsPerPage);

        this.renderProductosTable(paginatedProductos);
        this.renderPagination(totalPages);
    }

    renderProductosTable(productos) {
        const tbody = document.querySelector('#productosTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        productos.forEach(producto => {
            tbody.innerHTML += `
                <tr>
                    <td>${producto.nombre}</td>
                    <td>${formatCurrency(producto.precio)}</td>
                    <td>${producto.descripcion}</td>
                    <td>
                        <button onclick="productosModule.editarProducto(${producto.id})" class="btn-edit">
                            Editar
                        </button>
                        <button onclick="productosModule.eliminarProducto(${producto.id})" class="btn-delete">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // ... Mismos métodos de paginación que en ClientesModule ...

    async editarProducto(id) {
        try {
            const producto = await api.request(`/productos/${id}`);
            this.showProductoForm(producto);
        } catch (error) {
            modal.showAlert('Error al cargar producto', 'error');
        }
    }

    async eliminarProducto(id) {
        modal.showConfirm(
            '¿Está seguro de eliminar este producto?',
            async () => {
                try {
                    await api.request(`/productos/${id}`, { method: 'DELETE' });
                    this.loadProductos();
                    modal.showAlert('Producto eliminado exitosamente', 'success');
                } catch (error) {
                    modal.showAlert('Error al eliminar producto', 'error');
                }
            }
        );
    }
}

const productosModule = new ProductosModule();
