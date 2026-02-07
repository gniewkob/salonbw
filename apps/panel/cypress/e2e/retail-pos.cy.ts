import { mockAdminLogin } from '../support/mockLogin';

describe('POS operations', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('records a product sale', () => {
        const now = new Date().toISOString();
        cy.intercept('GET', 'http://localhost:3001/products*', {
            fixture: 'products.json',
        }).as('getProducts');
        cy.intercept('GET', 'http://localhost:3001/employees*', {
            fixture: 'employees.json',
        }).as('getEmployees');
        cy.intercept('GET', 'http://localhost:3001/appointments*', {
            fixture: 'appointments.json',
        }).as('getAppointments');
        cy.intercept('GET', 'http://localhost:3001/inventory*', {
            fixture: 'inventory.json',
        }).as('getInventory');
        cy.intercept('GET', 'http://localhost:3001/sales/summary*', {
            source: 'product_sales',
            units: 0,
            revenue: 0,
            from: now,
            to: now,
        }).as('getSummary');
        cy.intercept('POST', 'http://localhost:3001/sales', {
            status: 'ok',
        }).as('createSale');

        cy.visit('/dashboard/admin/retail');
        cy.wait([
            '@profile',
            '@getProducts',
            '@getEmployees',
            '@getAppointments',
            '@getInventory',
            '@getSummary',
        ]);

        cy.contains('button', 'Record Sale').click();
        cy.get('[data-testid="product-select"]').click();
        cy.get('[data-testid="product-option-1"]').click();
        cy.get('input[placeholder="Quantity"]').clear().type('2');
        cy.get('[data-testid="employee-select"]').click();
        cy.get('[data-testid="employee-option-1"]').click();
        cy.contains('button', 'Save').click();

        cy.wait('@createSale');
        cy.contains('Sale recorded').should('be.visible');
        cy.contains('Record Product Sale').should('not.exist');
    });

    it('adjusts inventory with positive delta', () => {
        const now = new Date().toISOString();
        cy.intercept('GET', 'http://localhost:3001/products*', {
            fixture: 'products.json',
        }).as('getProducts');
        cy.intercept('GET', 'http://localhost:3001/employees*', {
            fixture: 'employees.json',
        }).as('getEmployees');
        cy.intercept('GET', 'http://localhost:3001/appointments*', {
            fixture: 'appointments.json',
        }).as('getAppointments');
        cy.intercept('GET', 'http://localhost:3001/inventory*', {
            fixture: 'inventory.json',
        }).as('getInventory');
        cy.intercept('GET', 'http://localhost:3001/sales/summary*', {
            source: 'product_sales',
            units: 0,
            revenue: 0,
            from: now,
            to: now,
        }).as('getSummary');
        cy.intercept('POST', 'http://localhost:3001/inventory/adjust', {
            status: 'ok',
        }).as('adjustInventory');

        cy.visit('/dashboard/admin/retail');
        cy.wait([
            '@profile',
            '@getProducts',
            '@getEmployees',
            '@getAppointments',
            '@getInventory',
            '@getSummary',
        ]);

        cy.contains('button', 'Adjust Inventory').click();
        cy.get('[data-testid="product-select"]').click();
        cy.get('[data-testid="product-option-1"]').click();
        cy.get('input[placeholder="Delta"]').clear().type('10');
        cy.get('[data-testid="reason-select"]').click();
        cy.get('[data-testid="reason-option-delivery"]').click();
        cy.get('textarea[placeholder="Note (optional)"]').type('Batch X');
        cy.contains('button', 'Save').click();

        cy.wait('@adjustInventory');
        cy.contains('Inventory adjusted').should('be.visible');
        cy.contains('Adjust Inventory').should('not.exist');
    });

    it('adjusts inventory with negative delta', () => {
        const now = new Date().toISOString();
        cy.intercept('GET', 'http://localhost:3001/products*', {
            fixture: 'products.json',
        }).as('getProducts');
        cy.intercept('GET', 'http://localhost:3001/employees*', {
            fixture: 'employees.json',
        }).as('getEmployees');
        cy.intercept('GET', 'http://localhost:3001/appointments*', {
            fixture: 'appointments.json',
        }).as('getAppointments');
        cy.intercept('GET', 'http://localhost:3001/inventory*', {
            fixture: 'inventory.json',
        }).as('getInventory');
        cy.intercept('GET', 'http://localhost:3001/sales/summary*', {
            source: 'product_sales',
            units: 0,
            revenue: 0,
            from: now,
            to: now,
        }).as('getSummary');
        cy.intercept('POST', 'http://localhost:3001/inventory/adjust', {
            status: 'ok',
        }).as('adjustInventory');

        cy.visit('/dashboard/admin/retail');
        cy.wait([
            '@profile',
            '@getProducts',
            '@getEmployees',
            '@getAppointments',
            '@getInventory',
            '@getSummary',
        ]);

        cy.contains('button', 'Adjust Inventory').click();
        cy.get('[data-testid="product-select"]').click();
        cy.get('[data-testid="product-option-1"]').click();
        cy.get('input[placeholder="Delta"]').clear().type('-5');
        cy.get('[data-testid="reason-select"]').click();
        cy.get('[data-testid="reason-option-damage"]').click();
        cy.contains('button', 'Save').click();

        cy.wait('@adjustInventory');
        cy.contains('Inventory adjusted').should('be.visible');
        cy.contains('Adjust Inventory').should('not.exist');
    });

    it('shows validation error for empty sale form', () => {
        const now = new Date().toISOString();
        cy.intercept('GET', 'http://localhost:3001/products*', {
            fixture: 'products.json',
        }).as('getProducts');
        cy.intercept('GET', 'http://localhost:3001/employees*', {
            fixture: 'employees.json',
        }).as('getEmployees');
        cy.intercept('GET', 'http://localhost:3001/appointments*', {
            fixture: 'appointments.json',
        }).as('getAppointments');
        cy.intercept('GET', 'http://localhost:3001/inventory*', {
            fixture: 'inventory.json',
        }).as('getInventory');
        cy.intercept('GET', 'http://localhost:3001/sales/summary*', {
            source: 'product_sales',
            units: 0,
            revenue: 0,
            from: now,
            to: now,
        }).as('getSummary');
        let createSaleCalled = false;
        cy.intercept('POST', 'http://localhost:3001/sales', (req) => {
            createSaleCalled = true;
            req.reply({ status: 'ok' });
        }).as('createSale');

        cy.visit('/dashboard/admin/retail');
        cy.wait([
            '@profile',
            '@getProducts',
            '@getEmployees',
            '@getAppointments',
            '@getInventory',
            '@getSummary',
        ]);

        cy.contains('button', 'Record Sale').click();
        cy.get('input[placeholder="Quantity"]').clear();
        cy.contains('button', 'Save').click();
        cy.get('[role="alert"]').should('be.visible');
        cy.wrap(null).then(() => {
            expect(createSaleCalled).to.be.false;
        });
    });
});
