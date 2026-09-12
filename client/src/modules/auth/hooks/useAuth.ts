import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession, type Session } from '@/shared/api/client';
export function useAuth() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const submit = async (values: { email: string; password: string }) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const session = await api<Session>('/auth/login', {
        method: 'POST',
        body: { email: values.email, password: values.password },
        public: true,
      });
      setSession(session);
      router.replace('/panel');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar sesión.');
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return {
    showPassword,
    setShowPassword,
    showHelp,
    setShowHelp,
    error,
    busy,
    submit,
  };
}
