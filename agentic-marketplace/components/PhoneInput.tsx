'use client'

import { useState, useEffect } from 'react'

const countries = [
  { code: 'US', name: 'United States', dialCode: '+1', pattern: /^[0-9]{10}$/ },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', pattern: /^[0-9]{10,11}$/ },
  { code: 'CA', name: 'Canada', dialCode: '+1', pattern: /^[0-9]{10}$/ },
  { code: 'AU', name: 'Australia', dialCode: '+61', pattern: /^[0-9]{9}$/ },
  { code: 'DE', name: 'Germany', dialCode: '+49', pattern: /^[0-9]{10,11}$/ },
  { code: 'FR', name: 'France', dialCode: '+33', pattern: /^[0-9]{9}$/ },
  { code: 'IT', name: 'Italy', dialCode: '+39', pattern: /^[0-9]{9,10}$/ },
  { code: 'ES', name: 'Spain', dialCode: '+34', pattern: /^[0-9]{9}$/ },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', pattern: /^[0-9]{9}$/ },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', pattern: /^[0-9]{9}$/ },
  { code: 'SE', name: 'Sweden', dialCode: '+46', pattern: /^[0-9]{9}$/ },
  { code: 'NO', name: 'Norway', dialCode: '+47', pattern: /^[0-9]{8}$/ },
  { code: 'DK', name: 'Denmark', dialCode: '+45', pattern: /^[0-9]{8}$/ },
  { code: 'FI', name: 'Finland', dialCode: '+358', pattern: /^[0-9]{9}$/ },
  { code: 'BE', name: 'Belgium', dialCode: '+32', pattern: /^[0-9]{9}$/ },
  { code: 'AT', name: 'Austria', dialCode: '+43', pattern: /^[0-9]{10}$/ },
  { code: 'IE', name: 'Ireland', dialCode: '+353', pattern: /^[0-9]{9}$/ },
  { code: 'PT', name: 'Portugal', dialCode: '+351', pattern: /^[0-9]{9}$/ },
  { code: 'GR', name: 'Greece', dialCode: '+30', pattern: /^[0-9]{10}$/ },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', pattern: /^[0-9]{9}$/ },
  { code: 'PL', name: 'Poland', dialCode: '+48', pattern: /^[0-9]{9}$/ },
  { code: 'HU', name: 'Hungary', dialCode: '+36', pattern: /^[0-9]{9}$/ },
  { code: 'RO', name: 'Romania', dialCode: '+40', pattern: /^[0-9]{9}$/ },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', pattern: /^[0-9]{9}$/ },
  { code: 'HR', name: 'Croatia', dialCode: '+385', pattern: /^[0-9]{9}$/ },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', pattern: /^[0-9]{8}$/ },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', pattern: /^[0-9]{9}$/ },
  { code: 'EE', name: 'Estonia', dialCode: '+372', pattern: /^[0-9]{8}$/ },
  { code: 'LV', name: 'Latvia', dialCode: '+371', pattern: /^[0-9]{8}$/ },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', pattern: /^[0-9]{8}$/ },
  { code: 'JP', name: 'Japan', dialCode: '+81', pattern: /^[0-9]{10}$/ },
  { code: 'CN', name: 'China', dialCode: '+86', pattern: /^[0-9]{11}$/ },
  { code: 'IN', name: 'India', dialCode: '+91', pattern: /^[0-9]{10}$/ },
  { code: 'SG', name: 'Singapore', dialCode: '+65', pattern: /^[0-9]{8}$/ },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', pattern: /^[0-9]{9,10}$/ },
  { code: 'TH', name: 'Thailand', dialCode: '+66', pattern: /^[0-9]{9}$/ },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', pattern: /^[0-9]{9,12}$/ },
  { code: 'PH', name: 'Philippines', dialCode: '+63', pattern: /^[0-9]{10}$/ },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', pattern: /^[0-9]{9}$/ },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', pattern: /^[0-9]{8}$/ },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', pattern: /^[0-9]{9}$/ },
  { code: 'KR', name: 'South Korea', dialCode: '+82', pattern: /^[0-9]{9}$/ },
  { code: 'MX', name: 'Mexico', dialCode: '+52', pattern: /^[0-9]{10}$/ },
  { code: 'BR', name: 'Brazil', dialCode: '+55', pattern: /^[0-9]{10,11}$/ },
  { code: 'AR', name: 'Argentina', dialCode: '+54', pattern: /^[0-9]{10}$/ },
  { code: 'CL', name: 'Chile', dialCode: '+56', pattern: /^[0-9]{9}$/ },
  { code: 'CO', name: 'Colombia', dialCode: '+57', pattern: /^[0-9]{10}$/ },
  { code: 'PE', name: 'Peru', dialCode: '+51', pattern: /^[0-9]{9}$/ },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', pattern: /^[0-9]{10}$/ },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', pattern: /^[0-9]{9}$/ },
  { code: 'EG', name: 'Egypt', dialCode: '+20', pattern: /^[0-9]{10}$/ },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', pattern: /^[0-9]{10}$/ },
  { code: 'KE', name: 'Kenya', dialCode: '+254', pattern: /^[0-9]{9}$/ },
  { code: 'GH', name: 'Ghana', dialCode: '+233', pattern: /^[0-9]{9}$/ },
  { code: 'MA', name: 'Morocco', dialCode: '+212', pattern: /^[0-9]{9}$/ },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', pattern: /^[0-9]{8}$/ },
  { code: 'IL', name: 'Israel', dialCode: '+972', pattern: /^[0-9]{9}$/ },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', pattern: /^[0-9]{9}$/ },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', pattern: /^[0-9]{9}$/ },
  { code: 'TR', name: 'Turkey', dialCode: '+90', pattern: /^[0-9]{10}$/ },
  { code: 'RU', name: 'Russia', dialCode: '+7', pattern: /^[0-9]{10}$/ },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', pattern: /^[0-9]{9}$/ },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', pattern: /^[0-9]{10}$/ },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', pattern: /^[0-9]{9}$/ }
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  defaultCountry?: string
  className?: string
}

export default function PhoneInput({ value, onChange, defaultCountry = 'US', className = '' }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Parse existing value if provided
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode))
      if (country) {
        setSelectedCountry(country.code)
        setPhoneNumber(value.replace(country.dialCode, '').trim())
      } else {
        setPhoneNumber(value)
      }
    }
  }, [value])

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setError('')
    updateFullPhone(phoneNumber, countryCode)
  }

  const handlePhoneChange = (phone: string) => {
    // Only allow numbers
    const numbersOnly = phone.replace(/[^0-9]/g, '')
    setPhoneNumber(numbersOnly)
    setError('')
    updateFullPhone(numbersOnly, selectedCountry)
  }

  const updateFullPhone = (phone: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (country && phone) {
      const fullPhone = `${country.dialCode} ${phone}`
      onChange(fullPhone)
      
      // Validate phone number
      if (!country.pattern.test(phone)) {
        setError(`Invalid phone number format for ${country.name}`)
      }
    } else if (country) {
      onChange(country.dialCode)
    }
  }

  const selectedCountryData = countries.find(c => c.code === selectedCountry)

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number
      </label>
      <div className="flex space-x-2">
        <select
          className="flex-shrink-0 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.dialCode} {country.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          placeholder="Phone number"
          className={`flex-1 p-3 rounded-xl border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-amber-400 focus:border-transparent`}
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {selectedCountryData && (
        <p className="mt-1 text-xs text-gray-500">
          Format: {selectedCountryData.dialCode} + local number
        </p>
      )}
    </div>
  )
}
