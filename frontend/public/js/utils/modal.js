// frontend/public/js/utils/modal.js
class Modal {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.setupCloseEvents();
    }

    setupCloseEvents() {
        // Cerrar al hacer clic fuera del modal
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Cerrar con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.style.display === 'flex') {
                this.close();
            }
        });
    }

    show(content) {
        // Si es string, insertarlo directamente
        if (typeof content === 'string') {
            this.overlay.innerHTML = content;
        } else {
            // Si es un elemento DOM, limpiamos y agregamos
            this.overlay.innerHTML = '';
            this.overlay.appendChild(content);
        }
        
        this.overlay.style.display = 'flex';
        
        // Enfocar el primer input si existe
        const firstInput = this.overlay.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }

    close() {
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = '';
    }

    showLoading() {
        this.show(`
            <div class="modal-content loading-modal">
                <div class="spinner"></div>
                <p>Cargando...</p>
            </div>
        `);
    }

    showConfirm(message, onConfirm, onCancel) {
        this.show(`
            <div class="modal-content">
                <h2>Confirmar</h2>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-secondary" id="modalCancelBtn">Cancelar</button>
                    <button class="btn-primary" id="modalConfirmBtn">Confirmar</button>
                </div>
            </div>
        `);

        document.getElementById('modalConfirmBtn').addEventListener('click', () => {
            onConfirm();
            this.close();
        });

        document.getElementById('modalCancelBtn').addEventListener('click', () => {
            if (onCancel) onCancel();
            this.close();
        });
    }

    showAlert(message, type = 'info') {
        const icon = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        }[type];

        this.show(`
            <div class="modal-content">
                <div class="alert alert-${type}">
                    <span class="alert-icon">${icon}</span>
                    <p>${message}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="modal.close()">Aceptar</button>
                </div>
            </div>
        `);
    }
}

const modal = new Modal();
