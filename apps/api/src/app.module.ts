import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ArchivesModule } from './archives/archives.module';
import { FilesModule } from './files/files.module';
import { SearchModule } from './search/search.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { LmsModule } from './lms/lms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../.env'),
        path.resolve(process.cwd(), '.env'),
      ],
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    ArchivesModule,
    FilesModule,
    SearchModule,
    FavoritesModule,
    NewsModule,
    NotificationsModule,
    SettingsModule,
    AuditModule,
    InstitutionsModule,
    LmsModule,
  ],
})
export class AppModule {}
