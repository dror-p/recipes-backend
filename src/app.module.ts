import { Module } from '@nestjs/common';
import { RecipesModule } from './recipes/modules/recipes.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RecipesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
