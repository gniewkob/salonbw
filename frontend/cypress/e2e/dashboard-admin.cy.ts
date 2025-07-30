describe('admin dashboard navigation', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
    localStorage.setItem('role', 'admin');
  });

  it('redirects to admin dashboard and shows widgets', () => {
    cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' }).as('dash');
    cy.visit('/dashboard');
    cy.wait('@dash');
    cy.url().should('include', '/dashboard/admin');
    cy.contains('Clients');
    cy.contains('Employees');
  });

  it('navigates to employees via sidebar', () => {
    cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' }).as('dash');
    cy.visit('/dashboard/admin');
    cy.wait('@dash');
    cy.contains('Employees').click();
    cy.url().should('include', '/employees');
  });
});

describe('admin dashboard services crud', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
    localStorage.setItem('role', 'admin');
    cy.intercept('GET', '**/services', { fixture: 'services.json' }).as('getSvc');
  });

  it('creates a service', () => {
    cy.intercept('POST', '**/services', { id: 3, name: 'Wax' }).as('createSvc');
    cy.visit('/dashboard/services');
    cy.wait('@getSvc');
    cy.contains('Add Service').click();
    cy.get('input[placeholder="Name"]').type('Wax');
    cy.contains('button', 'Save').click();
    cy.wait('@createSvc');
    cy.contains('Wax');
  });
});

describe('admin dashboard permissions', () => {
  it('redirects anonymous user', () => {
    cy.visit('/dashboard/admin');
    cy.url().should('include', '/auth/login');
  });
});
