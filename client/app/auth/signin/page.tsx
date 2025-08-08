/**
 * Login page component - Static version that works
 */

import AuthCard from '../shared/AuthCard';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  // Static translations for now
  const serverTranslations = {
    loginLabel: 'Correo electrónico o Usuario',
    passwordLabel: 'Contraseña',
    loginPlaceholder: 'Ingresa tu correo electrónico o usuario',
    passwordPlaceholder: 'Ingresa tu contraseña',
    submitButton: 'Iniciar Sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes una cuenta?',
    signUpLink: 'Registrarse'
  };

  return (
    <AuthCard title="Iniciar Sesión">
      <LoginForm serverTranslations={serverTranslations} />
    </AuthCard>
  );
}
