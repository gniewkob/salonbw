import { mockAdminLogin } from '../support/mockLogin';

describe('admin dashboard navigation', () => {
    beforeEach(() => {
        mockAdminLogin();
        cy.intercept('GET', 'http://localhost:3001/dashboard', (req) => {
            const accept = String(req.headers['accept'] ?? '');
            if (!accept.includes('text/html')) {
                req.alias = 'dashboardJson';
                req.reply({ fixture: 'dashboard.json' });
            } else {
                req.continue();
            }
        }).as('dashboard');
    });

    it('redirects to admin dashboard and navigates to employees', () => {
        cy.visit('/dashboard');
        cy.wait('@profile');
        cy.get('main', { timeout: 10000 }).should('exist');
        cy.url().should('include', '/dashboard/admin');
        cy.contains('Clients');
        cy.get('[data-testid="value"]').then(($values) => {
            const metrics = Array.from($values).map(
                (el) => el.textContent?.trim() ?? null,
            );
            cy.wrap(metrics).toMatchSnapshot({
                name: 'admin-dashboard-metrics',
            });
        });
        cy.intercept('GET', 'http://localhost:3001/employees*', (req) => {
            const accept = String(req.headers['accept'] ?? '');
            if (!accept.includes('text/html')) {
                req.alias = 'getEmployeesJson';
                req.reply({ fixture: 'employees.json' });
            } else {
                req.continue();
            }
        }).as('getEmployees');
        cy.get('[data-testid="nav-employees"]', { timeout: 10000 }).as(
            'navEmployees',
        );
        cy.get('@navEmployees').click();
        cy.wait('@getEmployeesJson');
        cy.url().should('include', '/employees');
        cy.get('table').should('be.visible');
    });

    it('navigates to employees via sidebar', () => {
        cy.visit('/dashboard/admin');
        cy.wait('@profile');
        cy.get('main', { timeout: 10000 }).should('exist');
        cy.intercept('GET', 'http://localhost:3001/employees*', (req) => {
            const accept = String(req.headers['accept'] ?? '');
            if (!accept.includes('text/html')) {
                req.alias = 'getEmployeesJson';
                req.reply({ fixture: 'employees.json' });
            } else {
                req.continue();
            }
        }).as('getEmployees');
        cy.get('[data-testid="nav-employees"]', { timeout: 10000 }).as(
            'navEmployees',
        );
        cy.get('@navEmployees').click();
        cy.wait('@getEmployeesJson');
        cy.url().should('include', '/employees');
        cy.get('table').should('be.visible');
    });
});

describe('admin dashboard services crud', () => {
    beforeEach(() => {
        mockAdminLogin();
        cy.intercept('GET', 'http://localhost:3001/services*', (req) => {
            const accept = String(req.headers['accept'] ?? '');
            if (!accept.includes('text/html')) {
                req.alias = 'getSvcJson';
                req.reply({ fixture: 'services.json' });
            } else {
                req.continue();
            }
        }).as('getSvc');
    });

    it('creates a service', () => {
        cy.visit('/dashboard/services');
        cy.wait('@profile');
        cy.get('main', { timeout: 10000 }).should('exist');
        cy.location('pathname').should('include', '/dashboard/services');

        // Setup interceptor for creation
        cy.intercept('POST', 'http://localhost:3001/services', {
            statusCode: 201,
            body: { id: 3, name: 'Wax' },
        }).as('createSvc');

        // Check if Add Service button exists and click it
        cy.contains('Add Service', { timeout: 10000 })
            .should('be.visible')
            .click();

        // Fill in the form
        cy.get('input[placeholder="Name"]').type('Wax');
        cy.contains('button', 'Save').click();

        // Wait for the create request
        cy.wait('@createSvc').then(({ request }) => {
            const body =
                typeof request.body === 'string'
                    ? JSON.parse(request.body)
                    : request.body;
            expect(body).to.deep.equal({ name: 'Wax' });
        });

        // After creation, the modal should close and we should be back on the list
        // The app might update the list optimistically or through a different mechanism
        // So we just check if the success message or the new item appears
        cy.contains('Wax', { timeout: 10000 }).should('be.visible');
    });
});

describe('admin dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', 'http://localhost:3001/users/profile', {
            statusCode: 401,
        });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/admin');
        cy.url().should('include', '/auth/login');
    });
});
