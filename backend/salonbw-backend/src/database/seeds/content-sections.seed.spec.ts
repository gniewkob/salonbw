import { DataSource } from 'typeorm';
import ContentSectionsSeed from './content-sections.seed';

describe('ContentSectionsSeed', () => {
    let mockRepository: any;
    let mockDataSource: any;

    beforeEach(() => {
        mockRepository = {
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn((dto) => dto),
            save: jest.fn().mockResolvedValue([]),
        };

        mockDataSource = {
            getRepository: jest.fn().mockReturnValue(mockRepository),
        };

        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('loads existing sections once and saves missing sections in batch', async () => {
        const seed = new ContentSectionsSeed();
        await seed.run(mockDataSource as unknown as DataSource);

        expect(mockRepository.find).toHaveBeenCalledTimes(1);
        expect(mockRepository.save).toHaveBeenCalledTimes(1);

        const savedPayload = mockRepository.save.mock.calls[0][0];
        expect(Array.isArray(savedPayload)).toBe(true);
        expect(savedPayload.length).toBeGreaterThan(0);
    });
});
