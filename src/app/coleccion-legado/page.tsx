'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ColeccionLegado() {
  useEffect(() => {
    // Scroll reveal
    const reveals = document.querySelectorAll('.legado-page .reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(r => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="legado-page">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Petit+Formal+Script&family=Raleway:wght@300;400;500&display=swap');

        .legado-page {
          --rose:       #e8b4b8;
          --blush:      #f5dde0;
          --cream:      #fdf7f4;
          --gold:       #c9a96e;
          --gold-light: #e8d5b0;
          --text:       #3a2c2e;
          --text-soft:  #7a5c60;
          
          background: var(--cream);
          color: var(--text);
          font-family: 'Raleway', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
          scroll-behavior: smooth;
          position: relative;
        }

        /* ── Grain overlay ── */
        .legado-page::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 999;
        }

        /* ── HERO ── */
        .legado-page .hero {
          min-height: calc(100vh - 80px); /* Adjust for global header */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem 5rem;
          position: relative;
          overflow: hidden;
          background-image: url('https://images.unsplash.com/photo-1490750967868-88df5691cc2c?w=1800&q=80&fit=crop');
          background-size: cover;
          background-position: center top;
        }
        /* Soft overlay so text stays readable */
        .legado-page .hero::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            rgba(253,247,244,.82) 0%,
            rgba(245,221,224,.70) 40%,
            rgba(253,247,244,.88) 100%
          );
          z-index: 0;
        }
        .legado-page .hero > * { position: relative; z-index: 1; }

        /* Floating petals */
        .legado-page .petals { position: absolute; inset: 0; pointer-events: none; }
        .legado-page .petal {
          position: absolute;
          border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
          opacity: .18;
          animation: drift linear infinite;
        }
        @keyframes drift {
          0%   { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10%  { opacity: .18; }
          90%  { opacity: .18; }
          100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
        }

        .legado-page .hero-kicker {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 1.5rem;
          opacity: 0;
          animation: fadeUp .8s .2s forwards;
        }

        .legado-page .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(3.2rem, 8vw, 6.5rem);
          line-height: 1.05;
          color: var(--text);
          margin-bottom: .5rem;
          opacity: 0;
          animation: fadeUp .9s .4s forwards;
        }

        .legado-page .hero-title em {
          font-style: italic;
          color: var(--rose);
          display: block;
        }

        .legado-page .hero-script {
          font-family: 'Petit Formal Script', cursive;
          font-size: clamp(2rem, 5vw, 4rem);
          color: var(--gold);
          margin: .8rem 0 2rem;
          opacity: 0;
          animation: fadeUp .9s .6s forwards;
        }

        .legado-page .hero-sub {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--text-soft);
          max-width: 540px;
          opacity: 0;
          animation: fadeUp .9s .8s forwards;
        }

        .legado-page .hero-divider {
          width: 80px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          margin: 2.5rem auto;
          opacity: 0;
          animation: fadeIn .9s 1s forwards;
        }

        .legado-page .hero-cta {
          display: inline-block;
          padding: .9rem 2.6rem;
          border: 1px solid var(--gold);
          font-size: .78rem;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--gold);
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: color .4s;
          opacity: 0;
          animation: fadeUp .9s 1.1s forwards;
        }
        .legado-page .hero-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .4s ease;
          z-index: -1;
        }
        .legado-page .hero-cta:hover { color: var(--cream); }
        .legado-page .hero-cta:hover::before { transform: scaleX(1); }

        /* ── MANIFESTO ── */
        .legado-page .manifesto {
          padding: 7rem 2rem;
          text-align: center;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1800&q=80&fit=crop');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
        .legado-page .manifesto::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(245,221,224,.93) 0%, rgba(253,247,244,.90) 100%);
          z-index: 0;
        }
        .legado-page .manifesto > * { position: relative; z-index: 1; }

        .legado-page .manifesto::before {
          content: '❀';
          position: absolute; top: 3rem; left: 50%;
          transform: translateX(-50%);
          font-size: 1.4rem;
          color: var(--rose);
          opacity: .5;
          z-index: 2;
        }

        .legado-page .manifesto-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(1.5rem, 3.5vw, 2.6rem);
          line-height: 1.6;
          color: var(--text);
          max-width: 780px;
          margin: 0 auto 2.5rem;
        }

        .legado-page .manifesto-quote span {
          color: var(--gold);
        }

        .legado-page .manifesto-sign {
          font-family: 'Petit Formal Script', cursive;
          font-size: 1.5rem;
          color: var(--text-soft);
        }

        /* ── COLECCIÓN CARDS ── */
        .legado-page .coleccion-wrapper {
          background-image: url('https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1800&q=80&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .legado-page .coleccion-wrapper::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba(253,247,244,.94);
        }
        .legado-page .coleccion {
          padding: 7rem 3rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative; z-index: 1;
        }
        .legado-page .section-label {
          font-size: .72rem;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: var(--gold);
          text-align: center;
          margin-bottom: .8rem;
        }

        .legado-page .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300;
          text-align: center;
          margin-bottom: 1rem;
          color: var(--text);
        }

        .legado-page .section-desc {
          text-align: center;
          color: var(--text-soft);
          font-size: .95rem;
          line-height: 1.8;
          max-width: 520px;
          margin: 0 auto 4rem;
        }

        .legado-page .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .legado-page .card {
          background: white;
          border: 1px solid var(--gold-light);
          padding: 3rem 2.5rem 2.5rem;
          position: relative;
          transition: transform .4s ease, box-shadow .4s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .legado-page .card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 3px;
          background: linear-gradient(90deg, var(--rose), var(--gold));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .4s ease;
        }

        .legado-page .card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(201,169,110,.15); }
        .legado-page .card:hover::after { transform: scaleX(1); }

        .legado-page .card-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          font-weight: 300;
          color: var(--blush);
          line-height: 1;
          margin-bottom: 1rem;
        }

        .legado-page .card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: .8rem;
        }

        .legado-page .card-text {
          font-size: .88rem;
          line-height: 1.8;
          color: var(--text-soft);
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }

        .legado-page .card-tag {
          font-family: 'Petit Formal Script', cursive;
          font-size: 1.1rem;
          color: var(--gold);
          margin-bottom: 1.5rem;
        }

        .legado-page .card-btn {
          display: inline-block;
          padding: 0.8rem 1.5rem;
          background: var(--cream);
          border: 1px solid var(--gold);
          color: var(--gold);
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          margin-top: auto;
        }
        
        .legado-page .card-btn:hover {
          background: var(--gold);
          color: white;
        }

        /* ── HISTORIA ── */
        .legado-page .historia {
          color: var(--cream);
          padding: 8rem 3rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1800&q=80&fit=crop');
          background-size: cover;
          background-position: center;
        }
        .legado-page .historia::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba(42,28,30,.82);
        }
        .legado-page .historia > * { position: relative; z-index: 1; }

        @media (max-width: 768px) {
          .legado-page .historia { grid-template-columns: 1fr; gap: 3rem; }
        }

        .legado-page .historia-label {
          font-size: .7rem;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 1rem;
        }

        .legado-page .historia-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 300;
          line-height: 1.3;
          margin-bottom: 2rem;
        }

        .legado-page .historia-title em { font-style: italic; color: var(--rose); }

        .legado-page .historia-text {
          font-size: .93rem;
          line-height: 2;
          color: rgba(253,247,244,.7);
          margin-bottom: 1.5rem;
        }

        .legado-page .names-row {
          display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: 2rem;
        }

        .legado-page .name-pill {
          font-family: 'Petit Formal Script', cursive;
          font-size: 1.3rem;
          color: var(--gold);
          padding: .4rem 1.2rem;
          border: 1px solid rgba(201,169,110,.4);
          border-radius: 50px;
        }

        .legado-page .historia-visual {
          display: flex; align-items: center; justify-content: center;
        }

        .legado-page .florals {
          width: 300px; height: 300px;
          border-radius: 50%;
          border: 1px solid rgba(201,169,110,.3);
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }

        .legado-page .florals::before, .legado-page .florals::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(201,169,110,.15);
        }
        .legado-page .florals::before { inset: -20px; }
        .legado-page .florals::after  { inset: -40px; }

        .legado-page .florals-inner {
          font-family: 'Petit Formal Script', cursive;
          font-size: 2.2rem;
          color: var(--gold);
          text-align: center;
          line-height: 1.6;
        }

        .legado-page .florals-inner small {
          display: block;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: .85rem;
          color: rgba(253,247,244,.5);
          letter-spacing: .1em;
          margin-top: .5rem;
        }

        /* ── ESLOGAN BAND ── */
        .legado-page .band {
          background: linear-gradient(90deg, var(--rose), var(--gold), var(--rose));
          background-size: 200% 100%;
          animation: shiftBand 5s ease infinite;
          padding: 1.8rem;
          text-align: center;
          overflow: hidden;
        }

        @keyframes shiftBand {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        .legado-page .band p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.3rem;
          color: white;
          letter-spacing: .1em;
          margin: 0;
        }

        /* ── FOOTER ── */
        .legado-page footer {
          padding: 4rem 3rem;
          text-align: center;
          border-top: 1px solid var(--gold-light);
          background-image: url('https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?w=1200&q=60&fit=crop');
          background-size: cover;
          background-position: center bottom;
          position: relative;
        }
        .legado-page footer::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba(253,247,244,.95);
        }
        .legado-page footer > * { position: relative; z-index: 1; }

        .legado-page .footer-logo {
          font-family: 'Petit Formal Script', cursive;
          font-size: 2.5rem;
          color: var(--gold);
          display: block;
          margin-bottom: 1rem;
        }

        .legado-page .footer-text {
          font-size: .78rem;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--text-soft);
          margin-bottom: .5rem;
        }

        .legado-page .footer-url {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          color: var(--gold);
          text-decoration: none;
        }

        /* ── SCROLL REVEAL ── */
        .legado-page .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity .8s ease, transform .8s ease;
        }
        .legado-page .reveal.visible { opacity: 1; transform: translateY(0); }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
          from { opacity: 0; transform: translateY(24px); }
        }
        @keyframes fadeIn {
          to { opacity: 1; } from { opacity: 0; }
        }
      ` }} />

      {/* HERO */}
      <section className="hero">
        {/* Petals */}
        <div className="petals">
          <div className="petal" style={{ left: '8%', width: '28px', height: '22px', background: 'var(--rose)', animationDuration: '14s', animationDelay: '0s' }}></div>
          <div className="petal" style={{ left: '20%', width: '18px', height: '14px', background: 'var(--gold-light)', animationDuration: '18s', animationDelay: '2s' }}></div>
          <div className="petal" style={{ left: '40%', width: '22px', height: '18px', background: 'var(--blush)', animationDuration: '12s', animationDelay: '4s' }}></div>
          <div className="petal" style={{ left: '60%', width: '30px', height: '24px', background: 'var(--rose)', animationDuration: '16s', animationDelay: '1s' }}></div>
          <div className="petal" style={{ left: '75%', width: '16px', height: '12px', background: 'var(--gold-light)', animationDuration: '20s', animationDelay: '3s' }}></div>
          <div className="petal" style={{ left: '88%', width: '24px', height: '20px', background: 'var(--blush)', animationDuration: '13s', animationDelay: '6s' }}></div>
        </div>

        <p className="hero-kicker">Mily's · Colección Especial</p>
        <h1 className="hero-title">
          Tu Labor<br />
          <em>es Arte</em>
        </h1>
        <p className="hero-script">para las madres</p>
        <p className="hero-sub">
          Un espacio creado con amor, donde cada prenda lleva el peso sagrado de lo que significa ser mamá — tu paciencia, tu fuerza, tu magia cotidiana.
        </p>
        <div className="hero-divider"></div>
        <a href="#coleccion" className="hero-cta">Explorar la colección</a>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto">
        <blockquote className="manifesto-quote">
          "Mily's nació del diminutivo de amor con el que llamo a mi hija Emily. Como tú, sé que ser madre es el
          <span> diseño más complejo y hermoso </span>
          que jamás llevaremos puesto."
        </blockquote>
        <p className="manifesto-sign">— Vanessa, mamá &amp; creadora</p>
      </section>

      {/* COLECCIÓN */}
      <div className="coleccion-wrapper">
        <section className="coleccion" id="coleccion">
          <p className="section-label reveal">Diseños DTF · Edición Limitada</p>
          <h2 className="section-title reveal">Tres diseños, tres historias</h2>
          <p className="section-desc reveal">Estampados con técnica DTF de alta durabilidad, pensados para que cada lavada sea una afirmación: tu amor resiste todo.</p>

          <div className="cards-grid">
            <div className="card reveal">
              <p className="card-num">01</p>
              <h3 className="card-title">El Árbol de la Vida</h3>
              <p className="card-text">Una ilustración minimalista donde las raíces forman la palabra MAMÁ. Las hojas guardan los nombres de tus hijos, personalizados en DTF vibrante.</p>
              <p className="card-tag">"Mis raíces, mi fuerza, mi vida"</p>
              <Link href="/?category=Colección Legado#products" className="card-btn">Ver en Tienda</Link>
            </div>

            <div className="card reveal" style={{ transitionDelay: '.15s' }}>
              <p className="card-num">02</p>
              <h3 className="card-title">Definición de Superpoder</h3>
              <p className="card-text">Tipografía elegante tipo diccionario. <em>Madre: Creadora de mundos, sanadora de heridas, experta en magia cotidiana.</em> Ver también: Mily's.</p>
              <p className="card-tag">"Tu superpoder favorito"</p>
              <Link href="/?category=Colección Legado#products" className="card-btn">Ver en Tienda</Link>
            </div>

            <div className="card reveal" style={{ transitionDelay: '.3s' }}>
              <p className="card-num">03</p>
              <h3 className="card-title">Legado de Amor</h3>
              <p className="card-text">Una línea continua que dibuja el perfil de una madre abrazando a sus hijos, rodeada de flores vibrantes. DTF en su máxima expresión.</p>
              <p className="card-tag">"Tu labor es el regalo más valioso"</p>
              <Link href="/?category=Colección Legado#products" className="card-btn">Ver en Tienda</Link>
            </div>
          </div>
        </section>
      </div>

      {/* HISTORIA */}
      <section className="historia">
        <div>
          <p className="historia-label">La historia detrás de Mily's</p>
          <h2 className="historia-title">
            Cuatro corazones,<br />
            <em>una marca</em>
          </h2>
          <p className="historia-text">
            Esta colección no es solo ropa. Es una carta abierta a todas las madres que alguna vez necesitaron escuchar que lo están haciendo increíble.
          </p>
          <p className="historia-text">
            Soy Vanessa, mamá de tres niñas que son el motor de mi vida. El nombre <em style={{ color: 'var(--rose)', fontStyle: 'italic' }}>Mily's</em> nació de <strong style={{ fontWeight: 500 }}>Emily</strong>, mi hija — ese diminutivo de amor que guarda en tres letras todo lo que significa esta marca: ternura, familia y orgullo de ser mamá.
          </p>
          <p className="historia-text">
            Esta colección late gracias a cuatro corazones.
          </p>
          <div className="names-row">
            <span className="name-pill">Vanessa</span>
            <span className="name-pill">Aileen</span>
            <span className="name-pill">Eimy</span>
            <span className="name-pill">Emily</span>
          </div>
        </div>

        <div className="historia-visual">
          <div className="florals">
            <div className="florals-inner">
              mily's
              <small>Colección Legado</small>
            </div>
          </div>
        </div>
      </section>

      {/* BAND */}
      <div className="band">
        <p>Mily's · Porque ser mamá es el trabajo más importante del mundo · milys.shop</p>
      </div>

      {/* FOOTER */}
      <footer>
        <span className="footer-logo">mily's</span>
        <p className="footer-text">Diseños exclusivos · Técnica DTF · Venezuela</p>
        <Link href="/" className="footer-url">milys.shop</Link>
      </footer>
    </div>
  );
}
