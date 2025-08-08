import { render, screen } from '@testing-library/react';
import React from 'react';
import FAQPage from '@/pages/faq';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('FAQ page', () => {
  it('renders without crashing', () => {
    mockedUseAuth.mockReturnValue(createAuthValue());
    render(<FAQPage />);
    expect(
      screen.getByText(/Frequently Asked Questions/i)
    ).toBeInTheDocument();
  });
});
