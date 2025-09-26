import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: any;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    // password must contain at least one lowercase, one uppercase, one digit and one special character
    const pwdPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$';
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(pwdPattern)]],
      confirm: ['', Validators.required]
    });
  }

  submit() {
    // mark all controls so validation messages show
    this.form.markAllAsTouched();
    this.error = '';
    if (this.form.invalid || !this.passwordsMatch) return;
    const username = this.form.get('username')?.value || '';
    const password = this.form.get('password')?.value || '';
    const confirm = this.form.get('confirm')?.value || '';
    if (password !== confirm) {
      this.error = 'Passwords do not match';
      return;
    }

    try {
      // register the user (role 'others' by default). If username already exists, addUser returns false.
      const added = this.auth.addUser(username, password, 'others');
      if (!added) {
        this.error = 'Username already exists';
        return;
      }

      // store a one-time registration flag so login can show a single success message
      localStorage.setItem('ims_registered', '1');
      localStorage.setItem('ims_registered_user', username);
      // show native alert; execution resumes after user dismisses alert
      window.alert('Registered successfully');
      // redirect user to login (login will read and clear the localStorage flag)
      this.router.navigate(['/login']);
    } catch (e) {
      this.error = 'Registration failed';
    }
  }

  get passwordsMatch() {
    return this.form && this.form.get('password')?.value === this.form.get('confirm')?.value;
  }
}
