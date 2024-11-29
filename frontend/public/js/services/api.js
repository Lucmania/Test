const API_URL = 'http://localhost:3000/api';

class ApiService {
    constructor() {
        this.token = sessionStorage.getItem('token');
        this.API_URL = API_URL;
    }

    setToken(token) {
        this.token = token;
        sessionStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        sessionStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.API_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la solicitud');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async login(credentials) {
        try {
            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            if (data.token) {
                this.setToken(data.token);
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Métodos para clientes
    async getClientes() {
        return await this.request('/clientes');
    }

    async createCliente(clienteData) {
        return await this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
    }

    async updateCliente(id, clienteData) {
        return await this.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(clienteData)
        });
    }

    async deleteCliente(id) {
        return await this.request(`/clientes/${id}`, {
            method: 'DELETE'
        });
    }

    // Métodos para productos
    async getProductos() {
        return await this.request('/productos');
    }

    async createProducto(productoData) {
        return await this.request('/productos', {
            method: 'POST',
            body: JSON.stringify(productoData)
        });
    }

    async updateProducto(id, productoData) {
        return await this.request(`/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productoData)
        });
    }

    async deleteProducto(id) {
        return await this.request(`/productos/${id}`, {
            method: 'DELETE'
        });
    }

    // Métodos para pedidos
    async getPedidos() {
        return await this.request('/pedidos');
    }

    async createPedido(pedidoData) {
        return await this.request('/pedidos', {
            method: 'POST',
            body: JSON.stringify(pedidoData)
        });
    }

    async updatePedidoStatus(id, estado) {
        return await this.request(`/pedidos/${id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado })
        });
    }
}

const api = new ApiService();
