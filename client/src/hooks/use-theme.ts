import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
type ThemeMode = 'manual' | 'auto' | 'scheduled'

interface ScheduledTime {
  darkStart: string; // Format: "HH:MM"
  lightStart: string; // Format: "HH:MM"
}

interface ThemeStore {
  theme: Theme;
  mode: ThemeMode;
  scheduledTime: ScheduledTime;
  setTheme: (theme: Theme) => void;
  setMode: (mode: ThemeMode) => void;
  setScheduledTime: (time: ScheduledTime) => void;
  applyScheduledTheme: () => void;
}

// Default scheduled times
const DEFAULT_DARK_START = "19:00";  // 7 PM
const DEFAULT_LIGHT_START = "07:00"; // 7 AM

// Function to get time-appropriate theme
const getTimeBasedTheme = (darkStart: string, lightStart: string): Theme => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;
  
  const [darkHours, darkMinutes] = darkStart.split(':').map(Number);
  const [lightHours, lightMinutes] = lightStart.split(':').map(Number);
  
  const darkTime = darkHours * 60 + darkMinutes;
  const lightTime = lightHours * 60 + lightMinutes;
  
  // Check if we're in the dark period
  if (darkTime <= lightTime) {
    // Dark period doesn't cross midnight
    return (currentTime >= darkTime && currentTime < lightTime) ? 'dark' : 'light';
  } else {
    // Dark period crosses midnight
    return (currentTime >= darkTime || currentTime < lightTime) ? 'dark' : 'light';
  }
};

// Function to get system preference theme
const getSystemTheme = (): Theme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Function to apply theme to document
const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      mode: 'manual' as ThemeMode,
      scheduledTime: {
        darkStart: DEFAULT_DARK_START,
        lightStart: DEFAULT_LIGHT_START
      },
      
      setTheme: (theme) => {
        // Remove preload class if it exists
        document.documentElement.classList.remove('preload');
        
        // Apply theme to DOM
        applyTheme(theme);
        
        set({ theme });
      },
      
      setMode: (mode) => {
        set({ mode });
        
        // Apply appropriate theme based on new mode
        const state = get();
        
        if (mode === 'auto') {
          const systemTheme = getSystemTheme();
          if (systemTheme !== state.theme) {
            applyTheme(systemTheme);
            set({ theme: systemTheme });
          }
        } else if (mode === 'scheduled') {
          get().applyScheduledTheme();
        }
      },
      
      setScheduledTime: (time) => {
        set({ scheduledTime: time });
        
        // If we're in scheduled mode, apply the new schedule immediately
        if (get().mode === 'scheduled') {
          get().applyScheduledTheme();
        }
      },
      
      applyScheduledTheme: () => {
        const { scheduledTime } = get();
        const timeBasedTheme = getTimeBasedTheme(
          scheduledTime.darkStart, 
          scheduledTime.lightStart
        );
        
        if (timeBasedTheme !== get().theme) {
          applyTheme(timeBasedTheme);
          set({ theme: timeBasedTheme });
        }
      }
    }),
    {
      name: 'theme-settings',
      // Apply initial theme and setup watchers on initialization
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Initial application of theme
        const { theme, mode, scheduledTime } = state;
        
        // Apply appropriate theme based on mode
        if (mode === 'auto') {
          const systemTheme = getSystemTheme();
          applyTheme(systemTheme);
          state.theme = systemTheme;
        } else if (mode === 'scheduled') {
          const timeTheme = getTimeBasedTheme(scheduledTime.darkStart, scheduledTime.lightStart);
          applyTheme(timeTheme);
          state.theme = timeTheme;
        } else {
          // Manual mode
          applyTheme(theme);
        }
        
        // Setup system theme change watcher
        if (typeof window !== 'undefined') {
          // Watch for system theme changes
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (state.mode === 'auto') {
              const newTheme = e.matches ? 'dark' : 'light';
              applyTheme(newTheme);
              state.setTheme(newTheme);
            }
          });
          
          // Setup interval for scheduled theme
          if (mode === 'scheduled') {
            // Check every minute if we need to switch themes
            setInterval(() => {
              if (state.mode === 'scheduled') {
                state.applyScheduledTheme();
              }
            }, 60000); // Check every minute
          }
        }
      }
    }
  )
);

// Add preload class on initial load to prevent transitions
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('preload');
  // Remove preload after a small delay
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 200);
  });
}