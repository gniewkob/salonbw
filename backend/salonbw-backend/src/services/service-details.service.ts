import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    startOfDay,
    startOfMonth,
    startOfWeek,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { Service } from './service.entity';
import { ServiceMedia } from './entities/service-media.entity';
import {
    ServiceReview,
    ServiceReviewSource,
} from './entities/service-review.entity';
import { ServiceRecipeItem } from './entities/service-recipe-item.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { EmployeeService } from './entities/employee-service.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { CommissionRule } from '../commissions/commission-rule.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

type GroupBy = 'day' | 'week' | 'month';

@Injectable()
export class ServiceDetailsService {
    constructor(
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(ServiceMedia)
        private readonly mediaRepository: Repository<ServiceMedia>,
        @InjectRepository(ServiceReview)
        private readonly reviewRepository: Repository<ServiceReview>,
        @InjectRepository(ServiceRecipeItem)
        private readonly recipeRepository: Repository<ServiceRecipeItem>,
        @InjectRepository(ServiceVariant)
        private readonly variantRepository: Repository<ServiceVariant>,
        @InjectRepository(EmployeeService)
        private readonly employeeServiceRepository: Repository<EmployeeService>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(CommissionRule)
        private readonly commissionRuleRepository: Repository<CommissionRule>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) {}

