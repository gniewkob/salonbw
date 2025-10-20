describe('Access control', () => {
    const buildToken = (role: string) =>
        `header.${Buffer.from(JSON.stringify({ role })).toString('base64')}.sig`;

    const clientTokens = {
        access_token: buildToken('client'),
        refresh_token: 'client-refresh-token',
    };

    const clientProfile = {
        id: 2,
        email: 'client@demo.com',
        name: 'Client',
        role: 'client',
    };

    const clientDashboard = {
        clientCount: 1,
        employeeCount: 0,
        todayAppointments: 2,
        upcomingAppointments: [],
    };

    it('redirects unauthenticated users to login', () => {
        cy.visit('/dashboard', { failOnStatusCode: false });
        cy.location('pathname').should('eq', '/auth/login');
        cy.location('search').should('include', 'redirectTo=%2Fdashboard');
    });

    it('redirects client to their dashboard and blocks admin routes', () => {
        cy.intercept('POST', '**/auth/login', (req) => {
            req.reply({
                statusCode: 200,
                body: clientTokens,
            });
        }).as('login');
        cy.intercept('GET', '**/users/profile', clientProfile).as('profile');
        cy.intercept('GET', '**/dashboard', (req) => {
            const accept = req.headers['accept'] ?? '';
            if (typeof accept === 'string' && accept.includes('application/json')) {
                req.reply(clientDashboard);
            } else {
                req.continue();
            }
        }).as('dashboard');

        cy.visit('/auth/login');
        cy.get('input[name="email"]').type('client@demo.com');
        cy.get('input[name="password"]').type('password123');
        cy.contains('button', 'Login').click();

        cy.wait(['@login', '@profile', '@dashboard']).then(() => {
            cy.setCookie('jwtToken', clientTokens.access_token);
            cy.setCookie('refreshToken', clientTokens.refresh_token);
        });
        cy.visit('/dashboard/client');
        cy.contains('Upcoming', { timeout: 10000 }).should('be.visible');

        cy.visit('/dashboard/admin');
        cy.contains("You don't have permission to access this area.").should(
            'be.visible',
        );
        cy.location('pathname').should('eq', '/dashboard/admin');
    });
});
