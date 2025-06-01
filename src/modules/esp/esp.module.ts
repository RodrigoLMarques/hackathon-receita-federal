import { Module } from '@nestjs/common';
import { ApiModule } from '../api/api.module';
import { EspService } from './esp.service';

@Module({
  imports: [ApiModule],
  providers: [EspService],
  exports: [EspService],
})
export class EspModule {}
