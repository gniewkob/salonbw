describe('dashboard access', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
    cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' });
  });

  it('loads after login', () => {
    cy.visit('/dashboard');
    cy.contains('Klienci');
    cy.contains('Pracownicy');
  });
});
