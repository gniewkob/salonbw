import { User } from '../src/users/user.entity';
import { CustomerGroup } from '../src/customers/entities/customer-group.entity';
import { CustomerTag } from '../src/customers/entities/customer-tag.entity';
import { CustomerFile } from '../src/customers/entities/customer-file.entity';
import { CustomerNote } from '../src/customers/entities/customer-note.entity';
import { CustomerOrigin } from '../src/customers/entities/customer-origin.entity';
import { CustomerGalleryImage } from '../src/customers/entities/customer-gallery-image.entity';
import { CustomerExtraField } from '../src/customers/entities/customer-extra-field.entity';
import { Appointment } from '../src/appointments/appointment.entity';
import { Service } from '../src/services/service.entity';
import { ServiceVariant } from '../src/services/entities/service-variant.entity';
import { ServiceCategory } from '../src/services/entities/service-category.entity';
import { ServiceMedia } from '../src/services/entities/service-media.entity';
import { ServiceRecipeItem } from '../src/services/entities/service-recipe-item.entity';
import { ServiceReview } from '../src/services/entities/service-review.entity';
import { EmployeeService } from '../src/services/entities/employee-service.entity';
import { Product } from '../src/products/product.entity';
import { ProductCategory } from '../src/products/entities/product-category.entity';
import { ProductCommissionRule } from '../src/products/entities/product-commission-rule.entity';
import { Commission } from '../src/commissions/commission.entity';
import { CommissionRule } from '../src/commissions/commission-rule.entity';
import { Formula } from '../src/formulas/formula.entity';
import { Log } from '../src/logs/log.entity';
import { Branch, BranchMember } from '../src/branches/entities/branch.entity';
import { GiftCard, GiftCardTransaction } from '../src/gift-cards/entities/gift-card.entity';
import { TimeBlock } from '../src/calendar/entities/time-block.entity';
import { SmsSettings } from '../src/settings/entities/sms-settings.entity';
import { ReminderSettings } from '../src/settings/entities/reminder-settings.entity';
import { CalendarView } from '../src/settings/entities/calendar-view.entity';
import { OnlineBookingSettings } from '../src/settings/entities/online-booking-settings.entity';
import { BranchSettings } from '../src/settings/entities/branch-settings.entity';
import { CalendarSettings } from '../src/settings/entities/calendar-settings.entity';
import { Newsletter } from '../src/newsletters/entities/newsletter.entity';
import { NewsletterRecipient } from '../src/newsletters/entities/newsletter-recipient.entity';
import { ChatMessage } from '../src/chat/chat-message.entity';
import { Invoice } from '../src/invoices/invoice.entity';
import { Timetable } from '../src/timetables/entities/timetable.entity';
import { TimetableTemplate } from '../src/timetables/entities/timetable-template.entity';
import { TimetableTemplateDay } from '../src/timetables/entities/timetable-template-day.entity';
import { TimetableException } from '../src/timetables/entities/timetable-exception.entity';
import { TimetableSlot } from '../src/timetables/entities/timetable-slot.entity';
import { SmsLog } from '../src/sms/entities/sms-log.entity';
import { MessageTemplate } from '../src/sms/entities/message-template.entity';
import { LoginAttempt } from '../src/auth/login-attempt.entity';
import { RefreshToken } from '../src/auth/refresh-token.entity';
import { EmailLog } from '../src/emails/email-log.entity';
import { ContentSection } from '../src/content/entities/content-section.entity';
import {
    LoyaltyProgram,
    LoyaltyBalance,
    LoyaltyTransaction,
    LoyaltyReward,
    LoyaltyRewardRedemption,
} from '../src/loyalty/entities/loyalty.entity';
import { Review } from '../src/reviews/review.entity';
import { Supplier } from '../src/warehouse/entities/supplier.entity';
import { Delivery } from '../src/warehouse/entities/delivery.entity';
import { DeliveryItem } from '../src/warehouse/entities/delivery-item.entity';
import { Stocktaking } from '../src/warehouse/entities/stocktaking.entity';
import { StocktakingItem } from '../src/warehouse/entities/stocktaking-item.entity';
import { ProductMovement } from '../src/warehouse/entities/product-movement.entity';
import { WarehouseOrder } from '../src/warehouse/entities/warehouse-order.entity';
import { WarehouseOrderItem } from '../src/warehouse/entities/warehouse-order-item.entity';
import { WarehouseSale } from '../src/warehouse/entities/warehouse-sale.entity';
import { WarehouseSaleItem } from '../src/warehouse/entities/warehouse-sale-item.entity';
import { WarehouseUsage } from '../src/warehouse/entities/warehouse-usage.entity';
import { WarehouseUsageItem } from '../src/warehouse/entities/warehouse-usage-item.entity';
import { PushSubscription } from '../src/notifications/push-subscription.entity';
import { AutomaticMessageRule } from '../src/automatic-messages/entities/automatic-message-rule.entity';

export const ALL_ENTITIES = [
    User,
    CustomerGroup,
    CustomerTag,
    CustomerFile,
    CustomerNote,
    CustomerOrigin,
    CustomerGalleryImage,
    CustomerExtraField,
    Appointment,
    Service,
    ServiceVariant,
    ServiceCategory,
    ServiceMedia,
    ServiceRecipeItem,
    ServiceReview,
    EmployeeService,
    Product,
    ProductCategory,
    ProductCommissionRule,
    Commission,
    CommissionRule,
    Formula,
    Log,
    Branch,
    BranchMember,
    GiftCard,
    GiftCardTransaction,
    TimeBlock,
    SmsSettings,
    ReminderSettings,
    CalendarView,
    OnlineBookingSettings,
    BranchSettings,
    CalendarSettings,
    Newsletter,
    NewsletterRecipient,
    ChatMessage,
    Invoice,
    Timetable,
    TimetableTemplate,
    TimetableTemplateDay,
    TimetableException,
    TimetableSlot,
    SmsLog,
    MessageTemplate,
    LoginAttempt,
    RefreshToken,
    EmailLog,
    ContentSection,
    LoyaltyProgram,
    LoyaltyBalance,
    LoyaltyTransaction,
    LoyaltyReward,
    LoyaltyRewardRedemption,
    Review,
    Supplier,
    Delivery,
    DeliveryItem,
    Stocktaking,
    StocktakingItem,
    ProductMovement,
    WarehouseOrder,
    WarehouseOrderItem,
    WarehouseSale,
    WarehouseSaleItem,
    WarehouseUsage,
    WarehouseUsageItem,
    AutomaticMessageRule,
    PushSubscription,
];
