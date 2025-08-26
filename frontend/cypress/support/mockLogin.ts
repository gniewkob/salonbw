const buildToken = (role: string) =>
    `header.${Buffer.from(JSON.stringify({ role })).toString('base64')}.sig`;

function applyMockLogin(role: 'admin' | 'client' | 'employee', name: string) {
    const token = buildToken(role);

    cy.intercept('POST', '/api/auth/login', {
        accessToken: token,
        refreshToken: 'refresh',
    }).as('login');

    cy.intercept('GET', '/api/profile', {
        id: 1,
        name,
        role,
    }).as('profile');

    cy.visit('/');

    cy.setCookie('jwtToken', token);
    cy.setCookie('refreshToken', 'refresh');

    cy.window().then((win) => {
        win.localStorage.setItem('jwtToken', token);
        win.localStorage.setItem('refreshToken', 'refresh');
        win.localStorage.setItem('role', role);
    });
}

export function mockAdminLogin() {
    applyMockLogin('admin', 'Admin User');
}

export function mockClientLogin() {
    applyMockLogin('client', 'Test Client');
}

export function mockEmployeeLogin() {
    applyMockLogin('employee', 'Employee User');
}

