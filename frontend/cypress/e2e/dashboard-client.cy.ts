describe('client dashboard navigation', () => {
    beforeEach(() => {
        localStorage.setItem('jwtToken', 'x');
        localStorage.setItem('role', 'client');
    });

    it('redirects to client dashboard and shows widgets', () => {
        cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' }).as(
            'dash',
        );
        cy.visit('/dashboard');
        cy.wait('@dash');
        cy.url().should('include', '/dashboard/client');
        cy.contains('Upcoming');
    });

    it('navigates to reviews via sidebar', () => {
        cy.intercept('GET', '**/dashboard', { fixture: 'dashboard.json' }).as(
            'dash',
        );
        cy.visit('/dashboard/client');
        cy.wait('@dash');
        cy.contains('Reviews').click();
        cy.url().should('include', '/reviews');
    });
});

describe('client dashboard reviews crud', () => {
    beforeEach(() => {
        localStorage.setItem('jwtToken', 'x');
        localStorage.setItem('role', 'client');
        cy.intercept('GET', '**/employees/*/reviews', {
            fixture: 'reviews.json',
        }).as('getReviews');
    });

    it('creates a review', () => {
        cy.intercept('POST', '**/appointments/*/review', {
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
