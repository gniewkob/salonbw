import { act, fireEvent, render, screen } from '@testing-library/react';
import type { CustomerNote } from '@/types';
import CustomerNotesTab from '@/components/customers/CustomerNotesTab';
import CustomerFilesTab from '@/components/customers/CustomerFilesTab';
import CustomerGalleryTab from '@/components/customers/CustomerGalleryTab';
import {
    useCustomerNotes,
    useCreateCustomerNote,
    useUpdateCustomerNote,
    useDeleteCustomerNote,
} from '@/hooks/useCustomers';
import {
    useCustomerFiles,
    useUploadCustomerFile,
    useDeleteCustomerFile,
    useCustomerGallery,
    useUploadCustomerGalleryImage,
    useDeleteCustomerGalleryImage,
} from '@/hooks/useCustomerMedia';
import { useToast } from '@/contexts/ToastContext';

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerNotes: jest.fn(),
    useCreateCustomerNote: jest.fn(),
    useUpdateCustomerNote: jest.fn(),
    useDeleteCustomerNote: jest.fn(),
}));
jest.mock('@/hooks/useCustomerMedia', () => ({
    getBrowserApiBase: () => '/api',
    useCustomerFiles: jest.fn(),
    useUploadCustomerFile: jest.fn(),
    useDeleteCustomerFile: jest.fn(),
    useCustomerGallery: jest.fn(),
    useUploadCustomerGalleryImage: jest.fn(),
    useDeleteCustomerGalleryImage: jest.fn(),
}));
jest.mock('@/contexts/ToastContext', () => ({ useToast: jest.fn() }));
jest.mock('@/components/ConfirmModal', () => ({
    __esModule: true,
    default: ({
        open,
        onConfirm,
        onCancel,
    }: {
        open: boolean;
        onConfirm: () => void;
        onCancel: () => void;
    }) =>
        open ? (
            <div role="dialog" aria-label="Potwierdź usunięcie">
                <button type="button" onClick={onConfirm}>
                    Potwierdź usunięcie
                </button>
                <button type="button" onClick={onCancel}>
                    Anuluj usunięcie
                </button>
            </div>
        ) : null,
}));

const mutateNoteCreate = jest.fn().mockResolvedValue({});
const mutateNoteUpdate = jest.fn().mockResolvedValue({});
const mutateNoteDelete = jest.fn().mockResolvedValue({});
const mutateFileUpload = jest.fn();
const mutateFileDelete = jest.fn().mockResolvedValue({});
const mutateGalleryUpload = jest.fn();
const mutateGalleryDelete = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useToast).mockReturnValue({
        success: jest.fn(),
        error: jest.fn(),
    } as unknown as ReturnType<typeof useToast>);
    jest.mocked(useCustomerNotes).mockReturnValue({
        data: [
            {
                id: 17,
                customerId: 20,
                content: 'Woli ciepłą wodę',
                type: 'preference',
                isPinned: false,
                createdAt: '2026-11-01T09:00:00Z',
            } as CustomerNote,
        ],
        isLoading: false,
        error: null,
    } as unknown as ReturnType<typeof useCustomerNotes>);
    jest.mocked(useCreateCustomerNote).mockReturnValue({
        mutateAsync: mutateNoteCreate,
        isPending: false,
    } as unknown as ReturnType<typeof useCreateCustomerNote>);
    jest.mocked(useUpdateCustomerNote).mockReturnValue({
        mutateAsync: mutateNoteUpdate,
        mutate: mutateNoteUpdate,
        isPending: false,
    } as unknown as ReturnType<typeof useUpdateCustomerNote>);
    jest.mocked(useDeleteCustomerNote).mockReturnValue({
        mutate: mutateNoteDelete,
        isPending: false,
    } as unknown as ReturnType<typeof useDeleteCustomerNote>);

    jest.mocked(useCustomerFiles).mockReturnValue({
        data: [
            {
                id: 27,
                name: 'zgoda.pdf',
                category: 'consent',
                size: 1000,
                mimeType: 'application/pdf',
                description: null,
                createdAt: '2026-11-01T09:00:00Z',
                uploadedById: null,
                downloadUrl: '/customers/20/files/27/download',
            },
        ],
        isLoading: false,
        error: null,
    } as unknown as ReturnType<typeof useCustomerFiles>);
    jest.mocked(useUploadCustomerFile).mockReturnValue({
        mutate: mutateFileUpload,
        isPending: false,
    } as unknown as ReturnType<typeof useUploadCustomerFile>);
    jest.mocked(useDeleteCustomerFile).mockReturnValue({
        mutateAsync: mutateFileDelete,
        isPending: false,
    } as unknown as ReturnType<typeof useDeleteCustomerFile>);
    jest.mocked(useCustomerGallery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
    } as unknown as ReturnType<typeof useCustomerGallery>);
    jest.mocked(useUploadCustomerGalleryImage).mockReturnValue({
        mutate: mutateGalleryUpload,
        isPending: false,
    } as unknown as ReturnType<typeof useUploadCustomerGalleryImage>);
    jest.mocked(useDeleteCustomerGalleryImage).mockReturnValue({
        mutate: mutateGalleryDelete,
        isPending: false,
    } as unknown as ReturnType<typeof useDeleteCustomerGalleryImage>);
});

