describe('clients crud', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
  });

  it('loads and creates client', () => {
    cy.intercept('GET', '**/clients', { fixture: 'clients.json' }).as('getClients');
    cy.intercept('POST', '**/clients', { id: 3, name: 'New' }).as('createClient');
    cy.visit('/clients');
    cy.wait('@getClients');
    cy.contains('Add Client').click();
    cy.get('input[placeholder="Name"]').type('New');
    cy.contains('button', 'Save').click();
    cy.wait('@createClient');
    cy.contains('New');
    cy.contains('Client created');
  });
});
