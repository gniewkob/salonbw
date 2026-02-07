import { mockAdminLogin } from '../support/mockLogin';

describe('admin manage data', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('deletes a product', () => {
        // Load with a single product from fixture
        cy.intercept('GET', 'http://localhost:3001/products*', {
            fixture: 'products.json',
        }).as('getProd');
        cy.intercept('DELETE', 'http://localhost:3001/products/1', {
            statusCode: 204,
        }).as('deleteProd');

        cy.visit('/products');
        cy.wait('@profile');
        cy.wait('@getProd');
        // Ensure the product is visible
        cy.contains('tr', 'Shampoo', { timeout: 10000 }).should('be.visible');

        // Delete the product
        cy.on('window:confirm', () => true);
        cy.contains('tr', 'Shampoo').within(() => {
            cy.contains('button', 'Delete').click();
        });
        cy.wait('@deleteProd');
        cy.contains('Product deleted');
        cy.contains('Shampoo').should('not.exist');
        cy.get('tbody tr', { timeout: 10000 }).should('have.length', 0);
    });

    it('edits an employee', () => {
        cy.intercept('GET', 'http://localhost:3001/employees*', {
            fixture: 'employees.json',
        }).as('getEmps');
        cy.intercept('PUT', 'http://localhost:3001/employees/1', {
            statusCode: 200,
            body: {
                id: 1,
                firstName: 'Edited',
                lastName: 'One',
                fullName: 'Edited One',
            },
        }).as('updateEmp');
        cy.visit('/employees');
        cy.wait('@profile');
        cy.wait('@getEmps');
        cy.contains('E1 One');
        cy.contains('button', 'Edit').first().click();
        cy.get('input[placeholder="First name"]').clear().type('Edited');
        cy.contains('button', 'Save').click();
        cy.wait('@updateEmp');
        cy.contains('Edited One');
    });
});
