import { mockClientLogin } from '../support/mockLogin';

describe('basic', () => {
    it('loads home', () => {
        cy.visit('/');
        cy.contains('Featured Services');
    });
});

describe('reviews crud', () => {
    beforeEach(() => {
        mockClientLogin();
    });

    it('loads and creates review', () => {
        cy.intercept('GET', '/api/employees/*/reviews*', {
            fixture: 'reviews.json',
        }).as('getReviews');
        cy.intercept('POST', '/api/employees/*/reviews*', {
            id: 2,
            appointmentId: 1,
            rating: 5,
        }).as('createReview');
        cy.visit('/reviews');
        cy.wait('@getReviews');
        cy.contains('Add Review').click();
        cy.get('input[placeholder="Appointment"]').type('1');
        cy.get('input[placeholder="Rating"]').type('5');
        cy.contains('button', 'Save').click();
        cy.wait('@createReview');
        cy.contains('Review created');
    });
});
