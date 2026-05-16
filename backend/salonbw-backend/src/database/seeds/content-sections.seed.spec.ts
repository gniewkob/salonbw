import { DataSource, Repository } from 'typeorm';
import { ContentSection } from '../../content/entities/content-section.entity';
import ContentSectionsSeed from './content-sections.seed';

describe('ContentSectionsSeed', () => {
    let seed: ContentSectionsSeed;
    let mockRepo: jest.Mocked<Repository<ContentSection>>;
    let mockDataSource: jest.Mocked<DataSource>;

    beforeEach(() => {
        seed = new ContentSectionsSeed();
        mockRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn().mockImplementation((d) => d),
            find: jest.fn(),
        } as any;

        mockDataSource = {
            getRepository: jest.fn().mockReturnValue(mockRepo),
        } as any;

        // Silence console.log during tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should seed content sections using optimized bulk operations', async () => {
        mockRepo.find.mockResolvedValue([]); // Simulate no existing sections
        mockRepo.save.mockImplementation(async (val) => val);

        await seed.run(mockDataSource);

        // Optimized implementation:
        // 1 bulk find lookup using In operator
        // 1 bulk save for all new sections
        expect(mockRepo.find).toHaveBeenCalledTimes(1);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);

        // Should have called save with an array of 5 sections
        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(Array.isArray(savedArg)).toBe(true);
        expect(savedArg.length).toBe(5);
    });

    it('should skip already existing sections', async () => {
        // Simulate that 2 sections already exist
        mockRepo.find.mockResolvedValue([
            { key: 'HERO_SLIDES' } as ContentSection,
            { key: 'FOUNDER_MESSAGE' } as ContentSection,
        ]);
        mockRepo.save.mockImplementation(async (val) => val);

        await seed.run(mockDataSource);

        expect(mockRepo.find).toHaveBeenCalledTimes(1);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);

        // Should have called save with an array of remaining 3 sections
        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(Array.isArray(savedArg)).toBe(true);
        expect(savedArg.length).toBe(3);

        const keys = savedArg.map(s => s.key);
        expect(keys).toContain('HISTORY_ITEMS');
        expect(keys).toContain('CORE_VALUES');
        expect(keys).toContain('SALON_GALLERY');
    });
});
