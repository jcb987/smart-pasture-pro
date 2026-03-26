import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/* ─── tiny intersection-observer hook for scroll-reveal ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── data ─── */
const MODULES = [
  { icon: '🐄', name: 'Animales & Inventario', desc: 'Arete, historial, trazabilidad completa por animal' },
  { icon: '🥛', name: 'Producción de Leche', desc: 'Litros diarios, % grasa, alertas de calidad y mastitis' },
  { icon: '🥩', name: 'Producción de Carne', desc: 'Peso, ganancia diaria, condición corporal y proyecciones' },
  { icon: '💉', name: 'Salud & Vacunación', desc: 'Eventos sanitarios, calendario de vacunas, palpación IA' },
  { icon: '🔄', name: 'Reproducción', desc: 'Ciclos, inseminación, gestación y registro de partos' },
  { icon: '🌿', name: 'Praderas & Alimentación', desc: 'Rotación de potreros, cargas y manejo del pastoreo' },
  { icon: '📄', name: 'Documentos Oficiales', desc: 'Guías ICA, certificados de vacunación, movilización' },
  { icon: '📊', name: 'Reportes & Analytics', desc: 'Informes del predio, KPIs, exportación PDF y Excel' },
  { icon: '💰', name: 'Costos & Facturación', desc: 'Control de gastos, ingresos, facturas y flujo de caja' },
  { icon: '🏥', name: 'Plan Sanitario', desc: 'Cumplimiento ICA, ciclos preventivos y alertas oficiales' },
];

const STRENGTHS = [
  { emoji: '🇨🇴', title: 'Hecho en Colombia', subtitle: '100% local', body: 'Regulaciones ICA y SINIGAN incorporadas. Municipios colombianos, terminología local, formularios oficiales listos para usar.' },
  { emoji: '📡', title: 'Funciona sin conexión', subtitle: 'Sin internet, sin problema', body: 'Registra producción, vacunas y eventos en el campo sin señal. Sincroniza automáticamente al volver a conectarse.' },
  { emoji: '🤖', title: 'IA integrada', subtitle: 'Diagnóstico inteligente', body: 'Predicción de enfermedades, diagnóstico reproductivo asistido, alertas tempranas y análisis de productividad con machine learning.' },
  { emoji: '📋', title: 'Documentos ICA al instante', subtitle: 'Sin papeleos', body: 'Genera guías de movilización y certificados de vacunación en PDF con un clic, listos para presentar ante autoridades.' },
];

const COMPARE_ROWS = [
  { label: 'Precio/mes', agro: '$49.900 COP', a: '$150.000 COP', b: '$200.000 COP', excel: 'Gratis' },
  { label: 'Módulos incluidos', agro: '10 módulos', a: '5 módulos', b: '8 módulos', excel: 'Ninguno' },
  { label: 'Documentos ICA', agro: true, a: false, b: true, excel: false },
  { label: 'Funciona offline', agro: true, a: false, b: false, excel: true },
  { label: 'IA predictiva', agro: true, a: false, b: false, excel: false },
  { label: 'Soporte español', agro: true, a: 'Parcial', b: true, excel: '-' },
  { label: 'App móvil', agro: true, a: true, b: false, excel: false },
  { label: 'Adaptado Colombia', agro: true, a: false, b: 'Parcial', excel: '-' },
  { label: 'Informes PDF', agro: true, a: true, b: true, excel: false },
  { label: 'Multi-especie', agro: true, a: false, b: 'Parcial', excel: false },
];

