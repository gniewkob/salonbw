import { DataSource, Repository } from 'typeorm';
import ContentSectionsSeed from './content-sections.seed';
import { ContentSection } from '../../content/entities/content-section.entity';

describe('ContentSectionsSeed', () => {
    let seed: ContentSectionsSeed;
    let mockDataSource: Partial<DataSource>;
    let mockRepo: Partial<Repository<ContentSection>>;

    beforeEach(() => {
        seed = new ContentSectionsSeed();
        mockRepo = {
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn((val) => val as any),
        };
        mockDataSource = {
            getRepository: jest.fn().mockReturnValue(mockRepo),
        };
    });

    it('should seed content sections in bulk', async () => {
        (mockRepo.find as jest.Mock).mockResolvedValue([]);
        (mockRepo.save as jest.Mock).mockResolvedValue([]);

        await seed.run(mockDataSource as DataSource);

        expect(mockRepo.find).toHaveBeenCalledTimes(1);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
        const savedArray = (mockRepo.save as jest.Mock).mock.calls[0][0];
        expect(savedArray).toHaveLength(5);
    });

    it('should only seed missing sections', async () => {
        (mockRepo.find as jest.Mock).mockResolvedValue([{ key: 'HERO_SLIDES' }]);
        (mockRepo.save as jest.Mock).mockResolvedValue([]);

        await seed.run(mockDataSource as DataSource);

        expect(mockRepo.find).toHaveBeenCalledTimes(1);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
        const savedArray = (mockRepo.save as jest.Mock).mock.calls[0][0];
        expect(savedArray).toHaveLength(4);
        expect(savedArray.map((s: any) => s.key)).not.toContain('HERO_SLIDES');
    });

    it('should not save if all sections already exist', async () => {
        (mockRepo.find as jest.Mock).mockResolvedValue([
            { key: 'HERO_SLIDES' },
            { key: 'FOUNDER_MESSAGE' },
            { key: 'HISTORY_ITEMS' },
            { key: 'CORE_VALUES' },
            { key: 'SALON_GALLERY' },
        ]);

        await seed.run(mockDataSource as DataSource);

        expect(mockRepo.find).toHaveBeenCalledTimes(1);
        expect(mockRepo.save).not.toHaveBeenCalled();
    });
});
