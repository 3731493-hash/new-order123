"use client";

type HomeProps = {
  onStart: () => void;
};

export default function Home({ onStart }: HomeProps) {
  return (
    <main className="home-screen">
      <div className="background-grid" />
      <div className="red-glow red-glow-one" />
      <div className="red-glow red-glow-two" />

      <section className="home-content">

        <header className="brand">
          <p className="brand-kicker">
            김동현 · 김원영 · 이광희
          </p>

          <h1 className="brand-title">
            <span>NEW</span>
            <span>ORDER</span>
          </h1>

          <div className="brand-subtitle">
            MONEY <strong>GAME</strong>
          </div>
        </header>

        <div className="home-copy">
          <p>
            계엄
            <br />
            민주화
            <br />
            폭동
            <br />
            그리고 살아남아라.
          </p>
        </div>

        <button
          className="start-game-button"
          onClick={onStart}
        >
          GAME START →
        </button>

        <div className="utility-menu">
          <button>RECORD</button>

          <span />

          <button>SETTING</button>
        </div>

        <footer className="version-text">
          NEW ORDER v0.1
        </footer>

      </section>
    </main>
  );
}