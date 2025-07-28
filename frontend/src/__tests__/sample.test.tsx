import { render, screen } from '@testing-library/react';
import React from 'react';

function Sample() {
  return <div>Hello Jest</div>;
}

describe('Sample component', () => {
  it('renders text', () => {
    render(<Sample />);
    expect(screen.getByText('Hello Jest')).toBeInTheDocument();
  });
});
