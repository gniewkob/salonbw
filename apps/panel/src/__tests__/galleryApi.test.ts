import handler from '@/pages/api/gallery';
import type { NextApiRequest, NextApiResponse } from 'next';

function createResponse() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
    return res as unknown as NextApiResponse & typeof res;
}

describe('/api/gallery', () => {
    const originalToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    afterEach(() => {
        if (originalToken === undefined) {
            delete process.env.INSTAGRAM_ACCESS_TOKEN;
        } else {
            process.env.INSTAGRAM_ACCESS_TOKEN = originalToken;
        }
        jest.restoreAllMocks();
    });

    it('does not return local sample media when Instagram is not configured', async () => {
        delete process.env.INSTAGRAM_ACCESS_TOKEN;
        const req = { query: {} } as NextApiRequest;
        const res = createResponse();

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            items: [],
            nextCursor: null,
        });
    });

    it('returns an empty real gallery without falling back to sample media', async () => {
        process.env.INSTAGRAM_ACCESS_TOKEN = 'token';
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] }),
        } as Response);
        const req = { query: {} } as NextApiRequest;
        const res = createResponse();

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            items: [],
            nextCursor: null,
        });
    });
});
