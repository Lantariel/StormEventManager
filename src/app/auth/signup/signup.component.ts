import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {PermissionsService} from '../../services/permissions.service';
import {Permission} from '../../models/permission.model';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  permissions: Permission[] ;
  permissionSubscription: Subscription ;

  signUpForm: FormGroup;
  errorMessage: string;
  confMessage: string;

  constructor(private formBuilder: FormBuilder,
              private permissionService: PermissionsService,
              private authService: AuthService,
              private router: Router) { }

  ngOnInit(): void {
/*
    this.permissionSubscription = this.permissionService.permissionsSubject.subscribe(
      (permissions: Permission[]) => {
        this.permissions = permissions ;
        console.log(this.permissions) ;
      }
    );
    this.permissionService.emitPermission() ;
    console.log(this.permissions) ;*/
    this.initForm() ;
  }

  initForm() {
    this.signUpForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/[0-9a-zA-Z]{6,}/)]]
    });
  }

  onSubmit() {
    const email = this.signUpForm.get('email').value;
    const password = this.signUpForm.get('password').value;
    this.authService.createNewUser(email, password).then(
      () => {
        /*const newPermission = new Permission(email, 1, 'player') ;
        this.permissionService.createPermission(newPermission) ;*/
        this.router.navigate(['/listetournois']);
      },
      (error) => {
        this.errorMessage = error;
      }
    );
  }
}
