import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, ViewChild } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgxMatInputTelComponent } from '../../../ngx-mat-input-tel/src/lib/ngx-mat-input-tel.component'

interface PhoneForm {
  phone: FormControl<string | null>
}

interface ProfileForm {
  phone: FormControl<string | null>
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,

    // Forms
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,

    // Components
    NgxMatInputTelComponent,

    // Mat
    MatButtonModule,
    MatDividerModule,
  ],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(NgxMatInputTelComponent) phoneInput: NgxMatInputTelComponent | undefined

  phoneForm = new FormGroup<PhoneForm>({
    phone: new FormControl(null, [Validators.required, Validators.maxLength(12)]),
  })

  profileForm = new FormGroup<ProfileForm>({
    phone: new FormControl(null),
  })

  constructor() {}

  onSubmit() {
    console.log('onSubmit', this.phoneForm)
  }

  onReset() {
    this.phoneForm.reset()
  }

  ngAfterViewInit() {
    if (this.phoneInput && this.phoneInput.matMenu) {
      this.phoneInput.matMenu.panelClass = 'custom-panel'
    }

    this.phoneForm.valueChanges.subscribe((value) => {
      // Only emitting correct number
      console.log('phoneForm.valueChanges', value)
    })

    this.profileForm.valueChanges.subscribe((value) => {
      // Only emitting correct number
      console.log('phoneForm.valueChanges', value)
    })
  }
}
