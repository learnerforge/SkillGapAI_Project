import { useState, useCallback, type ChangeEvent } from 'react'

type ValidationRule<T> = {
  validate: (value: T[keyof T], values: T) => boolean
  message: string
}

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[]
}

interface UseFormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  setValue: <K extends keyof T>(key: K, value: T[K]) => void
  setFieldValue: <K extends keyof T>(key: K, value: T[K]) => void
  handleChange: (key: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleBlur: (key: keyof T) => () => void
  validate: () => boolean
  validateField: (key: keyof T) => boolean
  reset: (newValues?: T) => void
  setAll: (values: T) => void
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  rules?: ValidationRules<T>,
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback(
    (key: keyof T): boolean => {
      if (!rules?.[key]) return true
      for (const rule of rules[key]!) {
        if (!rule.validate(values[key], values)) {
          setErrors(prev => ({ ...prev, [key]: rule.message }))
          return false
        }
      }
      setErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return true
    },
    [values, rules],
  )

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const setFieldValue = setValue

  const handleChange = useCallback(
    (key: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target
      const val = target.type === 'checkbox'
        ? (target as HTMLInputElement).checked
        : target.value
      setValue(key, val as T[keyof T])
    },
    [setValue],
  )

  const handleBlur = useCallback(
    (key: keyof T) => () => {
      setTouched(prev => ({ ...prev, [key]: true }))
      validateField(key)
    },
    [validateField],
  )

  const validate = useCallback((): boolean => {
    let valid = true
    const newErrors: Partial<Record<keyof T, string>> = {}
    for (const key in rules) {
      if (Object.prototype.hasOwnProperty.call(rules, key)) {
        for (const rule of rules[key]!) {
          if (!rule.validate(values[key], values)) {
            newErrors[key] = rule.message
            valid = false
            break
          }
        }
      }
    }
    setErrors(newErrors)
    setTouched((rules ? Object.keys(rules) : []).reduce((acc, k) => ({ ...acc, [k]: true }), {} as Partial<Record<keyof T, boolean>>))
    return valid
  }, [values, rules])

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setAll = useCallback((newValues: T) => {
    setValues(newValues)
  }, [])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldValue,
    handleChange,
    handleBlur,
    validate,
    validateField,
    reset,
    setAll,
  }
}

export const rules = {
  required: (message = 'This field is required'): ValidationRule<Record<string, unknown>> => ({
    validate: (value) => value !== undefined && value !== null && value !== '',
    message,
  }),
  minLength: (min: number, message?: string): ValidationRule<Record<string, unknown>> => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: message || `Minimum ${min} characters required`,
  }),
  email: (message = 'Invalid email address'): ValidationRule<Record<string, unknown>> => ({
    validate: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),
  match: (field: string, message?: string): ValidationRule<Record<string, unknown>> => ({
    validate: (value, values) => value === values[field],
    message: message || `Must match ${field}`,
  }),
}
