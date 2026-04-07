import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from './supabase/supabase.module';
import { ListingsModule } from './listings/listings.module';
import { CmaModule } from './cma/cma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { MessagesModule } from './messages/messages.module';
import { ParcelsModule } from './parcels/parcels.module';

@Module({
  imports: [
    // Config — loads .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Cron jobs (parcel data sync)
    ScheduleModule.forRoot(),

    // Core services
    SupabaseModule,

    // Feature modules
    ListingsModule,
    CmaModule,
    TransactionsModule,
    ChecklistsModule,
    MessagesModule,
    ParcelsModule,
  ],
})
export class AppModule {}
