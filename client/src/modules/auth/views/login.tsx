'use client';
import { AuthPanel } from '../components/authPanel';
import { useAuth } from '../hooks/useAuth';
export function Login() {
  const auth = useAuth();
  return <AuthPanel {...auth} />;
}
