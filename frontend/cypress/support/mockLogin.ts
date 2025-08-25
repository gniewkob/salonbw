const buildToken = (role: string) =>
    `header.${Buffer.from(JSON.stringify({ role })).toString('base64')}.sig`;

export function mockAdminLogin() {
    const token = buildToken('admin');
    cy.intercept('POST', '/api/auth/login', {
        accessToken: token,
        refreshToken: 'refresh',
    }).as('login');
    cy.intercept('GET', '/api/profile', {
        id: 1,
        name: 'Admin User',
        role: 'admin',
    }).as('profile');
    cy.intercept('GET', '/api/dashboard', {
        fixture: 'dashboard.json',
    }).as('dashboard');
    cy.visit('/auth/login');
    cy.get('input[name=email]').type('admin@example.com');
    cy.get('input[name=password]').type('secret');
    cy.get('button[type=submit]').click();
    cy.wait(['@login', '@profile', '@dashboard']);
}

export function mockClientLogin() {
    const token = buildToken('client');
    cy.intercept('POST', '/api/auth/login', {
        accessToken: token,
        refreshToken: 'refresh',
    }).as('login');
    cy.intercept('GET', '/api/profile', {
        id: 1,
        name: 'Test Client',
        role: 'client',
    }).as('profile');
    cy.intercept('GET', '/api/dashboard', {
        fixture: 'dashboard.json',
    }).as('dashboard');
    cy.visit('/auth/login');
    cy.get('input[name=email]').type('client@example.com');
    cy.get('input[name=password]').type('secret');
    cy.get('button[type=submit]').click();
    cy.wait(['@login', '@profile', '@dashboard']);
}

export function mockEmployeeLogin() {
    const token = buildToken('employee');
    cy.intercept('POST', '/api/auth/login', {
        accessToken: token,
        refreshToken: 'refresh',
    }).as('login');
    cy.intercept('GET', '/api/profile', {
        id: 1,
        name: 'Employee User',
        role: 'employee',
    }).as('profile');
    cy.intercept('GET', '/api/dashboard', {
        fixture: 'dashboard.json',
    }).as('dashboard');
    cy.visit('/auth/login');
    cy.get('input[name=email]').type('employee@example.com');
    cy.get('input[name=password]').type('secret');
    cy.get('button[type=submit]').click();
    cy.wait(['@login', '@profile', '@dashboard']);
}
