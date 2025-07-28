import { render, screen } from '@testing-library/react';
import React from 'react';

function HelloWorld() {
  return <h1>Hello World</h1>;
}

describe('HelloWorld component', () => {
  it('renders greeting', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
