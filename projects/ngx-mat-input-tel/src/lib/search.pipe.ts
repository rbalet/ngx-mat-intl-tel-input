import { Pipe, PipeTransform } from '@angular/core'

import { Country } from '../lib/model/country.model'

@Pipe({
  name: 'search',
  standalone: true,
})
export class SearchPipe implements PipeTransform {
  // country | search:'searchCriteria'
  transform(country: Country, searchCriteria?: string): boolean {
    if (!searchCriteria || searchCriteria === '') {
      return true
    }

    return `${country.name}+${country.dialCode}${
      country.areaCodes ? country.areaCodes.join(',') : ''
    }`
      .toLowerCase()
      .includes(searchCriteria.toLowerCase())
  }
}
