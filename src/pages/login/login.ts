// App
import { ChangeDetectorRef, ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, NavController } from 'ionic-angular';
import { Auth, IDetailedError, User, UserDetails } from '@ionic/cloud-angular';

// Pages
import { ForgotPasswordPage } from '../forgot-password/forgot-password';
import { HomePage } from '../home/home';

// Providers
import { AlertService, AuthValidator } from '../../providers';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  public forgotPasswordPage: any = ForgotPasswordPage;
  public email: AbstractControl;
  public loginForm: FormGroup;
  public password: AbstractControl;
  constructor(
    private _alertSvc: AlertService,
    private _auth: Auth,
    private _detectorRef: ChangeDetectorRef,
    private _fb: FormBuilder,
    private _loadCtrl: LoadingController,
    private _navCtrl: NavController,
    private _user: User
  ) {

    this.loginForm = _fb.group({
      email: [
        '',
        Validators.compose([Validators.required, AuthValidator.emailValidator,
        AuthValidator.noWhiteSpace])
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(16),
        AuthValidator.passwordValidator, AuthValidator.noWhiteSpace])
      ]
    });

    this.email = this.loginForm.get('email');
    this.password = this.loginForm.get('password');
  }

  public login(form: { email: string, password: string }): void {
    let loader = this._loadCtrl.create({
      content: 'Please wait...',
      spinner: 'crescent'
    });

    loader.present();

    let details: UserDetails = {
      'email': form.email.trim(),
      'password': form.password.trim(),
    };

    this._auth.login('basic', details)
      .then(() => {
        loader.dismiss();
        this._navCtrl.setRoot(HomePage);
      })
      .catch((err: IDetailedError<Array<string>>) => {
        for (let e of err.details) {
          this._alertSvc.showAlert(AuthValidator.getErrorMessage(e, err));
        }
      });
  }

  ionViewWillUnload() {
    console.log('Destroying...');
    this._detectorRef.detach();
  }

}
