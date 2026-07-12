import { registerSchema } from '@/validations/authValidation'
import { VALIDATION_MESSAGES } from '@/constants/validationMessages'

describe('registrationValidation', () => {
  const validPayload = {
    name: 'Asha Rao',
    email: 'asha@example.com',
    password: 'Secret1',
    confirmPassword: 'Secret1',
  }

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('asha@example.com')
      expect(result.data.name).toBe('Asha Rao')
    }
  })

  it('lowercases email', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: 'Asha@Example.COM',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('asha@example.com')
    }
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      name: 'A',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain(VALIDATION_MESSAGES.NAME_MIN)
    }
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: '12345',
      confirmPassword: '12345',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain(VALIDATION_MESSAGES.PASSWORD_MIN)
    }
  })

  it('rejects mismatched confirm password', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: 'OtherPass1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const mismatch = result.error.issues.find(
        (issue) => issue.path.join('.') === 'confirmPassword',
      )
      expect(mismatch?.message).toBe(VALIDATION_MESSAGES.PASSWORD_MISMATCH)
    }
  })

  it('requires confirm password', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })
})
