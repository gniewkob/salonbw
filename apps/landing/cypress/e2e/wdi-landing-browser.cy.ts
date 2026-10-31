/**
 * WDI smoke on the ACTUAL built Next.js app.
 *
 * All API content is synthetic and served by a loopback fixture. This is a
 * browser-layout/integration smoke, NOT a hosted DEV or customer booking UAT.
 * Screenshots are CI artifacts on success/failure, not committed to git.
 */
const sizes = [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 960 },
    { width: 1440, height: 900 },
] as const;

function assertNoPageOverflow() {
    cy.document().then((doc) => {
        const overflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
        expect(overflow, 'document overflow in CSS pixels').to.be.at.most(1);
    });
}

function assertTouchTarget(selector: string) {
    cy.get(selector)
        .first()
        .should('be.visible')
        .then(($element) => {
            const rect = $element[0].getBoundingClientRect();
            expect(rect.height, `${selector} target height`).to.be.at.least(44);
        });
}

describe('WDI actual Next.js browser smoke — synthetic API only', () => {
    sizes.forEach(({ width, height }) => {
        it(`renders the Editorial hero at ${width}px with no overflow and usable booking`, () => {
            cy.viewport(width, height);
            cy.visit('/');

            cy.get('.split-hero h1').should('be.visible');
            cy.get('.split-hero__right img')
                .should('be.visible')
                .should(($image) => {
                    expect(($image[0] as HTMLImageElement).naturalWidth)
                        .to.be.greaterThan(0);
                });

            assertNoPageOverflow();
            assertTouchTarget('.split-hero__cta-primary');
            assertTouchTarget('.split-hero__cta-secondary');

            cy.get('.split-hero__cta-primary').click();
            cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
            cy.get('[role="dialog"] input').first().type('{esc}');
            cy.get('[role="dialog"]').should('not.exist');
            cy.get('.split-hero__cta-primary').should('have.focus');

            cy.screenshot(`wdi-home-pl-${width}`, { capture: 'viewport' });
            cy.get('.split-hero__cta-secondary').click();
            cy.location('pathname').should('eq', '/services');
        });
    });

    for (const lang of ['en', 'de'] as const) {
        it(`keeps English/German hero content visible on a 390px viewport (${lang})`, () => {
            cy.viewport(390, 844);
            cy.visit('/', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('lang', lang);
                },
            });

            cy.document().its('documentElement.lang').should('eq', lang);
            cy.get('.split-hero h1').should('be.visible');
            cy.get('.split-hero__tagline').should('be.visible');
            assertNoPageOverflow();
            assertTouchTarget('.split-hero__cta-primary');
            cy.screenshot(`wdi-home-${lang}-390`, { capture: 'viewport' });
        });
    }

    it('renders SSR catalog, variant prices and direct flat-option booking on desktop', () => {
        cy.viewport(1440, 900);
        cy.visit('/services');

        cy.get('.svcs-offer-layout--with-filter').should('exist');
        cy.get('.svcs-cat-filter').should('be.visible');
        cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('be.visible');
        cy.contains('Usługa wyłączona z rezerwacji').should('not.exist');
        cy.contains('50,00').should('not.exist'); // Withdrawn variant cannot leak into pricing
        assertNoPageOverflow();

        cy.get('.svcs-price-details__summary').first().click();
        cy.get('button[aria-label="Umów: Strzyżenie damskie – włosy długie"]')
            .should('be.visible')
            .click();
        cy.get('[role="dialog"]')
            .should('be.visible')
            .contains('Strzyżenie damskie – włosy długie');
        cy.screenshot('wdi-service-variant-modal-1440', { capture: 'viewport' });
    });

    it('keeps mobile service categories usable and deep-link focus intact', () => {
        cy.viewport(390, 844);
        cy.visit('/services?offer=care');
        cy.get('.svcs-row__name').contains('Olaplex').should('be.visible');
        cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('not.exist');
        assertNoPageOverflow();
        assertTouchTarget('.svcs-cat-chip');
        cy.get('.svcs-cat-chip').contains('Wszystkie').click();
        cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('be.visible');
        cy.screenshot('wdi-service-catalog-390', { capture: 'viewport' });
    });
});
