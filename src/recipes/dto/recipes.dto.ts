import { IsNotEmpty, ArrayNotEmpty, ArrayMinSize, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Column } from 'typeorm';

class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @IsString()
  @IsNotEmpty()
  amount: string;
}

class CreateStepDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  timer_duration: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];

  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps: CreateStepDto[];
}
