import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { User } from '@ionic/cloud-angular';

// Third-party
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import * as moment from 'moment';

// Models
import { Activity, ActivityPlan, UserProfile, WarningMessage } from '../models';

// Providers
import { FitnessService } from './fitness.service';
import { MealService } from './meal.service';
import { NutritionService } from './nutrition.service';

const CURRENT_DAY: number = moment().dayOfYear();

@Injectable()
export class ActivityService {
  private _activities: FirebaseListObservable<Array<Activity>>;
  private _activityLimitSubject: Subject<number> = new Subject();
  private _currentActivityPlan: FirebaseObjectObservable<ActivityPlan>;
  private _lastActivityPlan: FirebaseObjectObservable<ActivityPlan>;
  private _userWeight: number;
  constructor(
    private _db: AngularFireDatabase,
    private _fitSvc: FitnessService,
    private _mealSvc: MealService,
    private _nutritionSvc: NutritionService,
    private _user: User
  ) {
    this._activities = _db.list('/activities', {
      query: {
        //limitToFirst: this._activityLimitSubject,
        orderByChild: 'name'
      }
    });

    this._currentActivityPlan = _db.object(`/activity-plans/${_user.id}/${CURRENT_DAY}`);
    this._lastActivityPlan = _db.object(`/activity-plans/${_user.id}/${CURRENT_DAY - 1}`);

    this._userWeight = _fitSvc.getUserWeight();
  }

  /**
   * Looks for imbalance in the previous day activity plan
   * @description We must exercise every day, both intellectually and physically, but not too much
   * @param {ActivityPlan} activityPlan - The activity plan to check
   * @returns {void}
   */
  private _checkLastActivityPlan(activityPlan: ActivityPlan): void {
    if (activityPlan.intellectualEffort > 480) {
      activityPlan.intellectualOverwork++;
      activityPlan.intellectualInactivity = 0;
    } else if (activityPlan.intellectualEffort < 60) {
      activityPlan.intellectualInactivity++;
      activityPlan.intellectualOverwork = 0;
    }

    if (activityPlan.physicalEffort > 480) {
      activityPlan.physicalOverwork++;
      activityPlan.physicalInactivity = 0;
    } else if (activityPlan.physicalEffort < 60) {
      activityPlan.physicalInactivity++;
      activityPlan.physicalOverwork = 0;
    }
  }

  /**
   * Changes the database query limit of activities
   * @param {number} limit - The maximum limit
   * @returns {void}
   */
  public changeActivityQueryLimit(limit: number): void {
    this._activityLimitSubject.next(limit);
  }

  /**
   * Checks if the activity is performed properly
   * @description We must exercise smart
   * @param {Activity} activity - The activity to check
   * @returns {WarningMessage} Returns warning if something is wrong
   */
  public checkActivity(activity: Activity): WarningMessage {
    if (activity.met >= 8 && activity.duration > 45) {
      return new WarningMessage(
        'Too much intense exercise at once',
        'Long sessions of intense exercise damage the heart over time. Keep intense exercise to less than 45 minute per day.'
      )
    }

    if (activity.met < 4 && activity.type === 'Physical') {
      return new WarningMessage(
        'You need to reach your target heart rate',
        "Keep in mind that your activities are impactless if they don't raise your heart rate in the aerobic zone"
      )
    }

    /**
     * In a study, students who did more hours of homework experienced greater behavioral engagement in school but also more academic stress,
     * physical health problems, and lack of balance in their lives
     * http://www.tandfonline.com/doi/abs/10.1080/00220973.2012.745469
     */
    if (activity.duration >= 240 && activity.type === 'Intellectual') {
      return new WarningMessage(
        'Too much intellectual activity',
        'Studying for too long is not beneficial for your nervous system and not productive. Try to study less time, but more intense during your productive hours of the day.'
      )
    }
  }

  /**
   * Queries the activities
   * @returns {FirebaseListObservable} Returns observable of activities
   */
  public getActivities$(): FirebaseListObservable<Array<Activity>> {
    return this._activities;
  }

  /**
   * Calculates the total duration of performed activities
   * @param {Array} activities - The activities to count
   * @returns {number} Returns the total duration
   */
  public getActivitiesDuration(activities: Array<Activity>): number {
    return activities.reduce((acc: number, currActivity: Activity) => acc += currActivity.duration, 0);
  }

