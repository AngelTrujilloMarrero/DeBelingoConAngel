import { useState, useEffect, useRef } from 'react';

const INTRO_TEXT = `Hace 10 años, un trabajador de una conocida cadena de TV me citó en una cafetería de La Laguna. Yo no sabía el motivo de la citación hasta que me senté a hablar con él.

Fue directo conmigo: quería comprarme todas las redes sociales de Debelingo Con Ángel, en aquel momento llamado Verbenas y Orquestas Canarias Bailoteo. Me negué en rotundo, sin hablar ni siquiera de precios. Esto no se vende.

Diez años después, me cae la sorpresa de que otro trabajador de la misma cadena de TV, a través de las redes sociales, trinca la información y me cita donde nadie lo ve: en el chat, al final, conjuntamente con otros 30.

Sé perfectamente que un vídeo con las verbenas de cada fin de semana supera las cien mil visualizaciones, y a la larga genera dinero directa o indirectamente.

Es por ello que la página se cierra temporalmente. Lo siento.`;

export const INTRO_START_DATE = new Date('2026-07-26T00:00:00');
export const INTRO_DURATION_DAYS = 20;

export function isIntroActive(): boolean {
  const endDate = new Date(INTRO_START_DATE);
  endDate.setDate(endDate.getDate() + INTRO_DURATION_DAYS);
  return new Date() < endDate;
}

const TYPING_SPEED = 80;
const BLINK_SPEED = 530;

export default function IntroPage() {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (displayedText.length >= INTRO_TEXT.length) return;

    const timeout = setTimeout(() => {
      setDisplayedText(INTRO_TEXT.slice(0, displayedText.length + 1));
    }, TYPING_SPEED);

    return () => clearTimeout(timeout);
  }, [displayedText]);

  useEffect(() => {
    if (textRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      if (atBottom) {
        textRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [displayedText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, BLINK_SPEED);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: '#111111',
            marginBottom: '2rem',
            letterSpacing: '-0.02em',
          }}
        >
          De Belingo Con Ángel
        </h1>
        <div ref={textRef}>
          <p
            style={{
              fontFamily: "'Exo 2', Georgia, serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: 1.9,
              color: '#222222',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
            }}
          >
            {displayedText}
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                backgroundColor: '#111111',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                opacity: showCursor ? 1 : 0,
                transition: 'opacity 0.1s',
              }}
            />
          </p>
        </div>
      </div>
    </div>
  );
}