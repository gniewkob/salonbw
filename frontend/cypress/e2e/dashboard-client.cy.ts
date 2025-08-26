import { mockClientLogin } from '../support/mockLogin';
import { interceptCreateReview } from '../support/api';

describe('client dashboard navigation', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard.json' }).as(
            'dashboard',
        );
    });

    it('redirects to client dashboard and shows widgets', () => {
        cy.visit('/dashboard');
        cy.wait('@profile');
        cy.wait('@dashboard');
        cy.url().should('include', '/dashboard/client');
        cy.contains('Upcoming');
    });

    it('navigates to reviews via sidebar', () => {
        cy.visit('/dashboard/client');
        cy.wait('@profile');
        cy.wait('@dashboard');
        cy.get('[data-testid="nav-reviews"]', { timeout: 10000 }).as(
            'navReviews',
        );
        cy.get('@navReviews').click();
        cy.url().should('include', '/reviews');
    });
});

describe('client dashboard reviews crud', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.fixture('reviews.json').then((reviews) => {
            cy.intercept('GET', '/api/employees/*/reviews*', reviews).as(
                'getReviews',
            );
        });
    });

    it('creates a review', () => {
        interceptCreateReview();
        cy.intercept(
            'POST',
            /\/(api\/)?appointments\/\d+\/review(?:\/)?(?:\?.*)?$/,
            {
                statusCode: 201,
                body: { id: 1000, appointmentId: 1, rating: 5, comment: 'Great' },
            },
        ).as('createReview');
        cy.visit('/reviews');
        cy.wait('@profile');
        cy.wait('@getReviews');
        cy.contains('Add Review', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="Appointment"]').type('1');
        cy.get('input[placeholder="Rating"]').type('5');
        cy.contains('button', 'Save').click();
        cy.wait('@createReview', { timeout: 10000 });
        cy.contains('Review created');
    });
});

describe('client dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', '/api/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/client');
        cy.url().should('include', '/auth/login');
    });
});
