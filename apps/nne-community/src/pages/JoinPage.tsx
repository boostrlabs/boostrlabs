import { Link } from "react-router-dom";
import { CollabBrand } from "../components/CollabBrand";

export function JoinPage() {
  return (
    <main className="join-shell">
      <header className="join-header">
        <CollabBrand />
        <Link to="/login">Entrar</Link>
      </header>

      <section className="join-hero">
        <div className="eyebrow">NNE × WESTDETRO Community</div>
        <h1>Chambea.<br />Suma NNE.<br />Canjea.</h1>
        <p>Haz tareas cortas dentro de la comunidad, demuestra lo que hiciste y gana NNE Credits para ropa, equipos, beats y producciones.</p>
        <div className="join-actions">
          <Link className="primary-button button-link" to="/signup?promo=PRIMEROS50">Solicitar acceso</Link>
          <span>Primeros 50 aprobados: 3 NNE para arrancar.</span>
        </div>
      </section>

      <section className="join-steps" aria-label="Cómo funciona">
        <article><span>01</span><h2>Escoge tu chamba.</h2><p>Apoya un lanzamiento, comenta, escucha o crea contenido.</p></article>
        <article><span>02</span><h2>Sube la prueba.</h2><p>Nosotros revisamos que esté bien hecho. La creatividad y los números pueden sumar un plus.</p></article>
        <article><span>03</span><h2>Usa tus NNE.</h2><p>Canjéalos por lo que necesites para seguir avanzando. El límite regular es 5 NNE al día.</p></article>
      </section>

      <footer className="join-footer">
        <strong>De artistas haciéndolo real, para artistas que quieren hacerlo real.</strong>
        <Link to="/signup?promo=PRIMEROS50">Quiero entrar →</Link>
      </footer>
    </main>
  );
}
