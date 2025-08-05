describe('basic', () => {
  it('loads home', () => {
    cy.visit('/');
    cy.contains('Home Page');
  });
});
describe('reviews crud', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
  });

  it('loads and creates review', () => {
    cy.intercept('GET', '**/employees/*/reviews', { fixture: 'reviews.json' }).as('getRev');
    cy.intercept('POST', '**/appointments/*/review', {
      id: 2,
      appointmentId: 1,
      rating: 5,
    }).as('createRev');
    cy.visit('/reviews');
    cy.wait('@getRev');
    cy.contains('Add Review').click();
    cy.get('input[placeholder="Appointment"]').type('1');
    cy.get('input[placeholder="Rating"]').type('5');
    cy.contains('button', 'Save').click();
    cy.wait('@createRev');
    cy.contains('Review created');
  });
});
