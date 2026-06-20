import React from 'react';
import { Button } from '@heroui/react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

export default function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  return (
    <Button
      isIconOnly
      variant="tertiary"
      className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      onPress={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </Button>
  );
}
