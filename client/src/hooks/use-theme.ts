import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Function to get initial theme
const getInitialTheme = (): Theme => {
  // Check local storage first
  const savedTheme = localStorage.getItem('theme') as Theme
  if (savedTheme) {
    return savedTheme
  }

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export const useTheme = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    // Remove preload class if it exists
    document.documentElement.classList.remove('preload')

    // Update localStorage
    localStorage.setItem('theme', theme)

    // Update DOM
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    set({ theme })
  },
}))

// Add preload class on initial load to prevent transitions
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('preload')
  // Remove preload after a small delay
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('preload')
    }, 200)
  })
}