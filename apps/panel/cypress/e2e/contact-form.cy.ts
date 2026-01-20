describe('public contact form', () => {
    beforeEach(() => {
        cy.visit('/contact');
    });

    it('validates inputs and submits successfully', () => {
        cy.intercept('POST', '**/emails/send', {
            statusCode: 200,
            body: { status: 'ok' },
        }).as('sendEmail');

        cy.contains('button', 'Send').should('be.disabled');

        cy.get('input[name="name"]').type('Jane Doe');
        cy.get('input[name="email"]').type('invalid-email');
        cy.contains('button', 'Send').should('be.disabled');

        cy.get('input[name="email"]').clear().type('jane@example.com');
        cy.get('textarea[name="message"]').type(
            'I would like to book an appointment.',
        );

        cy.contains('button', 'Send').should('not.be.disabled').click();
        cy.wait('@sendEmail').its('request.body').should('include', {
            to: 'kontakt@salon-bw.pl',
        });
        cy.get('[data-testid="form-success-message"]').should('be.visible');
    });

    it('shows an error toast when submission fails', () => {
        cy.intercept('POST', '**/emails/send', { statusCode: 500 }).as(
            'sendEmailFail',
        );

        cy.get('input[name="name"]').type('John Doe');
        cy.get('input[name="email"]').type('john@example.com');
        cy.get('textarea[name="message"]').type('System unavailable?');
        cy.contains('button', 'Send').click();

        cy.wait('@sendEmailFail');
        cy.get('[data-testid="form-error-alert"]').should(
            'contain',
            'Nie udało się wysłać formularza',
        );
    });
});
