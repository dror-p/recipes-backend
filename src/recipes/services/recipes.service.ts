import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Recipe } from '../interfaces/recipe.interface';
import { Ingredient } from '../interfaces/ingredient.interface';
import { Step } from '../interfaces/step.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RecipesService {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DB_CONNECTION_STRING,
    });
  }

  async getAllRecipes(): Promise<Recipe[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT
          recipes.id,
          recipes.title,
          ingredients.id AS ingredient_id,
          ingredients.name AS ingredient_name,
          ingredients.amount,
          steps.id AS step_id,
          steps.description,
          steps.timer_duration,
          steps.previous_step_id,
          recipes.created_at,
          recipes.updated_at
        FROM
          recipes
          LEFT JOIN ingredients ON ingredients.recipe_id = recipes.id
          LEFT JOIN steps ON steps.recipe_id = recipes.id
        ORDER BY recipes.id, ingredients.id, steps.id
      `;
      const result = await client.query(query);
  
      const recipes: Recipe[] = [];
  
      for (const row of result.rows) {
        const {
          id,
          title,
          ingredient_id,
          ingredient_name,
          amount,
          step_id,
          description,
          timer_duration,
          identifier,
          previous_step_id,
          created_at,
          updated_at,
        } = row;
  
        let recipe = recipes.find((r) => r.id === id);
        if (!recipe) {
          recipe = {
            id,
            title,
            ingredients: [],
            steps: [],
            created_at,
            updated_at,
          };
          recipes.push(recipe);
        }
  
        if (ingredient_id && !recipe.ingredients.some((i) => i.id === ingredient_id)) {
          const ingredient: Ingredient = {
            id: ingredient_id,
            recipe_id: recipe.id,
            name: ingredient_name,
            amount,
          };
          recipe.ingredients.push(ingredient);
        }
  
        if (step_id && !recipe.steps.some((s) => s.id === step_id)) {
          const step: Step = {
            id: step_id,
            recipe_id: recipe.id,
            description,
            timer_duration,
            previous_step_id,
            identifier
          };
          recipe.steps.push(step);
        }
      }
  
      return recipes;
    } finally {
      client.release();
    }
  }

async createRecipe(recipe: Recipe): Promise<Recipe> {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');

    const insertRecipeQuery = `
      INSERT INTO recipes (title) VALUES ($1) RETURNING id
    `;
    const recipeValues = [recipe.title];
    const { rows: recipeRows } = await client.query(insertRecipeQuery, recipeValues);
    const recipeId = recipeRows[0].id;

    for (const ingredient of recipe.ingredients) {
      const insertIngredientQuery = `
        INSERT INTO ingredients (recipe_id, name, amount) VALUES ($1, $2, $3)
      `;
      const ingredientValues = [recipeId, ingredient.name, ingredient.amount];
      await client.query(insertIngredientQuery, ingredientValues);
    }

    const tempIdToStepIdMapping: Record<string, number> = {};

    for (const step of recipe.steps) {
      const { description, timer_duration, previous_step, temp_id } = step;

      const identifier = uuidv4();

      const insertStepQuery = `
        INSERT INTO steps (recipe_id, description, timer_duration, identifier) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `;
      const stepValues = [
        recipeId,
        description,
        timer_duration,
        identifier,
      ];
      const { rows: stepRows } = await client.query(insertStepQuery, stepValues);
      const stepId = stepRows[0].id;

      tempIdToStepIdMapping[temp_id] = stepId;

      if (previous_step) {
        const previousStepId = tempIdToStepIdMapping[previous_step];

        const updateStepQuery = `
          UPDATE steps SET previous_step_id = $1 WHERE id = $2
        `;
        const updateStepValues = [previousStepId, stepId];
        await client.query(updateStepQuery, updateStepValues);
      }
    }

    await client.query('COMMIT');

    return {
      ...recipe,
      id: recipeId,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  async deleteRecipe(id: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const deleteRecipeQuery = `
        DELETE FROM recipes WHERE id = $1
      `;
      await client.query(deleteRecipeQuery, [id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRecipeById(recipeId: number): Promise<Recipe | null> {
    const client = await this.pool.connect();
  
    try {
      const query = `
        SELECT
          r.id AS recipe_id,
          r.title,
          i.id AS ingredient_id,
          i.name AS ingredient_name,
          i.amount AS ingredient_amount,
          s.id AS step_id,
          s.description AS step_description,
          s.timer_duration AS step_timer_duration,
          s.identifier AS step_identifier,
          s.previous_step_id AS step_previous_step_id
        FROM recipes r
        LEFT JOIN ingredients i ON r.id = i.recipe_id
        LEFT JOIN steps s ON r.id = s.recipe_id
        WHERE r.id = $1
        ORDER BY i.id, s.id
      `;
  
      const result = await client.query(query, [recipeId]);
  
      if (result.rows.length === 0) {
        return null;
      }
  
      const recipe: Recipe = {
        id: result.rows[0].recipe_id,
        title: result.rows[0].title,
        ingredients: [],
        steps: [],
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      };
  
      const ingredientMap = new Map<number, Ingredient>();
      const stepMap = new Map<number, Step>();
  
      result.rows.forEach((row) => {
        const ingredientId = row.ingredient_id;
        const stepId = row.step_id;
  
        if (ingredientId && !ingredientMap.has(ingredientId)) {
          const ingredient: Ingredient = {
            id: ingredientId,
            name: row.ingredient_name,
            amount: row.ingredient_amount,
            recipe_id: row.recipe_id,
          };
          ingredientMap.set(ingredientId, ingredient);
          recipe.ingredients.push(ingredient);
        }
  
        if (stepId && !stepMap.has(stepId)) {
          const step: Step = {
            id: stepId,
            description: row.step_description,
            timer_duration: row.step_timer_duration,
            previous_step_id: row.step_previous_step_id,
            identifier: row.step_identifier,
            recipe_id: row.recipe_id,
          };
          stepMap.set(stepId, step);
          recipe.steps.push(step);
        }
      });
  
      return recipe;
    } finally {
      client.release();
    }
  }  
} 
