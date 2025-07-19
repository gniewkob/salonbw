describe('basic', () => {
  it('loads home', () => {
    cy.visit('/');
    cy.contains('Home Page');
  });
});
