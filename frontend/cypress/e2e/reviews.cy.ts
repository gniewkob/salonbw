describe('reviews crud', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
  });

  it('loads and creates review', () => {
    cy.intercept('GET', '**/reviews', { fixture: 'reviews.json' }).as('getRev');
    cy.intercept('POST', '**/reviews', { id: 2, reservationId: 1, rating: 5 }).as('createRev');
    cy.visit('/reviews');
    cy.wait('@getRev');
    cy.contains('Add Review').click();
    cy.get('input[placeholder="Reservation"]').type('1');
    cy.get('input[placeholder="Rating"]').type('5');
    cy.contains('button', 'Save').click();
    cy.wait('@createRev');
    cy.contains('Review created');
  });
});
