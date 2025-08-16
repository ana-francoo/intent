import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import '@/index.css'

// Create a QueryClient instance with Chrome extension-optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Longer stale time since auth/subscription doesn't change frequently
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache time before garbage collection
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry logic for failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect in extension context
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
