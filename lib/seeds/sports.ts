/**
 * Definiciones de seed por deporte.
 * Cada deporte incluye: terminología, horarios por defecto y ejercicios base.
 * Se aplica al crear una nueva organización en el onboarding (EPIC 8).
 */

export type SportKey = 'padel' | 'tenis' | 'futbol' | 'natacion' | 'baloncesto'

export type ExerciseSeed = {
  name:                 string
  theme:                'calentamiento' | 'tecnica' | 'tactica' | 'fisico' | 'vuelta_a_la_calma'
  objective:            string
  instructions:         string | null
  estimatedDurationMin: number
  materials:            string[]
}

export type SportSeed = {
  label:       string
  terminology: { resource: string; coach: string; player: string }
  settings: {
    openingTime: string  // "HH:MM"
    closingTime: string
  }
  exercises: ExerciseSeed[]
}

// ─────────────────────────────────────────────────────────────────────────────

export const SPORT_SEEDS: Record<SportKey, SportSeed> = {

  // ── PÁDEL ──────────────────────────────────────────────────────────────────
  padel: {
    label:       'Pádel',
    terminology: { resource: 'Cancha', coach: 'Entrenador', player: 'Jugador' },
    settings:    { openingTime: '08:00', closingTime: '22:00' },
    exercises: [
      {
        name: 'Calentamiento dinámico con raqueta',
        theme: 'calentamiento',
        objective: 'Activar articulaciones y musculatura antes de la sesión técnica',
        instructions: 'Movilidad de muñeca, codo y hombro con raqueta. Golpeos suaves contra la pared durante 5 minutos.',
        estimatedDurationMin: 10,
        materials: ['Raqueta', 'Pelota'],
      },
      {
        name: 'Carrera lateral y cambios de dirección',
        theme: 'calentamiento',
        objective: 'Elevar la frecuencia cardíaca y preparar la musculatura de piernas',
        instructions: 'Carrera lateral entre conos a lo ancho de la cancha. 3 series de 30 segundos con descanso de 15 s.',
        estimatedDurationMin: 8,
        materials: ['Conos'],
      },
      {
        name: 'Drive de control — zona defensiva',
        theme: 'tecnica',
        objective: 'Consolidar la mecánica de golpeo de drive en las 3 fases',
        instructions: 'Jugadores en zona defensiva. Peloteo cruzado manteniendo postura y punto de contacto correcto.',
        estimatedDurationMin: 15,
        materials: ['Raqueta', 'Pelota'],
      },
      {
        name: 'Bandeja desde posición de red',
        theme: 'tecnica',
        objective: 'Mejorar la bandeja como golpe de control y continuación del ataque',
        instructions: 'Entrenador alimenta globos. Jugador en posición de red ejecuta bandejas dirigidas a esquinas.',
        estimatedDurationMin: 15,
        materials: ['Raqueta', 'Pelota', 'Cesta de pelotas'],
      },
      {
        name: 'Globo defensivo — zona de cristal',
        theme: 'tecnica',
        objective: 'Salir de situaciones defensivas con globo largo y cruzado',
        instructions: 'Jugador en zona de cristal recibe pelota baja. Ejecuta globo cruzado profundo. 3 series de 10 repeticiones.',
        estimatedDurationMin: 12,
        materials: ['Raqueta', 'Pelota', 'Cesta de pelotas'],
      },
      {
        name: 'Juego de 4 puntos — defensa vs. ataque',
        theme: 'tactica',
        objective: 'Practicar transiciones defensa-ataque y comunicación de pareja',
        instructions: 'Pareja A defiende, pareja B ataca. Se juegan puntos cortos de 4 en 4. Rotación cada 8 puntos.',
        estimatedDurationMin: 20,
        materials: ['Raqueta', 'Pelota'],
      },
      {
        name: 'Situaciones de smash — toma de decisiones',
        theme: 'tactica',
        objective: 'Elegir entre remate directo, globo o bajada según la posición rival',
        instructions: 'Entrenador alimenta lob. Jugador decide el golpe de finalización según señal visual del entrenador.',
        estimatedDurationMin: 15,
        materials: ['Raqueta', 'Pelota', 'Cesta de pelotas'],
      },
      {
        name: 'Circuito de velocidad de reacción',
        theme: 'fisico',
        objective: 'Mejorar los tiempos de reacción y la explosividad en primeros pasos',
        instructions: '4 conos en X. A la señal del entrenador, el jugador toca el cono indicado y vuelve al centro. 3 series × 6 repeticiones.',
        estimatedDurationMin: 12,
        materials: ['Conos'],
      },
      {
        name: 'Vuelta a la calma — estiramientos de muñeca y hombro',
        theme: 'vuelta_a_la_calma',
        objective: 'Reducir la tensión muscular post-sesión y prevenir lesiones de sobreuso',
        instructions: 'Estiramiento isométrico de flexores y extensores de muñeca. Rotaciones de hombro. 30 s por posición.',
        estimatedDurationMin: 8,
        materials: [],
      },
    ],
  },

  // ── TENIS ──────────────────────────────────────────────────────────────────
  tenis: {
    label:       'Tenis',
    terminology: { resource: 'Cancha', coach: 'Entrenador', player: 'Tenista' },
    settings:    { openingTime: '07:00', closingTime: '21:00' },
    exercises: [
      {
        name: 'Mini-tenis en cuadro de servicio',
        theme: 'calentamiento',
        objective: 'Activar la coordinación ojo-raqueta y calentar a baja intensidad',
        instructions: 'Peloteo suave dentro del cuadro de servicio. Enfocarse en el centro del golpe.',
        estimatedDurationMin: 10,
        materials: ['Raqueta', 'Pelota'],
      },
      {
        name: 'Movilidad articular progresiva',
        theme: 'calentamiento',
        objective: 'Preparar la cadena cinética de hombro, cadera y muñeca',
        instructions: 'Círculos de hombro, rotación de cadera, flexoextensión de muñeca. 10 repeticiones cada movimiento.',
        estimatedDurationMin: 8,
        materials: [],
      },
      {
        name: 'Forehand cross-court — carrito de pelotas',
        theme: 'tecnica',
        objective: 'Consolidar el golpe de derecha cruzada con dirección y profundidad',
        instructions: 'Entrenador alimenta desde la red. Tenista ejecuta derecha cruzada profunda. 3 series × 15 pelotas.',
        estimatedDurationMin: 15,
        materials: ['Raqueta', 'Pelota', 'Cesta de pelotas'],
      },
      {
        name: 'Servicio plano y slice — práctica por zonas',
        theme: 'tecnica',
        objective: 'Mejorar la consistencia del servicio hacia zonas T y cuerpo',
        instructions: 'Marcar zonas con conos. Servicio alterno plano y slice. 10 servicios por zona por serie.',
        estimatedDurationMin: 20,
        materials: ['Raqueta', 'Pelota', 'Conos'],
      },
      {
        name: 'Volea de bloqueo en red',
        theme: 'tecnica',
        objective: 'Desarrollar firmeza de muñeca y posicionamiento en volea',
        instructions: 'Entrenador alimenta bolas a ambos lados. Tenista ejecuta volea sin swing. 3 series × 20 pelotas.',
        estimatedDurationMin: 12,
        materials: ['Raqueta', 'Pelota', 'Cesta de pelotas'],
      },
      {
        name: 'Patrones de juego — ataque desde zona central',
        theme: 'tactica',
        objective: 'Construir el punto con secuencias de golpe predefinidas',
        instructions: 'Secuencia: derecha cruzada + reverso en línea + aproximación + volea. 5 repeticiones, luego punto libre.',
        estimatedDurationMin: 18,
        materials: ['Raqueta', 'Pelota'],
      },
      {
        name: 'Juego condicionado — solo redes',
        theme: 'tactica',
        objective: 'Mejorar el juego de red y la transición defensa-ataque',
        instructions: 'Los puntos se ganan solo con volea o smash. Obliga al tenista a aproximarse constantemente.',
        estimatedDurationMin: 15,
        materials: ['Raqueta', 'Pelota'],
      },
      {
        name: 'Agilidad con escalera de coordinación',
        theme: 'fisico',
        objective: 'Mejorar la cadencia de pasos y la coordinación de pies',
        instructions: 'Patrones: 1 dentro–1 fuera, 2 dentro–2 fuera, lateral. 3 series completas con descanso de 30 s.',
        estimatedDurationMin: 10,
        materials: ['Escalera de coordinación'],
      },
      {
        name: 'Estiramientos de cadena posterior y manguito rotador',
        theme: 'vuelta_a_la_calma',
        objective: 'Prevenir lesiones de hombro y codo comunes en tenistas',
        instructions: 'Estiramiento del manguito con banda elástica. Estiramiento de isquiotibiales en posición de tijera. 30 s c/u.',
        estimatedDurationMin: 8,
        materials: ['Banda elástica'],
      },
    ],
  },

  // ── FÚTBOL ─────────────────────────────────────────────────────────────────
  futbol: {
    label:       'Fútbol',
    terminology: { resource: 'Campo', coach: 'Entrenador', player: 'Jugador' },
    settings:    { openingTime: '07:00', closingTime: '20:00' },
    exercises: [
      {
        name: 'Rondo 4×2 de activación',
        theme: 'calentamiento',
        objective: 'Activar el pase, la visión periférica y los movimientos sin balón',
        instructions: '4 jugadores en círculo con 2 defensores al centro. El objetivo es no perder el balón. 5 min continuo.',
        estimatedDurationMin: 8,
        materials: ['Balón', 'Conos'],
      },
      {
        name: 'Movilidad articular y activación muscular',
        theme: 'calentamiento',
        objective: 'Preparar caderas, rodillas y tobillos para la sesión',
        instructions: 'Skipping, saltos laterales, rotaciones de cadera. Progresión en intensidad durante 8 minutos.',
        estimatedDurationMin: 10,
        materials: [],
      },
      {
        name: 'Control orientado y conducción en espacio reducido',
        theme: 'tecnica',
        objective: 'Mejorar el primer toque orientado hacia el espacio de juego',
        instructions: 'Grilla de 10×10 m. Jugador recibe el balón, controla orientado y conduce hacia el cono de salida. 3 series × 8 repeticiones.',
        estimatedDurationMin: 15,
        materials: ['Balón', 'Conos'],
      },
      {
        name: 'Pase en movimiento — triángulos de presión',
        theme: 'tecnica',
        objective: 'Desarrollar la velocidad de circulación del balón bajo presión',
        instructions: 'Grupos de 3 en triángulo. Pase y va con presión pasiva. 5 min por grupo, luego rotación.',
        estimatedDurationMin: 15,
        materials: ['Balón', 'Conos'],
      },
      {
        name: 'Tiro a portería — borde del área',
        theme: 'tecnica',
        objective: 'Mejorar la precisión y potencia del disparo desde media distancia',
        instructions: 'Conducción desde centro del campo, pared y disparo desde el borde del área. 10 tiros por jugador.',
        estimatedDurationMin: 20,
        materials: ['Balón', 'Portería', 'Conos'],
      },
      {
        name: 'Juego de posición 7×7 con porteros',
        theme: 'tactica',
        objective: 'Practicar la presión tras pérdida y la circulación en bloque medio',
        instructions: 'Equipos de 7 con portero. Al perder la pelota, el equipo que pierde presiona en bloque durante 5 segundos.',
        estimatedDurationMin: 20,
        materials: ['Balón', 'Petos', 'Portería'],
      },
      {
        name: 'Transiciones ataque-defensa 3×3+2',
        theme: 'tactica',
        objective: 'Desarrollar la rapidez en el cambio de fase entre ataque y defensa',
        instructions: 'Juego en espacio reducido. Al recuperar el balón, el equipo tiene 5 segundos para atacar. 4 min × 3 series.',
        estimatedDurationMin: 15,
        materials: ['Balón', 'Conos', 'Petos'],
      },
      {
        name: 'Circuito de resistencia anaeróbica',
        theme: 'fisico',
        objective: 'Desarrollar la capacidad de repetir esfuerzos máximos en poco tiempo',
        instructions: 'Sprint 20 m + 10 sentadillas + sprint de vuelta. 6 repeticiones con 45 s de descanso entre series.',
        estimatedDurationMin: 15,
        materials: ['Conos'],
      },
      {
        name: 'Vuelta a la calma — trote suave y estiramientos',
        theme: 'vuelta_a_la_calma',
        objective: 'Bajar la frecuencia cardíaca y elongar los grupos musculares solicitados',
        instructions: 'Trote suave 3 min. Estiramiento de cuádriceps, isquiotibiales, pantorrillas y aductores. 30 s c/u.',
        estimatedDurationMin: 10,
        materials: [],
      },
    ],
  },

  // ── NATACIÓN ───────────────────────────────────────────────────────────────
  natacion: {
    label:       'Natación',
    terminology: { resource: 'Carril', coach: 'Entrenador', player: 'Nadador' },
    settings:    { openingTime: '05:00', closingTime: '21:00' },
    exercises: [
      {
        name: 'Calentamiento en seco — movilidad de hombros',
        theme: 'calentamiento',
        objective: 'Activar el manguito rotador y mejorar el rango de movimiento antes de entrar al agua',
        instructions: 'Círculos de brazo, bandas de resistencia ligera, rotaciones internas y externas. 3 min en seco.',
        estimatedDurationMin: 8,
        materials: ['Banda elástica'],
      },
      {
        name: 'Natación libre de activación — 200 m suaves',
        theme: 'calentamiento',
        objective: 'Adaptar el cuerpo al agua y subir la temperatura corporal progresivamente',
        instructions: '200 m a ritmo cómodo alternando estilos. Sin cronómetro. Enfocarse en la técnica de giro.',
        estimatedDurationMin: 10,
        materials: [],
      },
      {
        name: 'Técnica de crol — pull con pull-buoy',
        theme: 'tecnica',
        objective: 'Mejorar la tracción del brazo y la posición de la mano durante el tirón',
        instructions: '4 × 50 m solo brazos con pull-buoy. Foco: entrada de la mano, codo alto en el tirón, salida del agua.',
        estimatedDurationMin: 15,
        materials: ['Pull-buoy'],
      },
      {
        name: 'Patada de crol con tabla',
        theme: 'tecnica',
        objective: 'Consolidar la patada de cadera y reducir la resistencia frontal',
        instructions: '6 × 25 m con tabla. Piernas juntas, movimiento desde la cadera, tobillos relajados.',
        estimatedDurationMin: 12,
        materials: ['Tabla de natación'],
      },
      {
        name: 'Viraje de tumba-giro (flip turn)',
        theme: 'tecnica',
        objective: 'Automatizar el viraje para no perder tiempo en cada largo',
        instructions: 'Práctica desde 5 m de la pared. 10 repeticiones por carril. Énfasis en la distancia de impulso.',
        estimatedDurationMin: 15,
        materials: [],
      },
      {
        name: 'Series de ritmo — 4 × 100 m con tiempo objetivo',
        theme: 'tactica',
        objective: 'Aprender a distribuir el esfuerzo durante la prueba y gestionar el ritmo',
        instructions: 'Cada 100 m a ritmo de competencia −5%. Descanso de 30 s entre series. Registrar tiempos.',
        estimatedDurationMin: 20,
        materials: ['Cronómetro'],
      },
      {
        name: 'Salidas de bloque — reacción y posición aérea',
        theme: 'tactica',
        objective: 'Optimizar el tiempo de reacción y la trayectoria de entrada al agua',
        instructions: '8 salidas de bloque a señal auditiva. Énfasis en cabeza recta, brazos adelante y entrada limpia.',
        estimatedDurationMin: 15,
        materials: ['Bloque de salida'],
      },
      {
        name: 'Fartlek acuático — 10 × 50 m alterno',
        theme: 'fisico',
        objective: 'Desarrollar la resistencia aeróbica y la capacidad de cambio de ritmo',
        instructions: '50 m rápido + 50 m suave × 10 series. Descanso mínimo en el viraje. Cronometrar las series rápidas.',
        estimatedDurationMin: 20,
        materials: ['Cronómetro'],
      },
      {
        name: 'Elongación acuática y respiración de recuperación',
        theme: 'vuelta_a_la_calma',
        objective: 'Reducir la tensión muscular y normalizar la frecuencia cardíaca',
        instructions: '100 m muy suaves de espalda. En borde de piscina: estiramiento de hombros, cuello y lumbares. 30 s c/u.',
        estimatedDurationMin: 10,
        materials: [],
      },
    ],
  },

  // ── BALONCESTO ─────────────────────────────────────────────────────────────
  baloncesto: {
    label:       'Baloncesto',
    terminology: { resource: 'Cancha', coach: 'Entrenador', player: 'Jugador' },
    settings:    { openingTime: '08:00', closingTime: '22:00' },
    exercises: [
      {
        name: 'Dribbling estático de activación',
        theme: 'calentamiento',
        objective: 'Despertar la sensibilidad con el balón y activar la coordinación mano-ojo',
        instructions: 'Dribbling bajo, alto, alternando manos, entre piernas. 2 minutos continuos sin detenerse.',
        estimatedDurationMin: 8,
        materials: ['Balón'],
      },
      {
        name: 'Movilidad dinámica sin balón',
        theme: 'calentamiento',
        objective: 'Preparar rodillas, caderas y tobillos para los cambios de dirección',
        instructions: 'Skipping, karaoke, saltos laterales, cambios de dirección a señal. Progresión durante 8 min.',
        estimatedDurationMin: 8,
        materials: [],
      },
      {
        name: 'Parada en uno y dos tiempos — tiro en suspensión',
        theme: 'tecnica',
        objective: 'Consolidar la mecánica de tiro desde parada tras recepción en movimiento',
        instructions: 'Pase del entrenador. Jugador recibe, para en dos tiempos y ejecuta tiro. 10 tiros por posición (3 posiciones).',
        estimatedDurationMin: 15,
        materials: ['Balón', 'Canasta'],
      },
      {
        name: 'Bandeja por ambos lados',
        theme: 'tecnica',
        objective: 'Automatizar la coordinación de pasos y el punto de suelta en bandeja',
        instructions: 'Desde el poste bajo, alternando lado derecho e izquierdo. 5 bandejas por lado × 3 series. Énfasis en el ángulo de suelta.',
        estimatedDurationMin: 12,
        materials: ['Balón', 'Canasta'],
      },
      {
        name: 'Tiro de tres puntos desde esquinas y alas',
        theme: 'tecnica',
        objective: 'Mejorar la consistencia del tiro exterior desde posiciones de partido',
        instructions: '5 posiciones fijas (2 esquinas, 2 alas, 1 parte superior). 5 tiros por posición. Registro de efectividad.',
        estimatedDurationMin: 15,
        materials: ['Balón', 'Canasta'],
      },
      {
        name: 'Pick and roll — leer la defensa',
        theme: 'tactica',
        objective: 'Desarrollar la lectura del defensor del bloqueador para tomar la decisión correcta',
        instructions: 'Jugador A pone bloqueo a B. B lee si el defensor cambia o se queda → pasa a A o ataca el aro. 3 series × 10 repeticiones.',
        estimatedDurationMin: 18,
        materials: ['Balón'],
      },
      {
        name: 'Juego 3×3 de media cancha',
        theme: 'tactica',
        objective: 'Aplicar los conceptos de desmarcaje, corte y toma de decisiones en situación real',
        instructions: 'Posesión de 24 s. Al terminar, rota el equipo. El equipo defensor pasa a atacar. Juego continuo 4 min.',
        estimatedDurationMin: 20,
        materials: ['Balón', 'Petos'],
      },
      {
        name: 'Circuito de resistencia y saltos',
        theme: 'fisico',
        objective: 'Desarrollar potencia de piernas y resistencia específica del juego',
        instructions: 'Sprint carril → 5 saltos verticales → sprint carril → 10 sentadillas → descanso 30 s. 4 series.',
        estimatedDurationMin: 12,
        materials: ['Conos'],
      },
      {
        name: 'Vuelta a la calma — estiramientos de tren inferior y espalda',
        theme: 'vuelta_a_la_calma',
        objective: 'Recuperación activa para prevenir sobrecarga muscular post-sesión',
        instructions: 'Estiramiento de cuádriceps, isquiotibiales, aductores y zona lumbar. 30 s por posición. Respiración profunda.',
        estimatedDurationMin: 8,
        materials: [],
      },
    ],
  },
}

export const SPORT_LABELS: Record<SportKey, string> = {
  padel:      'Pádel',
  tenis:      'Tenis',
  futbol:     'Fútbol',
  natacion:   'Natación',
  baloncesto: 'Baloncesto',
}

export const SUPPORTED_SPORTS = Object.keys(SPORT_SEEDS) as SportKey[]
