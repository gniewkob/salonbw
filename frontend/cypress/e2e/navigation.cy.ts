describe('navigation visibility', () => {
  it('shows dashboard navigation for authenticated users on /products', () => {
    localStorage.setItem('jwtToken', 'x');
    localStorage.setItem('role', 'admin');
    cy.intercept('GET', '**/products**', { fixture: 'products.json' }).as('getProd');
    cy.visit('/products');
    cy.wait('@getProd');
    cy.contains('Dashboard');
    cy.contains('Products');
  });

  it('redirects unauthenticated users away from /products', () => {
    cy.visit('/products');
    cy.url().should('include', '/auth/login');
  });

  it('renders public navigation on public pages', () => {
    cy.intercept('GET', '**/services**', { fixture: 'services.json' }).as('getServices');
    cy.visit('/services');
    cy.wait('@getServices');
    cy.get('nav').contains('Login');
    cy.get('nav').contains('Services');
  });
});
