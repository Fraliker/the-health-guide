// App
import { Injectable } from '@angular/core';
import { User } from '@ionic/cloud-angular';

// Third-party
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

// Models
import {
  Food,
  Nutrition,
  Recipe
} from '../models';

// Providers
import { FoodService } from './food.service';
import { NutritionService } from './nutrition.service';

@Injectable()
export class RecipeService {
  private _recipes: FirebaseListObservable<Array<Recipe>>;
  constructor(
    private _db: AngularFireDatabase,
    private _foodSvc: FoodService,
    private _nutritionSvc: NutritionService,
    private _user: User
  ) {
    this._recipes = _db.list(`/recipes/${_user.id}`, {
      query: {
        orderByChild: 'name'
      }
    });
  }

  /**
   * Applies the cooking impact on nutrients
   * @param {Recipe} recipe - The recipe to check
   * @returns {void}
   */
  public checkCooking(recipe: Recipe): void {
    if (recipe.cookingMethod === 'Baking' || recipe.cookingMethod === 'Grilling' || recipe.cookingMethod === 'Roasting' || recipe.cookingMethod === 'Steaming') {
      // Dry heat cooking
      recipe.nutrition.ala.value *= 0.75;
      recipe.nutrition.choline.value *= 0.1;
      recipe.nutrition.dha.value *= 0.75;
      recipe.nutrition.epa.value *= 0.75;
      recipe.nutrition.la.value *= 0.75;
      recipe.nutrition.omega3.value *= 0.75;
      recipe.nutrition.omega6.value *= 0.75;
      recipe.nutrition.vitaminA.value *= 0.5;
      recipe.nutrition.vitaminB1.value *= 0.3;
      recipe.nutrition.vitaminB2.value *= 0.1;
      recipe.nutrition.vitaminB3.value *= 0.1;
      recipe.nutrition.vitaminB5.value *= 0.1;
      recipe.nutrition.vitaminB6.value *= 0.1;
      recipe.nutrition.vitaminB9.value *= 0.1;
      recipe.nutrition.vitaminC.value *= 0.8;
      recipe.nutrition.vitaminD.value *= 0.5;
      recipe.nutrition.vitaminE.value *= 0.5;
      recipe.nutrition.vitaminK.value *= 0.5;
    } else if (recipe.cookingMethod === 'Frying' || recipe.cookingMethod === 'Stewing') {
      // Moist cooking
      recipe.nutrition.ala.value *= 0.75;
      recipe.nutrition.calcium.value *= 0.2;
      recipe.nutrition.choline.value *= 0.7;
      recipe.nutrition.copper.value *= 0.4;
      recipe.nutrition.dha.value *= 0.75;
      recipe.nutrition.epa.value *= 0.75;
      recipe.nutrition.iron.value *= 0.35;
      recipe.nutrition.la.value *= 0.75;
      recipe.nutrition.magnesium.value *= 0.25;
      recipe.nutrition.manganese.value *= 0.25;
      recipe.nutrition.omega3.value *= 0.75;
      recipe.nutrition.omega6.value *= 0.75;
      recipe.nutrition.phosphorus.value *= 0.25;
      recipe.nutrition.potassium.value *= 0.3;
      recipe.nutrition.selenium.value *= 0.25;
      recipe.nutrition.vitaminA.value *= 0.25;
      recipe.nutrition.vitaminB1.value *= 0.55;
      recipe.nutrition.vitaminB2.value *= 0.25;
      recipe.nutrition.vitaminB3.value *= 0.4;
      recipe.nutrition.vitaminB5.value *= 0.5;
      recipe.nutrition.vitaminB6.value *= 0.4;
      recipe.nutrition.vitaminB9.value *= 0.7;
      recipe.nutrition.vitaminB12.value *= 0.45;
      recipe.nutrition.vitaminC.value *= 0.5;
      recipe.nutrition.vitaminD.value *= 0.25;
      recipe.nutrition.vitaminE.value *= 0.25;
      recipe.nutrition.vitaminK.value *= 0.25;
      recipe.nutrition.zinc.value *= 0.25;
    } else if (recipe.cookingMethod === 'Boiling') {
      // Cooking and draining the water
      recipe.nutrition.ala.value *= 0.75;
      recipe.nutrition.calcium.value *= 0.25;
      recipe.nutrition.choline.value *= 0.75;
      recipe.nutrition.copper.value *= 0.45;
      recipe.nutrition.dha.value *= 0.75;
      recipe.nutrition.epa.value *= 0.75;
      recipe.nutrition.iron.value *= 0.4;
      recipe.nutrition.la.value *= 0.75;
      recipe.nutrition.magnesium.value *= 0.4;
      recipe.nutrition.manganese.value *= 0.4;
      recipe.nutrition.omega3.value *= 0.75;
      recipe.nutrition.omega6.value *= 0.75;
      recipe.nutrition.phosphorus.value *= 0.35;
      recipe.nutrition.potassium.value *= 0.7;
      recipe.nutrition.selenium.value *= 0.4;
      recipe.nutrition.vitaminA.value *= 0.35;
      recipe.nutrition.vitaminB1.value *= 0.7;
      recipe.nutrition.vitaminB2.value *= 0.45;
      recipe.nutrition.vitaminB3.value *= 0.55;
      recipe.nutrition.vitaminB5.value *= 0.7;
      recipe.nutrition.vitaminB6.value *= 0.65;
      recipe.nutrition.vitaminB9.value *= 0.75;
      recipe.nutrition.vitaminB12.value *= 0.5;
      recipe.nutrition.vitaminC.value *= 0.75;
      recipe.nutrition.vitaminD.value *= 0.35;
      recipe.nutrition.vitaminE.value *= 0.35;
      recipe.nutrition.vitaminK.value *= 0.35;
      recipe.nutrition.zinc.value *= 0.4;
    }

  }