    async getSummary(serviceId: number): Promise<Service> {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
            relations: [
                'categoryRelation',
                'variants',
                'media',
                'recipeItems',
                'recipeItems.product',
                'recipeItems.serviceVariant',
            ],
            order: {
                variants: { sortOrder: 'ASC' },
                media: { sortOrder: 'ASC' },
            },
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }
        return service;
    }

    async getStats(
        serviceId: number,
        from?: string,
        to?: string,
        groupBy: GroupBy = 'day',
    ) {
        const group: GroupBy =
            groupBy === 'week' || groupBy === 'month' ? groupBy : 'day';
        const { fromDate, toDate } = this.resolveDateRange(from, to);
        const appointments = await this.appointmentRepository.find({
            where: {
                serviceId,
                status: AppointmentStatus.Completed,
                startTime: Between(fromDate, toDate),
            },
            relations: ['service', 'serviceVariant'],
        });

        const intervals =
            group === 'month'
                ? eachMonthOfInterval({ start: fromDate, end: toDate })
                : group === 'week'
                  ? eachWeekOfInterval(
                        { start: fromDate, end: toDate },
                        { weekStartsOn: 1 },
                    )
                  : eachDayOfInterval({ start: fromDate, end: toDate });

        const formatStr =
            group === 'month'
                ? 'LLLL yyyy'
                : group === 'week'
                  ? "'Tydz.' w"
                  : 'd MMM';

        const data = intervals.map((date) => {
            const rangeStart =
                group === 'month'
                    ? startOfMonth(date)
                    : group === 'week'
                      ? startOfWeek(date, { weekStartsOn: 1 })
                      : startOfDay(date);
            const rangeEnd =
                group === 'month'
                    ? endOfMonth(date)
                    : group === 'week'
                      ? endOfWeek(date, { weekStartsOn: 1 })
                      : endOfDay(date);

            const period = appointments.filter((a) => {
                const t = new Date(a.startTime);
                return t >= rangeStart && t <= rangeEnd;
            });

            const revenue = period.reduce((sum, a) => {
                const price =
                    a.paidAmount ??
                    Number(a.serviceVariant?.price ?? a.service?.price ?? 0);
                return sum + price;
            }, 0);

            return {
                date: format(date, 'yyyy-MM-dd'),
                label: format(date, formatStr, { locale: pl }),
                revenue,
                appointments: period.length,
            };
        });

        const totalRevenue = appointments.reduce((sum, a) => {
            const price =
                a.paidAmount ??
                Number(a.serviceVariant?.price ?? a.service?.price ?? 0);
            return sum + price;
        }, 0);

        return {
            totalRevenue,
            totalCount: appointments.length,
            data,
        };
    }

    async getHistory(
        serviceId: number,
        page = 1,
        limit = 20,
        from?: string,
        to?: string,
    ) {
        const qb = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.client', 'client')
            .leftJoinAndSelect('appointment.employee', 'employee')
            .leftJoinAndSelect('appointment.serviceVariant', 'serviceVariant')
            .where('appointment.serviceId = :serviceId', { serviceId });

        if (from) {
            qb.andWhere('appointment.startTime >= :from', {
                from: new Date(from),
            });
        }
        if (to) {
            qb.andWhere('appointment.startTime <= :to', { to: new Date(to) });
        }

        qb.orderBy('appointment.startTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, total] = await qb.getManyAndCount();
        return {
            items,
            total,
            page,
            limit,
        };
    }

    async getEmployees(serviceId: number) {
        return this.employeeServiceRepository.find({
            where: { serviceId },
            relations: ['employee', 'serviceVariant'],
        });
    }

    async getComments(serviceId: number, source?: ServiceReviewSource) {
        return this.reviewRepository.find({
            where: source ? { serviceId, source } : { serviceId },
            order: { createdAt: 'DESC' },
        });
    }

    async addComment(serviceId: number, data: Partial<ServiceReview>) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
        });
        if (!service) throw new NotFoundException('Service not found');
        const review = this.reviewRepository.create({
            serviceId,
            source: data.source ?? ServiceReviewSource.Internal,
            rating: data.rating,
            comment: data.comment,
            authorName: data.authorName,
        });
        return this.reviewRepository.save(review);
    }

    async deleteComment(serviceId: number, commentId: number): Promise<void> {
        const existing = await this.reviewRepository.findOne({
            where: { id: commentId, serviceId },
        });
        if (!existing) throw new NotFoundException('Comment not found');
        await this.reviewRepository.delete(commentId);
    }

    async getPhotos(serviceId: number) {
        return this.mediaRepository.find({
            where: { serviceId },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        });
    }

    async addPhoto(serviceId: number, data: Partial<ServiceMedia>) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
        });
        if (!service) throw new NotFoundException('Service not found');
        const photo = this.mediaRepository.create({
            serviceId,
            url: data.url,
            caption: data.caption,
            sortOrder: data.sortOrder ?? 0,
            isPublic: data.isPublic ?? true,
        });
        return this.mediaRepository.save(photo);
    }

    async deletePhoto(serviceId: number, photoId: number): Promise<void> {
        const existing = await this.mediaRepository.findOne({
            where: { id: photoId, serviceId },
        });
        if (!existing) throw new NotFoundException('Photo not found');
        await this.mediaRepository.delete(photoId);
    }

    async getRecipe(serviceId: number) {
        return this.recipeRepository.find({
            where: { serviceId },
            relations: ['product', 'serviceVariant'],
            order: { id: 'ASC' },
        });
    }

    async replaceRecipe(
        serviceId: number,
        items: Array<Partial<ServiceRecipeItem>>,
    ) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
        });
        if (!service) throw new NotFoundException('Service not found');

        for (const item of items) {
            if (item.serviceVariantId) {
                const variant = await this.variantRepository.findOne({
                    where: { id: item.serviceVariantId },
                });
                if (!variant || variant.serviceId !== serviceId) {
                    throw new BadRequestException('Invalid serviceVariantId');
                }
            }
            if (item.productId) {
                const product = await this.productRepository.findOne({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new BadRequestException('Invalid productId');
                }
            }
        }

        await this.recipeRepository.delete({ serviceId });
        if (items.length === 0) return [];
        const toSave = items.map((item) =>
            this.recipeRepository.create({
                serviceId,
                serviceVariantId: item.serviceVariantId ?? null,
                productId: item.productId ?? null,
                quantity: item.quantity ?? null,
                unit: item.unit ?? null,
                notes: item.notes ?? null,
            }),
        );
        return this.recipeRepository.save(toSave);
    }

    async getCommissions(serviceId: number) {
        return this.commissionRuleRepository.find({
            where: { service: { id: serviceId } },
        });
    }

    async replaceCommissions(
        serviceId: number,
        rules: Array<{ employeeId: number; commissionPercent: number }>,
    ) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
        });
        if (!service) throw new NotFoundException('Service not found');

        for (const rule of rules) {
            const employee = await this.userRepository.findOne({
                where: { id: rule.employeeId },
            });
            if (!employee) {
                throw new BadRequestException('Invalid employeeId');
            }
        }

        await this.commissionRuleRepository.delete({
            service: { id: serviceId },
        });

        if (rules.length === 0) return [];
        const toSave = rules.map((rule) =>
            this.commissionRuleRepository.create({
                service: { id: serviceId },
                employee: { id: rule.employeeId },
                commissionPercent: rule.commissionPercent,
            }),
        );
        return this.commissionRuleRepository.save(toSave);
    }

    private resolveDateRange(from?: string, to?: string) {
        const now = new Date();
        const fromDate = from ? startOfDay(new Date(from)) : startOfMonth(now);
        const toDate = to ? endOfDay(new Date(to)) : endOfDay(now);
        return { fromDate, toDate };
    }
}
