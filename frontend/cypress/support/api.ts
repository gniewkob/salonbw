export function interceptAppointmentsList() {
  cy.intercept(
    { method: 'GET', url: /\/(api\/)?appointments(?:\/)?(?:\?.*)?$/ },
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
    { method: 'GET', url: /\/(api\/)?reviews(?:\/)?(?:\?.*)?$/ },
    {
      statusCode: 200,
      body: [
        {
          id: 500,
          appointmentId: 1,
          rating: 5,
          comment: 'Sample review',
          employee: { id: 1, fullName: 'John Doe' },
          author: { id: 1, name: 'Test Client' },
        },
      ],
    },
  ).as('getReviews');
}

export function interceptCreateReview() {
  cy.intercept(
    {
      method: 'POST',
      url: /\/(api\/)?(appointments\/\d+\/review|reviews)(?:\/)?(?:\?.*)?$/,
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

