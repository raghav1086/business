import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './controllers/health.controller';
import { Gstr1Controller } from './controllers/gstr1.controller';
import { Gstr3bController } from './controllers/gstr3b.controller';
import { Gstr4Controller } from './controllers/gstr4.controller';
import { Gstr2aReconciliationController } from './controllers/gstr2a-reconciliation.controller';
import { ValidationController } from './controllers/validation.controller';
import { BusinessGstSettingsController } from './controllers/business-gst-settings.controller';
import { EInvoiceController } from './controllers/einvoice.controller';
import { EWayBillController } from './controllers/ewaybill.controller';
import { AuthGuard } from './guards/auth.guard';
import { GstReport } from './entities/gst-report.entity';
import { EInvoiceRequest } from './entities/einvoice-request.entity';
import { BusinessGstSettings } from './entities/business-gst-settings.entity';
import { EWayBill } from './entities/ewaybill.entity';
import { CreditNote } from './entities/credit-note.entity';
import { DebitNote } from './entities/debit-note.entity';
import { AdvanceReceipt } from './entities/advance-receipt.entity';
import { Gstr2aImport } from './entities/gstr2a-import.entity';
import { Gstr2aReconciliation } from './entities/gstr2a-reconciliation.entity';
import { GstReportRepository } from './repositories/gst-report.repository';
import { EInvoiceRequestRepository } from './repositories/einvoice-request.repository';
import { BusinessGstSettingsRepository } from './repositories/business-gst-settings.repository';
import { EWayBillRepository } from './repositories/ewaybill.repository';
import { Gstr2aImportRepository } from './repositories/gstr2a-import.repository';
import { Gstr2aReconciliationRepository } from './repositories/gstr2a-reconciliation.repository';
import { HttpClientService } from './services/http-client.service';
import { InvoiceClientService } from './services/invoice-client.service';
import { PartyClientService } from './services/party-client.service';
import { BusinessClientService } from './services/business-client.service';
import { Gstr1Service } from './services/gstr1.service';
import { Gstr3bService } from './services/gstr3b.service';
import { Gstr4Service } from './services/gstr4.service';
import { Gstr2aReconciliationService } from './services/gstr2a-reconciliation.service';
import { BusinessGstSettingsService } from './services/business-gst-settings.service';
import { ExcelExportService } from './services/excel-export.service';
import { GSPProviderFactory } from './services/gsp/gsp-provider.factory';
import { ClearTaxGSPProvider } from './services/gsp/cleartax-gsp-provider.service';
import { GSPAuthService } from './services/gsp/gsp-auth.service';
import { EInvoiceService } from './services/einvoice.service';
import { EWayBillService } from './services/ewaybill.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('GST_DB_NAME', 'gst_db'),
        entities: [GstReport, EInvoiceRequest, BusinessGstSettings, EWayBill, CreditNote, DebitNote, AdvanceReceipt, Gstr2aImport, Gstr2aReconciliation],
        synchronize: configService.get('NODE_ENV') !== 'production' || 
                     configService.get('ENABLE_SYNC') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      GstReport,
      EInvoiceRequest,
      BusinessGstSettings,
      EWayBill,
      CreditNote,
      DebitNote,
      AdvanceReceipt,
      Gstr2aImport,
      Gstr2aReconciliation,
    ]),
  ],
  controllers: [HealthController, Gstr1Controller, Gstr3bController, Gstr4Controller, Gstr2aReconciliationController, ValidationController, BusinessGstSettingsController, EInvoiceController, EWayBillController],
  providers: [
    AuthGuard,
    HttpClientService,
    InvoiceClientService,
    PartyClientService,
    BusinessClientService,
    GstReportRepository,
    EInvoiceRequestRepository,
    BusinessGstSettingsRepository,
    EWayBillRepository,
    Gstr1Service,
    Gstr3bService,
    Gstr4Service,
    Gstr2aReconciliationService,
    BusinessGstSettingsService,
    ExcelExportService,
    GSPProviderFactory,
    ClearTaxGSPProvider,
    GSPAuthService,
    EInvoiceService,
    EWayBillService,
  ],
  exports: [
    HttpClientService,
    InvoiceClientService,
    PartyClientService,
    BusinessClientService,
    GstReportRepository,
    EInvoiceRequestRepository,
    BusinessGstSettingsRepository,
    EWayBillRepository,
  ],
})
export class AppModule {}

