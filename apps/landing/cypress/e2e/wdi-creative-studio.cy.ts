/** WDI v2 on built Next + loopback-only synthetic catalog. Never contacts hosted DEV. */
const previews = ['fashion', 'cinematic', 'atelier'] as const;
const viewports = [390, 1440] as const;

function noOverflow() {
    cy.document().then((doc) => {
        const viewport = doc.defaultView?.innerWidth ?? doc.documentElement.clientWidth;
        expect(Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth) - viewport).to.be.at.most(1);
    });
}

function visitDev(path: string, options: Partial<Cypress.VisitOptions> = {}) {
    const username = Cypress.env('DEV_ACCESS_USER') as string | undefined;
    const password = Cypress.env('DEV_ACCESS_PASSWORD') as string | undefined;
    if (!username || !password) throw new Error('Missing synthetic basic-auth fixture for WDI preview');
    cy.visit(path, { ...options, auth: { username, password } });
}

describe('WDI v2 comparative DEV-only editions', () => {
    for (const edition of previews) {
        for (const width of viewports) {
            it(`${edition} @ ${width}px keeps booking, services and readable layout`, () => {
                cy.viewport(width, 900);
                visitDev(`/?edition=${edition}`);
                cy.get('[data-wdi-direction]').should('have.attr', 'data-wdi-direction', edition);
                cy.get('.creative-switcher button[aria-pressed="true"]').should('contain.text', edition === 'fashion' ? 'Fashion' : edition === 'cinematic' ? 'Cinematic' : 'Atelier');
                cy.get('.creative-hero h1').should('be.visible').should('contain.text', 'Black');
                cy.get('.creative-hero__photo img').should('be.visible').should(($img) => {
                    expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
                });
                cy.get('.creative-services__item').should('have.length', 3);
                cy.get('.creative-services__item[href="/services?offer=care"]').should('exist');
                noOverflow();
                cy.scrollTo('top', { duration: 0 });
                cy.screenshot(`creative-${edition}-home-${width}`, { capture: 'fullPage' });
                cy.get('.creative-hero__book').should('be.visible').then(($btn) => {
                    expect($btn[0].getBoundingClientRect().height).to.be.at.least(44);
                }).click();
                cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
                cy.get('[role="dialog"] input').first().type('{esc}');
                cy.get('[role="dialog"]').should('not.exist');
                visitDev('/services?offer=care');
                cy.get('[data-wdi-direction]').should('have.attr', 'data-wdi-direction', edition);
                cy.get('.svcs-row__name').contains('Olaplex').should('be.visible');
                cy.get('.svcs-row__name').contains('Strzyżenie damskie').should('not.exist');
                noOverflow();
                cy.scrollTo('top', { duration: 0 });
                cy.screenshot(`creative-${edition}-services-${width}`, { capture: 'fullPage' });
            });
        }
    }

    it('switches edition without reloading or losing the service catalog route', () => {
        cy.viewport(390, 844);
        visitDev('/services?offer=care&edition=fashion');
        cy.get('[data-wdi-direction]').should('have.attr', 'data-wdi-direction', 'fashion');
        cy.get('.creative-switcher button').contains('Cinematic').click();
        cy.get('[data-wdi-direction]').should('have.attr', 'data-wdi-direction', 'cinematic');
        cy.location('pathname').should('equal', '/services');
        cy.location('search').should('contain', 'offer=care');
        cy.get('.svcs-row__name').contains('Olaplex').should('exist');
        visitDev('/services?offer=care&edition=fashion');
        cy.get('[data-wdi-direction]').should('have.attr', 'data-wdi-direction', 'fashion'); // explicit query takes precedence
        visitDev('/services?offer=care');
        cy.get('[data-wdi-direction]').should('have.attr', 'data-wdi-direction', 'cinematic'); // session persists
    });

    for (const lang of ['en', 'de'] as const) {
        it(`preserves ${lang} content and hero controls`, () => {
            cy.viewport(390, 844);
            visitDev('/?edition=atelier', {
                onBeforeLoad(win) { win.localStorage.setItem('lang', lang); },
            });
            cy.document().its('documentElement.lang').should('equal', lang);
            cy.get('.creative-hero h1').should('be.visible');
            cy.get('.creative-hero__book').should('be.visible');
            noOverflow();
        });
    }
});
