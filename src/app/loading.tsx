export default function GlobalLoading() {
  return (
    <main className="loading-shell">
      <section className="card loading-card stack-sm" aria-live="polite" aria-busy="true">
        <h1 className="heading">Carregando MarketNow...</h1>
        <p className="text-muted">Aguarde enquanto preparamos seus dados.</p>
      </section>
    </main>
  );
}

