import { DataSource } from 'typeorm';
import ContentSectionsSeed from './content-sections.seed';
import * as fs from 'fs';
import * as path from 'path';

describe('ContentSectionsSeed Benchmark', () => {
    let mockRepository: any;
    let mockDataSource: any;

    beforeEach(() => {
        mockRepository = {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn((dto) => dto),
            save: jest.fn().mockResolvedValue({}),
        };

        mockDataSource = {
            getRepository: jest.fn().mockReturnValue(mockRepository),
        };

        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('measures baseline performance (calls to database)', async () => {
        const seed = new ContentSectionsSeed();
        await seed.run(mockDataSource as unknown as DataSource);

        const results = `
Baseline Benchmark:
findOne calls: ${mockRepository.findOne.mock.calls.length}
find calls: ${mockRepository.find.mock.calls.length}
save calls: ${mockRepository.save.mock.calls.length}
`;
        fs.writeFileSync(path.join(__dirname, 'benchmark_results.txt'), results);
    });
});
