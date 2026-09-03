import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { StorageModule } from '../files/storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [StorageModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
