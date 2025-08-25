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

    cy.setCookie('jwtToken', token);
    cy.setCookie('refreshToken', 'refresh');

    localStorage.setItem('jwtToken', token);
    localStorage.setItem('refreshToken', 'refresh');
    localStorage.setItem('role', role);
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

