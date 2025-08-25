describe('basic', () => {
    it('loads home', () => {
        cy.visit('/');
        cy.contains('Featured Services');
    });
});

describe('employees crud', () => {
    beforeEach(() => {
        localStorage.setItem('jwtToken', 'x');
    });

    it('loads and creates employee', () => {
        cy.intercept('GET', '/api/employees', { fixture: 'employees.json' }).as(
            'getEmps',
        );
        cy.intercept('POST', '/api/employees', { id: 3, name: 'New' }).as(
            'createEmp',
        );
        cy.visit('/employees');
        cy.wait('@getEmps');
        cy.contains('Add Employee').click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.contains('button', 'Save').click();
        cy.wait('@createEmp');
        cy.contains('New');
        cy.contains('Employee created');
    });
});
