'use client'

import { useState } from 'react'

const countries = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'HU', name: 'Hungary', dialCode: '+36' },
  { code: 'RO', name: 'Romania', dialCode: '+40' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359' },
  { code: 'HR', name: 'Croatia', dialCode: '+385' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421' },
  { code: 'EE', name: 'Estonia', dialCode: '+372' },
  { code: 'LV', name: 'Latvia', dialCode: '+371' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'MA', name: 'Morocco', dialCode: '+212' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' }
]

const citiesByCountry: { [key: string]: string[] } = {
  'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'GB': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Liverpool', 'Edinburgh', 'Bristol'],
  'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
  'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Logan City'],
  'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dortmund', 'Essen', 'Leipzig', 'Bremen'],
  'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
  'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga', 'Bilbao', 'Murcia', 'Palma', 'Las Palmas', 'Zaragoza'],
  'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'],
  'JP': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Kobe', 'Kyoto', 'Fukuoka', 'Kawasaki', 'Saitama'],
  'CN': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Chongqing', 'Tianjin', 'Wuhan', 'Dongguan', 'Shenyang', 'Hangzhou'],
  'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'],
  'SG': ['Singapore'],
  'MY': ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Seremban', 'Kuching', 'Kota Kinabalu', 'Klang'],
  'TH': ['Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Chiang Mai', 'Phuket', 'Pattaya', 'Udon Thani', 'Khon Kaen', 'Nakhon Ratchasima'],
  'ID': ['Jakarta', 'Surabaya', 'Bandung', 'Bekasi', 'Medan', 'Tangerang', 'Depok', 'Semarang', 'Palembang', 'Makassar'],
  'PH': ['Manila', 'Quezon City', 'Caloocan', 'Davao City', 'Cebu City', 'Zamboanga City', 'Antipolo', 'Taguig', 'Pasig', 'Cagayan de Oro'],
  'VN': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Bien Hoa', 'Hue', 'Nha Trang', 'Can Tho', 'Rach Gia', 'Buon Ma Thuot', 'Vung Tau'],
  'HK': ['Hong Kong'],
  'TW': ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu', 'Taoyuan', 'Chiayi', 'Keelung', 'Changhua', 'Pingtung'],
  'KR': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Goyang', 'Seongnam'],
  'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Santiago de Querétaro', 'San Luis Potosí'],
  'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
  'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
  'CL': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán'],
  'CO': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga', 'Soacha'],
  'PE': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Pucallpa'],
  'VE': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'San Cristóbal', 'Maturín', 'Barcelona', 'Los Teques'],
  'ZA': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Nelspruit', 'Kimberley'],
  'EG': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Damietta', 'Asyut'],
  'NG': ['Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos'],
  'KE': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Kitale', 'Thika', 'Malindi', 'Garissa'],
  'GH': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Obuasi', 'Tema', 'Madina', 'Teshie', 'Cape Coast'],
  'MA': ['Casablanca', 'Rabat', 'Marrakesh', 'Fès', 'Tangier', 'Meknès', 'Oujda', 'Kenitra', 'Agadir', 'Tétouan'],
  'TN': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous'],
  'IL': ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beersheba', 'Bnei Brak', 'Holon'],
  'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hofuf'],
  'TR': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin'],
  'RU': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don'],
  'UA': ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol'],
  'KZ': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kostanay'],
  'NZ': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua']
}

interface CountryCityDropdownProps {
  selectedCountry: string
  selectedCity: string
  onCountryChange: (country: string) => void
  onCityChange: (city: string) => void
  onDialCodeChange?: (dialCode: string) => void
}

export default function CountryCityDropdown({ 
  selectedCountry, 
  selectedCity, 
  onCountryChange, 
  onCityChange,
  onDialCodeChange 
}: CountryCityDropdownProps) {
  const availableCities = selectedCountry ? citiesByCountry[selectedCountry] || [] : []

  const handleCountryChange = (countryCode: string) => {
    onCountryChange(countryCode)
    onCityChange('') // Reset city when country changes
    if (onDialCodeChange) {
      const country = countries.find(c => c.code === countryCode)
      if (country) {
        onDialCodeChange(country.dialCode)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country
        </label>
        <select
          className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {availableCities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <select
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
          >
            <option value="">Select a city</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