const PLANS = [
  {
    name: 'Ganadero',
    price: '$49.900',
    period: 'COP / mes',
    popular: false,
    desc: 'Ideal para fincas pequeñas y medianas',
    features: ['Hasta 200 animales', 'Todos los 10 módulos', '1 usuario', 'Soporte por email', 'Documentos ICA', 'Exportación PDF'],
    cta: 'Comenzar gratis 14 días',
    variant: 'outline' as const,
  },
  {
    name: 'Empresarial',
    price: '$89.900',
    period: 'COP / mes',
    popular: true,
    desc: 'Para fincas en crecimiento y medianas empresas',
    features: ['Animales ilimitados', 'Todos los 10 módulos', '5 usuarios', 'Soporte prioritario', 'Reportes avanzados', 'API básica'],
    cta: 'Comenzar gratis 14 días',
    variant: 'default' as const,
  },
  {
    name: 'Cooperativa',
    price: 'A medida',
    period: 'cotización personalizada',
    popular: false,
    desc: 'Para cooperativas y empresas con múltiples fincas',
    features: ['Fincas ilimitadas', 'Usuarios ilimitados', 'Soporte dedicado', 'Marca personalizada', 'API completa', 'Integración ERP'],
    cta: 'Contactar ventas',
    variant: 'outline' as const,
  },
];

const APPROACH = [
  { n: '01', title: 'Simplicidad', body: 'Gestión ganadera compleja, interfaz simple. Sin capacitación previa. Si sabes usar un celular, sabes usar AgroData.' },
  { n: '02', title: 'Cumplimiento', body: 'Regulaciones ICA, SINIGAN y normas fitosanitarias colombianas incorporadas por defecto en cada módulo.' },
  { n: '03', title: 'Rentabilidad', body: 'Controla costos por animal, por lote y por finca. Identifica los animales más rentables y las pérdidas ocultas.' },
  { n: '04', title: 'Accesibilidad', body: 'Funciona en cualquier dispositivo, con o sin internet. Desde celulares básicos hasta computadores de escritorio.' },
];

const TESTIMONIALS = [
  { name: 'Carlos Mendoza', farm: 'Finca La Esperanza, Montería', text: 'Antes llenaba cuadernos a mano y perdía información. Ahora en 2 minutos registro todo y genera los documentos del ICA automáticamente.' },
  { name: 'Ana Patricia Gómez', farm: 'Hacienda El Porvenir, Valledupar', text: 'El módulo de leche me ayudó a detectar un brote de mastitis antes de que afectara toda la producción. Ahorré millones.' },
  { name: 'Jorge Hernández', farm: 'Rancho Los Pinos, Villavicencio', text: 'Tengo 3 fincas y AgroData las maneja todas desde un solo lugar. La IA de reproducción mejoró mi tasa de preñez en un 18%.' },
];

/* ─── cell renderer ─── */
function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <span className="text-[#16a34a] text-lg font-bold">✓</span>;
  if (val === false) return <span className="text-gray-300 text-lg">✗</span>;
  return <span className="text-gray-400 text-sm">{val}</span>;
}

