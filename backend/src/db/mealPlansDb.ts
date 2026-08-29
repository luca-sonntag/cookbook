import type {
  MealPlanEntry,
  MealType,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  IngredientGroup,
} from '@cookbook/shared';
import { getClient, wrapError, isNoRowsError, num } from './client.js';
import type { MealPlanRow } from './types/mealPlans.js';

export function rowToMealPlanEntry(row: MealPlanRow): MealPlanEntry {
  const recipeData = row.recipes;
  return {
    id: row.id,
    userId: row.user_id,
    recipeId: row.recipe_id,
    planDate: row.plan_date,
    mealType: row.meal_type as MealType,
    servings: num(row.servings) ?? 2,
    isCooked: row.is_cooked,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipe: recipeData
      ? {
          id: recipeData.id,
          title: recipeData.title,
          imageUrl: recipeData.image_url,
          prepTime: recipeData.prep_time,
          cookTime: recipeData.cook_time,
          servings: num(recipeData.servings) ?? 2,
          calories: num(recipeData.calories),
          protein: num(recipeData.protein_g),
          carbs: num(recipeData.carbs_g),
          fat: num(recipeData.fat_g),
          ingredients: (recipeData.ingredients as IngredientGroup[]) ?? [],
        }
      : undefined,
  };
}

export async function listMealPlans(
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<MealPlanEntry[]> {
  let query = getClient()
    .from('meal_plans')
    .select(
      `
      id,
      user_id,
      recipe_id,
      plan_date,
      meal_type,
      servings,
      is_cooked,
      notes,
      created_at,
      updated_at,
      recipes (
        id,
        title,
        image_url,
        prep_time,
        cook_time,
        servings,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        ingredients
      )
    `,
    )
    .eq('user_id', userId)
    .order('plan_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (startDate) {
    query = query.gte('plan_date', startDate);
  }
  if (endDate) {
    query = query.lte('plan_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw wrapError('listMealPlans', error);

  return ((data as unknown as MealPlanRow[]) || []).map(rowToMealPlanEntry);
}

export async function createMealPlan(
  userId: string,
  dto: CreateMealPlanDto,
): Promise<MealPlanEntry> {
  const { data, error } = await getClient()
    .from('meal_plans')
    .insert({
      user_id: userId,
      recipe_id: dto.recipeId,
      plan_date: dto.planDate,
      meal_type: dto.mealType,
      servings: dto.servings ?? 2,
      notes: dto.notes ?? null,
    })
    .select(
      `
      id,
      user_id,
      recipe_id,
      plan_date,
      meal_type,
      servings,
      is_cooked,
      notes,
      created_at,
      updated_at,
      recipes (
        id,
        title,
        image_url,
        prep_time,
        cook_time,
        servings,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        ingredients
      )
    `,
    )
    .single();

  if (error) throw wrapError('createMealPlan', error);
  return rowToMealPlanEntry(data as unknown as MealPlanRow);
}

export async function updateMealPlan(
  id: string,
  userId: string,
  dto: UpdateMealPlanDto,
): Promise<MealPlanEntry> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (dto.planDate !== undefined) updates.plan_date = dto.planDate;
  if (dto.mealType !== undefined) updates.meal_type = dto.mealType;
  if (dto.servings !== undefined) updates.servings = dto.servings;
  if (dto.isCooked !== undefined) updates.is_cooked = dto.isCooked;
  if (dto.notes !== undefined) updates.notes = dto.notes;

  const { data, error } = await getClient()
    .from('meal_plans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select(
      `
      id,
      user_id,
      recipe_id,
      plan_date,
      meal_type,
      servings,
      is_cooked,
      notes,
      created_at,
      updated_at,
      recipes (
        id,
        title,
        image_url,
        prep_time,
        cook_time,
        servings,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        ingredients
      )
    `,
    )
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      throw new Error(`Meal plan entry not found or unauthorized: ${id}`);
    }
    throw wrapError('updateMealPlan', error);
  }

  return rowToMealPlanEntry(data as unknown as MealPlanRow);
}

export async function deleteMealPlan(id: string, userId: string): Promise<void> {
  const { error } = await getClient()
    .from('meal_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw wrapError('deleteMealPlan', error);
}

export async function markMealPlansCookedForRecipe(
  userId: string,
  recipeId: string,
  dateStr?: string,
): Promise<number> {
  const targetDate = dateStr ?? new Date().toISOString().split('T')[0];
  const { data, error } = await getClient()
    .from('meal_plans')
    .update({
      is_cooked: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .eq('plan_date', targetDate)
    .eq('is_cooked', false)
    .select('id');

  if (error) throw wrapError('markMealPlansCookedForRecipe', error);
  return (data as Array<{ id: string }> | null)?.length ?? 0;
}

