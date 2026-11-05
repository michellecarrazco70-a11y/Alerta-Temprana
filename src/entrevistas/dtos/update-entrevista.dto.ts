import { PartialType } from '@nestjs/mapped-types';
import { CreateEntrevistaDto } from './create-entrevista.dto';

export class UpdateEntrevistaDto extends PartialType(CreateEntrevistaDto) {}