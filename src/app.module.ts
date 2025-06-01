import { Module } from '@nestjs/common';
import { EspModule } from './modules/esp/esp.module';
import { ApiModule } from './modules/api/api.module';

@Module({
  imports: [EspModule, ApiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
