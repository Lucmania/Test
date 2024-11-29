// frontend/public/js/modules/clientes.js
class ClientesModule {
    constructor() {
        this.newClienteBtn = document.getElementById('newClienteBtn');
        this.itemsPerPage = 10; // Cantidad de items por página
        this.currentPage = 1;
        this.initializeEvents();
    }

    initializeEvents() {
        this.newClienteBtn.addEventListener('click', () => {
            this.showClienteForm();
        });
    }

    showClienteForm(clienteData = null) {
        const title = clienteData ? 'Editar Cliente' : 'Nuevo Cliente';
        const content = `
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="clienteForm">
                    ${clienteData ? `<input type="hidden" name="id" value="${clienteData.id}">` : ''}
                    <div class="form-group">
                        <label for="nombre_apellido">Nombre y Apellido *</label>
                        <input type="text" id="nombre_apellido" name="nombre_apellido" required 
                            value="${clienteData?.nombre_apellido || ''}">
                    </div>
                    <div class="form-group">
                        <label for="telefono">Teléfono *</label>
                        <input type="tel" id="telefono" name="telefono" required
                            value="${clienteData?.telefono || ''}" 
                            ${clienteData ? 'readonly' : ''}>
                    </div>
                    <div class="form-group">
                        <label for="barrio">Barrio *</label>
                        <input type="text" id="barrio" name="barrio" required
                            value="${clienteData?.barrio || ''}">
                    </div>
                    <div class="form-group">
                        <label for="direccion">Dirección *</label>
                        <input type="text" id="direccion" name="direccion" required
                            value="${clienteData?.direccion || ''}">
                    </div>
                    <div class="form-group">
                        <label for="piso_depto">Piso y Departamento</label>
                        <input type="text" id="piso_depto" name="piso_depto"
                            value="${clienteData?.piso_depto || ''}">
                        <small>Opcional</small>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="modal.close()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            ${clienteData ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        modal.show(content);

        document.getElementById('clienteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const clienteData = Object.fromEntries(formData.entries());

            try {
                if (clienteData.id) {
                    await api.request(`/clientes/${clienteData.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(clienteData)
                    });
                } else {
                    await api.request('/clientes', {
                        method: 'POST',
                        body: JSON.stringify(clienteData)
                    });
                }

                modal.close();
                modal.showAlert(
                    `Cliente ${clienteData.id ? 'actualizado' : 'creado'} exitosamente`, 
                    'success'
                );
                this.loadClientes();
            } catch (error) {
                modal.showAlert(error.message, 'error');
            }
        });
    }

    async loadClientes() {
        try {
            const clientes = await api.request('/clientes');
            this.renderPaginatedClientes(clientes);
        } catch (error) {
            modal.showAlert('Error al cargar clientes', 'error');
        }
    }

    renderPaginatedClientes(clientes) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedClientes = clientes.slice(startIndex, endIndex);
        const totalPages = Math.ceil(clientes.length / this.itemsPerPage);

        this.renderClientesTable(paginatedClientes);
        this.renderPagination(totalPages);
    }

    renderClientesTable(clientes) {
        const tbody = document.querySelector('#clientesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        clientes.forEach(cliente => {
            tbody.innerHTML += `
                <tr>
                    <td>${cliente.id}</td>
                    <td>${cliente.nombre_apellido}</td>
                    <td>${cliente.telefono}</td>
                    <td>${cliente.barrio}</td>
                    <td>${cliente.direccion}</td>
                    <td>${cliente.piso_depto || '-'}</td>
                    <td>
                        <button onclick="clientesModule.editarCliente(${cliente.id})" class="btn-edit">
                            Editar
                        </button>
                        <button onclick="clientesModule.eliminarCliente(${cliente.id})" class="btn-delete">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    renderPagination(totalPages) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        
        // Botón anterior
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.className = 'btn-secondary';
        prevButton.disabled = this.currentPage === 1;
        prevButton.onclick = () => this.changePage(this.currentPage - 1);
        
        // Botón siguiente
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.className = 'btn-secondary';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.onclick = () => this.changePage(this.currentPage + 1);
        
        // Números de página
        const pageNumbers = document.createElement('div');
        pageNumbers.className = 'page-numbers';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === this.currentPage ? 'active' : '';
            pageButton.onclick = () => this.changePage(i);
            pageNumbers.appendChild(pageButton);
        }
        
        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageNumbers);
        paginationContainer.appendChild(nextButton);
        
        // Agregar paginación al DOM
        const tableContainer = document.querySelector('.table-container');
        const existingPagination = tableContainer.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        tableContainer.appendChild(paginationContainer);
    }

    changePage(page) {
        this.currentPage = page;
        this.loadClientes();
    }

    async editarCliente(id) {
        try {
            const cliente = await api.request(`/clientes/${id}`);
            this.showClienteForm(cliente);
        } catch (error) {
            modal.showAlert('Error al cargar cliente', 'error');
        }
    }

    async eliminarCliente(id) {
        modal.showConfirm(
            '¿Está seguro de eliminar este cliente?',
            async () => {
                try {
                    await api.request(`/clientes/${id}`, { method: 'DELETE' });
                    this.loadClientes();
                    modal.showAlert('Cliente eliminado exitosamente', 'success');
                } catch (error) {
                    modal.showAlert('Error al eliminar cliente', 'error');
                }
            }
        );
    }
}

// Crear instancia global
const clientesModule = new ClientesModule();

// Agregar estilos de paginación
const paginationStyles = `
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem;
}

.page-numbers {
    display: flex;
    gap: 0.5rem;
}

.pagination button {
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
}

.pagination button.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = paginationStyles;
document.head.appendChild(styleSheet);
