import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { registerSchema } from '../../validations/authValidation'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import { getFieldErrors } from '../../api/apiError'
import TextField from '../../components/forms/TextField'
import EmailField from '../../components/forms/EmailField'
import PasswordField from '../../components/forms/PasswordField'
import Button from '../../components/common/Button'
import InlineAlert from '../../components/feedback/InlineAlert'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAccount, isLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    document.title = 'Register | TransitOps'
  }, [])

  const busy = isLoading || submitting

  const onSubmit = async (values) => {
    if (busy) return
    clearErrors()
    setSubmitting(true)

    try {
      const result = await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      toast.success(
        result?.message ||
          'Registration successful. Your account is waiting for administrator approval.',
      )
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field, {
            type: 'server',
            message: Array.isArray(message) ? message[0] : String(message),
          })
        })
      }

      setError('root', {
        message:
          error?.message ||
          'Unable to register. Please check your details and try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          TransitOps
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Create an account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Register with your work email. A Super Admin must approve your account
          and assign a role before operational access is granted.
        </p>
      </div>

      {errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Registration failed">
            {errors.root.message}
          </InlineAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          name="name"
          label="Name"
          required
          placeholder="Your full name"
          autoComplete="name"
          disabled={busy}
          registration={register('name')}
          error={errors.name?.message}
        />

        <EmailField
          name="email"
          label="Email"
          required
          placeholder="you@company.com"
          autoComplete="email"
          disabled={busy}
          registration={register('email')}
          error={errors.email?.message}
        />

        <PasswordField
          name="password"
          label="Password"
          required
          placeholder="Create a password"
          autoComplete="new-password"
          disabled={busy}
          registration={register('password')}
          error={errors.password?.message}
        />

        <PasswordField
          name="confirmPassword"
          label="Confirm password"
          required
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={busy}
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          className="mt-2"
          fullWidth
          loading={busy}
          disabled={busy}
        >
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-medium text-teal-700 hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  )
}
