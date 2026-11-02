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
        // Browser scrollbars consume layout width on Linux Electron.
        // Compare scrollable document width to viewport innerWidth, not the
        // scrollbar-excluding html.clientWidth (which created a false 10px fail).
        const viewport = doc.defaultView?.innerWidth ?? doc.documentElement.clientWidth;
        const overflow = Math.max(
            doc.documentElement.scrollWidth,
            doc.body.scrollWidth,
        ) - viewport;
        const offenders = [...doc.querySelectorAll<HTMLElement>('body *')]
            .filter((el) => {
                const box = el.getBoundingClientRect();
                return box.width > 0 && box.right > viewport + 1;
            })
            .slice(0, 12)
            .map((el) => {
                const box = el.getBoundingClientRect();
                return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 65)}:right=${box.right.toFixed(0)}`;
            });
        expect(
            overflow,
            `document overflow in CSS pixels; outliers=${JSON.stringify(offenders)}`,
        ).to.be.at.most(1);
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
            cy.window().its('innerWidth').should('eq', width);

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

            // Capture the original page before Cypress clicks/scrolls.
            // Cypress 15 Electron element screenshot after fullPage triggers
            // a negative Buffer.alloc RangeError on tall pages; use fullPage
            // alone and crop locally for visual review after the run.
            cy.scrollTo('top', { duration: 0 });
            cy.window().its('scrollY').should('eq', 0);
            cy.screenshot(`wdi-home-full-pl-${width}`, { capture: 'fullPage' });

            cy.get('.split-hero .split-hero__cta-primary').click();
            cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
            cy.get('[role="dialog"] input').first().type('{esc}');
            cy.get('[role="dialog"]').should('not.exist');
            cy.get('.split-hero .split-hero__cta-primary').should('have.focus');

             cy.get('.split-hero .split-hero__cta-secondary').click();
            cy.location('pathname').should('eq', '/services');
        });
    });

    it('keeps mobile booking available without duplicating the visible hero CTA', () => {
        cy.viewport(390, 844);
        cy.visit('/');
        cy.get('[data-cy="mobile-booking-fab"]')
            .should('have.attr', 'aria-hidden', 'true')
            .find('button')
            .should('have.attr', 'tabindex', '-1');

        // Leave hero, but remain far above the footer, so the floating CTA
        // should reappear with unchanged booking modal behavior.
        cy.scrollTo(0, 1500);
        cy.get('[data-cy="mobile-booking-fab"]')
            .should('have.attr', 'aria-hidden', 'false')
            .find('button')
            .should('have.attr', 'tabindex', '0')
            .click();
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
    });

    // A real visual review found that the old md: navigation tried to put
    // desktop links and a booking button into the 768px tablet header.
    for (const width of [768, 1024] as const) {
        it(`uses accessible compact navigation at ${width}px`, () => {
            cy.viewport(width, 900);
            cy.visit('/');
            cy.window().its('innerWidth').should('eq', width);
            cy.get('nav[aria-label="Nawigacja główna"] button[aria-controls="mobile-menu"]')
                .should('be.visible')
                .should('have.attr', 'aria-expanded', 'false')
                .click()
                .should('have.attr', 'aria-expanded', 'true');
            cy.get('#mobile-menu')
                .should('be.visible')
                .within(() => {
                    cy.get('a[href="/services"]').should('be.visible');
                    cy.get('button[aria-label="Język: PL"]').should('be.visible');
                    cy.contains('button', 'Umów wizytę').should('be.visible');
                });
            assertNoPageOverflow();
        });
    }

    it('retains full navigation on wide desktop without a duplicate mobile menu', () => {
        cy.viewport(1440, 900);
        cy.visit('/');
        cy.get('nav[aria-label="Nawigacja główna"] button[aria-controls="mobile-menu"]')
            .should('not.be.visible');
        cy.get('nav a[href="/services"]').should('be.visible');
        assertNoPageOverflow();
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
            cy.window().its('innerWidth').should('eq', 390);
            cy.scrollTo('top', { duration: 0 });
            cy.screenshot(`wdi-home-full-${lang}-390`, { capture: 'fullPage' });
        });
    }

    it('renders SSR catalog, variant prices and direct flat-option booking on desktop', () => {
        cy.viewport(1440, 900);
        cy.visit('/services');
        cy.window().its('innerWidth').should('eq', 1440);

        cy.get('.svcs-offer-layout--with-filter').should('exist');
        cy.get('.svcs-cat-filter').should('be.visible');
        cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('be.visible');
        cy.contains('Usługa wyłączona z rezerwacji').should('not.exist');
        cy.contains('50,00').should('not.exist'); // Withdrawn variant cannot leak into pricing
        assertNoPageOverflow();
        cy.scrollTo('top', { duration: 0 });
        cy.screenshot('wdi-services-full-1440', { capture: 'fullPage' });

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
        cy.window().its('innerWidth').should('eq', 390);
        cy.get('.svcs-row__name').contains('Olaplex').should('be.visible');
        cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('not.exist');
        assertNoPageOverflow();
        cy.scrollTo('top', { duration: 0 });
        cy.screenshot('wdi-services-care-full-390', { capture: 'fullPage' });
        assertTouchTarget('.svcs-cat-chip');
        cy.get('.svcs-cat-chip').contains('Wszystkie').click();
        cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('be.visible');
        cy.screenshot('wdi-services-all-full-390', { capture: 'fullPage' });
    });
});

describe('WDI radically different designs — protected CI-only preview', () => {
    for (const variant of ['editorial', 'cinematic', 'atelier', 'immersive', 'reel', 'orbit'] as const) {
        for (const width of [390, 1440] as const) {
            it('renders ' + variant + ' at ' + width + 'px with the canonical catalog links', () => {
                cy.viewport(width, width === 390 ? 844 : 900);
                cy.visit('/design-lab?variant=' + variant);
                cy.get('[data-cy="design-' + variant + '"]').should('be.visible');
                cy.get('[data-cy="design-' + variant + '"] h1').should('be.visible');
                cy.get('[data-cy="design-offers"] a').should('have.length', 3);
                cy.get('[data-cy="design-offer-1"]')
                    .should('have.attr', 'href', '/services?offer=care');
                assertNoPageOverflow();
                cy.scrollTo('top', { duration: 0 });
                cy.screenshot('wdi-lab-' + variant + '-' + width, { capture: 'fullPage' });
            });
        }
    }

    it('connects immersive photo wall and booking to existing UI', () => {
        cy.viewport(390, 844);
        cy.visit('/design-lab?variant=immersive');
        cy.get('[data-cy="immersive-photo-wall"] button').should('have.length', 6);
        cy.get('[data-cy="immersive-photo-wall"] button').first().click();
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        cy.get('body').type('{esc}');
        cy.get('[role="dialog"]').should('not.exist');

        cy.get('[data-cy="design-immersive"] button').contains('Umów wizytę').first().click();
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        assertNoPageOverflow();
    });

    it('plays the Motion Reel by arrow controls and opens genuine photographs', () => {
        cy.viewport(390, 844);
        cy.visit('/design-lab?variant=reel');
        cy.get('[data-cy="reel-frame"]').should('have.length', 6);
        cy.get('[data-cy="design-reel"] button[aria-label="Następny kadr"]')
            .should('be.visible').click();
        cy.get('[data-cy="reel-frame"]').eq(1).should('exist');
        cy.get('[data-cy="reel-frame"] button').first().click();
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        cy.get('body').type('{esc}');
        cy.get('[role="dialog"]').should('not.exist');
        assertNoPageOverflow();
    });

    it('rotates Spatial Atelier and opens the shared image lightbox', () => {
        cy.viewport(390, 844);
        cy.visit('/design-lab?variant=orbit');
        cy.get('[data-cy="orbit-wheel"]').should('exist');
        cy.get('[data-cy="orbit-next"]').should('be.visible').click();
        cy.get('#orbit-selected').should('contain.text', 'Stylizacja');
        cy.contains('button', 'Powiększ wybrany kadr').click();
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        cy.get('body').type('{esc}');
        cy.get('[role="dialog"]').should('not.exist');
        assertNoPageOverflow();
    });

    it('switches layouts without replacing the real booking modal', () => {
        cy.viewport(390, 844);
        cy.visit('/design-lab');
        cy.get('[data-cy="variant-cinematic"]').click().should('have.attr', 'aria-pressed', 'true');
        cy.get('[data-cy="design-cinematic"]').should('exist');
        cy.location('search').should('contain', 'variant=cinematic');
        cy.get('[data-cy="design-cinematic"] button').contains('Umów wizytę').click();
        cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
        cy.get('[role="dialog"] input').first().type('{esc}');
        cy.get('[role="dialog"]').should('not.exist');
        cy.get('[data-cy="variant-atelier"]').click();
        cy.get('[data-cy="design-atelier"]').should('exist');
        assertNoPageOverflow();
    });
});
