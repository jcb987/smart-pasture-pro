import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Orbe 3D animado con GSAP — identidad visual del Dashboard.
 * Esfera con iluminación radial + 3 anillos orbitales + partículas.
 */
export const DashboardOrb = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const p3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Float suave del contenedor
      gsap.to(containerRef.current, {
        y: -10,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Rotación lenta del orbe (efecto brillo deslizante)
      gsap.to(orbRef.current, {
        rotateY: 360,
        duration: 22,
        repeat: -1,
        ease: 'none',
      });

      // Anillo 1 — plano Z
      gsap.to(ring1Ref.current, {
        rotateZ: 360,
        duration: 7,
        repeat: -1,
        ease: 'none',
      });

      // Anillo 2 — plano X (inclinado)
      gsap.to(ring2Ref.current, {
        rotateX: 360,
        duration: 11,
        repeat: -1,
        ease: 'none',
      });

      // Anillo 3 — plano Y inverso
      gsap.to(ring3Ref.current, {
        rotateY: -360,
        duration: 17,
        repeat: -1,
        ease: 'none',
      });

      // Partícula 1 — órbita rápida
      gsap.to(p1Ref.current, {
        motionPath: { path: 'M 60,0 A 60,60 0 1,1 60,-0.01', autoRotate: true },
        duration: 5,
        repeat: -1,
        ease: 'none',
      });

      // Partícula 2 — órbita media inclinada
      gsap.fromTo(
        p2Ref.current,
        { rotate: 0, transformOrigin: '50% 50%' },
        { rotate: 360, duration: 9, repeat: -1, ease: 'none' }
      );

      // Partícula 3 — órbita lenta
      gsap.fromTo(
        p3Ref.current,
        { rotate: 180 },
        { rotate: -180, duration: 14, repeat: -1, ease: 'none' }
      );

      // Entrada dramática
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(1.4)', delay: 0.3 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative hidden sm:flex items-center justify-center perspective-1000"
      style={{ width: 120, height: 120 }}
    >
      {/* Sombra / halo debajo */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: 80,
          height: 16,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, hsl(19 60% 50% / 0.4) 0%, transparent 70%)',
          filter: 'blur(6px)',
        }}
      />

      {/* Esfera principal */}
      <div
        ref={orbRef}
        className="relative preserve-3d orb-glow"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `
            radial-gradient(
              circle at 35% 35%,
              hsl(45 29% 93%) 0%,
              hsl(19 60% 50%) 25%,
              hsl(147 16% 22%) 55%,
              hsl(0 0% 8%) 100%
            )
          `,
          boxShadow: `
            inset -8px -8px 20px hsl(0 0% 0% / 0.5),
            inset 4px 4px 12px hsl(45 29% 93% / 0.25),
            0 0 40px hsl(19 60% 50% / 0.3)
          `,
        }}
      >
        {/* Brillo especular */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '20%',
            width: '28%',
            height: '18%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, hsl(45 29% 93% / 0.7) 0%, transparent 80%)',
            transform: 'rotate(-30deg)',
          }}
        />
      </div>

      {/* Anillo 1 — Arcilla */}
      <div
        ref={ring1Ref}
        className="absolute preserve-3d"
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: '1.5px solid hsl(19 60% 50% / 0.7)',
          boxShadow: '0 0 8px hsl(19 60% 50% / 0.3)',
          transform: 'rotateX(70deg)',
        }}
      />

      {/* Anillo 2 — Musgo */}
      <div
        ref={ring2Ref}
        className="absolute preserve-3d"
        style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          border: '1px solid hsl(147 16% 50% / 0.5)',
          transform: 'rotateX(70deg) rotateZ(45deg)',
        }}
      />

      {/* Anillo 3 — Crema */}
      <div
        ref={ring3Ref}
        className="absolute preserve-3d"
        style={{
          width: 118,
          height: 118,
          borderRadius: '50%',
          border: '1px dashed hsl(45 29% 80% / 0.4)',
          transform: 'rotateX(70deg) rotateZ(-30deg)',
        }}
      />

      {/* Partícula 1 — Arcilla */}
      <div
        ref={p1Ref}
        className="absolute"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'hsl(19 60% 60%)',
          boxShadow: '0 0 6px hsl(19 60% 50%)',
          top: '50%',
          left: '50%',
          marginTop: -3,
          marginLeft: 57,
        }}
      />

      {/* Partícula 2 — Crema */}
      <div
        ref={p2Ref}
        className="absolute"
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'hsl(45 29% 85%)',
          top: '50%',
          left: '50%',
          marginTop: -62,
          marginLeft: -2,
          transformOrigin: '2px 62px',
        }}
      />

      {/* Partícula 3 — Musgo claro */}
      <div
        ref={p3Ref}
        className="absolute"
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'hsl(147 20% 55%)',
          boxShadow: '0 0 4px hsl(147 16% 22% / 0.6)',
          top: '50%',
          left: '50%',
          marginTop: -2,
          marginLeft: -67,
          transformOrigin: '67px 2px',
        }}
      />
    </div>
  );
};
