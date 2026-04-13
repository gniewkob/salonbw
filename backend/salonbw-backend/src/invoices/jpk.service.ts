import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { format } from 'date-fns';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { BranchSettings } from '../settings/entities/branch-settings.entity';
import { User } from '../users/user.entity';
import { PricingService } from '../finance/pricing.service';
import { MetricsService } from '../observability/metrics.service';

@Injectable()
export class JPKService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(BranchSettings)
        private readonly branchSettingsRepository: Repository<BranchSettings>,
        private readonly pricingService: PricingService,
        private readonly metricsService: MetricsService,
    ) {}

    async generateJPKFA(from: Date, to: Date): Promise<string> {
        this.metricsService.incJpkExport();
        const settings = await this.branchSettingsRepository.findOne({
            where: { isActive: true },
        });
        if (!settings) {
            throw new NotFoundException('Branch settings not found');
        }

        const appointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.client', 'client')
            .leftJoinAndSelect('appointment.service', 'service')
            .leftJoinAndSelect('appointment.serviceVariant', 'serviceVariant')
            .where('appointment.finalizedAt BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .orderBy('appointment.finalizedAt', 'ASC')
            .getMany();

        // Product sales aggregation using QueryBuilder
        const productSales = await this.appointmentRepository.query(
            `SELECT ps.*, p.name as "productName", u.name as "customerName", u.email as "customerEmail"
             FROM product_sales ps
             LEFT JOIN products p ON p.id = ps."productId"
             LEFT JOIN appointments a ON a.id = ps."appointmentId"
             LEFT JOIN users u ON u.id = a."clientId"
             WHERE ps."soldAt" BETWEEN $1 AND $2`,
            [from, to],
        );

        const now = new Date();
        const tns = 'http://jpk.mf.gov.pl/wzor/2022/02/15/02151/';
        const etd = 'http://crd.gov.pl/xml/schematy/dziedzinowe/mf/2022/01/05/eD/DefinicjeTypy/';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<JPK xmlns="${tns}" xmlns:etd="${etd}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Naglowek>
    <KodFormularza kodSystemowy="JPK_FA (4)" wersjaSchemy="1-0">JPK_FA</KodFormularza>
    <WariantFormularza>4</WariantFormularza>
    <DataWytworzeniaJPK>${format(now, "yyyy-MM-dd'T'HH:mm:ss")}</DataWytworzeniaJPK>
    <DataOd>${format(from, 'yyyy-MM-dd')}</DataOd>
    <DataDo>${format(to, 'yyyy-MM-dd')}</DataDo>
    <KodUrzedu>1471</KodUrzedu>
  </Naglowek>
  <Podmiot1 role="Kontrahent">
    <IdentyfikatorPodmiotu>
      <NIP>${settings.nip?.replace(/[^0-9]/g, '') || ''}</NIP>
      <PelnaNazwa>${this.escapeXml(settings.companyName)}</PelnaNazwa>
    </IdentyfikatorPodmiotu>
    <AdresPodmiotu>
      <KodKraju>PL</KodKodKraju>
      <Wojewodztwo>Mazowieckie</Wojewodztwo>
      <Powiat>Warszawa</Powiat>
      <Gmina>Warszawa</Gmina>
      <Miejscowosc>${this.escapeXml(settings.city || '')}</Miejscowosc>
      <KodPocztowy>${settings.postalCode || ''}</KodPocztowy>
      <Ulica>${this.escapeXml(settings.street || '')}</Ulica>
      <NrDomu>${settings.buildingNumber || ''}</NrDomu>
    </AdresPodmiotu>
  </Podmiot1>`;

        // Add Invoices (Faktura)
        // Appointments as Service Invoices
        let totalNet = 0;
        let totalGross = 0;
        let invoiceCount = 0;

        for (const app of appointments) {
            const gross = Number(app.paidAmount || 0);
            const net = this.pricingService.calculateNet(gross);
            const vat = this.pricingService.calculateVatAmount(gross);
            totalNet += net;
            totalGross += gross;
            invoiceCount++;

            xml += `
  <Faktura>
    <P_1>${format(new Date(app.finalizedAt!), 'yyyy-MM-dd')}</P_1>
    <P_2>WIZ/${app.id}</P_2>
    <P_3A>OS/${app.clientId || 'GUEST'}</P_3A>
    <P_3B>${this.escapeXml(app.client?.name || 'Klient detaliczny')}</P_3B>
    <P_3C>${this.escapeXml(settings.companyName)}</P_3C>
    <P_3D>${this.escapeXml(settings.city || '')} ${settings.postalCode || ''}, ${this.escapeXml(settings.street || '')} ${settings.buildingNumber || ''}</P_3D>
    <P_4B>${settings.nip?.replace(/[^0-9]/g, '') || ''}</P_4B>
    <P_13_1>${net.toFixed(2)}</P_13_1>
    <P_14_1>${vat.toFixed(2)}</P_14_1>
    <P_15>${gross.toFixed(2)}</P_15>
    <P_16>false</P_16>
    <P_17>false</P_17>
    <P_18>false</P_18>
    <P_18A>false</P_18A>
    <P_19>false</P_19>
    <P_22>false</P_22>
    <RodzajFaktury>VAT</RodzajFaktury>
  </Faktura>`;
        }

        // Product sales
        for (const sale of productSales) {
            const gross = Number(sale.quantity) * Number(sale.unitPrice) - Number(sale.discount || 0);
            const net = this.pricingService.calculateNet(gross);
            const vat = this.pricingService.calculateVatAmount(gross);
            totalNet += net;
            totalGross += gross;
            invoiceCount++;

            xml += `
  <Faktura>
    <P_1>${format(new Date(sale.soldAt), 'yyyy-MM-dd')}</P_1>
    <P_2>SPRZ/${sale.id}</P_2>
    <P_3A>DETAL</P_3A>
    <P_3B>${this.escapeXml(sale.customerName || 'Klient detaliczny')}</P_3B>
    <P_13_1>${net.toFixed(2)}</P_13_1>
    <P_14_1>${vat.toFixed(2)}</P_14_1>
    <P_15>${gross.toFixed(2)}</P_15>
    <RodzajFaktury>VAT</RodzajFaktury>
  </Faktura>`;
        }

        xml += `
  <FakturaCtrl>
    <LiczbaFaktur>${invoiceCount}</LiczbaFaktur>
    <WartoscFaktur>${totalGross.toFixed(2)}</WartoscFaktur>
  </FakturaCtrl>
</JPK>`;

        return xml;
    }

    private escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&"']/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&apos;';
                default: return c;
            }
        });
    }
}
