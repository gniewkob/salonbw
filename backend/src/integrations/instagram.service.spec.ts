import { Test, TestingModule } from '@nestjs/testing';
import { InstagramService } from './instagram.service';
import * as nock from 'nock';

describe('InstagramService', () => {
    let service: InstagramService;
    const httpProxy = process.env.http_proxy;
    const httpsProxy = process.env.https_proxy;
    const HTTPProxy = process.env.HTTP_PROXY;
    const HTTPSProxy = process.env.HTTPS_PROXY;
    const npmHttpProxy = process.env.npm_config_http_proxy;
    const npmHttpsProxy = process.env.npm_config_https_proxy;
    const yarnHttpProxy = process.env.YARN_HTTP_PROXY;
    const yarnHttpsProxy = process.env.YARN_HTTPS_PROXY;
    const globalProxy = process.env.GLOBAL_AGENT_HTTP_PROXY;

    beforeEach(async () => {
        process.env.INSTAGRAM_ACCESS_TOKEN = 'token';
        delete process.env.http_proxy;
        delete process.env.https_proxy;
        delete process.env.HTTP_PROXY;
        delete process.env.HTTPS_PROXY;
        delete process.env.npm_config_http_proxy;
        delete process.env.npm_config_https_proxy;
        delete process.env.YARN_HTTP_PROXY;
        delete process.env.YARN_HTTPS_PROXY;
        delete process.env.GLOBAL_AGENT_HTTP_PROXY;
        const module: TestingModule = await Test.createTestingModule({
            providers: [InstagramService],
        }).compile();

        service = module.get<InstagramService>(InstagramService);
    });

    afterEach(() => {
        delete process.env.INSTAGRAM_ACCESS_TOKEN;
        if (httpProxy) process.env.http_proxy = httpProxy;
        else delete process.env.http_proxy;
        if (httpsProxy) process.env.https_proxy = httpsProxy;
        else delete process.env.https_proxy;
        if (HTTPProxy) process.env.HTTP_PROXY = HTTPProxy;
        else delete process.env.HTTP_PROXY;
        if (HTTPSProxy) process.env.HTTPS_PROXY = HTTPSProxy;
        else delete process.env.HTTPS_PROXY;
        if (npmHttpProxy) process.env.npm_config_http_proxy = npmHttpProxy;
        else delete process.env.npm_config_http_proxy;
        if (npmHttpsProxy) process.env.npm_config_https_proxy = npmHttpsProxy;
        else delete process.env.npm_config_https_proxy;
        if (yarnHttpProxy) process.env.YARN_HTTP_PROXY = yarnHttpProxy;
        else delete process.env.YARN_HTTP_PROXY;
        if (yarnHttpsProxy) process.env.YARN_HTTPS_PROXY = yarnHttpsProxy;
        else delete process.env.YARN_HTTPS_PROXY;
        if (globalProxy) process.env.GLOBAL_AGENT_HTTP_PROXY = globalProxy;
        else delete process.env.GLOBAL_AGENT_HTTP_PROXY;
        nock.cleanAll();
    });

    it('fetchLatestPosts parses API response', async () => {
        nock('https://graph.instagram.com')
            .get('/me/media')
            .query(true)
            .reply(200, {
                data: [
                    {
                        id: '1',
                        caption: 'A',
                        media_url: 'img1.jpg',
                        thumbnail_url: 'thumb1.jpg',
                        permalink: 'link1',
                        media_type: 'IMAGE',
                    },
                    {
                        id: '2',
                        caption: 'B',
                        media_url: 'img2.jpg',
                        thumbnail_url: 'thumb2.jpg',
                        permalink: 'link2',
                        media_type: 'VIDEO',
                    },
                ],
            });

        const posts = await service.fetchLatestPosts(1);
        expect(posts).toEqual([
            {
                imageUrl: 'img1.jpg',
                caption: 'A',
                link: 'link1',
                thumbnailUrl: 'thumb1.jpg',
            },
        ]);
        expect(nock.isDone()).toBe(true);
    });
});
