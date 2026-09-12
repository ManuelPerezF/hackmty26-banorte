import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function useAuth() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  return {
    showPassword,
    setShowPassword,
    showHelp,
    setShowHelp,
    enterDemo: () => router.push('/panel'),
  };
}
