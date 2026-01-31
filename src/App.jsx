import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import "./index.css";
import surpriseGif from "./assets/cats-cat-with-flower.gif";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.random() * (max - min) + min;

export default function App() {
  const yesRef = useRef(null);
  const noRef = useRef(null);

  const [accepted, setAccepted] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 }); // viewport coords
  const [noClicks, setNoClicks] = useState(0);

  // taille de base du bouton NON (sans scale)
  const noBaseSizeRef = useRef({ w: 120, h: 50 });

  // Tailles
  const yesScale = clamp(1 + noClicks * 0.18, 1, 2.25);
  const noScale = clamp(1 - noClicks * 0.12, 0.18, 1);

  const hideNo = noClicks >= 8;

  function getNoScaleFor(clicks) {
    return clamp(1 - clicks * 0.12, 0.18, 1);
  }

  function getNoScaledSizeFor(clicks) {
    const { w, h } = noBaseSizeRef.current;
    const s = getNoScaleFor(clicks);
    return { w: w * s, h: h * s };
  }

  // place Non à côté du Oui (mesuré) -> coordonnées viewport
  function placeNoNearYesFor(clicks) {
    const yes = yesRef.current;
    if (!yes) return;

    const yesRect = yes.getBoundingClientRect();
    const { w, h } = getNoScaledSizeFor(clicks);

    const gap = 24;
    const x = yesRect.right + gap;
    const y = yesRect.top + yesRect.height / 2 - h / 2;

    // clamp direct pour rester visible
    const padding = 12;
    setNoPos({
      x: clamp(x, padding, Math.max(padding, window.innerWidth - w - padding)),
      y: clamp(y, padding, Math.max(padding, window.innerHeight - h - padding)),
    });
  }

  function moveNoRandomFor(clicks) {
    const padding = 12;
    const { w, h } = getNoScaledSizeFor(clicks);

    const minX = padding;
    const minY = padding;
    const maxX = Math.max(padding, window.innerWidth - w - padding);
    const maxY = Math.max(padding, window.innerHeight - h - padding);

    setNoPos({
      x: rand(minX, maxX),
      y: rand(minY, maxY),
    });
  }

  // init: mesurer taille base du Non (quand il est encore dans la div)
  useEffect(() => {
    requestAnimationFrame(() => {
      const btn = noRef.current;
      if (!btn) return;

      const prev = btn.style.transform;
      btn.style.transform = "scale(1)";
      const b = btn.getBoundingClientRect();
      btn.style.transform = prev;

      noBaseSizeRef.current = { w: b.width, h: b.height };
    });
  }, []);

  // quand Non sort de la div (noClicks passe à 1), on le place juste à côté du Oui
  useEffect(() => {
    if (accepted) return;
    if (noClicks !== 1) return;

    requestAnimationFrame(() => {
      placeNoNearYesFor(noClicks);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noClicks, accepted]);

  // resize: re-clamp la position du Non (si il est en portal)
  useEffect(() => {
    const onResize = () => {
      if (noClicks === 0) return; // tant qu'il est dans la div, pas besoin

      const padding = 12;
      const { w, h } = getNoScaledSizeFor(noClicks);

      setNoPos((p) => ({
        x: clamp(p.x, padding, Math.max(padding, window.innerWidth - w - padding)),
        y: clamp(p.y, padding, Math.max(padding, window.innerHeight - h - padding)),
      }));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noClicks]);

  function onNo() {
    setNoClicks((c) => {
      const next = c + 1;

      // à partir du 1er clic, le Non est en portal => déplacement aléatoire
      if (next >= 1) {
        requestAnimationFrame(() => moveNoRandomFor(next));
      }

      return next;
    });
  }

  function fireYesConfetti() {
    confetti({ particleCount: 140, spread: 85, origin: { y: 0.65 } });
    setTimeout(() => {
      confetti({ particleCount: 110, spread: 120, origin: { y: 0.45 } });
    }, 220);
  }

  function onYes() {
    setAccepted(true);
    fireYesConfetti();
  }

  return (
    <div className="page">
      <div className="card">
        {!accepted ? (
          <>
            <h1>Veux-tu être ma Valentine ? 💖</h1>
            <p className="sub">Fais le bon choix 😇</p>

            {/* ✅ Les 2 boutons dans une div centrée */}
            <div className="buttonRowCenter">
              <button
                ref={yesRef}
                className="btn yes"
                style={{ transform: `scale(${yesScale})` }}
                onClick={onYes}
              >
                Oui 🥰
              </button>

              {/* Tant que Non n’a pas encore été cliqué, il reste dans la div */}
              {noClicks === 0 && !hideNo && (
                <button ref={noRef} className="btn no" onClick={onNo}>
                  Non
                </button>
              )}
            </div>

            {hideNo && (
              <p className="hint">
                Bon… j’ai l’impression qu’il ne reste qu’une option 😏
              </p>
            )}
          </>
        ) : (
          <>
            <h1>YEEEES 💘</h1>
            <p className="sub">Alors RDV le 14 février mon amoureuse ! 😍❤️</p>

            <img
              src={surpriseGif}
              alt="Surprise romantique"
              className="finalGif"
            />
          </>
        )}
      </div>

      {/* ✅ NON rendu dans document.body après le 1er clic */}
      {!accepted &&
        noClicks > 0 &&
        !hideNo &&
        createPortal(
          <button
            ref={noRef}
            className="btn no floating"
            style={{
              left: noPos.x,
              top: noPos.y,
              transform: `scale(${noScale})`,
            }}
            onClick={onNo}
          >
            Non
          </button>,
          document.body
        )}
    </div>
  );
}