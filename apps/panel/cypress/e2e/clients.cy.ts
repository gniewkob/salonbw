describe('basic', () => {
    it('loads home', () => {
        cy.visit('/');
        cy.contains('Featured Services');
    });
});
