import { Matches } from 'class-validator';

export class ReceptionOperationalInsightsQueryDto {
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    from!: string;

    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    to!: string;
}
