import Link from 'next/link';
export function ProfileView({
  savedCardLabel,
}: {
  savedCardLabel: string | null;
}) {
  return (
    <section className="settings-view">
      <h2>Tu perfil Banorte</h2>
      <p>Tu información y preferencias, en un mismo lugar.</p>
      <dl>
        <div>
          <dt>Persona de ejemplo</dt>
          <dd>Alex Morgan</dd>
        </div>
        <div>
          <dt>Idioma</dt>
          <dd>Español (México)</dd>
        </div>
        <div>
          <dt>Entorno</dt>
          <dd>Demostración</dd>
        </div>
        <div>
          <dt>Tarjeta elegida</dt>
          <dd>{savedCardLabel ? savedCardLabel : 'Sin seleccionar'}</dd>
        </div>
      </dl>
      <p>
        Los cambios de esta demo se conservan mientras permaneces en el panel.
      </p>
      <Link className="button" href="/login">
        Salir de la demo
      </Link>
    </section>
  );
}
