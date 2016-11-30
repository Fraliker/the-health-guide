import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { DataService } from '../../shared/data.service';
import { Recipe } from '../shared/recipe.model';

@Injectable()
export class RecipeDetailResolve implements Resolve<Recipe> {

  constructor(private dataSvc: DataService) { }

  public resolve(route: ActivatedRouteSnapshot): Promise<Recipe> {
    return new Promise((resolve, reject) => {
      resolve(this.dataSvc.getRecipe());
    });
  }

}