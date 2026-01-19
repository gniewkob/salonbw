import { mockClientLogin } from '../support/mockLogin';
import {
    interceptAppointmentsList,
    interceptReviewsList,
    interceptCreateReview,
} from '../support/api';

describe('client dashboard navigation', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.intercept('GET', '**/dashboard', {
            fixture: 'dashboard.json',
        }).as('dashboard');
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
        cy.intercept('GET', '**/dashboard', {
            fixture: 'dashboard.json',
        }).as('dashboard');
    });

    it('creates a review', () => {
        cy.visit('/dashboard/client');
        cy.wait('@profile');
        cy.wait('@dashboard');
        interceptAppointmentsList();
        interceptReviewsList();
        interceptCreateReview();

        cy.get('[data-testid="nav-reviews"]', { timeout: 10000 }).click();
        cy.wait('@getReviews', { timeout: 10000 });

        cy.contains('Add Review', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="Appointment"], input[name="appointmentId"]')
            .first()
            .clear()
            .type('1');
        cy.get('input[placeholder="Rating"], input[name="rating"]')
            .first()
            .clear()
            .type('5');
        cy.get('textarea[name="comment"]').type('Great service!');
        cy.contains('button', 'Save').click();
        cy.wait('@createReview', { timeout: 10000 });
        cy.contains('Review created');
    });
});

describe('client dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', '**/users/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/client');
        cy.url().should('include', '/auth/login');
    });
});
