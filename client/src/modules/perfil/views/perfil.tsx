'use client';
import { useBank } from '@/modules/cuentas/context/bank-context';
export function ProfileView({
  savedCardLabel,
}: {
  savedCardLabel: string | null;
}) {
  const bank = useBank();
  return (
    <section className="settings-view">
      <h2>Tu perfil</h2>
      <p>Tu información y preferencias, en un mismo lugar.</p>
      <dl>
        <div>
          <dt>Nombre</dt>
          <dd>{bank.profile.displayName}</dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd>{bank.profile.email}</dd>
        </div>
        <div>
          <dt>Idioma</dt>
          <dd>{bank.profile.locale}</dd>
        </div>
        <div>
          <dt>Zona horaria</dt>
          <dd>{bank.profile.timezone}</dd>
        </div>
        <div>
          <dt>Tarjeta principal</dt>
          <dd>{savedCardLabel ?? 'Sin seleccionar'}</dd>
        </div>
      </dl>
      <p>
        Tu historial se construye con los movimientos que registres. Tus datos
        se conservan en tu cuenta.
      </p>
      <button
        className="button"
        onClick={() => {
          void bank.logout().catch(() => {});
        }}
      >
        Cerrar sesión
      </button>
    </section>
  );
}
