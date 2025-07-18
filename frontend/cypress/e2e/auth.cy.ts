describe('auth guard', () => {
  it('redirects unauthenticated user', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
