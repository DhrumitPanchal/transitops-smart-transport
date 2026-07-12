import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { loginSchema } from '../../validations/authValidation'
import { useAuth } from '../../hooks/useAuth'
import { getDemoAccounts } from '../../services/authService'
import { getRoleLandingRoute, getRoleLabel } from '../../utils/helpers'
import env from '../../config/env'
import EmailField from '../../components/forms/EmailField'
import PasswordField from '../../components/forms/PasswordField'
import Button from '../../components/common/Button'
import InlineAlert from '../../components/feedback/InlineAlert'
import Badge from '../../components/common/Badge'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const demoAccounts = useMemo(
    () => (env.useMocks ? getDemoAccounts() : []),
    [],
  )
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    document.title = 'Sign in | TransitOps'
  }, [])

  const busy = isLoading || submitting

  const onSubmit = async (values) => {
    if (busy) return

    clearErrors('root')
    setSubmitting(true)

    try {
      const result = await login(values)
      navigate(getRoleLandingRoute(result.user.role), { replace: true })
    } catch (error) {
      setError('root', {
        message: error.message || 'Invalid email or password',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoAccount = (account) => {
    if (busy) return
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
    clearErrors('root')
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          TransitOps
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your work email and password to access the operations console.
        </p>
      </div>

      {errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Sign in failed">
            {errors.root.message}
          </InlineAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <EmailField
          name="email"
          label="Email"
          required
          placeholder="you@company.com"
          autoComplete="username"
          disabled={busy}
          registration={register('email')}
          error={errors.email?.message}
        />

        <PasswordField
          name="password"
          label="Password"
          required
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={busy}
          registration={register('password')}
          error={errors.password?.message}
        />

        <Button
          type="submit"
          className="mt-2"
          fullWidth
          loading={busy}
          disabled={busy}
        >
          Sign in
        </Button>
      </form>

      {env.useMocks && demoAccounts.length > 0 ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-slate-800">Demo Accounts</p>
          <p className="mt-1 text-xs text-slate-500">
            Click an account to fill credentials for mock login.
          </p>
          <div className="mt-3 space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={busy}
                onClick={() => fillDemoAccount(account)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-teal-300 hover:bg-teal-50 disabled:opacity-60"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {account.name}
                  </p>
                  <p className="text-xs text-slate-500">{account.email}</p>
                </div>
                <Badge tone="teal">{getRoleLabel(account.role)}</Badge>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
