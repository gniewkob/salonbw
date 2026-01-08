describe('registration', () => {
    it('registers and redirects to login', () => {
        cy.intercept('POST', '**/auth/register', {
            statusCode: 201,
            body: { id: 2, name: 'New User' },
        }).as('register');
        cy.visit('/auth/register');
        cy.get('input[placeholder="Name"]').type('User');
        cy.get('input[placeholder="Email"]').type('user@example.com');
        cy.get('input[placeholder="Phone"]').type('123456789');
        cy.get('input[placeholder="Password"]').type('secret');
        cy.contains('button', 'Register').click();
        cy.wait('@register');
        cy.url().should('include', '/auth/login');
    });
});
