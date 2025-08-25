import { mockClientLogin } from '../support/mockLogin';

describe('client dashboard navigation', () => {
    beforeEach(() => {
        mockClientLogin();
    });

    it('redirects to client dashboard and shows widgets', () => {
        cy.visit('/dashboard');
        cy.wait('@dashboard');
        cy.url().should('include', '/dashboard/client');
        cy.contains('Upcoming');
    });

    it('navigates to reviews via sidebar', () => {
        cy.visit('/dashboard/client');
        cy.wait('@dashboard');
        cy.contains('Reviews').click();
        cy.url().should('include', '/reviews');
    });
});

describe('client dashboard reviews crud', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.intercept('GET', '**/api/employees/*/reviews', {
            fixture: 'reviews.json',
        }).as('getReviews');
    });

    it('creates a review', () => {
        cy.intercept('POST', '**/api/appointments/*/review', {
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

describe('client dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.visit('/dashboard/client');
        cy.url().should('include', '/auth/login');
    });
});
