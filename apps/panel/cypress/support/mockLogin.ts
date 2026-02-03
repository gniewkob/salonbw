const buildToken = (role: string) =>
    `header.${Buffer.from(JSON.stringify({ role })).toString('base64')}.sig`;

function applyMockLogin(role: 'admin' | 'client' | 'employee', name: string) {
    const token = buildToken(role);

    // Use wildcard pattern to match requests regardless of the baseURL
    cy.intercept('POST', 'http://localhost:3001/auth/login', {
        accessToken: token,
        refreshToken: 'refresh',
    }).as('login');

    cy.intercept('GET', 'http://localhost:3001/users/profile', {
        id: 1,
        name,
        role,
    }).as('profile');

    cy.on('uncaught:exception', () => false);
    cy.visit('/auth/login');
    cy.setCookie('accessToken', token);
    cy.setCookie('refreshToken', 'refresh');
    cy.setCookie('sbw_auth', 'true');
    cy.setCookie('token', token);
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
