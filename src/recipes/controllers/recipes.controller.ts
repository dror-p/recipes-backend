import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { RecipesService } from '../services/recipes.service';
import { Recipe } from '../interfaces/recipe.interface';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  async findAll(): Promise<Recipe[]> {
    return this.recipesService.getAllRecipes();
  }

  @Get(':id')
  async getRecipeById(@Param('id') id: string): Promise<Recipe | null> {
    const recipeId = parseInt(id, 10);
    return this.recipesService.getRecipeById(recipeId);
  }

  @Post()
  async create(@Body() recipe: Recipe): Promise<Recipe> {
    return this.recipesService.createRecipe(recipe);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    await this.recipesService.deleteRecipe(id);
  }
}
