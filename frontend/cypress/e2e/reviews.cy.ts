import { mockClientLogin } from '../support/mockLogin';
import { interceptAppointmentsList, interceptCreateReview } from '../support/api';

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
        cy.fixture('reviews.json').then((reviews) => {
            cy.intercept('GET', '/api/employees/*/reviews*', reviews).as(
                'getReviews',
            );
        });
        interceptAppointmentsList();
        interceptCreateReview();
        cy.visit('/reviews');
        cy.wait('@getReviews');
        cy.wait('@getAppointments');
        cy.contains('Add Review', { timeout: 10000 }).click();
        // Rating (input name or placeholder)
        cy.get('input[placeholder="Rating"], input[name="rating"]').first().clear().type('5');
        // Comment (optional)
        cy.get('textarea[placeholder="Comment"], textarea[name="comment"]').first().then(($el) => {
            if ($el.length) cy.wrap($el).type('Great');
        });
        // Appointment: try input, then select, then combobox trigger
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
