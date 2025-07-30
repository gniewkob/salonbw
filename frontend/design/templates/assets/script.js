// Versum UI JavaScript

// Utility functions
const VersumUI = {
    // Initialize the UI
    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupTables();
        this.setupModals();
    },

    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.navbar-nav a');
        navLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach((l) => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
            });
        });
    },

    // Setup forms
    setupForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach((form) => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form);
            });
        });
    },

    // Handle form submission
    handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Zapisywanie...';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            this.showNotification('Dane zostały zapisane pomyślnie', 'success');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1000);
    },

    // Setup tables
    setupTables() {
        const tables = document.querySelectorAll('.table');
        tables.forEach((table) => {
            // Add sorting functionality
            const headers = table.querySelectorAll('th[data-sort]');
            headers.forEach((header) => {
                header.addEventListener('click', () => {
                    this.sortTable(table, header);
                });
            });
        });
    },

    // Sort table
    sortTable(table, header) {
        const column = header.dataset.sort;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((a, b) => {
            const aValue = a.querySelector(`td[data-${column}]`).textContent;
            const bValue = b.querySelector(`td[data-${column}]`).textContent;
            return aValue.localeCompare(bValue);
        });

        // Clear and re-append rows
        tbody.innerHTML = '';
        rows.forEach((row) => tbody.appendChild(row));
    },

    // Setup modals
    setupModals() {
        const modalTriggers = document.querySelectorAll('[data-modal]');
        modalTriggers.forEach((trigger) => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.dataset.modal;
                this.openModal(modalId);
            });
        });

        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    },

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    },

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#25B4C1',
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('pl-PL');
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount);
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone
    validatePhone(phone) {
        const re = /^[\+]?[0-9\s\-\(\)]{9,}$/;
        return re.test(phone);
    },
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .modal.show {
    opacity: 1;
  }

  .modal-content {
    background-color: white;
    margin: 10% auto;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    transform: translateY(-50px);
    transition: transform 0.3s ease;
  }

  .modal.show .modal-content {
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    VersumUI.init();
});

// Export for use in other scripts
window.VersumUI = VersumUI;
