import { mockAdminLogin } from '../support/mockLogin';

describe('employees crud', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('loads and creates employee', () => {
        cy.intercept('GET', 'http://localhost:3001/employees*', {
            fixture: 'employees.json',
        }).as('getEmps');
        cy.intercept('POST', 'http://localhost:3001/employees', {
            id: 3,
            firstName: 'New',
            lastName: 'Employee',
            fullName: 'New Employee',
        }).as('createEmp');
        cy.visit('/employees');
        cy.contains('Add Employee', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="First name"]').type('New');
        cy.get('input[placeholder="Last name"]').type('Employee');
        cy.contains('button', 'Save').click();
        cy.wait('@createEmp');
        cy.contains('New Employee');
        cy.contains('Employee created');
    });
});
