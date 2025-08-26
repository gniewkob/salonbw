import { mockClientLogin } from '../support/mockLogin';
import { interceptAppointmentsList, interceptCreateReview } from '../support/api';

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
        cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard.json' }).as(
            'dashboard',
        );
        cy.fixture('reviews.json').then((reviews) => {
            cy.intercept('GET', '/api/employees/*/reviews*', reviews).as(
                'getReviews',
            );
        });
        interceptAppointmentsList();
        interceptCreateReview();
    });

    it('creates a review', () => {
        cy.visit('/dashboard/client');
        cy.wait('@profile');
        cy.wait('@dashboard');
        cy.contains('Reviews', { timeout: 10000 }).click();
        cy.wait('@getAppointments');

        cy.contains('Add Review', { timeout: 10000 }).click();

        cy.get('input[placeholder="Rating"], input[name="rating"]').first().clear().type('5');

        cy.get('textarea[placeholder="Comment"], textarea[name="comment"]').first().then(($el) => {
            if ($el.length) cy.wrap($el).type('Great');
        });

        cy.get('input[placeholder*="Appointment"], input[name="appointmentId"]').then(($in) => {
            if ($in.length) {
                cy.wrap($in[0]).clear().type('1');
            } else {
                cy.get('select[name="appointmentId"]').then(($sel) => {
                    if ($sel.length) {
                        cy.wrap($sel[0]).select('1');
                    } else {
                        cy.get('[data-testid="appointment-select-trigger"], [role="combobox"]').first().click();
                        cy.get('[data-radix-select-collection-item], [role="option"]').first().click();
                    }
                });
            }
        });

        cy.contains('button', 'Save').click();
        cy.wait('@createReview', { timeout: 10000 });
        cy.contains('Review created', { timeout: 10000 });
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
