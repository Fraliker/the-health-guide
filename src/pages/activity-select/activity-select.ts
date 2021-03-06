// App
import { Component } from '@angular/core';
import { AlertController, InfiniteScroll, ViewController } from 'ionic-angular';

// Third-party
import { FirebaseListObservable } from 'angularfire2/database';

// Models
import { Activity } from '../../models';

// Providers
import { ActivityService } from '../../providers';


@Component({
  selector: 'page-activity-select',
  templateUrl: 'activity-select.html'
})
export class ActivitySelectPage {
  public activities$: FirebaseListObservable<Array<Activity>>;
  public limit: number = 50;
  public searchQuery: string = '';
  public selectedActivity: Activity;
  constructor(
    private _activitySvc: ActivityService,
    private _alertCtrl: AlertController,
    private _viewCtrl: ViewController
  ) { }

  public clearSearch(ev): void {
    this.searchQuery = '';
  }

  public doneSelecting(): void {
    this._viewCtrl.dismiss(this.selectedActivity);
  }

  public loadMore(ev: InfiniteScroll) {
    this.limit += 50;
    setTimeout(() => {
      ev.complete();
    }, 1000);
  }

  public selectActivity(activity: Activity): void {
    this._alertCtrl.create({
      title: 'Duration',
      subTitle: 'How long did you perform this activity?',
      inputs: [
        {
          name: 'duration',
          placeholder: 'Minutes',
          type: 'number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Done',
          handler: (data: { duration: number }) => {
            activity.duration = +data.duration;
            activity.energyBurn = this._activitySvc.getActivityEnergyBurn(activity);
            this.selectedActivity = Object.assign({}, activity);
          }
        }
      ]
    }).present();
  }

  ionViewWillEnter(): void {
    this.activities$ = this._activitySvc.getActivities$();
  }
}
