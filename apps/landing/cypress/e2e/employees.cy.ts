import { mockAdminLogin } from '../support/mockLogin';

describe('basic', () => {
    it('loads home', () => {
        cy.visit('/');
        cy.contains('Featured Services');
    });
});

describe('employees crud', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('loads and creates employee', () => {
        cy.intercept('GET', '**/employees*', {
            fixture: 'employees.json',
        }).as('getEmps');
        cy.intercept('POST', '**/employees', {
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
