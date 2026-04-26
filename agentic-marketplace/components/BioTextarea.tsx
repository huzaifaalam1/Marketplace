'use client'

import { useState, useEffect } from 'react'

interface BioTextareaProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  maxWords?: number
  maxCharacters?: number
}

export default function BioTextarea({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Describe your business or organization...',
  maxWords = 150,
  maxCharacters = 1000
}: BioTextareaProps) {
  const [wordCount, setWordCount] = useState(0)
  const [characterCount, setCharacterCount] = useState(0)

  useEffect(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0
    const chars = value.length
    setWordCount(words)
    setCharacterCount(chars)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const words = newValue.trim() ? newValue.trim().split(/\s+/).length : 0
    
    // Check word limit
    if (words > maxWords) {
      // Trim to max words
      const wordArray = newValue.trim().split(/\s+/)
      const trimmedWords = wordArray.slice(0, maxWords)
      const trimmedValue = trimmedWords.join(' ')
      onChange(trimmedValue)
      return
    }
    
    // Check character limit
    if (newValue.length > maxCharacters) {
      onChange(newValue.slice(0, maxCharacters))
      return
    }
    
    onChange(newValue)
  }

  const isNearLimit = wordCount > maxWords * 0.9
  const isAtLimit = wordCount >= maxWords
  const isOverCharacterLimit = characterCount > maxCharacters * 0.9

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Business Description
      </label>
      <textarea
        placeholder={placeholder}
        className={`w-full p-3 rounded-xl border ${isAtLimit ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none`}
        value={value}
        onChange={handleChange}
        rows={6}
      />
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-gray-500">
          <span className={`${isNearLimit ? 'text-orange-500' : ''} ${isAtLimit ? 'text-red-500 font-medium' : ''}`}>
            {wordCount} / {maxWords} words
          </span>
          <span className="mx-2">•</span>
          <span className={`${isOverCharacterLimit ? 'text-orange-500' : ''}`}>
            {characterCount} / {maxCharacters} characters
          </span>
        </div>
        {isAtLimit && (
          <span className="text-sm text-red-500 font-medium">
            Maximum word limit reached
          </span>
        )}
      </div>
      {wordCount < maxWords * 0.3 && (
        <p className="mt-1 text-xs text-gray-500">
          A detailed description helps others understand your business better. Aim for at least {Math.round(maxWords * 0.3)} words.
        </p>
      )}
      {wordCount >= maxWords * 0.3 && wordCount < maxWords * 0.7 && (
        <p className="mt-1 text-xs text-green-600">
          Good length! Consider adding more details about your services, experience, or unique value proposition.
        </p>
      )}
      {wordCount >= maxWords * 0.7 && !isAtLimit && (
        <p className="mt-1 text-xs text-blue-600">
          Excellent! You're providing a comprehensive description.
        </p>
      )}
    </div>
  )
}
