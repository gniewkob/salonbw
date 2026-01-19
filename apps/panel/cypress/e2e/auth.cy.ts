describe('Authentication', () => {
    const buildToken = (role: string) =>
        `header.${Buffer.from(JSON.stringify({ role })).toString('base64')}.sig`;

    const adminTokens = {
        access_token: buildToken('admin'),
        refresh_token: 'admin-refresh-token',
    };

    const adminProfile = {
        id: 1,
        email: 'admin@demo.com',
        name: 'Admin',
        role: 'admin',
    };

    const adminDashboard = {
        clientCount: 25,
        employeeCount: 11,
        todayAppointments: 4,
        upcomingAppointments: [
            {
                id: 101,
                startTime: '2025-01-01T10:00:00.000Z',
                client: { id: 7, name: 'John Doe' },
                service: {
                    id: 3,
                    name: 'Hair styling',
                    duration: 45,
                    price: 120,
                },
                employee: { id: 5, name: 'Alex' },
            },
        ],
    };

    beforeEach(() => {
        cy.intercept('POST', '**/auth/login', (req) => {
            req.reply({
                statusCode: 200,
                body: adminTokens,
            });
        }).as('login');
        cy.intercept('GET', '**/users/profile', adminProfile).as('profile');
        cy.intercept('GET', '**/dashboard', (req) => {
            const accept = req.headers['accept'] ?? '';
            if (
                typeof accept === 'string' &&
                accept.includes('application/json')
            ) {
                req.reply(adminDashboard);
            } else {
                req.continue();
            }
        }).as('dashboard');
    });

    it('logs in an admin and displays dashboard stats', () => {
        cy.visit('/auth/login');

        cy.get('input[name="email"]').type('admin@demo.com');
        cy.get('input[name="password"]').type('password123');
        cy.contains('button', 'Login').click();

        cy.wait(['@login', '@profile', '@dashboard']).then(() => {
            cy.setCookie('jwtToken', adminTokens.access_token);
            cy.setCookie('refreshToken', adminTokens.refresh_token);
        });
        cy.visit('/dashboard/admin');
        cy.get('[data-testid="value"]').eq(0).should('contain.text', '25');
        cy.get('[data-testid="value"]').eq(1).should('contain.text', '11');
        cy.get('[data-testid="value"]').eq(2).should('contain.text', '4');

        cy.get('ul li')
            .first()
            .within(() => {
                cy.contains('John Doe');
                cy.contains('Hair styling');
            });
    });
});
