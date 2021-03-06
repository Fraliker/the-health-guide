// App
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, NavController, NavParams } from 'ionic-angular';
import { Auth } from '@ionic/cloud-angular';

// Providers
import { AuthValidator } from '../../providers';

@Component({
  selector: 'page-password-reset',
  templateUrl: 'password-reset.html'
})
export class PasswordResetPage {
  public email: string;
  public password: AbstractControl;
  public passwordResetForm: FormGroup;
  public resetCode: AbstractControl;
  constructor(
    private _alertCtrl: AlertController,
    private _auth: Auth,
    private _fb: FormBuilder,
    private _loadCtrl: LoadingController,
    private _navCtrl: NavController,
    private _params: NavParams
  ) {
    this.email = _params.get('email');
    this.passwordResetForm = _fb.group({
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(16),
        AuthValidator.passwordValidator, AuthValidator.noWhiteSpace])
      ],
      resetCode: [
        '',
        Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(6),
        AuthValidator.noWhiteSpace])
      ]
    });

    this.password = this.passwordResetForm.get('password');
    this.resetCode = this.passwordResetForm.get('resetCode');
  }

  public backToLogin(): void {
    this._navCtrl.popToRoot();
  }

  public resetPassword(form: { resetCode: number, password: string }): void {
    let loader = this._loadCtrl.create({
      content: 'Resetting your password...',
      spinner: 'crescent'
    });

    loader.present();

    this._auth.confirmPasswordReset(form.resetCode, form.password)
      .then(() => {
        loader.dismiss();
        this._navCtrl.popToRoot();
      })
      .catch((err: Error) => this._alertCtrl.create({
        title: 'Uhh ohh...',
        subTitle: 'Something went wrong',
        message: err.toString(),
        buttons: ['OK']
      }).present());
  }
}
