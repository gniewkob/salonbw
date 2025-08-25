const clientToken = `header.${Buffer.from(JSON.stringify({ role: 'client' })).toString('base64')}.sig`;

function mockLogin() {
    cy.intercept('POST', '/api/auth/login', {
        accessToken: clientToken,
        refreshToken: 'refresh',
    }).as('login');
    cy.intercept('GET', '/api/profile', {
        id: 1,
        name: 'Test Client',
        role: 'client',
    }).as('profile');
    cy.intercept('GET', '/api/dashboard', {
        todayCount: 0,
        clientCount: 0,
    }).as('dashboard');
}

describe('authentication flow', () => {
    it('successful login redirects to /dashboard and shows user-specific feedback', () => {
        mockLogin();
        cy.visit('/auth/login');
        cy.get('input[name=email]').type('client@example.com');
        cy.get('input[name=password]').type('secret');
        cy.get('button[type=submit]').click();
        cy.wait(['@login', '@profile', '@dashboard']);
        cy.url().should('include', '/dashboard/client');
        cy.contains('Upcoming');
    });

    it('logout returns to /auth/login and clears session', () => {
        mockLogin();
        cy.visit('/auth/login');
        cy.get('input[name=email]').type('client@example.com');
        cy.get('input[name=password]').type('secret');
        cy.get('button[type=submit]').click();
        cy.wait(['@login', '@profile', '@dashboard']);
        cy.contains('Logout').click();
        cy.url().should('include', '/auth/login');
        cy.window().then((win) => {
            expect(win.localStorage.getItem('jwtToken')).to.be.null;
            expect(win.localStorage.getItem('refreshToken')).to.be.null;
        });
    });

    it('direct navigation to /dashboard when logged out redirects to /auth/login', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/auth/login');
    });

    it('client visiting /dashboard/employee is redirected to /dashboard/client', () => {
        mockLogin();
        cy.visit('/auth/login');
        cy.get('input[name=email]').type('client@example.com');
        cy.get('input[name=password]').type('secret');
        cy.get('button[type=submit]').click();
        cy.wait(['@login', '@profile', '@dashboard']);
        cy.visit('/dashboard/employee');
        cy.url().should('include', '/dashboard/client');
    });
});
