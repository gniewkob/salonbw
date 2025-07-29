import { render, screen } from '@testing-library/react';
import React from 'react';
import FAQPage from '@/pages/faq';

describe('FAQ page', () => {
  it('renders without crashing', () => {
    render(<FAQPage />);
    expect(
      screen.getByText(/Frequently Asked Questions/i)
    ).toBeInTheDocument();
  });
});
