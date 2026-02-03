describe('registration', () => {
    it('registers and redirects to dashboard', () => {
        const token =
            'header.' +
            Buffer.from(JSON.stringify({ role: 'client' })).toString('base64') +
            '.sig';
        cy.intercept('POST', 'http://localhost:3001/auth/register', {
            statusCode: 201,
            body: { id: 2, name: 'New User' },
        }).as('register');
        cy.intercept('POST', 'http://localhost:3001/auth/login', {
            accessToken: token,
            refreshToken: 'refresh',
        }).as('login');
        cy.intercept('GET', 'http://localhost:3001/users/profile', {
            id: 2,
            name: 'New User',
            role: 'client',
        }).as('profile');
        cy.visit('/auth/register');
        cy.get('input[placeholder="Name"]').type('User');
        cy.get('input[placeholder="Email"]').type('user@example.com');
        cy.get('input[placeholder="Phone (optional)"]').type('123456789');
        cy.get('input[placeholder="Password"]').type('secret');
        cy.contains('button', 'Register').click();
        cy.wait(['@register', '@login', '@profile']);
        cy.url().should('include', '/dashboard');
    });
});