  /**
   * Calculates the kilocalories burned during a performed energy
   * @description The formula was developed by Dr. Gily Ionesc
   * @param {Activity} activity - 
   */
  public getActivityEnergyBurn(activity: Activity): number {
    return Math.round((activity.met * 3.5 * this._userWeight / 200) * activity.duration);
  }

  /**
   * Queries the current day activity plan and checks for overwork or inactivity
   * @returns {Observable} Returns observable of the current day activity plan
   */
  public getActivityPlan$(): Observable<ActivityPlan> {
    return new Observable((observer: Observer<ActivityPlan>) => {
      this._currentActivityPlan.subscribe((currActivityPlan: ActivityPlan) => {
        if (currActivityPlan['$value'] === null) {
          let newActivityPlan = new ActivityPlan();

          // Get the previous day activity plan to check for activity imbalances
          this._lastActivityPlan.subscribe((lastActivityPlan: ActivityPlan) => {
            if (!lastActivityPlan.hasOwnProperty('$value')) {
              this._checkLastActivityPlan(lastActivityPlan);

              // Add up the intellectual activity imbalances of the previous activity plan along with the accumulated once from previous days or reset them if it is the case
              newActivityPlan.intellectualInactivity += lastActivityPlan.intellectualInactivity;
              newActivityPlan.intellectualOverwork += lastActivityPlan.intellectualOverwork;

              // Add up the physical activity imbalances of the previous activity plan along with the accumulated once from previous days or reset them if it is the case
              newActivityPlan.physicalInactivity += lastActivityPlan.physicalInactivity;
              newActivityPlan.physicalOverwork += lastActivityPlan.physicalOverwork;
            }

            observer.next(newActivityPlan);
            observer.complete();
          });
        } else {
          observer.next(currActivityPlan);
          observer.complete();
        }
      });
    });
  }

  /**
   * Gets the user's left energy supplies based on the energy intake and energy burn
   * @description The user must use his daily energy supplies
   * @returns {number} Returns the user's left energy supplies
   */
  public getLeftEnergy(): Promise<number> {
    return new Promise(resolve => Promise.all([this._fitSvc.restoreEnergyConsumption(), this._fitSvc.restoreEnergyIntake()]).then((data: Array<number>) => resolve(data[1] - data[0])));
  }

  /**
   * Calculates the total energy burn of performed activities
   * @param {Array} activities - The activities to count
   * @returns {number} Returns the total energy burn
   */
  public getTotalEnergyBurn(activities: Array<Activity>): number {
    return activities.reduce((acc: number, currActivity: Activity) => acc += currActivity.energyBurn, 0);
  }

  /**
   * Saves the activity plan to Firebase database
   * @param {ActivityPlan} activityPlan - The activity plan to save
   * @returns {void}
   */
  public saveActivityPlan(activityPlan: ActivityPlan): void {
    console.log('Saving activity plan: ', activityPlan);

    // Update the user daily requirements
    this.updateUserRequirements(activityPlan.totalEnergyBurn);

    this._currentActivityPlan.update({
      date: activityPlan.date,
      intellectualActivities: activityPlan.intellectualActivities,
      intellectualEffort: activityPlan.intellectualEffort,
      intellectualInactivity: activityPlan.intellectualInactivity,
      intellectualOverwork: activityPlan.intellectualOverwork,
      physicalActivities: activityPlan.physicalActivities,
      physicalEffort: activityPlan.physicalEffort,
      physicalInactivity: activityPlan.physicalInactivity,
      physicalOverwork: activityPlan.physicalOverwork,
      totalEnergyBurn: activityPlan.totalEnergyBurn,
      warnings: activityPlan.warnings
    });
  }

  /**
   * Updates the user's requirements based on his energy consumptions
   * @param {number} energyConsumption - The user's daily energy consumption in kilocalories
   * @returns {void}
   */
  public updateUserRequirements(energyConsumption: number): void {
    let userProfile: UserProfile = this._fitSvc.getProfile();
    this._fitSvc.storeEnergyConsumption(userProfile.bmr + energyConsumption);
    userProfile.requirements = this._nutritionSvc.getDri(userProfile.age, userProfile.bmr + energyConsumption, userProfile.gender, userProfile.height, userProfile.lactating, userProfile.pregnant, userProfile.weight);
    this._fitSvc.saveProfile(userProfile);
  }

}
