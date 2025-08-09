describe('employee dashboard navigation', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
    localStorage.setItem('role', 'employee');
  });

  it('redirects to employee dashboard and shows widgets', () => {
    cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' }).as('dash');
    cy.visit('/dashboard');
    cy.wait('@dash');
    cy.url().should('include', '/dashboard/employee');
    cy.contains('Today Appointments');
    cy.contains('Clients');
  });

  it('navigates to clients via sidebar', () => {
    cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' }).as('dash');
    cy.visit('/dashboard/employee');
    cy.wait('@dash');
    cy.contains('Clients').click();
    cy.url().should('include', '/clients');
  });
});

describe('employee dashboard clients crud', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
    localStorage.setItem('role', 'employee');
    cy.intercept('GET', '**/clients', { fixture: 'clients.json' }).as('getClients');
  });

  it('creates a client', () => {
    cy.intercept('POST', '**/clients', { id: 3, name: 'New' }).as('createClient');
    cy.visit('/clients');
    cy.wait('@getClients');
    cy.contains('Add Client').click();
    cy.get('input[placeholder="Name"]').type('New');
    cy.contains('button', 'Save').click();
    cy.wait('@createClient');
    cy.contains('New');
  });
});

describe('employee dashboard permissions', () => {
  it('redirects anonymous user', () => {
    cy.visit('/dashboard/employee');
    cy.url().should('include', '/auth/login');
  });
});
