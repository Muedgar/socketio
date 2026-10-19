import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AdminGateway } from './gateways/admin.gateway';
import { EventsGateway } from './gateways/events.gateway';
import { SocketStateService } from './socket-state.service';

@Module({
  controllers: [AuthController],
  providers: [EventsGateway, AdminGateway, SocketStateService],
})
export class AppModule {}
