// App
import { ChangeDetectorRef, ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, NavController } from 'ionic-angular';
import { Auth, IDetailedError, User, UserDetails } from '@ionic/cloud-angular';

// Vendor
import { Md5 } from 'ts-md5/dist/md5';

// Pages
import { HomePage } from '../home/home';
import { LoginPage } from '../login/login';

// Providers
import { AlertService, AuthValidator } from '../../providers';

@Component({
  selector: 'page-registration',
  templateUrl: 'registration.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationPage {
  public email: AbstractControl;
  public loginPage: any = LoginPage;
  public password: AbstractControl;
  public passwordConfirm: AbstractControl;
  public registerForm: FormGroup;
  public username: AbstractControl;
  constructor(
    private _alertSvc: AlertService,
    private _auth: Auth,
    private _detectorRef: ChangeDetectorRef,
    private _fb: FormBuilder,
    private _loadCtrl: LoadingController,
    private _navCtrl: NavController,
    private _user: User
  ) {
    this.registerForm = this._fb.group({
      email: [
        '',
        Validators.compose([Validators.required, AuthValidator.emailValidator,
        AuthValidator.noWhiteSpace])
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(16),
        AuthValidator.passwordValidator, AuthValidator.noWhiteSpace])
      ],
      passwordConfirm: ['', Validators.required],
      username: [
        '',
        Validators.compose([Validators.required, Validators.maxLength(20),
        AuthValidator.usernameValidator, AuthValidator.noWhiteSpace])
      ]
    }, { validator: AuthValidator.passwordMatchValidator });

    this.email = this.registerForm.get('email');
    this.password = this.registerForm.get('password');
    this.passwordConfirm = this.registerForm.get('passwordConfirm');
    this.username = this.registerForm.get('username');
  }

  public register(form: { username: string, email: string, password: string }): void {
    this._loadCtrl.create({
      content: 'Creating your account...',
      spinner: 'crescent',
      dismissOnPageChange: true
    }).present();
    
    let details: UserDetails = {
      'email': form.email.trim(),
      'image': 'https://www.gravatar.com/avatar/' + Md5.hashStr(form.email.trim()),
      'password': form.password.trim(),
      'username': form.username.trim()
    };

    this._auth.signup(details)
      .then(() => {
        this._auth.login('basic', details)
          .then(() => this._navCtrl.setRoot(HomePage))
          .catch((err: IDetailedError<Array<string>>) => {
            for (let e of err.details) {
              this._alertSvc.showAlert(AuthValidator.getErrorMessage(e, err));
            }
          });
      })
      .catch((err: IDetailedError<Array<string>>) => {
        for (let e of err.details) {
          this._alertSvc.showAlert(AuthValidator.getErrorMessage(e, err));
        }
      });
  }

  ionViewWillEnter() {
    if (this._auth.isAuthenticated()) {
      this._navCtrl.setRoot(HomePage);
    }
  }

  ionViewWillUnload() {
    console.log('Destroying...');
    this._detectorRef.detach();
  }

}
