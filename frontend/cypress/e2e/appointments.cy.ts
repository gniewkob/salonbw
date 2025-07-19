describe('appointments calendar', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', 'x');
  });

  it('drag, add and edit appointment', () => {
    cy.intercept('GET', '**/appointments', { fixture: 'appointments.json' }).as('getAppts');
    cy.intercept('PATCH', '**/appointments/admin/*', { id: 1 }).as('updateAppt');
    cy.intercept('POST', '**/appointments/admin', { id: 3 }).as('createAppt');
    cy.visit('/appointments');
    cy.wait('@getAppts');
    cy.contains('A');
    cy.get('.fc-daygrid-day').first().click();
    cy.get('input[type="datetime-local"]').type('2024-01-01T10:00');
    cy.contains('button', 'Save').click();
    cy.wait('@createAppt');
  });
});
