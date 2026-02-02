import AdminDashboard from '@/pages/dashboard/admin';
import { AuthProvider } from '@/contexts/AuthContext';
import type { NextRouter } from 'next/router';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';

const createMockRouter = (): NextRouter => ({
  basePath: '',
  pathname: '/dashboard/admin',
  route: '/dashboard/admin',
  query: {},
  asPath: '/dashboard/admin',
  back: () => {},
  beforePopState: () => {},
  prefetch: () => Promise.resolve(),
  push: () => Promise.resolve(true),
  reload: () => {},
  replace: () => Promise.resolve(true),
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
  isLocaleDomain: false,
  isFallback: false,
  isReady: true,
  isPreview: false,
  isDraftMode: false,
});

const mockProfile = {
  id: 'user-admin',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

const mockDashboard = {
  clientCount: 12,
  employeeCount: 5,
  todayAppointments: 3,
  upcomingAppointments: [
    {
      id: 'appt-1',
      startTime: '2024-11-06T08:00:00Z',
      client: { name: 'Alice Client' },
      service: { name: 'Cut & Style' },
      employee: { name: 'Bob Stylist' },
    },
  ],
};

const asJsonResponse = (win: Window, body: unknown, init?: ResponseInit) =>
  new win.Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('<AdminDashboard />', () => {
  beforeEach(() => {
    cy.document().then((doc) => {
      doc.cookie = 'XSRF-TOKEN=test-token';
    });

    cy.window().then((win) => {
      cy.stub(win, 'fetch')
        .as('fetch')
        .callsFake((input: RequestInfo | URL, init?: RequestInit) => {
          const url =
            typeof input === 'string'
              ? input
              : input instanceof win.Request
              ? input.url
              : input instanceof URL
              ? input.toString()
              : String(input);

          if (url.includes('/api/users/profile')) {
            return Promise.resolve(asJsonResponse(win, mockProfile));
          }

          if (url.includes('/dashboard')) {
            return Promise.resolve(asJsonResponse(win, mockDashboard));
          }

          if (url.includes('/auth/logout')) {
            return Promise.resolve(new win.Response(null, { status: 200 }));
          }

          throw new Error(
            `Unhandled fetch request: ${url} (${init?.method ?? 'GET'})`,
          );
        });
    });
  });

  it('renders admin stats and shortcuts when authenticated', () => {
    const router = createMockRouter();

    cy.mount(
      <RouterContext.Provider value={router}>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </RouterContext.Provider>,
    );

    cy.contains('Clients').should('be.visible');
    cy.contains('Employees').should('be.visible');
    cy.get('[data-testid="value"]').eq(0).should('have.text', '12');
    cy.get('[data-testid="value"]').eq(1).should('have.text', '5');
    cy.get('[data-testid="value"]').eq(2).should('have.text', '3');
    cy.contains('Alice Client').should('be.visible');
    cy.contains('Cut & Style').should('be.visible');
    cy.contains('Scheduler').should('be.visible');
  });
});
