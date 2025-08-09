import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginPage from '@/pages/auth/login';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push, replace: jest.fn() }) }));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginPage', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('submits valid form', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(createAuthValue({ login }));
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows validation error', async () => {
    const login = jest.fn();
    mockedUseAuth.mockReturnValue(createAuthValue({ login }));
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
