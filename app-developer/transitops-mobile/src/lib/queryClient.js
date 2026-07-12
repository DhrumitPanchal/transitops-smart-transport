import { QueryClient } from '@tanstack/react-query'

function shouldRetryQuery(failureCount, error) {
  const status = error?.status ?? error?.response?.status
  if (status === 401 || status === 403) return false
  return failureCount < 1
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
})

export default queryClient
