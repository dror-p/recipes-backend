import { Module } from '@nestjs/common';
import { RecipesController } from '../controllers/recipes.controller';
import { RecipesService } from '../services/recipes.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
