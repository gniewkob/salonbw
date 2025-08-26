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
        cy.fixture('reviews.json').then((reviews) => {
            cy.intercept('GET', '/api/employees/*/reviews*', reviews).as(
                'getReviews',
            );
        });
        cy.intercept(
            'POST',
            /\/(api\/)?appointments\/\d+\/review$/,
            {
                statusCode: 201,
                body: {
                    id: 2,
                    appointmentId: 1,
                    rating: 5,
                    comment: 'Great',
                },
            },
        ).as('createReview');
        cy.visit('/reviews');
        cy.wait('@getReviews');
        cy.contains('Add Review', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="Appointment"]').type('1');
        cy.get('input[placeholder="Rating"]').type('5');
        cy.contains('button', 'Save').click();
        cy.wait('@createReview');
        cy.contains('Review created');
    });
});