describe('V18 customer operation parity', () => {
    it('creates a typed note scoped to the current customer', async () => {
        render(<CustomerNotesTab customerId={20} variant="v18" />);
        fireEvent.change(
            screen.getByRole('textbox', { name: 'Treść notatki' }),
            { target: { value: '  Nowa preferencja  ' } },
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'Typ notatki' }));
        fireEvent.click(screen.getByRole('option', { name: 'Preferencja' }));
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'dodaj komentarz' }),
            );
        });
        expect(mutateNoteCreate).toHaveBeenCalledWith({
            customerId: 20,
            content: 'Nowa preferencja',
            type: 'preference',
            isPinned: false,
        });
    });

    it('edits note text through the existing scoped mutation', async () => {
        render(<CustomerNotesTab customerId={20} variant="v18" />);
        fireEvent.click(screen.getByRole('button', { name: 'edytuj' }));
        fireEvent.change(
            screen.getByRole('textbox', { name: 'Edytuj treść notatki' }),
            { target: { value: '  Zmieniła preferencję  ' } },
        );
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Zapisz notatkę' }),
            );
        });
        expect(mutateNoteUpdate).toHaveBeenCalledWith({
            noteId: 17,
            customerId: 20,
            data: { content: 'Zmieniła preferencję' },
        });
    });

    it('requires confirmation before removing a note', () => {
        render(<CustomerNotesTab customerId={20} variant="v18" />);
        fireEvent.click(screen.getByRole('button', { name: 'usuń' }));
        expect(mutateNoteDelete).not.toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole('button', { name: 'Potwierdź usunięcie' }),
        );
        expect(mutateNoteDelete).toHaveBeenCalledWith({
            noteId: 17,
            customerId: 20,
        });
    });

    it('uploads a file with its selected V18 category and confirms deletion', () => {
        const { container } = render(
            <CustomerFilesTab customerId={20} variant="v18" />,
        );
        fireEvent.click(
            screen.getByRole('combobox', {
                name: 'Kategoria plików do dodania',
            }),
        );
        fireEvent.click(screen.getByRole('option', { name: 'Umowa' }));
        const input = container.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();
        const file = new File(['test'], 'umowa.pdf', {
            type: 'application/pdf',
        });
        fireEvent.change(input!, { target: { files: [file] } });
        expect(mutateFileUpload).toHaveBeenCalledWith({
            file,
            category: 'contract',
        });
        fireEvent.click(screen.getByRole('button', { name: 'Usuń plik' }));
        expect(mutateFileDelete).not.toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole('button', { name: 'Potwierdź usunięcie' }),
        );
        expect(mutateFileDelete).toHaveBeenCalledWith(27);
    });

    it('uploads a supported gallery image using the original mutation', () => {
        const { container } = render(<CustomerGalleryTab customerId={20} />);
        const input = container.querySelector('input[type="file"]');
        const image = new File(['image'], 'test.webp', { type: 'image/webp' });
        fireEvent.change(input!, { target: { files: [image] } });
        expect(mutateGalleryUpload).toHaveBeenCalledWith({ image });
    });

    it('rejects invalid gallery uploads before invoking the API', () => {
        const { container } = render(<CustomerGalleryTab customerId={20} />);
        const input = container.querySelector('input[type="file"]');
        const image = new File(['data'], 'test.svg', { type: 'image/svg+xml' });
        fireEvent.change(input!, { target: { files: [image] } });
        expect(mutateGalleryUpload).not.toHaveBeenCalled();
    });
});
