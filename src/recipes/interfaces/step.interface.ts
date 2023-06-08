export interface Step {
    id: number;
    recipe_id: number;
    description: string;
    timer_duration: string;
    previous_step_id?: number;
    identifier: string;
    previous_step?: string;
    temp_id?: string;
}
  
  