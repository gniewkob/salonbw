import { mockClientLogin } from '../support/mockLogin';
import {
    interceptAppointmentsList,
    interceptReviewsList,
    interceptCreateReview,
} from '../support/api';

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
        interceptAppointmentsList();
        interceptReviewsList();
        interceptCreateReview();
        cy.visit('/reviews');
        cy.wait('@getReviews', { timeout: 10000 });
        cy.contains('Add Review', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="Appointment"], input[name="appointmentId"]').first().type('1');
        cy.get('input[placeholder="Rating"], input[name="rating"]').first().type('5');
        cy.contains('button', 'Save').click();
        cy.wait('@createReview', { timeout: 10000 });
        cy.contains('Review created');
    });
});
