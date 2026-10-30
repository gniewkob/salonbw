import { fireEvent, render, screen } from '@testing-library/react';
import CustomerGalleryTab from '@/components/customers/CustomerGalleryTab';

const mockUpload = jest.fn();
const mockToastError = jest.fn();

jest.mock('@/hooks/useCustomerMedia', () => ({
    getBrowserApiBase: () => '/api',
    useCustomerGallery: () => ({
        data: [],
        isLoading: false,
        error: null,
    }),
    useDeleteCustomerGalleryImage: () => ({
        mutate: jest.fn(),
        isPending: false,
    }),
    useUploadCustomerGalleryImage: () => ({
        mutate: mockUpload,
        isPending: false,
    }),
}));

jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({
        success: jest.fn(),
        error: mockToastError,
    }),
}));

describe('CustomerGalleryTab upload validation', () => {
    beforeEach(() => {
        mockUpload.mockReset();
        mockToastError.mockReset();
    });

    function selectFile(file: File) {
        fireEvent.change(screen.getByLabelText('dodaj zdjęcie'), {
            target: { files: [file] },
        });
    }

    it('restricts the file chooser to API-supported image formats', () => {
        render(<CustomerGalleryTab customerId={7} />);

        expect(screen.getByLabelText('dodaj zdjęcie')).toHaveAttribute(
            'accept',
            'image/jpeg,image/png,image/webp',
        );
    });

    it.each([
        ['JPEG', 'image/jpeg', 'photo.jpg'],
        ['PNG', 'image/png', 'photo.png'],
        ['WebP', 'image/webp', 'photo.webp'],
    ])('uploads a valid %s image', (_format, mimeType, filename) => {
        render(<CustomerGalleryTab customerId={7} />);
        const file = new File(['synthetic'], filename, { type: mimeType });

        selectFile(file);

        expect(mockUpload).toHaveBeenCalledWith({ image: file });
        expect(mockToastError).not.toHaveBeenCalled();
    });

    it('blocks unsupported MIME types even if the browser picker is bypassed', () => {
        render(<CustomerGalleryTab customerId={7} />);

        selectFile(new File(['synthetic'], 'photo.gif', { type: 'image/gif' }));

        expect(mockUpload).not.toHaveBeenCalled();
        expect(mockToastError).toHaveBeenCalledWith(
            'Obsługiwane formaty: JPEG, PNG i WebP.',
        );
    });

    it('blocks images larger than the API 10 MiB limit', () => {
        render(<CustomerGalleryTab customerId={7} />);
        const file = new File(['synthetic'], 'large.png', {
            type: 'image/png',
        });
        Object.defineProperty(file, 'size', {
            value: 10 * 1024 * 1024 + 1,
        });

        selectFile(file);

        expect(mockUpload).not.toHaveBeenCalled();
        expect(mockToastError).toHaveBeenCalledWith(
            'Zdjęcie może mieć maksymalnie 10 MB.',
        );
    });
});
