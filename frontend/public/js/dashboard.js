class Dashboard {
    constructor() {
        this.initializeModules();
        this.setupEventListeners();
        this.loadInitialData();
    }

    initializeModules() {
        // Referencias DOM principales
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.content-section');
        this.sectionTitle = document.getElementById('sectionTitle');
        this.userName = document.getElementById('userName');
    }

    setupEventListeners() {
        // Navegación
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.changeSection(link.dataset.section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    async loadInitialData() {
        try {
            // Cargar estadísticas iniciales
            await this.loadDashboardStats();
            
            // Cargar datos de la sección actual
            const activeSection = document.querySelector('.nav-link.active').dataset.section;
            this.loadSectionData(activeSection);
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            if (error.message.includes('token')) {
                this.logout();
            }
        }
    }

    async loadDashboardStats() {
        try {
            document.getElementById('totalClientes').textContent = "0";
            document.getElementById('totalProductos').textContent = "0";
            document.getElementById('pedidosPendientes').textContent = "0";
            document.getElementById('ventasMes').textContent = "$0";
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    changeSection(sectionId) {
        // Limpiar contenido anterior
        this.clearSectionContent(sectionId);

        // Actualizar navegación
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            }
        });

        // Actualizar secciones visibles
        this.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionId}Section`) {
                section.classList.add('active');
                if (section.querySelector('h2')) {
                    this.sectionTitle.textContent = section.querySelector('h2').textContent;
                }
            }
        });

        // Cargar datos de la sección
        this.loadSectionData(sectionId);
    }

    clearSectionContent(sectionId) {
        const section = document.getElementById(`${sectionId}Section`);
        if (!section || sectionId === 'resumen') return; // No limpiar si es la sección resumen
    
        // Guardar el título y el botón
        const title = section.querySelector('h2');
        const button = section.querySelector('.btn-primary');
        const tableHeaders = section.querySelector('thead');
    
        // Limpiar el contenido de la sección
        section.innerHTML = '';
    
        // Restaurar elementos importantes
        if (title) section.appendChild(title);
        if (button) section.appendChild(button);
        
        // Recrear la estructura de la tabla si existía
        if (tableHeaders) {
            const table = document.createElement('table');
            table.className = 'data-table';
            table.id = `${sectionId}Table`;
            
            const thead = document.createElement('thead');
            thead.innerHTML = tableHeaders.innerHTML;
            
            const tbody = document.createElement('tbody');
            
            table.appendChild(thead);
            table.appendChild(tbody);
            
            const tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';
            tableContainer.appendChild(table);
            
            section.appendChild(tableContainer);
        }
    }

    loadSectionData(section) {
        switch (section) {
            case 'resumen':
                this.loadDashboardStats();
                break;
            case 'clientes':
                console.log('Cargando sección clientes');
                // Aquí irá la lógica para cargar clientes
                break;
            case 'productos':
                console.log('Cargando sección productos');
                // Aquí irá la lógica para cargar productos
                break;
            case 'pedidos':
                console.log('Cargando sección pedidos');
                // Aquí irá la lógica para cargar pedidos
                break;
        }
    }

    logout() {
        sessionStorage.removeItem('token');
        window.location.href = './index.html';
    }
}

// Utilidades globales
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = './index.html';
        return;
    }
    // Crear instancia del dashboard
    const dashboard = new Dashboard();
});
