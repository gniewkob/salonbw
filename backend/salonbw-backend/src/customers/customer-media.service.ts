import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Repository } from 'typeorm';
import Jimp from 'jimp';
import {
    CustomerFile,
    CustomerFileCategory,
} from './entities/customer-file.entity';
import { CustomerGalleryImage } from './entities/customer-gallery-image.entity';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_FILE_MIME = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
]);

const ALLOWED_GALLERY_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function assertIntId(value: unknown, label: string): number {
    const n = typeof value === 'string' ? Number(value) : (value as number);
    if (!Number.isInteger(n) || n <= 0) {
        throw new BadRequestException(`Invalid ${label}`);
    }
    return n;
}

@Injectable()
export class CustomerMediaService {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(CustomerFile)
        private readonly filesRepo: Repository<CustomerFile>,
        @InjectRepository(CustomerGalleryImage)
        private readonly galleryRepo: Repository<CustomerGalleryImage>,
    ) {}

    getUploadsRoot(): string {
        const configured = this.configService.get<string>('UPLOADS_DIR');
        return configured && configured.trim().length > 0
            ? configured.trim()
            : path.join(process.cwd(), 'uploads');
    }

    private async ensureDir(dir: string) {
        await fs.mkdir(dir, { recursive: true });
    }

    private resolveStoredPath(storedRelativePath: string): string {
        const root = path.resolve(this.getUploadsRoot());
        const full = path.resolve(root, storedRelativePath);
        if (!full.startsWith(root + path.sep) && full !== root) {
            throw new BadRequestException('Invalid path');
        }
        return full;
    }

    private customerFilesRelDir(customerId: number) {
        return path.join('customers', String(customerId), 'files');
    }

    private customerGalleryRelDir(customerId: number) {
        return path.join('customers', String(customerId), 'gallery');
    }

    private async safeUnlink(fullPath: string) {
        try {
            await fs.unlink(fullPath);
        } catch {
            // ignore
        }
    }

    // ==================== Files ====================

    async listFiles(customerId: number) {
        const id = assertIntId(customerId, 'customerId');
        const files = await this.filesRepo.find({
            where: { customerId: id },
            order: { createdAt: 'DESC' },
        });
        return files.map((f) => ({
            id: f.id,
            name: f.originalName,
            size: f.size,
            mimeType: f.mimeType,
            category: f.category,
            description: f.description,
            createdAt: f.createdAt,
            uploadedById: f.uploadedById,
            downloadUrl: `/customers/${id}/files/${f.id}/download`,
        }));
    }

    async createFile(params: {
        customerId: number;
        actorId: number | null;
        storedRelativePath: string;
        storedName: string;
        originalName: string;
        mimeType: string;
        size: number;
        category?: string;
        description?: string;
    }) {
        const fullPath = this.resolveStoredPath(params.storedRelativePath);
        const category =
            (params.category as CustomerFileCategory | undefined) ??
            CustomerFileCategory.Other;
        if (!Object.values(CustomerFileCategory).includes(category)) {
            await this.safeUnlink(fullPath);
            throw new BadRequestException('Invalid file category');
        }
        if (params.size > MAX_FILE_BYTES) {
            await this.safeUnlink(fullPath);
            throw new BadRequestException('File too large');
        }
        if (!ALLOWED_FILE_MIME.has(params.mimeType)) {
            await this.safeUnlink(fullPath);
            throw new UnsupportedMediaTypeException('Unsupported file type');
        }

        const file = this.filesRepo.create({
            customerId: params.customerId,
            uploadedById: params.actorId,
            originalName: params.originalName,
            storedName: params.storedName,
            path: params.storedRelativePath,
            mimeType: params.mimeType,
            size: params.size,
            category,
            description: params.description?.trim() || null,
        });
        const saved = await this.filesRepo.save(file);
        return {
            id: saved.id,
            name: saved.originalName,
            size: saved.size,
            mimeType: saved.mimeType,
            category: saved.category,
            description: saved.description,
            createdAt: saved.createdAt,
            uploadedById: saved.uploadedById,
            downloadUrl: `/customers/${params.customerId}/files/${saved.id}/download`,
        };
    }

    async getFileForDownload(customerId: number, fileId: number) {
        const cId = assertIntId(customerId, 'customerId');
        const fId = assertIntId(fileId, 'fileId');
        const file = await this.filesRepo.findOne({
            where: { id: fId, customerId: cId },
        });
        if (!file) throw new NotFoundException('File not found');
        return {
            file,
            fullPath: this.resolveStoredPath(file.path),
        };
    }

    async deleteFile(customerId: number, fileId: number) {
        const { file, fullPath } = await this.getFileForDownload(
            customerId,
            fileId,
        );
        await this.filesRepo.delete({
            id: file.id,
            customerId: file.customerId,
        });
        await this.safeUnlink(fullPath);
        return { success: true };
    }

    // ==================== Gallery ====================

    async listGallery(customerId: number) {
        const id = assertIntId(customerId, 'customerId');
        const images = await this.galleryRepo.find({
            where: { customerId: id },
            order: { createdAt: 'DESC' },
        });
        return images.map((img) => ({
            id: img.id,
            mimeType: img.mimeType,
            size: img.size,
            description: img.description,
            serviceId: img.serviceId,
            createdAt: img.createdAt,
            uploadedById: img.uploadedById,
            url: `/customers/${id}/gallery/${img.id}`,
            thumbnailUrl: `/customers/${id}/gallery/${img.id}/thumbnail`,
        }));
    }

    async createGalleryImage(params: {
        customerId: number;
        actorId: number | null;
        storedRelativePath: string;
        thumbnailRelativePath: string;
        mimeType: string;
        size: number;
        description?: string;
        serviceId?: number | null;
    }) {
        const fullOriginal = this.resolveStoredPath(params.storedRelativePath);
        const fullThumb = this.resolveStoredPath(params.thumbnailRelativePath);

        if (params.size > MAX_IMAGE_BYTES) {
            await this.safeUnlink(fullOriginal);
            await this.safeUnlink(fullThumb);
            throw new BadRequestException('Image too large');
        }
        if (!ALLOWED_GALLERY_MIME.has(params.mimeType)) {
            await this.safeUnlink(fullOriginal);
            await this.safeUnlink(fullThumb);
            throw new UnsupportedMediaTypeException('Unsupported image type');
        }

        // Ensure thumbnail exists; generate if missing.
        await this.ensureDir(path.dirname(fullThumb));

        try {
            const image = await Jimp.read(fullOriginal);
            image.scaleToFit(320, 320);
            image.quality(80);
            await image.writeAsync(fullThumb);
        } catch {
            // If Jimp cannot decode, reject the upload.
            await this.safeUnlink(fullOriginal);
            await this.safeUnlink(fullThumb);
            throw new UnsupportedMediaTypeException(
                'Unsupported image encoding for thumbnail generation',
            );
        }

        const record = this.galleryRepo.create({
            customerId: params.customerId,
            uploadedById: params.actorId,
            path: params.storedRelativePath,
            thumbnailPath: params.thumbnailRelativePath,
            mimeType: params.mimeType,
            size: params.size,
            description: params.description?.trim() || null,
            serviceId: params.serviceId ?? null,
        });

        const saved = await this.galleryRepo.save(record);
        return {
            id: saved.id,
            mimeType: saved.mimeType,
            size: saved.size,
            description: saved.description,
            serviceId: saved.serviceId,
            createdAt: saved.createdAt,
            uploadedById: saved.uploadedById,
            url: `/customers/${params.customerId}/gallery/${saved.id}`,
            thumbnailUrl: `/customers/${params.customerId}/gallery/${saved.id}/thumbnail`,
        };
    }

    async getGalleryImage(
        customerId: number,
        imageId: number,
        which: 'original' | 'thumbnail',
    ) {
        const cId = assertIntId(customerId, 'customerId');
        const iId = assertIntId(imageId, 'imageId');
        const image = await this.galleryRepo.findOne({
            where: { id: iId, customerId: cId },
        });
        if (!image) throw new NotFoundException('Image not found');
        const rel = which === 'thumbnail' ? image.thumbnailPath : image.path;
        const fullPath = this.resolveStoredPath(rel);
        const mimeType = which === 'thumbnail' ? 'image/jpeg' : image.mimeType;
        return { image, fullPath, mimeType };
    }

    async deleteGalleryImage(customerId: number, imageId: number) {
        const { image } = await this.getGalleryImage(
            customerId,
            imageId,
            'original',
        );
        const fullOriginal = this.resolveStoredPath(image.path);
        const fullThumb = this.resolveStoredPath(image.thumbnailPath);
        await this.galleryRepo.delete({
            id: image.id,
            customerId: image.customerId,
        });
        await this.safeUnlink(fullOriginal);
        await this.safeUnlink(fullThumb);
        return { success: true };
    }

    // ==================== Helpers for controllers ====================

    async ensureCustomerUploadDirs(customerId: number) {
        const root = this.getUploadsRoot();
        const filesDir = path.join(root, this.customerFilesRelDir(customerId));
        const galleryDir = path.join(
            root,
            this.customerGalleryRelDir(customerId),
        );
        await this.ensureDir(filesDir);
        await this.ensureDir(galleryDir);
        return { root, filesDir, galleryDir };
    }
}
