import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice } from './invoice.entity';
import * as xml2js from 'xml2js';

interface JpkFaHeader {
    kodFormularza: { _: string; kodSystemowy: string; wersjaSchemy: string };
    wariantFormularza: string;
    celZlozenia: { _: string; poz: string };
    dataWytworzeniaJPK: string;
    dataOd: string;
    dataDo: string;
    domyslnyKodWaluty: string;
    kodUrzedu: string;
}

interface JpkFaPodmiot {
    nip: string;
    pelnaNazwa: string;
    email: string;
}

interface JpkFaInvoice {
    typ: string;
    faktura: {
        p1: string; // czy faktura VAT
        p2A: string; // nr faktury
        p3A: string; // data wystawienia
        p3B: string; // data sprzedaży
        p3C?: string; // data zapłaty
        p4A: string; // kod kraju sprzedawcy
        p4B: string; // nip sprzedawcy
        p5A: string; // nazwa sprzedawcy
        p5B: string; // adres sprzedawcy
        p6: string; // kod kraju nabywcy
        p13_1?: string; // wartość netto
        p14_1?: string; // wartość VAT
        p14_1W?: string; // VAT zwolniony
        p13_2?: string; // wartość netto zwolniona
        p15: string; // wartość brutto
        p16: boolean; // czy faktura ustrukturyzowana
        p17?: boolean; // czy samofakturowanie
        p18?: boolean; // czy odwrotne obciążenie
        p19?: boolean; // czy samofakturowanie (MPP)
        p19A?: string;
        p19B?: string;
        p19C?: string;
        rodzajFaktury: string;
    };
}

// Invoice entity type

@Injectable()
export class JpkService {
    private readonly logger = new Logger(JpkService.name);

    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
    ) {}

    /**
     * Generate JPK FA (VAT Invoices) XML for given period
     */
    async generateJpkFa(
        startDate: Date,
        endDate: Date,
        companyData: {
            nip: string;
            name: string;
            email: string;
            address: string;
            taxOfficeCode: string;
        },
    ): Promise<string> {
        const invoices = await this.getInvoicesForPeriod(startDate, endDate);

        const jpkData = this.buildJpkFaXml(
            startDate,
            endDate,
            companyData,
            invoices,
        );

        const builder = new xml2js.Builder({
            rootName: 'JPK',
            headless: true,
            renderOpts: { pretty: true, indent: '  ' },
        });

        return builder.buildObject(jpkData);
    }

    /**
     * Generate JPK FA for a single invoice
     */
    async generateJpkFaForInvoice(
        invoiceId: number,
        companyData: {
            nip: string;
            name: string;
            email: string;
            address: string;
            taxOfficeCode: string;
        },
    ): Promise<string> {
        const invoice = await this.invoiceRepo.findOne({
            where: { id: invoiceId },
            relations: ['items', 'customer'],
        });

        if (!invoice) {
            throw new Error(`Invoice ${invoiceId} not found`);
        }

        const startDate = invoice.createdAt;
        const endDate = invoice.createdAt;

        const jpkData = this.buildJpkFaXml(startDate, endDate, companyData, [
            invoice,
        ]);

        const builder = new xml2js.Builder({
            rootName: 'JPK',
            headless: true,
            renderOpts: { pretty: true, indent: '  ' },
        });

        return builder.buildObject(jpkData);
    }

    private async getInvoicesForPeriod(
        startDate: Date,
        endDate: Date,
    ): Promise<Invoice[]> {
        return this.invoiceRepo.find({
            where: {
                createdAt: Between(startDate, endDate),
            },
            relations: ['client'],
            order: { createdAt: 'ASC' },
        });
    }

    private buildJpkFaXml(
        startDate: Date,
        endDate: Date,
        companyData: {
            nip: string;
            name: string;
            email: string;
            address: string;
            taxOfficeCode: string;
        },
        invoices: Invoice[],
    ): any {
        const now = new Date();
        const header: JpkFaHeader = {
            kodFormularza: {
                _: 'JPK_FA',
                kodSystemowy: 'JPK_FA (3)',
                wersjaSchemy: '1-0',
            },
            wariantFormularza: '3',
            celZlozenia: { _: '1', poz: 'Pozycja 1' },
            dataWytworzeniaJPK: this.formatDateTime(now),
            dataOd: this.formatDate(startDate),
            dataDo: this.formatDate(endDate),
            domyslnyKodWaluty: 'PLN',
            kodUrzedu: companyData.taxOfficeCode,
        };

        const podmiot: JpkFaPodmiot = {
            nip: this.cleanNip(companyData.nip),
            pelnaNazwa: companyData.name,
            email: companyData.email,
        };

        const faktury = invoices.map((invoice, index) =>
            this.mapInvoiceToJpk(invoice, companyData, index + 1),
        );

        // Calculate totals (assume 23% VAT)
        const totalGross = invoices.reduce(
            (sum, inv) => sum + Number(inv.amount || 0),
            0,
        );
        const totalNet = totalGross * 0.813; // net amount
        const totalVat = totalGross * 0.187; // VAT amount

        return {
            $: {
                xmlns: 'http://jpk.mf.gov.pl/wzor/2021/07/08/07081/',
                'xmlns:etd':
                    'http://crd.gov.pl/xml/schematy/dziedzinowe/mf/2018/08/24/eD/DefinicjeTypy/',
            },
            Naglowek: {
                KodFormularza: header.kodFormularza,
                WariantFormularza: header.wariantFormularza,
                CelZlozenia: header.celZlozenia,
                DataWytworzeniaJPK: header.dataWytworzeniaJPK,
                DataOd: header.dataOd,
                DataDo: header.dataDo,
                DomyslnyKodWaluty: header.domyslnyKodWaluty,
                KodUrzedu: header.kodUrzedu,
            },
            Podmiot1: {
                NIP: podmiot.nip,
                PelnaNazwa: podmiot.pelnaNazwa,
                Email: podmiot.email,
            },
            Faktura: faktury.map((f) => f.faktura),
            FakturaCtrl: {
                LiczbaFaktur: invoices.length.toString(),
                WartoscFaktur: totalGross.toFixed(2),
            },
            StawkiPodatku: {
                Stawka1: '23',
                Stawka2: '8',
                Stawka3: '5',
                Stawka4: '0',
                Stawka5: 'zw',
            },
        };
    }

    private mapInvoiceToJpk(
        invoice: Invoice,
        companyData: { nip: string; name: string; address: string },
        lineNumber: number,
    ): JpkFaInvoice {
        const vatRate = 23; // default VAT rate
        const isVat = true;
        const isExempt = false;

        return {
            typ: 'G',
            faktura: {
                p1: isVat ? 'true' : 'false',
                p2A: invoice.number,
                p3A: this.formatDate(invoice.createdAt),
                p3B: this.formatDate(invoice.createdAt),
                ...(invoice.paidAt && { p3C: this.formatDate(invoice.paidAt) }),
                p4A: 'PL',
                p4B: this.cleanNip(companyData.nip || ''),
                p5A: companyData.name || '',
                p5B: companyData.address || '',
                p6: 'PL',
                p13_1: (Number(invoice.amount) * 0.813).toFixed(2),
                p14_1: (Number(invoice.amount) * 0.187).toFixed(2),
                p15: Number(invoice.amount).toFixed(2),
                p16: true, // ustrukturyzowana
                rodzajFaktury: 'VAT',
            },
        };
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private formatDateTime(date: Date): string {
        return date.toISOString().replace('Z', '').replace('T', 'T');
    }

    private cleanNip(nip: string): string {
        return nip.replace(/[^\d]/g, '');
    }
}
