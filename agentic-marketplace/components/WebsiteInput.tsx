'use client'

import { useState, useEffect } from 'react'

interface WebsiteInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export default function WebsiteInput({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'https://www.example.com' 
}: WebsiteInputProps) {
  const [error, setError] = useState('')

  useEffect(() => {
    if (value) {
      validateUrl(value)
    }
  }, [value])

  const validateUrl = (url: string) => {
    if (!url) {
      setError('')
      return true
    }

    // Add protocol if missing
    let formattedUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`
    }

    try {
      const urlObj = new URL(formattedUrl)
      
      // Check if it's a valid domain
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
      
      if (!domainRegex.test(urlObj.hostname)) {
        setError('Please enter a valid website URL')
        return false
      }

      // Check for common TLDs
      const commonTlds = ['.com', '.org', '.net', '.edu', '.gov', '.mil', '.int', '.io', '.co', '.ai', '.tech', '.app', '.dev', '.shop', '.store', '.online', '.site', '.website', '.space', '.blog', '.news', '.info', '.biz', '.xyz', '.me', '.us', '.uk', '.ca', '.au', '.de', '.fr', '.it', '.es', '.nl', '.se', '.no', '.dk', '.fi', '.ch', '.at', '.be', '.ie', '.pt', '.gr', '.pl', '.cz', '.hu', '.ro', '.bg', '.hr', '.si', '.sk', '.ee', '.lv', '.lt', '.jp', '.cn', '.in', '.sg', '.my', '.th', '.id', '.ph', '.vn', '.hk', '.tw', '.kr', '.mx', '.br', '.ar', '.cl', '.co', '.pe', '.ve', '.za', '.eg', '.ng', '.ke', '.gh', '.ma', '.tn', '.il', '.ae', '.sa', '.tr', '.ru', '.ua', '.kz', '.nz']
      
      const hasValidTld = commonTlds.some(tld => urlObj.hostname.toLowerCase().endsWith(tld))
      
      if (!hasValidTld) {
        setError('Please enter a website with a valid domain extension')
        return false
      }

      setError('')
      onChange(formattedUrl)
      return true
    } catch (err) {
      setError('Please enter a valid website URL')
      return false
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  const handleBlur = () => {
    if (value) {
      validateUrl(value)
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Website
      </label>
      <input
        type="url"
        placeholder={placeholder}
        className={`w-full p-3 rounded-xl border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-amber-400 focus:border-transparent`}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!error && value && (
        <p className="mt-1 text-xs text-green-600">✓ Valid website URL</p>
      )}
    </div>
  )
}
