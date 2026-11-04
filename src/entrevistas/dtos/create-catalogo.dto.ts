import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCatalogoDto {

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  nombre: string;
}