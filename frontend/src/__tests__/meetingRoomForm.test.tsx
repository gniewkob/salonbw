import { render, screen, fireEvent } from '@testing-library/react';
import MeetingRoomForm from '@/components/MeetingRoomForm';

describe('MeetingRoomForm', () => {
  it('allows selecting projector equipment', () => {
    render(<MeetingRoomForm onSubmit={async () => {}} onCancel={() => {}} />);
    const checkbox = screen.getByLabelText('Projector') as HTMLInputElement;
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