/* ─── MAIN COMPONENT ─── */
export default function AgroDataLanding() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const s1 = useReveal(); const s2 = useReveal(); const s3 = useReveal();
  const s4 = useReveal(); const s5 = useReveal(); const s6 = useReveal();
  const s7 = useReveal();

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0f1f14] font-['DM_Sans',sans-serif] overflow-x-hidden">

      {/* ── STICKY NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/agrodata" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a4731] flex items-center justify-center text-white text-sm font-bold">A</div>
            <span className={`font-bold text-lg tracking-tight transition-colors ${scrolled ? 'text-[#0f1f14]' : 'text-white'}`}>AgroData</span>
          </Link>
          <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
            <a href="#modulos" className="hover:text-[#16a34a] transition-colors">Módulos</a>
            <a href="#fortalezas" className="hover:text-[#16a34a] transition-colors">Por qué AgroData</a>
            <a href="#precios" className="hover:text-[#16a34a] transition-colors">Precios</a>
            <a href="#enfoque" className="hover:text-[#16a34a] transition-colors">Enfoque</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className={`text-sm font-medium ${scrolled ? 'text-gray-700 hover:text-[#1a4731]' : 'text-white hover:bg-white/10'}`}>
              Iniciar sesión
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')}
              className="bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold rounded-lg px-5">
              Empezar gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2318] via-[#1a4731] to-[#0f3320]" />
        {/* grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
        {/* amber glow orb */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{background:'radial-gradient(circle,hsl(38,92%,50%),transparent)'}} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{background:'radial-gradient(circle,hsl(152,45%,40%),transparent)'}} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-white/90 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            Plataforma SaaS · Ganadería Colombiana · Lanzamiento 2026
          </div>

          {/* headline */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white leading-[0.95] mb-6"
            style={{textShadow:'0 2px 40px rgba(0,0,0,0.4)'}}>
            Agro<span className="text-[#4ade80]">Data</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mb-4 leading-relaxed">
            La plataforma inteligente para la <strong className="text-white">gestión ganadera colombiana</strong>
          </p>
          <p className="text-base text-white/60 max-w-xl mb-10">
            Digitaliza tu finca en minutos. Registra producción, salud, reproducción y genera documentos ICA desde el campo, sin conexión.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button size="lg" onClick={() => navigate('/auth')}
              className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl px-8 py-4 text-base shadow-lg shadow-green-900/50 transition-transform hover:scale-105">
              Iniciar Gratis — 14 días
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 font-semibold rounded-xl px-8 py-4 text-base backdrop-blur-sm">
              Ver Demo →
            </Button>
          </div>

          {/* stats bar */}
          <div className="flex flex-wrap justify-center gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            {[['500+','Fincas activas'],['10','Módulos completos'],['100%','Colombiano'],['ICA','Cumplimiento']].map(([n,l]) => (
              <div key={n} className="flex flex-col items-center px-8 py-4 bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-2xl font-black text-[#4ade80]">{n}</span>
                <span className="text-xs text-white/60 mt-0.5 whitespace-nowrap">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* mock dashboard preview */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0f1f14]/80 backdrop-blur-sm">
            {/* browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <span className="w-3 h-3 rounded-full bg-green-400/70" />
              <span className="ml-4 text-xs text-white/30 font-mono">app.agrodata.co/dashboard</span>
            </div>
            {/* mock UI grid */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['🐄','142','Animales'],['🥛','3,840 L','Leche / mes'],['💉','2','Vacunas pendientes'],['📈','18%','Crecimiento']].map(([ic,val,lab]) => (
                <div key={lab} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-2xl mb-2">{ic}</div>
                  <div className="text-xl font-black text-white">{val}</div>
                  <div className="text-xs text-white/40 mt-1">{lab}</div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-3">
              <div className="col-span-2 rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/40 mb-3 font-medium">Producción de leche — últimos 30 días</div>
                <div className="flex items-end gap-1 h-16">
                  {[60,75,55,80,70,90,65,85,75,95,70,80,88,72,91,78,84,69,93,76,88,72,95,80,87,74,90,82,96,88].map((h,i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all" style={{height:`${h}%`,background:`hsl(${142+i*0.5},${50+i*0.3}%,${40+i*0.2}%)`}} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/40 mb-3 font-medium">Alertas activas</div>
                <div className="space-y-2">
                  {[['🔴','Vacuna vencida'],['🟡','Parto próximo'],['🟢','Ciclo completado']].map(([dot,txt]) => (
                    <div key={txt} className="flex items-center gap-2 text-xs text-white/60">{dot} {txt}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modulos" className="py-24 bg-white">
        <div ref={s1.ref} className={`max-w-7xl mx-auto px-6 transition-all duration-700 ${s1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#dcfce7]">10 módulos completos</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#0f1f14] mb-4 tracking-tight">Todo lo que tu finca necesita</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Una plataforma unificada. Sin hojas de cálculo, sin cuadernos, sin información perdida.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MODULES.map((m, i) => (
              <div key={m.name}
                className="group rounded-2xl border border-gray-100 bg-[#fafaf7] hover:border-[#86efac] hover:bg-[#f0fdf4] p-5 transition-all duration-300 hover:shadow-md cursor-default"
                style={{transitionDelay:`${i*40}ms`,opacity:s1.visible?1:0,transform:s1.visible?'none':'translateY(16px)'}}>
                <div className="w-11 h-11 rounded-xl bg-[#dcfce7] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
                <h3 className="font-bold text-sm text-[#0f1f14] mb-1.5 leading-tight">{m.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STRENGTHS ── */}
      <section id="fortalezas" className="py-24 bg-[#0f1f14] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)'}} />
        <div ref={s2.ref} className={`relative z-10 max-w-7xl mx-auto px-6 transition-all duration-700 ${s2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/10">Nuestra ventaja</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">¿Por qué AgroData?</h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">Construido por y para ganaderos colombianos. No un software extranjero adaptado.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STRENGTHS.map((s, i) => (
              <div key={s.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:border-[#4ade80]/30 hover:bg-white/8 transition-all duration-300"
                style={{transitionDelay:`${i*80}ms`,opacity:s2.visible?1:0,transform:s2.visible?'none':'translateY(20px)'}}>
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a4731] flex items-center justify-center text-3xl shrink-0">{s.emoji}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-white">{s.title}</h3>
                      <span className="text-xs text-[#4ade80] font-semibold">{s.subtitle}</span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section id="comparacion" className="py-24 bg-white">
        <div ref={s3.ref} className={`max-w-5xl mx-auto px-6 transition-all duration-700 ${s3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#dcfce7]">Comparativa</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#0f1f14] mb-4 tracking-tight">Más por menos</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">La solución más completa del mercado al mejor precio.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-4 text-gray-400 font-medium w-40">Característica</th>
                  <th className="p-4 bg-[#f0fdf4] border-x-2 border-[#16a34a]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-black text-[#15803d] text-base">AgroData</span>
                      <Badge className="bg-[#16a34a] text-white text-xs hover:bg-[#16a34a]">Tu elección</Badge>
                    </div>
                  </th>
                  <th className="p-4 text-gray-400 font-medium text-center">Software A</th>
                  <th className="p-4 text-gray-400 font-medium text-center">Software B</th>
                  <th className="p-4 text-gray-400 font-medium text-center">Excel / Manual</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.label} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="p-4 text-gray-600 font-medium text-xs">{row.label}</td>
                    <td className="p-4 bg-[#f0fdf4]/80 border-x-2 border-[#16a34a] text-center">
                      {typeof row.agro === 'string' ? (
                        <span className="font-bold text-[#15803d]">{row.agro}</span>
                      ) : (
                        <Cell val={row.agro} />
                      )}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {typeof row.a === 'string' ? row.a : <Cell val={row.a} />}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {typeof row.b === 'string' ? row.b : <Cell val={row.b} />}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {typeof row.excel === 'string' ? row.excel : <Cell val={row.excel} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" className="py-24 bg-[#fafaf7]">
        <div ref={s4.ref} className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${s4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#dcfce7]">Precios transparentes</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#0f1f14] mb-4 tracking-tight">Elige tu plan</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Sin contratos anuales. Sin letras pequeñas. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan, i) => (
              <div key={plan.name}
                className={`rounded-2xl border-2 p-8 relative transition-all duration-300 ${plan.popular
                  ? 'border-[#16a34a] bg-[#0f1f14] shadow-2xl shadow-green-900/30 scale-105'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'}`}
                style={{transitionDelay:`${i*80}ms`,opacity:s4.visible?1:0,transform:s4.visible?(plan.popular?'scale(1.05)':'none'):'translateY(20px)'}}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#16a34a] text-white font-bold px-4 py-1 text-xs shadow-lg">⭐ Más popular</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-black mb-1 ${plan.popular ? 'text-white' : 'text-[#0f1f14]'}`}>Plan {plan.name}</h3>
                  <p className={`text-xs mb-4 ${plan.popular ? 'text-white/50' : 'text-gray-400'}`}>{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.popular ? 'text-[#4ade80]' : 'text-[#15803d]'}`}>{plan.price}</span>
                    <span className={`text-xs mb-1.5 ${plan.popular ? 'text-white/40' : 'text-gray-400'}`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className={`text-sm font-bold ${plan.popular ? 'text-[#4ade80]' : 'text-[#16a34a]'}`}>✓</span>
                      <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl font-bold py-5 ${plan.popular
                    ? 'bg-[#16a34a] hover:bg-[#15803d] text-white shadow-lg shadow-green-900/40'
                    : 'border-2 border-[#16a34a] text-[#15803d] bg-transparent hover:bg-[#f0fdf4]'}`}
                  onClick={() => navigate('/auth')}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">✓ 14 días gratis en todos los planes · Sin tarjeta de crédito · Cancela en cualquier momento</p>
        </div>
      </section>

      {/* ── APPROACH ── */}
      <section id="enfoque" className="py-24 bg-white">
        <div ref={s5.ref} className={`max-w-5xl mx-auto px-6 transition-all duration-700 ${s5.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#dcfce7]">Filosofía</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#0f1f14] mb-4 tracking-tight">Nuestro Enfoque</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">No solo un software. Una apuesta por la modernización ganadera colombiana.</p>
          </div>
          <div className="relative">
            {/* connecting line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#16a34a] to-[#86efac] hidden md:block" />
            <div className="space-y-6">
              {APPROACH.map((a, i) => (
                <div key={a.n}
                  className="flex gap-6 items-start group"
                  style={{transitionDelay:`${i*100}ms`,opacity:s5.visible?1:0,transform:s5.visible?'none':'translateX(-16px)',transition:'all 0.6s'}}>
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#0f1f14] flex items-center justify-center shrink-0 group-hover:bg-[#1a4731] transition-colors">
                    <span className="text-[#4ade80] font-black text-sm">{a.n}</span>
                  </div>
                  <div className="flex-1 pt-3 pb-6 border-b border-gray-100 last:border-0">
                    <h3 className="text-xl font-black text-[#0f1f14] mb-2">{a.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-[#fafaf7]">
        <div ref={s6.ref} className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${s6.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#dcfce7]">Ganaderos reales</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#0f1f14] mb-4 tracking-tight">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={t.name}
                className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                style={{transitionDelay:`${i*80}ms`,opacity:s6.visible?1:0,transform:s6.visible?'none':'translateY(16px)'}}>
                <CardContent className="p-6">
                  <div className="text-[#16a34a] text-3xl mb-4 font-black leading-none">"</div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#15803d] font-black text-sm">
                      {t.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#0f1f14]">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.farm}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24">
        <div ref={s7.ref} className={`max-w-4xl mx-auto px-6 transition-all duration-700 ${s7.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a2318] via-[#1a4731] to-[#0f3320]" />
            <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 30% 70%,#4ade80,transparent 60%),radial-gradient(circle at 70% 30%,#f59e0b,transparent 50%)'}} />
            <div className="relative z-10 text-center py-20 px-8">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                Empieza hoy mismo
              </h2>
              <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
                Tu finca merece la mejor herramienta. Únete a los ganaderos colombianos que ya digitalizaron su operación.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" onClick={() => navigate('/auth')}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white font-black rounded-xl px-10 py-5 text-base shadow-2xl shadow-green-900/60 transition-transform hover:scale-105">
                  Crear cuenta gratis →
                </Button>
              </div>
              <p className="text-white/30 text-sm mt-5">No se requiere tarjeta de crédito · 14 días gratis · Cancela cuando quieras</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a1a0f] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a4731] flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="font-bold text-white">AgroData</span>
              <span className="text-white/30 text-xs">— Sistema de Gestión Ganadera</span>
            </div>
            <div className="flex gap-6 text-sm text-white/40">
              <Link to="/terminos" className="hover:text-white/80 transition-colors">Términos</Link>
              <Link to="/privacidad" className="hover:text-white/80 transition-colors">Privacidad</Link>
              <Link to="/ayuda" className="hover:text-white/80 transition-colors">Soporte</Link>
              <Link to="/auth" className="hover:text-white/80 transition-colors">Iniciar sesión</Link>
            </div>
          </div>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/20">
            <span>© 2026 AgroData · Hecho con ❤️ en Colombia</span>
            <span>v1.0 · Lovable Platform · Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
