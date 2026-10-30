import {
    BadRequestException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import sharp from 'sharp';
import { Repository } from 'typeorm';
import { CustomerMediaService } from './customer-media.service';
import { CustomerFile } from './entities/customer-file.entity';
import { CustomerGalleryImage } from './entities/customer-gallery-image.entity';

describe('CustomerMediaService gallery thumbnails', () => {
    let uploadRoot: string;
    let service: CustomerMediaService;
    let galleryRepo: {
        create: jest.Mock;
        save: jest.Mock;
    };

    const customerId = 7;
    const original = 'customers/7/gallery/original';
    const thumbnail = 'customers/7/gallery/thumbnail.jpg';

    beforeEach(async () => {
        uploadRoot = await fs.mkdtemp(
            path.join(os.tmpdir(), 'salonbw-gallery-thumbnail-'),
        );
        galleryRepo = {
            create: jest.fn((record: unknown) => record),
            save: jest.fn(async (record: object) => ({
                ...record,
                id: 31,
                createdAt: new Date('2026-10-30T00:00:00.000Z'),
            })),
        };
        const config = {
            get: jest.fn((key: string) =>
                key === 'UPLOADS_DIR' ? uploadRoot : undefined,
            ),
        } as unknown as ConfigService;

        service = new CustomerMediaService(
            config,
            {} as Repository<CustomerFile>,
            galleryRepo as unknown as Repository<CustomerGalleryImage>,
        );
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await fs.rm(uploadRoot, { recursive: true, force: true });
    });

    async function writeOriginal(bytes: Buffer): Promise<void> {
        const full = path.join(uploadRoot, original);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, bytes);
    }

    async function createGalleryImage(mimeType: string, size: number) {
        return service.createGalleryImage({
            customerId,
            actorId: 3,
            storedRelativePath: original,
            thumbnailRelativePath: thumbnail,
            mimeType,
            size,
            description: 'Test image',
        });
    }

    it.each([
        ['jpeg', 'image/jpeg'],
        ['png', 'image/png'],
        ['webp', 'image/webp'],
    ] as const)(
        'generates an aspect-fit JPEG at 320px from %s without changing the gallery contract',
        async (format, mime) => {
            const image = await sharp({
                create: {
                    width: 800,
                    height: 400,
                    channels: 3,
                    background: { r: 30, g: 90, b: 150 },
                },
            })
                .toFormat(format)
                .toBuffer();
            await writeOriginal(image);

            const result = await createGalleryImage(mime, image.length);
            const thumbBuffer = await fs.readFile(
                path.join(uploadRoot, thumbnail),
            );
            const metadata = await sharp(thumbBuffer).metadata();

            expect(metadata).toMatchObject({
                format: 'jpeg',
                width: 320,
                height: 160,
            });
            expect(result).toMatchObject({
                id: 31,
                mimeType: mime,
                size: image.length,
                url: '/customers/7/gallery/31',
                thumbnailUrl: '/customers/7/gallery/31/thumbnail',
            });
            expect(await fs.readFile(path.join(uploadRoot, original))).toEqual(
                image,
            );
            expect(galleryRepo.save).toHaveBeenCalledTimes(1);
        },
    );

    it('does not add padding or crop portrait images', async () => {
        const image = await sharp({
            create: {
                width: 400,
                height: 800,
                channels: 3,
                background: { r: 128, g: 128, b: 128 },
            },
        })
            .png()
            .toBuffer();
        await writeOriginal(image);

        await createGalleryImage('image/png', image.length);

        expect(
            await sharp(path.join(uploadRoot, thumbnail)).metadata(),
        ).toMatchObject({ format: 'jpeg', width: 160, height: 320 });
    });

    it('rejects invalid image encoding and removes the input without saving DB metadata', async () => {
        const data = Buffer.from('invalid image content');
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        await writeOriginal(data);

        await expect(
            createGalleryImage('image/png', data.length),
        ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);

        await expect(
            fs.access(path.join(uploadRoot, original)),
        ).rejects.toThrow();
        await expect(
            fs.access(path.join(uploadRoot, thumbnail)),
        ).rejects.toThrow();
        expect(galleryRepo.save).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(
            '[gallery-thumbnail] decode failed',
            expect.objectContaining({
                customerId,
                mimeType: 'image/png',
                bytes: data.length,
            }),
        );
    });

    it('removes the original and thumbnail if saving metadata fails', async () => {
        const image = await sharp({
            create: {
                width: 640,
                height: 360,
                channels: 3,
                background: { r: 40, g: 80, b: 120 },
            },
        })
            .png()
            .toBuffer();
        await writeOriginal(image);
        galleryRepo.save.mockRejectedValueOnce(
            new Error('Synthetic DB write failure'),
        );

        await expect(
            createGalleryImage('image/png', image.length),
        ).rejects.toThrow('Synthetic DB write failure');

        await expect(
            fs.access(path.join(uploadRoot, original)),
        ).rejects.toThrow();
        await expect(
            fs.access(path.join(uploadRoot, thumbnail)),
        ).rejects.toThrow();
        expect(galleryRepo.save).toHaveBeenCalledTimes(1);
    });

    it('preserves the missing-source error contract and does not save metadata', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(
            createGalleryImage('image/jpeg', 20),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(galleryRepo.save).not.toHaveBeenCalled();
    });

    it('rejects oversized uploads before attempting to decode and cleans up the source', async () => {
        await writeOriginal(Buffer.from('synthetic bytes'));

        await expect(
            createGalleryImage('image/jpeg', 10 * 1024 * 1024 + 1),
        ).rejects.toBeInstanceOf(BadRequestException);

        await expect(
            fs.access(path.join(uploadRoot, original)),
        ).rejects.toThrow();
        expect(galleryRepo.save).not.toHaveBeenCalled();
    });

    it('rejects unsupported declared MIME before decoding and cleans up the source', async () => {
        await writeOriginal(Buffer.from('synthetic bytes'));

        await expect(
            createGalleryImage('image/gif', 15),
        ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);

        await expect(
            fs.access(path.join(uploadRoot, original)),
        ).rejects.toThrow();
        expect(galleryRepo.save).not.toHaveBeenCalled();
    });
});
