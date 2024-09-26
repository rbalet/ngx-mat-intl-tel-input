import { FocusMonitor } from '@angular/cdk/a11y'
import { coerceBooleanProperty } from '@angular/cdk/coercion'
import { NgClass } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
  booleanAttribute,
} from '@angular/core'
import {
  FormGroupDirective,
  FormsModule,
  NG_VALIDATORS,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from '@angular/forms'
import {
  ErrorStateMatcher,
  MatRippleModule,
  _AbstractConstructor,
  mixinErrorState,
} from '@angular/material/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldControl } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatMenu, MatMenuModule } from '@angular/material/menu'
import {
  AsYouType,
  CountryCode as CC,
  E164Number,
  NationalNumber,
  PhoneNumber,
  getExampleNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import { Subject } from 'rxjs'
import { CountryCode, Examples } from './data/country-code'
import { Country } from './model/country.model'
import { PhoneNumberFormat } from './model/phone-number-format.model'
import { phoneNumberValidator } from './ngx-mat-input-tel.validator'
import { SearchPipe } from './search.pipe'

class ngxMatInputTelBase {
  constructor(
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    public ngControl: NgControl,
  ) {}
}

const _ngxMatInputTelMixinBase: typeof ngxMatInputTelBase = mixinErrorState(
  ngxMatInputTelBase as _AbstractConstructor<any>,
)

@Component({
  standalone: true,
  selector: 'ngx-mat-input-tel',
  templateUrl: './ngx-mat-input-tel.component.html',
  styleUrls: ['./ngx-mat-input-tel.component.scss'],
  providers: [
    CountryCode,
    { provide: MatFormFieldControl, useExisting: NgxMatInputTelComponent },
    {
      provide: NG_VALIDATORS,
      useValue: phoneNumberValidator,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,

    // Forms
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,

    // Mat
    MatMenuModule,
    MatRippleModule,
    MatDividerModule,

    // Pipes
    SearchPipe,
  ],
})
export class NgxMatInputTelComponent
  extends _ngxMatInputTelMixinBase
  implements OnInit, DoCheck, OnDestroy
{
  static nextId = 0
  @ViewChild(MatMenu) matMenu!: MatMenu
  @ViewChild('menuSearchInput', { static: false }) menuSearchInput?: ElementRef<HTMLInputElement>
  @ViewChild('focusable', { static: false }) focusable!: ElementRef

  @HostBinding()
  id = `ngx-mat-input-tel-${NgxMatInputTelComponent.nextId++}`
  @HostBinding('class.ngx-floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty
  }

  @Input() autocomplete: 'off' | 'tel' = 'off'
  @Input() cssClass?: string
  @Input() errorStateMatcher: ErrorStateMatcher = this._defaultErrorStateMatcher
  @Input() placeholder: string = ''
  @Input() maxLength: string | number = 15
  @Input() name?: string
  @Input() onlyCountries: string[] = []
  @Input() preferredCountries: string[] = []
  @Input() searchPlaceholder = 'Search ...'
  @Input({ transform: booleanAttribute }) enablePlaceholder = false
  @Input({ transform: booleanAttribute }) enableSearch = false
  @Input({ transform: booleanAttribute }) resetOnChange = false
  @Input()
  set format(value: PhoneNumberFormat) {
    this._format = value
    this.phoneNumber = this.formattedPhoneNumber()
    this.stateChanges.next()
  }
  get format(): PhoneNumberFormat {
    return this._format
  }

  private _required = false
  @Input({ transform: booleanAttribute })
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value)
    this.stateChanges.next(undefined)
  }
  get required(): boolean {
    return this._required
  }

  private _disabled = false
  @Input({ alias: 'disabled', transform: booleanAttribute })
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value)
    this.stateChanges.next(undefined)
  }
  get disabled(): boolean {
    return this._disabled
  }

  get empty(): boolean {
    return !this.phoneNumber
  }

  @Output()
  countryChanged: EventEmitter<Country> = new EventEmitter<Country>()

  stateChanges = new Subject<void>()
  focused = false
  describedBy = ''
  phoneNumber?: E164Number | NationalNumber = '' as E164Number | NationalNumber
  allCountries: Country[] = []
  preferredCountriesInDropDown: Country[] = []
  selectedCountry!: Country
  numberInstance?: PhoneNumber
  value?: any
  searchCriteria?: string

  private _previousFormattedNumber?: string
  private _format: PhoneNumberFormat = 'default'

  onTouched = () => {}
  propagateChange = (_: any) => {}

  private errorState?: boolean

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private countryCodeData: CountryCode,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() _ngControl: NgControl,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    _defaultErrorStateMatcher: ErrorStateMatcher,
  ) {
    super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, _ngControl)

    _focusMonitor.monitor(_elementRef, true).subscribe((origin) => {
      if (this.focused && !origin) {
        this.onTouched()
      }
      this.focused = !!origin
      this.stateChanges.next()
    })

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this
    }
  }

  ngOnInit() {
    this.fetchCountryData()

    if (this.preferredCountries.length) {
      this.preferredCountries.forEach((iso2) => {
        const preferredCountry = this.allCountries
          .filter((c) => {
            return c.iso2 === iso2
          })
          .shift()

        if (preferredCountry) this.preferredCountriesInDropDown.push(preferredCountry)
      })
    }

    if (this.onlyCountries.length) {
      this.allCountries = this.allCountries.filter((c) => this.onlyCountries.includes(c.iso2))
    }

    if (this.numberInstance && this.numberInstance.country) {
      // If an existing number is present, we use it to determine selectedCountry
      this.selectedCountry = this.getCountry(this.numberInstance.country)
    } else {
      if (this.preferredCountriesInDropDown.length) {
        this.selectedCountry = this.preferredCountriesInDropDown[0]
      } else {
        this.selectedCountry = this.allCountries[0]
      }
    }

    this.countryChanged.emit(this.selectedCountry)
    this._changeDetectorRef.markForCheck()
    this.stateChanges.next()
  }

  ngDoCheck(): void {
    if (this.ngControl) {
      const oldState = this.errorState
      const newState = this.errorStateMatcher.isErrorState(this.ngControl.control, this._parentForm)

      this.errorState =
        (newState && (!this.ngControl.control?.value || this.ngControl.control?.touched)) ||
        (!this.focused ? newState : false)

      if (oldState !== newState) {
        this.errorState = newState
        this.stateChanges.next()
      }
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete()
    this._focusMonitor.stopMonitoring(this._elementRef)
  }

  public onPhoneNumberChange(): void {
    if (!this.phoneNumber) this.value = null
    else
      try {
        this.numberInstance = parsePhoneNumberFromString(
          this.phoneNumber.toString(),
          this.selectedCountry.iso2.toUpperCase() as CC,
        )

        this.formatAsYouTypeIfEnabled()
        this.value = this.numberInstance?.number
        if (!this.value) throw new Error('Incorrect phone number')

        if (this.numberInstance && this.numberInstance.isValid()) {
          if (this.phoneNumber !== this.formattedPhoneNumber()) {
            this.phoneNumber = this.formattedPhoneNumber()
          }
          if (
            this.selectedCountry.iso2 !== this.numberInstance.country &&
            this.numberInstance.country
          ) {
            this.selectedCountry = this.getCountry(this.numberInstance.country)
            this.countryChanged.emit(this.selectedCountry)
          }
        }
      } catch (e) {
        // if no possible numbers are there,
        // then the full number is passed so that validator could be triggered and proper error could be shown
        this.value = this.formattedPhoneNumber().toString()
      }

    this.propagateChange(this.value)
    this._changeDetectorRef.markForCheck()
  }

  public onCountrySelect(country: Country, el: any): void {
    if (this.phoneNumber) {
      this.phoneNumber = this.numberInstance?.nationalNumber
    }
    if (this.resetOnChange && this.selectedCountry !== country) {
      this.reset()
    }

    this.selectedCountry = country
    this.countryChanged.emit(this.selectedCountry)

    this.onPhoneNumberChange()
    el.focus()
  }

  public getCountry(code: CC): Country {
    return (this.allCountries.find((c) => c.iso2 === code.toLowerCase()) || {
      name: 'UN',
      iso2: 'UN',
      dialCode: undefined,
      priority: 0,
      areaCodes: undefined,
      flagClass: 'UN',
      placeHolder: '',
    }) as Country
  }

  public onInputKeyPress(event: any): void {
    const pattern = /[0-9+\- ]/
    if (!pattern.test(event.key)) {
      event.preventDefault()
    }
  }

  protected fetchCountryData(): void {
    this.countryCodeData.allCountries.forEach((c) => {
      const country: Country = {
        name: c[0].toString(),
        iso2: c[1].toString(),
        dialCode: c[2].toString(),
        priority: +c[3] || 0,
        areaCodes: (c[4] as string[]) || undefined,
        flagClass: c[1].toString().toUpperCase(),
        placeHolder: '',
      }

      if (this.enablePlaceholder) {
        country.placeHolder = this._getPhoneNumberPlaceHolder(country.iso2.toUpperCase())
      }

      this.allCountries.push(country)
    })
  }

  private _getPhoneNumberPlaceHolder(countryISOCode: any): string | undefined {
    try {
      return getExampleNumber(countryISOCode, Examples)?.number
    } catch (e) {
      return e as any
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
    this._changeDetectorRef.markForCheck()
    this.stateChanges.next(undefined)
  }

  writeValue(value: any): void {
    if (value) {
      this.numberInstance = parsePhoneNumberFromString(value)
      if (this.numberInstance) {
        const countryCode = this.numberInstance.country
        this.phoneNumber = this.formattedPhoneNumber()

        if (!countryCode) return

        this.selectedCountry = this.getCountry(countryCode)
        if (
          this.selectedCountry.dialCode &&
          !this.preferredCountries.includes(this.selectedCountry.iso2)
        ) {
          this.preferredCountriesInDropDown.push(this.selectedCountry)
        }
        this.countryChanged.emit(this.selectedCountry)

        // Initial value is set
        this.stateChanges.next()
      } else {
        this.phoneNumber = value
        this.stateChanges.next(undefined)
      }
    }
    // Angular bug
    // else if (this.phoneNumber !== '') {
    //   this.reset()
    // }

    // Value is set from outside using setValue()
    this._changeDetectorRef.markForCheck()
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ')
  }

  onContainerClick(event: MouseEvent): void {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      this._elementRef.nativeElement.querySelector('input')!.focus()
    }
  }

  reset() {
    this.phoneNumber = '' as E164Number | NationalNumber
    this.propagateChange(null)

    this._changeDetectorRef.markForCheck()
    this.stateChanges.next(undefined)
  }

  private formattedPhoneNumber(): E164Number | NationalNumber {
    if (!this.numberInstance) {
      return (this.phoneNumber?.toString() || '') as E164Number | NationalNumber
    }
    switch (this.format) {
      case 'national':
        return this.numberInstance.formatNational() as E164Number | NationalNumber
      case 'international':
        return this.numberInstance.formatInternational() as E164Number | NationalNumber
      default:
        return this.numberInstance.nationalNumber.toString() as E164Number | NationalNumber
    }
  }

  private formatAsYouTypeIfEnabled(): void {
    if (this.format === 'default') {
      return
    }
    const asYouType: AsYouType = new AsYouType(this.selectedCountry.iso2.toUpperCase() as CC)
    // To avoid caret positioning we apply formatting only if the caret is at the end:
    if (!this.phoneNumber) return

    if (this.phoneNumber?.toString().startsWith(this._previousFormattedNumber || '')) {
      this.phoneNumber = asYouType.input(this.phoneNumber.toString()) as E164Number | NationalNumber
    }
    this._previousFormattedNumber = this.phoneNumber.toString()
  }
}
