describe('Registration Flow', () => {
    const timestamp = new Date().getTime();
    const email = `cy_test_${timestamp}@example.com`;
    const password = 'Password123!';

    beforeEach(() => {
        // Ensure we start clean
        cy.clearCookies();
        cy.clearLocalStorage();
    });

    it('should register a new user and redirect to dashboard (Auto-Login)', () => {
        // 1. Visit Register Page
        cy.visit('/auth/register');

        // 2. Fill Form
        cy.get('input[placeholder="Name"]').type('Cypress Tester');
        cy.get('input[placeholder="Email"]').type(email);
        cy.get('input[placeholder="Phone (optional)"]').type('123456789');
        cy.get('input[placeholder="Password"]').type(password);

        // 3. Submit
        cy.get('button[type="submit"]').click();

        // 4. Verification
        // Should NOT go to login
        // Should go to dashboard
        cy.url().should('include', '/dashboard');

        // Verify Dashboard content (depending on what's on the dashboard)
        // For now, looking for any dashboard element or just the URL is good.
        cy.contains('Dashboard', { matchCase: false }).should('exist');

        // 5. Verify Manual Login (Logout -> Login)
        // Logout
        cy.contains('Logout', { matchCase: false }).click(); // Adjust selector if needed based on UI
        // Fallback if no logout button visible: visit logout directly if possible, or just clear cookies?
        // Usually there is a logout button in dashboard.
        // Let's assume standard UI has one. If not, we might need to inspect the dashboard first.
        // Safe approach: Visit login, it should clear or we force clear?
        // AuthContext usually clears on logout.
        // Let's try finding a Logout button.

        // Actually, let's verify we are on login page after logout
        cy.url().should('include', '/auth/login');

        // Login with new account
        cy.get('input[type="email"]').type(email);
        cy.get('input[type="password"]').type(password);
        cy.get('button[type="submit"]').click();

        // Verify Dashboard again
        cy.url().should('include', '/dashboard');
    });

    it('should show validation errors for invalid input', () => {
        cy.visit('/auth/register');

        // Submit empty
        cy.get('button[type="submit"]').click();

        // Expect errors
        cy.contains('Name is required').should('be.visible');
        cy.contains('Email is required').should('be.visible');
        cy.contains('Password is required').should('be.visible');

        // Invalid Email
        cy.get('input[placeholder="Email"]').type('invalid-email');
        cy.contains('Invalid email').should('be.visible');

        // Short Password
        cy.get('input[placeholder="Password"]').type('123');
        cy.contains('Password must be at least 6 characters').should(
            'be.visible',
        );
    });
});
