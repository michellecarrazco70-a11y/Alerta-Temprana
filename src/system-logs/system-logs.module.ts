import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from '../entities';
import { LoggerService } from './logs.service';

@Global()
@Module({
	imports: [TypeOrmModule.forFeature([Log])],
	providers: [LoggerService],
	exports: [LoggerService],
})
export class SystemLogsModule { }