  /**
   * Gets the recipe difficulty level by the number of instructions
   * @param {Recipe} recipe - The recipe to check
   * @returns {string} Returns the difficulty level name
   */
  public checkDifficulty(recipe: Recipe): number {
    return recipe.instructions.length < 5 ? 1 : recipe.instructions.length < 10 ? 2 : 3;
  }
  
  /**
   * Calculates the nutritional values of a single portions of the recipe based on the ingredients
   * @param {Array} items - The ingredients of the recipe
   * @param {number} portions - The number of portions for t
   * @returns {Nutrition} Returns the recipe nutrition
   */
  public getRecipeNutrition(items: Array<Food | Recipe>, portions: number): Nutrition {
    let totalNutrition: Nutrition = this._nutritionSvc.getTotalNutrition(items),
      portionNutrition: Nutrition = new Nutrition();

    for (let nutrientKey in totalNutrition) {
      portionNutrition[nutrientKey].value = totalNutrition[nutrientKey].value / portions;
      portionNutrition[nutrientKey].value = +(portionNutrition[nutrientKey].value).toFixed(2);
    }
    return portionNutrition;
  }

  /**
   * Gets the user's recipes
   * @returns {FirebaseListObservable} Returns an observable that publishes the recipes
   */
  public getRecipes$(): FirebaseListObservable<Array<Recipe>> {
    return this._recipes;
  }

  /**
   * Gets the size of the recipe
   * @param {Array} items - The ingredients of the recipe
   * @returns {number} Returns the quantity in grams of the recipe
   */
  public getRecipeSize(items: Array<Food | Recipe>, portions: number): number {
    return Math.round(this._nutritionSvc.calculateQuantity(items) / portions);
  }

  /**
   * Removes the recipe from the database
   * @param {Recipes} recipe - The recipe to update
   * @returns {void}
   */
  public removeRecipe(recipe: Recipe): void {
    this._recipes.remove(recipe['$key']);
  }

  /**
   * Updates a recipe to the database or adds it if it's new
   * @param {Recipes} recipe - The recipe to update
   * @returns {void}
   */
  public saveRecipe(recipe: Recipe): void {
    console.log('Saving recipe: ', recipe);
    if (!recipe.hasOwnProperty('$key')) {
      recipe['$key'] = this._recipes.push(recipe).key;
    } else {
      this._recipes.update(recipe['$key'], {
        chef: this._user.details.username || this._user.details.name,
        chefAvatar: this._user.details.image,
        cookingMethod: recipe.cookingMethod,
        cookingTemperature: recipe.cookingTemperature,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        image: recipe.image,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        name: recipe.name,
        nutrition: recipe.nutrition,
        portions: recipe.portions,
        pral: recipe.pral,
        quantity: recipe.quantity,
        servings: recipe.servings
      });
    }
  }

}
