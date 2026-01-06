import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  PlayCircle, ChevronLeft, ChevronRight, CheckCircle2, Clock, 
  Lightbulb, AlertTriangle, Video, BookOpen
} from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  tip?: string;
  warning?: string;
}

interface ModuleTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'básico' | 'intermedio' | 'avanzado';
  videoPlaceholder: boolean;
  introduction: string;
  steps: TutorialStep[];
  commonQuestions: { question: string; answer: string }[];
}

const moduleTutorials: ModuleTutorial[] = [
  {
    id: 'inicio',
    title: 'Primeros Pasos en el Sistema',
    description: 'Configura tu finca y empieza a usar GanaderoPro',
    duration: '10 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'Bienvenido a GanaderoPro. Esta guía te llevará paso a paso por la configuración inicial de tu cuenta y tu primera experiencia con el sistema. Al finalizar, tendrás tu finca configurada y lista para comenzar a registrar información.',
    steps: [
      {
        title: 'Acceder al sistema',
        content: 'Ingresa a la aplicación usando tu correo electrónico y contraseña. Si es tu primera vez, deberás registrarte creando una cuenta nueva con tus datos básicos.',
        tip: 'Usa una contraseña segura que combines letras, números y símbolos.'
      },
      {
        title: 'Configurar tu perfil',
        content: 'Una vez dentro, ve a Configuración → Perfil. Completa tu nombre, teléfono y los datos de tu finca como nombre, ubicación y tipo de producción (leche, carne o doble propósito).',
      },
      {
        title: 'Conocer el Dashboard',
        content: 'El Dashboard es tu pantalla principal. Aquí verás un resumen de tu finca: total de animales, alertas pendientes, producción reciente y el clima. Familiarízate con las tarjetas de información y los accesos rápidos.',
        tip: 'Puedes personalizar qué información ver en el Dashboard desde Configuración → Preferencias.'
      },
      {
        title: 'Explorar el menú lateral',
        content: 'El menú izquierdo contiene todos los módulos del sistema: Animales, Producción, Reproducción, Salud, Alimentación, Praderas, Costos, Reportes y más. Haz clic en cada uno para explorar.',
      },
      {
        title: 'Crear tu primer lote',
        content: 'Los lotes te permiten agrupar animales. Ve a Animales → Lotes y crea tu primer lote (ejemplo: "Vacas en producción", "Novillas", "Terneros"). Esto facilitará la gestión de tu ganado.',
      }
    ],
    commonQuestions: [
      { question: '¿Puedo cambiar el nombre de mi finca después?', answer: 'Sí, ve a Configuración → Perfil y podrás editar todos los datos de tu finca en cualquier momento.' },
      { question: '¿Cómo agrego más usuarios?', answer: 'Ve al módulo Usuarios y haz clic en "Nuevo Usuario". Puedes crear cuentas para trabajadores, veterinarios o técnicos con diferentes niveles de acceso.' }
    ]
  },
  {
    id: 'animales',
    title: 'Gestión de Animales',
    description: 'Registro, edición y organización del inventario ganadero',
    duration: '15 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Animales es el corazón de GanaderoPro. Aquí registrarás cada animal de tu finca con toda su información: identificación, genealogía, estado reproductivo y más. Un buen registro de animales es la base para todas las demás funciones del sistema.',
    steps: [
      {
        title: 'Acceder al módulo de Animales',
        content: 'Desde el menú lateral, haz clic en "Animales". Verás una tabla con todos tus animales registrados. Si es la primera vez, la lista estará vacía.',
      },
      {
        title: 'Registrar un nuevo animal',
        content: 'Haz clic en el botón "Nuevo Animal". Completa el formulario con:\n• Número de identificación (arete o tatuaje)\n• Nombre (opcional)\n• Sexo: Macho o Hembra\n• Categoría: Vaca, Toro, Novilla, Novillo, Ternera, Ternero, Becerra, Becerro\n• Fecha de nacimiento\n• Raza\n• Color\n• Peso actual (si lo conoces)',
        tip: 'El número de identificación debe ser único. Usa el mismo formato para todos tus animales.'
      },
      {
        title: 'Agregar información genealógica',
        content: 'En el formulario de registro, puedes seleccionar el padre y la madre del animal si ya están registrados en el sistema. Esto es útil para el módulo de Genética y para calcular consanguinidad.',
      },
      {
        title: 'Asignar a un lote',
        content: 'Selecciona el lote al que pertenece el animal (ejemplo: "Vacas en producción"). Esto te permite filtrar y gestionar grupos de animales fácilmente.',
      },
      {
        title: 'Ver y editar un animal',
        content: 'Haz clic en cualquier fila de la tabla para ver el detalle completo del animal. Desde ahí puedes editar su información, ver su historial de eventos, pesajes, producciones y más.',
      },
      {
        title: 'Usar filtros y búsqueda',
        content: 'Utiliza la barra de búsqueda para encontrar animales por número o nombre. Los filtros te permiten ver solo vacas, solo machos, por lote, por estado (activo, vendido, etc.).',
        tip: 'Puedes exportar la lista filtrada a Excel haciendo clic en "Exportar".'
      },
      {
        title: 'Registrar bajas',
        content: 'Cuando un animal sale de tu finca (venta, muerte, descarte), actualiza su estado. Haz clic en el animal, luego en "Cambiar Estado" y selecciona el motivo. El animal quedará en el historial pero no aparecerá en los conteos activos.',
        warning: 'Una vez marcado como vendido o muerto, el animal no puede volver a estado activo.'
      },
      {
        title: 'Escanear código de animal',
        content: 'Si tienes un lector de códigos o usas códigos QR, puedes escanear directamente desde el botón "Escanear" para encontrar rápidamente un animal o registrar uno nuevo.',
      }
    ],
    commonQuestions: [
      { question: '¿Puedo importar animales desde Excel?', answer: 'Sí, ve a Animales → Importar y descarga la plantilla de Excel. Complétala con tus datos y súbela al sistema.' },
      { question: '¿Qué pasa si registro mal un animal?', answer: 'Puedes editar toda la información del animal en cualquier momento. Solo el número de identificación no puede cambiarse una vez creado.' },
      { question: '¿Cómo veo el historial completo de un animal?', answer: 'Haz clic en el animal y ve a la pestaña "Historial". Ahí verás todos los eventos: pesajes, vacunas, tratamientos, reproducciones, etc.' }
    ]
  },
  {
    id: 'produccion-leche',
    title: 'Producción de Leche',
    description: 'Registro diario de ordeños y análisis de producción',
    duration: '12 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Producción de Leche te permite llevar un registro detallado de cada ordeño. Podrás ver la producción por animal, por día, detectar vacas de baja producción y analizar tendencias a lo largo del tiempo.',
    steps: [
      {
        title: 'Acceder a Producción de Leche',
        content: 'Desde el menú lateral, haz clic en "Producción de Leche". Verás un resumen de la producción actual y un listado de registros.',
      },
      {
        title: 'Registrar un ordeño',
        content: 'Haz clic en "Nuevo Registro". Selecciona la vaca, la fecha y registra los litros producidos. Puedes registrar producción de mañana, tarde y/o noche por separado.',
        tip: 'Registra los ordeños al momento o al final del día para no olvidar datos.'
      },
      {
        title: 'Agregar calidad de leche (opcional)',
        content: 'Si realizas análisis de leche, puedes registrar: porcentaje de grasa, porcentaje de proteína y conteo de células somáticas (CCS). Estos datos son útiles para detectar mastitis y evaluar calidad.',
      },
      {
        title: 'Ver producción por animal',
        content: 'En la pestaña "Por Animal" verás la producción acumulada de cada vaca. Puedes ordenar por mayor o menor producción para identificar tus mejores productoras.',
      },
      {
        title: 'Analizar tendencias',
        content: 'Los gráficos te muestran la evolución de la producción a lo largo del tiempo. Identifica patrones estacionales, efectos del cambio de alimentación o caídas de producción.',
      },
      {
        title: 'Ver ranking de producción',
        content: 'La tabla de ranking muestra tus vacas ordenadas de mayor a menor producción. Usa esto para tomar decisiones sobre descarte o premiación.',
      }
    ],
    commonQuestions: [
      { question: '¿Puedo registrar la producción de todo el hato junto?', answer: 'Sí, puedes registrar por lote completo ingresando el total de litros y el número de vacas. El sistema distribuirá el promedio.' },
      { question: '¿Cómo detecto vacas con mastitis?', answer: 'Un aumento en el conteo de células somáticas (CCS) puede indicar mastitis. El sistema te alertará cuando detecte valores anormales.' }
    ]
  },
  {
    id: 'produccion-carne',
    title: 'Producción de Carne',
    description: 'Control de peso, ganancia diaria y engorde',
    duration: '12 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Producción de Carne está diseñado para fincas de engorde o doble propósito. Registra pesajes periódicos y el sistema calculará automáticamente la ganancia diaria de peso (GDP), permitiéndote evaluar el rendimiento de cada animal.',
    steps: [
      {
        title: 'Acceder a Producción de Carne',
        content: 'Desde el menú lateral, haz clic en "Producción de Carne". Verás un resumen del inventario de engorde y los últimos pesajes registrados.',
      },
      {
        title: 'Registrar un pesaje',
        content: 'Haz clic en "Nuevo Pesaje". Selecciona el animal (o escanea su código), ingresa la fecha y el peso en kilogramos. El sistema calculará automáticamente la ganancia desde el último pesaje.',
        tip: 'Pesa los animales siempre a la misma hora y condiciones para datos más precisos.'
      },
      {
        title: 'Registrar pesaje por lote',
        content: 'Si pesas un grupo completo, usa "Pesaje de Lote". Ingresa cada animal con su peso y el sistema registrará todos de una vez.',
      },
      {
        title: 'Ver ganancia diaria de peso (GDP)',
        content: 'La GDP se calcula dividiendo el aumento de peso entre los días transcurridos. Una GDP de 0.8-1.2 kg/día es buena en engorde intensivo.',
        tip: 'GDP baja puede indicar problemas de salud, alimentación o parásitos.'
      },
      {
        title: 'Evaluar condición corporal',
        content: 'Al registrar un pesaje, puedes agregar la puntuación de condición corporal (1-5). Esto te ayuda a decidir cuándo un animal está listo para venta.',
      },
      {
        title: 'Analizar por lote',
        content: 'La vista por lote te muestra el peso promedio, GDP promedio y distribución de pesos del grupo. Útil para planificar ventas.',
      },
      {
        title: 'Proyectar peso a fecha futura',
        content: 'Con base en la GDP actual, el sistema puede proyectar cuándo un animal alcanzará el peso objetivo de venta.',
      }
    ],
    commonQuestions: [
      { question: '¿Cada cuánto debo pesar los animales?', answer: 'Idealmente cada 2-4 semanas para tener datos confiables de GDP. Al menos una vez al mes.' },
      { question: '¿Qué hago si un animal pierde peso?', answer: 'Revisa su salud, alimentación y busca parásitos. El sistema te alertará cuando detecte pérdida de peso.' }
    ]
  },
  {
    id: 'reproduccion',
    title: 'Gestión Reproductiva',
    description: 'Inseminaciones, diagnósticos de preñez y partos',
    duration: '18 min',
    difficulty: 'intermedio',
    videoPlaceholder: true,
    introduction: 'El módulo de Reproducción es esencial para maximizar la eficiencia reproductiva de tu hato. Registra calores, inseminaciones, diagnósticos de preñez, partos y más. El sistema calculará indicadores como intervalo entre partos y tasa de preñez.',
    steps: [
      {
        title: 'Acceder al módulo de Reproducción',
        content: 'Desde el menú lateral, haz clic en "Reproducción". Verás un resumen del estado reproductivo del hato y los próximos eventos programados.',
      },
      {
        title: 'Registrar detección de celo',
        content: 'Cuando detectes una hembra en celo, haz clic en "Registrar Evento" → "Celo Detectado". Ingresa la fecha, la hembra y observaciones. Esto te ayudará a programar la inseminación.',
        tip: 'Registra el celo aunque no vayas a inseminar. El historial de ciclos es valioso.'
      },
      {
        title: 'Registrar inseminación o monta',
        content: 'Haz clic en "Registrar Evento" → "Inseminación" o "Monta Natural". Selecciona la hembra, la fecha, y el toro o código de semen utilizado. Agrega datos del técnico si aplica.',
      },
      {
        title: 'Programar diagnóstico de preñez',
        content: 'El sistema te recordará cuándo hacer el diagnóstico (generalmente 30-45 días post-inseminación). Ve a Alertas para ver las vacas pendientes de chequeo.',
      },
      {
        title: 'Registrar resultado de diagnóstico',
        content: 'Después del chequeo veterinario, registra el resultado: "Preñada" o "Vacía". Si está preñada, el sistema calculará la fecha probable de parto.',
        warning: 'No olvides registrar las vacías para reprogramar servicios.'
      },
      {
        title: 'Ver calendario de partos',
        content: 'El calendario muestra las fechas esperadas de parto. Prepárate con anticipación revisando qué vacas están próximas a parir.',
      },
      {
        title: 'Registrar parto',
        content: 'Cuando ocurra el parto, registra: fecha, tipo de parto (normal, asistido, cesárea), sexo de la cría, peso al nacer. El sistema creará automáticamente el registro de la cría si lo deseas.',
        tip: 'Registra también los partos con problemas para identificar vacas con dificultades.'
      },
      {
        title: 'Ver indicadores reproductivos',
        content: 'Los indicadores clave son:\n• Tasa de preñez: % de vacas preñadas vs servidas\n• Intervalo entre partos (IEP): días promedio entre partos\n• Días abiertos: días desde el parto hasta nueva preñez\n• Servicios por concepción: inseminaciones necesarias para preñar',
      }
    ],
    commonQuestions: [
      { question: '¿Cuál es un buen intervalo entre partos?', answer: 'El objetivo es 365-400 días. Más de 420 días indica problemas reproductivos.' },
      { question: '¿Cómo registro un aborto?', answer: 'Ve a Registrar Evento → Aborto. Ingresa la fecha y las posibles causas. La vaca volverá a estado "vacía".' },
      { question: '¿Puedo ver el historial reproductivo completo?', answer: 'Sí, haz clic en la hembra y ve a la pestaña "Historial Reproductivo" para ver todos sus ciclos, servicios y partos.' }
    ]
  },
  {
    id: 'salud',
    title: 'Control Sanitario',
    description: 'Vacunaciones, tratamientos y eventos de salud',
    duration: '15 min',
    difficulty: 'intermedio',
    videoPlaceholder: true,
    introduction: 'El módulo de Salud te permite llevar un control completo de vacunas, tratamientos, enfermedades y eventos sanitarios. Programa vacunaciones masivas, registra tratamientos individuales y mantén un historial médico de cada animal.',
    steps: [
      {
        title: 'Acceder al módulo de Salud',
        content: 'Desde el menú lateral, haz clic en "Salud". Verás las alertas de salud, vacunas pendientes y un resumen del estado sanitario del hato.',
      },
      {
        title: 'Ver alertas de salud',
        content: 'Las alertas te muestran: vacunas próximas a vencer, tratamientos en curso, animales en período de retiro y eventos pendientes. Revisa esta sección diariamente.',
      },
      {
        title: 'Registrar una vacunación',
        content: 'Haz clic en "Nueva Vacunación". Puedes vacunar un animal individual o un lote completo. Ingresa: vacuna aplicada, fecha, dosis, lote de vacuna y próxima aplicación.',
        tip: 'Guarda el número de lote de la vacuna por trazabilidad.'
      },
      {
        title: 'Programar calendario de vacunación',
        content: 'En la pestaña "Calendario", configura el plan de vacunación anual. El sistema te recordará cuándo toca cada vacuna según la edad y categoría del animal.',
      },
      {
        title: 'Registrar un evento de salud',
        content: 'Cuando un animal se enferme, haz clic en "Nuevo Evento de Salud". Registra: síntomas, diagnóstico, tratamiento aplicado, medicamentos y días de retiro.',
        warning: 'Recuerda calcular correctamente los días de retiro antes de vender leche o carne.'
      },
      {
        title: 'Seguimiento de tratamientos',
        content: 'Para tratamientos de varios días, el sistema te recordará las aplicaciones pendientes. Marca cada dosis aplicada para llevar el control.',
      },
      {
        title: 'Registrar costos de salud',
        content: 'Al registrar vacunas o tratamientos, ingresa el costo. Esto se reflejará en el módulo de Costos para calcular el gasto sanitario por animal.',
      },
      {
        title: 'Usar IA para predicción de salud',
        content: 'En la pestaña "Predicción IA", el sistema analiza patrones históricos para identificar animales en riesgo de enfermarse. Revisa las alertas preventivas.',
      }
    ],
    commonQuestions: [
      { question: '¿Cómo registro una desparasitación?', answer: 'Usa "Nuevo Evento de Salud" con tipo "Desparasitación". Ingresa el producto, dosis y fecha de próxima aplicación.' },
      { question: '¿Puedo ver el historial médico completo?', answer: 'Sí, haz clic en el animal y ve a "Historial de Salud" para ver todas las vacunas, tratamientos y eventos.' },
      { question: '¿Qué es el período de retiro?', answer: 'Es el tiempo que debe pasar después de aplicar un medicamento antes de poder vender la leche o carne del animal.' }
    ]
  },
  {
    id: 'alimentacion',
    title: 'Alimentación y Dietas',
    description: 'Inventario de alimentos, formulación de dietas y consumo',
    duration: '15 min',
    difficulty: 'intermedio',
    videoPlaceholder: true,
    introduction: 'El módulo de Alimentación te permite gestionar tu inventario de alimentos, formular dietas balanceadas y registrar el consumo diario. Optimiza la nutrición de tu ganado mientras controlas los costos de alimentación.',
    steps: [
      {
        title: 'Acceder al módulo de Alimentación',
        content: 'Desde el menú lateral, haz clic en "Alimentación". Verás pestañas para Inventario, Dietas y Consumo.',
      },
      {
        title: 'Registrar alimentos en inventario',
        content: 'En la pestaña "Inventario", haz clic en "Nuevo Alimento". Registra: nombre (ej: silo de maíz), categoría, unidad de medida, cantidad en stock, costo por unidad y stock mínimo para alertas.',
        tip: 'Incluye la información nutricional (proteína, energía, FDN) si la conoces.'
      },
      {
        title: 'Crear una dieta',
        content: 'Ve a la pestaña "Dietas" y haz clic en "Nueva Dieta". Dale un nombre (ej: "Vacas alta producción"), selecciona los ingredientes y sus cantidades. El sistema calculará el aporte nutricional total.',
      },
      {
        title: 'Asignar dieta a un lote',
        content: 'Cada dieta puede asignarse a un lote específico. Así puedes dar diferentes dietas a vacas en producción, secas, novillas, etc.',
      },
      {
        title: 'Registrar consumo diario',
        content: 'En la pestaña "Consumo", registra cuánto alimento se usó cada día por lote. Esto descuenta automáticamente del inventario y calcula el costo de alimentación.',
        tip: 'Puedes programar consumos fijos diarios para que el sistema los registre automáticamente.'
      },
      {
        title: 'Ver alertas de stock bajo',
        content: 'Cuando un alimento baje del stock mínimo, aparecerá una alerta. Planifica tus compras con anticipación.',
      },
      {
        title: 'Analizar costo por animal',
        content: 'Los reportes te muestran el costo de alimentación por animal o por litro de leche producido. Compara diferentes dietas para optimizar.',
      },
      {
        title: 'Usar optimizador IA',
        content: 'El optimizador de IA analiza tus dietas actuales y sugiere ajustes para mejorar la relación costo/producción basándose en el rendimiento de tus animales.',
      }
    ],
    commonQuestions: [
      { question: '¿Cómo calculo la materia seca?', answer: 'Ingresa el porcentaje de materia seca de cada alimento. El sistema calculará el consumo de MS total de la dieta.' },
      { question: '¿Puedo copiar una dieta existente?', answer: 'Sí, abre la dieta y haz clic en "Duplicar". Modifica los ingredientes según necesites.' }
    ]
  },
  {
    id: 'praderas',
    title: 'Gestión de Praderas',
    description: 'Potreros, rotación y medición de forraje',
    duration: '12 min',
    difficulty: 'intermedio',
    videoPlaceholder: true,
    introduction: 'El módulo de Praderas te ayuda a gestionar tus potreros eficientemente. Registra cada potrero, programa rotaciones, mide la disponibilidad de forraje y maximiza el aprovechamiento del pasto.',
    steps: [
      {
        title: 'Acceder al módulo de Praderas',
        content: 'Desde el menú lateral, haz clic en "Praderas". Verás un mapa o lista de tus potreros con su estado actual.',
      },
      {
        title: 'Registrar un potrero',
        content: 'Haz clic en "Nuevo Potrero". Ingresa: nombre, área en hectáreas, tipo de pasto, capacidad de carga, si tiene riego y días de descanso recomendados.',
      },
      {
        title: 'Ver estado de potreros',
        content: 'Cada potrero tiene un estado: Ocupado (con animales), En descanso (recuperándose), Disponible (listo para usar). Los colores te ayudan a identificarlos rápido.',
      },
      {
        title: 'Iniciar una rotación',
        content: 'Haz clic en "Iniciar Rotación". Selecciona el potrero destino, el lote de animales, fecha de entrada y forraje disponible estimado.',
      },
      {
        title: 'Finalizar rotación',
        content: 'Cuando muevas los animales a otro potrero, finaliza la rotación. Registra el forraje residual para calcular el consumo. El potrero pasará a "En descanso".',
        tip: 'Anota la fecha para que el sistema calcule los días de ocupación.'
      },
      {
        title: 'Medir disponibilidad de forraje',
        content: 'Registra mediciones periódicas de altura de pasto o kg/ha. Esto te ayuda a decidir cuándo entrar y salir de cada potrero.',
      },
      {
        title: 'Ver historial del potrero',
        content: 'Cada potrero tiene un historial de rotaciones, mediciones y días de descanso. Analiza cuáles potreros son más productivos.',
      },
      {
        title: 'Programar descansos',
        content: 'El sistema te alerta cuando un potrero cumple sus días de descanso mínimo y está listo para recibir animales nuevamente.',
      }
    ],
    commonQuestions: [
      { question: '¿Cuántos días de descanso necesita un potrero?', answer: 'Depende del tipo de pasto y clima. Generalmente 25-45 días. Consulta con un agrónomo para tu zona.' },
      { question: '¿Cómo calculo la carga animal?', answer: 'El sistema sugiere la carga basándose en el área y el forraje disponible. Generalmente se mide en UGG/ha (Unidades de Gran Ganado por hectárea).' }
    ]
  },
  {
    id: 'genetica',
    title: 'Genética y Mejoramiento',
    description: 'Evaluaciones genéticas, pedigree y cruzamientos',
    duration: '15 min',
    difficulty: 'avanzado',
    videoPlaceholder: true,
    introduction: 'El módulo de Genética te permite evaluar el mérito genético de tus animales, visualizar árboles genealógicos, calcular consanguinidad y planificar cruzamientos para mejorar tu hato generación tras generación.',
    steps: [
      {
        title: 'Acceder al módulo de Genética',
        content: 'Desde el menú lateral, haz clic en "Genética". Verás indicadores genéticos del hato y herramientas de análisis.',
      },
      {
        title: 'Ver árbol genealógico',
        content: 'Selecciona un animal y haz clic en "Ver Pedigree". Verás el árbol de hasta 4 generaciones mostrando padres, abuelos y bisabuelos.',
        tip: 'Completa la genealogía de tus animales para mejores análisis.'
      },
      {
        title: 'Registrar evaluación genética',
        content: 'Haz clic en "Nueva Evaluación". Ingresa índices como: valor genético para leche, carne, fertilidad, facilidad de parto, conformación, etc.',
      },
      {
        title: 'Calcular consanguinidad',
        content: 'La calculadora de consanguinidad te muestra el coeficiente de endogamia al cruzar dos animales. Evita cruzamientos con más del 6.25% de consanguinidad.',
        warning: 'Alta consanguinidad puede causar problemas de fertilidad y vigor.'
      },
      {
        title: 'Ver sugerencias de cruzamiento',
        content: 'El sistema analiza tu hato y sugiere los mejores cruzamientos basándose en complementariedad genética, evitando consanguinidad y maximizando mejoras.',
      },
      {
        title: 'Comparar toros/semen',
        content: 'Compara diferentes opciones de toros o semen para elegir el más adecuado según tus objetivos de mejoramiento.',
      },
      {
        title: 'Analizar progreso genético',
        content: 'Los gráficos muestran la evolución de índices genéticos a lo largo de las generaciones. Verifica que tu programa de mejoramiento esté funcionando.',
      }
    ],
    commonQuestions: [
      { question: '¿Qué es el mérito genético?', answer: 'Es una estimación del valor de un animal como reproductor, basada en su rendimiento y el de sus parientes.' },
      { question: '¿Cómo empiezo un programa de mejoramiento?', answer: 'Define tus objetivos (más leche, más carne, mejor fertilidad), evalúa tu hato actual y selecciona reproductores superiores.' }
    ]
  },
  {
    id: 'costos',
    title: 'Gestión Financiera',
    description: 'Ingresos, gastos, rentabilidad y proyecciones',
    duration: '15 min',
    difficulty: 'intermedio',
    videoPlaceholder: true,
    introduction: 'El módulo de Costos te da una visión completa de las finanzas de tu finca. Registra ingresos por venta de leche, carne y animales, controla gastos por categoría y analiza la rentabilidad de tu operación.',
    steps: [
      {
        title: 'Acceder al módulo de Costos',
        content: 'Desde el menú lateral, haz clic en "Costos". Verás un resumen de ingresos, gastos y el balance del período.',
      },
      {
        title: 'Registrar un ingreso',
        content: 'Haz clic en "Nueva Transacción" → "Ingreso". Selecciona la categoría: venta de leche, venta de animales, otros. Ingresa monto, fecha y descripción.',
      },
      {
        title: 'Registrar un gasto',
        content: 'Haz clic en "Nueva Transacción" → "Gasto". Categorías comunes: alimentación, sanidad, mano de obra, mantenimiento, insumos, servicios.',
        tip: 'Categoriza correctamente para tener buenos reportes.'
      },
      {
        title: 'Asociar costos a animales',
        content: 'Puedes asociar gastos específicos a un animal o lote. Esto te permite calcular el costo de producción por animal.',
      },
      {
        title: 'Ver análisis de costos',
        content: 'La pestaña "Análisis" muestra gráficos de distribución de gastos, comparativas mensuales y tendencias a lo largo del tiempo.',
      },
      {
        title: 'Calcular costo por litro/kilo',
        content: 'El sistema calcula automáticamente el costo de producir un litro de leche o un kilo de carne basándose en tus gastos y producción.',
      },
      {
        title: 'Crear presupuestos',
        content: 'Planifica tus finanzas creando presupuestos por categoría. El sistema te alertará cuando superes lo presupuestado.',
      },
      {
        title: 'Ver proyecciones',
        content: 'Las proyecciones financieras te muestran escenarios futuros basados en tu historial. Útil para planificar inversiones.',
      }
    ],
    commonQuestions: [
      { question: '¿Cómo calculo la rentabilidad?', answer: 'Rentabilidad = (Ingresos - Gastos) / Gastos × 100. El sistema lo calcula automáticamente.' },
      { question: '¿Puedo exportar para mi contador?', answer: 'Sí, exporta las transacciones a Excel con todos los detalles para contabilidad.' }
    ]
  },
  {
    id: 'insumos',
    title: 'Inventario de Insumos',
    description: 'Control de stock de medicamentos, herramientas y materiales',
    duration: '10 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Insumos te permite controlar el inventario de medicamentos, vacunas, herramientas y cualquier material que uses en tu finca. Recibe alertas de stock bajo y vencimientos próximos.',
    steps: [
      {
        title: 'Acceder al módulo de Insumos',
        content: 'Desde el menú lateral, haz clic en "Insumos". Verás el inventario actual organizado por categorías.',
      },
      {
        title: 'Agregar un insumo',
        content: 'Haz clic en "Nuevo Insumo". Ingresa: nombre, categoría (medicamento, vacuna, herramienta, etc.), unidad, stock actual, stock mínimo, proveedor y ubicación.',
      },
      {
        title: 'Registrar lotes con vencimiento',
        content: 'Para medicamentos y vacunas, registra cada lote con su fecha de vencimiento. El sistema te alertará antes de que venzan.',
        warning: 'No uses productos vencidos. Pueden ser inefectivos o peligrosos.'
      },
      {
        title: 'Registrar entradas',
        content: 'Cuando compres insumos, registra la entrada. Esto aumenta el stock y guarda el historial de compras con costos.',
      },
      {
        title: 'Registrar salidas/uso',
        content: 'Cuando uses un insumo, registra la salida. Puedes asociarlo a un animal o lote específico para trazabilidad.',
      },
      {
        title: 'Ver alertas de stock',
        content: 'Las alertas te muestran: productos bajo stock mínimo y productos próximos a vencer. Revisa frecuentemente.',
      },
      {
        title: 'Ver kardex de movimientos',
        content: 'El kardex muestra todas las entradas y salidas de cada insumo. Útil para auditorías y control.',
      }
    ],
    commonQuestions: [
      { question: '¿Puedo escanear códigos de barras?', answer: 'Sí, usa el escáner para registrar entradas y salidas más rápido.' },
      { question: '¿Cómo organizo por ubicación?', answer: 'Cada insumo tiene un campo de ubicación. Puedes filtrar por bodega, refrigerador, etc.' }
    ]
  },
  {
    id: 'reportes',
    title: 'Reportes y Análisis',
    description: 'Generación de informes y exportación de datos',
    duration: '12 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Reportes te permite generar informes detallados de todas las áreas de tu finca. Exporta a PDF o Excel para compartir con socios, bancos o para tus registros.',
    steps: [
      {
        title: 'Acceder al módulo de Reportes',
        content: 'Desde el menú lateral, haz clic en "Reportes". Verás los tipos de reportes disponibles organizados por categoría.',
      },
      {
        title: 'Seleccionar tipo de reporte',
        content: 'Elige el reporte que necesitas: inventario de animales, producción de leche, movimientos financieros, estado sanitario, etc.',
      },
      {
        title: 'Configurar filtros',
        content: 'Antes de generar, configura los filtros: rango de fechas, lotes específicos, categorías de animales, etc. Esto te da reportes más precisos.',
      },
      {
        title: 'Previsualizar el reporte',
        content: 'Haz clic en "Generar" para ver la previsualización. Revisa que los datos sean correctos antes de exportar.',
      },
      {
        title: 'Exportar a PDF',
        content: 'Haz clic en "Exportar PDF" para descargar un documento formateado listo para imprimir o compartir.',
      },
      {
        title: 'Exportar a Excel',
        content: 'Haz clic en "Exportar Excel" para descargar los datos en formato de hoja de cálculo. Útil para análisis adicionales.',
      },
      {
        title: 'Configurar reportes automáticos',
        content: 'En la pestaña "Automáticos", programa reportes que se generen y envíen por email periódicamente (diario, semanal, mensual).',
      },
      {
        title: 'Ver historial de reportes',
        content: 'Los reportes generados se guardan en el historial para consulta futura sin tener que regenerarlos.',
      }
    ],
    commonQuestions: [
      { question: '¿Puedo personalizar el formato del reporte?', answer: 'Puedes elegir qué columnas incluir y el orden. Los reportes incluyen el logo de tu finca si lo configuraste.' },
      { question: '¿Cómo comparto un reporte con mi veterinario?', answer: 'Exporta a PDF y envíalo por email o WhatsApp. También puedes dar acceso de solo lectura al veterinario.' }
    ]
  },
  {
    id: 'usuarios',
    title: 'Gestión de Usuarios',
    description: 'Crear usuarios, roles y permisos',
    duration: '8 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Usuarios te permite crear cuentas para tu equipo de trabajo. Cada persona puede tener diferentes niveles de acceso según su rol en la finca.',
    steps: [
      {
        title: 'Acceder al módulo de Usuarios',
        content: 'Desde el menú lateral, haz clic en "Usuarios". Solo los administradores pueden acceder a este módulo.',
      },
      {
        title: 'Crear un nuevo usuario',
        content: 'Haz clic en "Nuevo Usuario". Ingresa: nombre, email, teléfono y una contraseña temporal. El usuario recibirá un email para confirmar su cuenta.',
      },
      {
        title: 'Asignar un rol',
        content: 'Los roles disponibles son:\n• Administrador: Acceso total\n• Ganadero: Gestión de animales y producción\n• Técnico: Registro de datos operativos\n• Veterinario: Acceso a salud y reproducción',
      },
      {
        title: 'Configurar permisos específicos',
        content: 'Además del rol, puedes dar o quitar permisos específicos por módulo. Por ejemplo, un técnico puede tener permiso de lectura pero no de eliminar.',
      },
      {
        title: 'Ver actividad del usuario',
        content: 'El log de actividad muestra todas las acciones realizadas por cada usuario: qué registró, editó o eliminó, y cuándo.',
      },
      {
        title: 'Bloquear/desbloquear usuario',
        content: 'Si alguien deja de trabajar en la finca, puedes bloquear su cuenta sin eliminarla. Sus registros históricos se mantienen.',
      }
    ],
    commonQuestions: [
      { question: '¿Cuántos usuarios puedo crear?', answer: 'Depende de tu plan. Consulta en Configuración → Mi Plan.' },
      { question: '¿Cómo reseteo la contraseña de alguien?', answer: 'En el perfil del usuario, haz clic en "Resetear Contraseña". Le llegará un email con instrucciones.' }
    ]
  },
  {
    id: 'trazabilidad',
    title: 'Trazabilidad e Intercambio',
    description: 'Hoja de vida del animal y exportación de datos',
    duration: '10 min',
    difficulty: 'intermedio',
    videoPlaceholder: true,
    introduction: 'El módulo de Trazabilidad te permite generar la hoja de vida completa de cada animal y preparar documentación para venta, transporte o inspecciones oficiales.',
    steps: [
      {
        title: 'Acceder al módulo de Intercambio',
        content: 'Desde el menú lateral, haz clic en "Intercambio / Trazabilidad". Aquí gestionas la documentación oficial de tus animales.',
      },
      {
        title: 'Generar hoja de vida',
        content: 'Selecciona un animal y haz clic en "Generar Hoja de Vida". Esto crea un documento con todo su historial: origen, vacunas, tratamientos, producciones, genealogía.',
      },
      {
        title: 'Exportar para venta',
        content: 'Al vender un animal, genera el documento de trazabilidad que incluye: identificación, estado sanitario, últimas vacunas y código de verificación.',
      },
      {
        title: 'Registrar movimientos',
        content: 'Documenta cuando un animal entra o sale de tu finca: fecha, origen/destino, motivo (compra, venta, traslado).',
      },
      {
        title: 'Ver línea de tiempo',
        content: 'La línea de tiempo muestra cronológicamente todos los eventos importantes en la vida del animal. Ideal para auditorías.',
      },
      {
        title: 'Verificar código de trazabilidad',
        content: 'Cada documento tiene un código único verificable. Compradores o inspectores pueden validar la autenticidad.',
      }
    ],
    commonQuestions: [
      { question: '¿El documento es válido oficialmente?', answer: 'El documento sirve como registro interno. Para documentos oficiales, debes cumplir con la normativa de tu país (ICA en Colombia, por ejemplo).' },
      { question: '¿Puedo importar animales con su historial?', answer: 'Sí, si el vendedor te proporciona el archivo de trazabilidad, puedes importarlo al sistema.' }
    ]
  },
  {
    id: 'app-movil',
    title: 'Aplicación Móvil',
    description: 'Uso del sistema desde el campo sin conexión',
    duration: '8 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'La aplicación móvil te permite usar GanaderoPro desde tu celular o tablet, incluso sin conexión a internet. Registra datos en el campo y se sincronizarán automáticamente cuando tengas conexión.',
    steps: [
      {
        title: 'Instalar la aplicación',
        content: 'Desde tu celular, ve al módulo "App Móvil" en el menú. Haz clic en "Instalar" y sigue las instrucciones para agregar la app a tu pantalla de inicio.',
        tip: 'También puedes instalar como PWA desde el navegador: Menú → "Agregar a pantalla de inicio".'
      },
      {
        title: 'Iniciar sesión',
        content: 'Abre la app e inicia sesión con tu email y contraseña habituales. La primera vez, se descargarán los datos de tu finca.',
      },
      {
        title: 'Usar sin conexión',
        content: 'La app funciona sin internet. Puedes registrar pesajes, eventos de salud, producciones, etc. Los datos se guardan localmente.',
      },
      {
        title: 'Sincronizar datos',
        content: 'Cuando recuperes conexión, la app sincroniza automáticamente. También puedes forzar sincronización desde el botón "Sincronizar".',
        warning: 'Si la app no sincroniza, los datos solo existen en tu celular. Sincroniza frecuentemente.'
      },
      {
        title: 'Escanear animales',
        content: 'Usa la cámara para escanear códigos QR o de barras de los animales. La app abrirá directamente la ficha del animal.',
      },
      {
        title: 'Registrar con voz (próximamente)',
        content: 'Podrás registrar información hablando. "Registrar 25 litros de leche para la vaca 123".',
      }
    ],
    commonQuestions: [
      { question: '¿Funciona en iPhone y Android?', answer: 'Sí, la app funciona en ambos sistemas. Es una app web progresiva (PWA) que se instala desde el navegador.' },
      { question: '¿Cuánto espacio ocupa?', answer: 'Muy poco. La app es ligera y los datos se almacenan principalmente en la nube.' },
      { question: '¿Qué pasa si pierdo el celular?', answer: 'Tus datos están seguros en la nube. Solo debes iniciar sesión en otro dispositivo.' }
    ]
  },
  {
    id: 'configuracion',
    title: 'Configuración del Sistema',
    description: 'Personalización, alertas y preferencias',
    duration: '10 min',
    difficulty: 'básico',
    videoPlaceholder: true,
    introduction: 'El módulo de Configuración te permite personalizar GanaderoPro según tus necesidades. Configura alertas, preferencias de visualización, datos de tu finca y opciones de respaldo.',
    steps: [
      {
        title: 'Acceder a Configuración',
        content: 'Desde el menú lateral, haz clic en "Configuración". Verás secciones para diferentes tipos de ajustes.',
      },
      {
        title: 'Editar perfil de finca',
        content: 'En "Perfil", actualiza: nombre de finca, ubicación, tipo de producción, logo y datos de contacto.',
      },
      {
        title: 'Configurar alertas',
        content: 'En "Alertas", activa/desactiva las notificaciones que quieres recibir: vacunas, partos próximos, stock bajo, vencimientos, etc. Elige si las recibes por email y/o en la app.',
      },
      {
        title: 'Personalizar unidades',
        content: 'Configura las unidades de medida que prefieres: kilogramos o libras, hectáreas o cuadras, litros o galones.',
      },
      {
        title: 'Configurar categorías',
        content: 'Personaliza las categorías de animales, razas disponibles, tipos de eventos y otras listas según tu finca.',
      },
      {
        title: 'Gestionar backup',
        content: 'En "Backup", puedes exportar todos tus datos en un archivo JSON. Esto sirve como respaldo adicional.',
        tip: 'Descarga un backup mensualmente y guárdalo en un lugar seguro.'
      },
      {
        title: 'Ver información del plan',
        content: 'En "Mi Plan", ve qué funciones tienes disponibles, cuántos usuarios puedes crear y cómo actualizar tu suscripción.',
      }
    ],
    commonQuestions: [
      { question: '¿Puedo cambiar el idioma?', answer: 'Actualmente el sistema está en español. Próximamente estará disponible en otros idiomas.' },
      { question: '¿Cómo cambio mi contraseña?', answer: 'Ve a Configuración → Seguridad → Cambiar Contraseña.' }
    ]
  }
];

