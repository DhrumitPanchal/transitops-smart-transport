import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginSchema } from '../../validations/authValidation'
import { useAuth } from '../../hooks/useAuth'
import { getRoleLandingRoute } from '../../utils/helpers'
import FormField from '../../components/forms/FormField'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/common/Button'
import PageLoader from '../../components/feedback/PageLoader'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, isAuthenticated, isBootstrapping, landingRoute } =
    useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@transitops.com',
      password: 'password',
    },
  })

  useEffect(() => {
    document.title = 'Sign in | TransitOps'
  }, [])

  if (isBootstrapping) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    return <Navigate to={landingRoute} replace />
  }

  const onSubmit = async (values) => {
    try {
      const result = await login(values)
      toast.success('Welcome back')
      navigate(getRoleLandingRoute(result.user.role))
    } catch (error) {
      toast.error(error.message || 'Login failed')
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-slate-900">Sign in</h2>
      <p className="mb-6 text-sm text-slate-500">
        Access your TransitOps operations console
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </FormField>

        <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
