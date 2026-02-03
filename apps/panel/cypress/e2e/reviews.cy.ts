import { mockClientLogin } from '../support/mockLogin';
import {
    interceptAppointmentsList,
    interceptReviewsList,
    interceptCreateReview,
} from '../support/api';

describe('reviews crud', () => {
    beforeEach(() => {
        mockClientLogin();
        interceptAppointmentsList();
        interceptReviewsList();
        interceptCreateReview();
    });

    it('loads and creates review', () => {
        cy.visit('/reviews');
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