interface TutorialContentProps {
  moduleId: string;
  onBack: () => void;
}

const TutorialContent = ({ moduleId, onBack }: TutorialContentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tutorial = moduleTutorials.find(t => t.id === moduleId);

  if (!tutorial) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Tutorial no encontrado</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleCompleteStep = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const progress = (completedSteps.length / tutorial.steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{tutorial.title}</h2>
          <p className="text-muted-foreground">{tutorial.description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{tutorial.duration}</span>
          <Badge 
            variant={tutorial.difficulty === 'básico' ? 'secondary' : tutorial.difficulty === 'intermedio' ? 'default' : 'destructive'}
          >
            {tutorial.difficulty}
          </Badge>
        </div>
      </div>

      {/* Video Placeholder */}
      {tutorial.videoPlaceholder && (
        <Card className="bg-muted/50">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Video Tutorial</h3>
              <p className="text-muted-foreground max-w-md">
                Próximamente estará disponible el video tutorial de este módulo. 
                Por ahora, sigue la guía paso a paso a continuación.
              </p>
              <Button variant="outline" className="mt-4" disabled>
                <PlayCircle className="mr-2 h-4 w-4" />
                Ver video (Próximamente)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Introducción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{tutorial.introduction}</p>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {completedSteps.length} de {tutorial.steps.length} pasos completados
        </span>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Guía Paso a Paso</CardTitle>
          <CardDescription>
            Sigue cada paso para aprender a usar este módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {tutorial.steps.map((step, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${
                    currentStep === index ? 'border-primary bg-primary/5' : 'border-border'
                  } ${completedSteps.includes(index) ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        completedSteps.includes(index) 
                          ? 'bg-green-500 text-white' 
                          : currentStep === index 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {completedSteps.includes(index) ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-muted-foreground whitespace-pre-line">{step.content}</p>
                      
                      {step.tip && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
                          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-700 dark:text-blue-300">{step.tip}</span>
                        </div>
                      )}
                      
                      {step.warning && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-amber-700 dark:text-amber-300">{step.warning}</span>
                        </div>
                      )}

                      {!completedSteps.includes(index) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCompleteStep(index)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar como completado
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Paso anterior
        </Button>
        <Button 
          onClick={() => {
            handleCompleteStep(currentStep);
            setCurrentStep(Math.min(tutorial.steps.length - 1, currentStep + 1));
          }}
          disabled={currentStep === tutorial.steps.length - 1}
        >
          Siguiente paso
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* FAQ */}
      {tutorial.commonQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {tutorial.commonQuestions.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { TutorialContent, moduleTutorials };
export type { ModuleTutorial };
