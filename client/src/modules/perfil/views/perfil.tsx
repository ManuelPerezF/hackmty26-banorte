export function ProfileView() {
  return (
    <section className="team-view">
      <h2>Tu perfil, conectado.</h2>
      <p>Datos del perfil de demostración.</p>
      <div className="team-person">
        <span className="company-avatar">AM</span>
        <div>
          <strong>Alex Morgan</strong>
          <span>demo.banorte</span>
        </div>
        <span className="team-role">Administrador</span>
      </div>
      <p className="panel-footnote">
        Este perfil es ficticio. No se envían invitaciones.
      </p>
    </section>
  );
}
