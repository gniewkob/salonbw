import { mockAdminLogin } from '../support/mockLogin';

describe('admin manage data', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('deletes a product', () => {
        cy.intercept('GET', '**/api/products*', {
            fixture: 'products.json',
        }).as('getProd');
        cy.intercept('DELETE', '**/api/products/1', { statusCode: 204 }).as(
            'deleteProd',
        );
        cy.visit('/products');
        cy.wait('@profile');
        cy.wait('@getProd');
        cy.contains('Shampoo');
        cy.on('window:confirm', () => true);
        cy.contains('tr', 'Shampoo')
            .find('button')
            .contains('Delete')
            .click();
        cy.wait('@deleteProd');
        cy.contains('Shampoo').should('not.exist');
    });

    it('edits an employee', () => {
        cy.intercept('GET', '**/api/employees*', {
            fixture: 'employees.json',
        }).as('getEmps');
        cy.intercept('PUT', '**/api/employees/1', {
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
