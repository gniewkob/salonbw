export function interceptAppointmentsList() {
    cy.intercept(
        {
            method: 'GET',
            url: 'http://localhost:3001/appointments*',
        },
        {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    date: '2025-01-01T10:00:00.000Z',
                    status: 'COMPLETED',
                    customerId: 1,
                    employeeId: 1,
                    serviceId: 1,
                },
            ],
        },
    ).as('getAppointments');
}

export function interceptReviewsList() {
    cy.intercept(
        {
            method: 'GET',
            url: /http:\/\/localhost:3001\/(reviews|employees\/\d+\/reviews|clients\/\d+\/reviews)(?:\/)?(?:\?.*)?$/,
        },
        {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 500,
                        appointmentId: 1,
                        rating: 5,
                        comment: 'Sample review',
                        employee: { id: 1, fullName: 'John Doe' },
                        author: { id: 1, name: 'Test Client' },
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            },
        },
    ).as('getReviews');
}

export function interceptCreateReview() {
    cy.intercept(
        {
            method: 'POST',
            url: /http:\/\/localhost:3001\/appointments\/\d+\/review$/,
        },
        {
            statusCode: 201,
            body: {
                id: 1001,
                appointmentId: 1,
                rating: 5,
                comment: 'Great',
                employee: { id: 1, fullName: 'John Doe' },
                author: { id: 1, name: 'Test Client' },
            },
        },
    ).as('createReview');
}
