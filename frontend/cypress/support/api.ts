export function interceptCreateReview() {
  cy.intercept(
    { method: 'POST', url: /\/(api\/)?appointments\/\d+\/review(?:\/)?(?:\?.*)?$/ },
    {
      statusCode: 201,
      body: {
        id: 2,
        appointmentId: 1,
        rating: 5,
        comment: 'Great',
        employee: { id: 1, fullName: 'John Doe' },
        author: { id: 1, name: 'Test Client' },
      },
    }
  ).as('createReview');
}
