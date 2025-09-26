import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: any;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['others']
    });

    // prefill username if registration flow set a one-time flag
    try {
      const regFlag = localStorage.getItem('ims_registered');
      if (regFlag === '1') {
        const ru = localStorage.getItem('ims_registered_user') || '';
        if (ru) this.form.get('username')?.setValue(ru);
        localStorage.removeItem('ims_registered');
        localStorage.removeItem('ims_registered_user');
      }
    } catch (e) {
      // ignore
    }
  }

  submit() {
    if (this.form.invalid) return;
    const username = this.form.get('username')?.value || '';
    const password = this.form.get('password')?.value || '';
    const role = this.form.get('role')?.value || 'user';

    // If user is non-admin and not registered, show helpful error
    if (role !== 'admin' && !this.auth.userExists(username)) {
      this.error = 'User not registered,Please register first.';
      return;
    }

    const ok = this.auth.login(username as string, password as string, role as string);
    if (ok) {
      const redirect = this.auth.getRedirectUrl();
      if (redirect) {
        this.auth.setRedirectUrl(null);
        this.router.navigateByUrl(redirect).then(() => window.dispatchEvent(new Event('auth:login')));
      } else if (role !== 'admin') {
        // non-admin users go straight to products
        this.router.navigateByUrl('/products').then(() => window.dispatchEvent(new Event('auth:login')));
      } else {
        this.router.navigateByUrl('/').then(() => window.dispatchEvent(new Event('auth:login')));
      }
    } else {
      if (role === 'admin') this.error = 'Invalid admin credentials';
      else this.error = 'Invalid username or password.';
    }
  }
}
