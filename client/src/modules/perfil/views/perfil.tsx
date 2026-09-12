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
          <dt>Nombre</dt>
          <dd>Alex Morgan</dd>
        </div>
        <div>
          <dt>Idioma</dt>
          <dd>Español (México)</dd>
        </div>
        <div>
          <dt>Moneda principal</dt>
          <dd>Peso mexicano (MXN)</dd>
        </div>
        <div>
          <dt>Tarjeta principal</dt>
          <dd>{savedCardLabel ? savedCardLabel : 'Banorte Clásica · 4281'}</dd>
        </div>
      </dl>
      <p>
        Esta versión utiliza información de ejemplo y movimientos guardados en
        este navegador.
      </p>
      <Link className="button" href="/login">
        Salir del panel
      </Link>
    </section>
  );
}
