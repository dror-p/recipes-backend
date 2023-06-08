import { Ingredient } from './ingredient.interface';
import { Step } from './step.interface';

export interface Recipe {
    id: number;
    title: string;
    ingredients: Ingredient[];
    steps: Step[];
    created_at: Date;
    updated_at: Date;
  }
  