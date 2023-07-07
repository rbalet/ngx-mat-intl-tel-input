import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { MatDividerModule } from '@angular/material/divider'

import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { ngxMatTelInputComponent } from './ngx-mat-tel-input.component'
import { SearchPipe } from './search.pipe'

describe('ngxMatTelInputComponent', () => {
  let component: ngxMatTelInputComponent
  let fixture: ComponentFixture<ngxMatTelInputComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatMenuModule,
        MatButtonModule,
        MatDividerModule,
        ReactiveFormsModule,
        ngxMatTelInputComponent,
        SearchPipe,
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ngxMatTelInputComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
