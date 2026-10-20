/*
 * Spanish (es-ES) copy for /es/ and /es/calculadora-fps/.
 * Tables marked ${T.*} are computed from the engine by scripts/i18n-pages.js.
 * Runtime calculator strings are in assets/js/i18n.js.
 */
module.exports = {
  lang: "es",

  site: {
    skip: "Saltar a la calculadora",
    logoAria: "Inicio de la calculadora de cuello de botella",
    navLabel: "Principal",
    footerNavLabel: "Sitio",
    langLabel: "Idioma",
    tocLabel: "En esta página",
    requiresJs: "Requiere JavaScript",
    ogImageAlt: "Calculadora de cuello de botella: equilibrio entre CPU y GPU, FPS y mejoras recomendadas",
    copyright: "© 2026 Bottleneck Calculator. Las estimaciones son orientativas. El rendimiento real varía según el juego, los ajustes, los drivers y la refrigeración.",
    // [page group or path, label, English-only page]
    footerLinks: [
      ["home", "Calculadora de cuello de botella"],
      ["fps", "Calculadora de FPS"],
      ["bottleneck/", "Combinaciones populares (en inglés)", true],
      ["guides/", "Guías (en inglés)", true],
      ["about/", "Quiénes somos", true],
      ["editorial-policy/", "Política editorial", true],
      ["privacy/", "Privacidad", true],
      ["contact/", "Contacto", true],
    ],
  },

  ui: {
    storage: "Unidad de los juegos",
    storageOptions: [["nvme", "SSD NVMe"], ["sata", "SSD SATA"], ["hdd", "Disco duro (HDD)"]],
    saveImage: "Guardar imagen",
    processor: "Procesador",
    cpuPlaceholder: "Busca tu CPU, p. ej. 7800X3D",
    cpuToggle: "Mostrar todos los procesadores",
    cpuList: "Procesadores",
    gpu: "Tarjeta gráfica",
    gpuPlaceholder: "Busca tu GPU, p. ej. RTX 5070",
    gpuToggle: "Mostrar todas las tarjetas gráficas",
    gpuList: "Tarjetas gráficas",
    resolution: "Resolución",
    settings: "Ajustes",
    quality: "Calidad gráfica",
    qualitySeg: [["low", "Bajo"], ["medium", "Medio"], ["high", "Alto"], ["ultra", "Ultra"]],
    ram: "Memoria (RAM)",
    games: "Juegos a los que juegas",
    workloadOptions: [
      ["general", "AAA / juegos variados"],
      ["esports", "Esports competitivos (CS2, Valorant, Fortnite)"],
      ["cpuheavy", "Exigentes en CPU (estrategia, simuladores, MMO)"],
      ["raytracing", "Ray tracing / path tracing"],
    ],
    upscaling: "Escalado",
    hz: "Frecuencia del monitor",
    streaming: "Streaming o grabación (codificación por CPU)",
    resultAria: "Resultado",
    pipelineAria: "Cadena de fotogramas",
    display: "Monitor",
    bottleneckTag: "Límite",
    pipeNote: "Fotogramas máximos que puede entregar cada pieza. Se acumulan delante de la más lenta.",
    avgFps: "FPS medios",
    low1: "Mín. 1%",
    cpuLoad: "Uso de CPU",
    gpuLoad: "Uso de GPU",
    copyLink: "Copiar enlace",
    resTitle: "Cuello de botella por resolución",
    resSub: "Mismo equipo y ajustes, distintas resoluciones.",
    resHead: ["Resolución", "FPS medios", "Mín. 1%", "Cuello de botella"],
    wlTitle: "FPS por tipo de juego",
    wlSub: "Con la resolución y la calidad que has elegido.",
    wlHead: ["Tipo de juego", "FPS medios", "Limitado por"],
    recTitle: "Recomendaciones",
    recSub: "Específicas para tus piezas y tus ajustes.",
  },

  tables: {
    resHead: ["Resolución", "Límite CPU", "Límite GPU", "FPS medios", "Cuello de botella"],
    gpuHead: "Tarjeta gráfica",
    stillCpuBound: "(sigue limitado por CPU)",
    gameHead: "Juego",
    engineHead: "Tipo de motor",
    capHead: "Tope de FPS",
    capShort: "tope",
  },

  fpsUi: {
    game: "Juego",
    popularGames: "Juegos populares",
    gameTypes: "Tipos de juego",
    avgFpsShort: "FPS medios",
    calculating: "Calculando",
    pickTitle: "Elige tu CPU, GPU y juego",
    pickText: "Los resultados se actualizan al instante al cambiar cualquier opción.",
    limitTag: "Límite",
    pipeNote: "Fotogramas máximos que cada pieza puede entregar en este juego. La más lenta marca tu tasa de FPS.",
    frameTime: "Tiempo de fotograma",
    limitedBy: "Limitado por",
    gridTitle: "FPS por resolución y calidad",
    gridSub: "Selecciona una celda para usar esos ajustes.",
    under30: "Menos de 30",
    targetsTitle: "Objetivos de frecuencia",
    targetsSub: "¿Puede este equipo llenar un monitor de 60, 144 o 240 Hz? Según los FPS medios.",
    recSub: "Específicas para este juego, tus piezas y tus ajustes.",
    gamesTitle: "Este equipo en todos los juegos",
    gamesSub: "Selecciona un juego para cargarlo.",
  },

  // ======================================================================
  // Calculadora de cuello de botella (/es/)
  // ======================================================================
  home: {
    title: "Calculadora de cuello de botella CPU y GPU (2026) + FPS estimados",
    description: "Calculadora de cuello de botella gratis: comprueba si tu procesador frena a tu tarjeta gráfica, mira los FPS estimados a 1080p, 1440p y 4K y descubre qué mejora lo soluciona. Más de 280 CPU y GPU, incluidas las RTX 50 y RX 9000.",
    ogTitle: "Calculadora de cuello de botella: ¿tu CPU frena a tu GPU?",
    ogDescription: "Comprueba el equilibrio entre CPU y GPU, los FPS estimados y los mínimos del 1% a cualquier resolución, y la mejora exacta que elimina el cuello de botella.",
    appName: "Calculadora de cuello de botella",
    appDescription: "Calculadora gratuita de cuello de botella de CPU y GPU con FPS estimados a 1080p, 1440p, ultrawide y 4K, modelado por tipo de juego, comprobación de VRAM y recomendaciones de mejora.",
    trademarks: "Los nombres de productos son marcas registradas de sus respectivos propietarios. Este sitio no está afiliado a AMD, Intel ni NVIDIA.",
    eyebrow: "Actualizado en octubre de 2026 · 284 CPU y GPU",
    h1: "Calculadora de cuello de botella",
    lead: "Comprueba si hay cuello de botella entre tu CPU y tu GPU, cuántos FPS puedes esperar y qué mejora lo soluciona de verdad.",
    calcAria: "Calculadora de cuello de botella",
    nav: [
      ["es/calculadora-fps/", "Calculadora de FPS"],
      ["#how-it-works", "Método"],
      ["#min-cpu", "CPU para tu GPU"],
      ["#popular", "Combinaciones"],
      ["#faq", "FAQ"],
    ],
    toc: [
      ["what-is", "¿Qué es un cuello de botella?"],
      ["how-to-use", "Cómo usar la calculadora"],
      ["how-it-works", "Cómo lo calculamos"],
      ["thresholds", "Qué % es aceptable"],
      ["cpu-vs-gpu", "Cuello de botella de CPU o de GPU"],
      ["resolution", "Por qué importa la resolución"],
      ["min-cpu", "La mejor CPU para tu GPU"],
      ["popular", "Combinaciones populares"],
      ["fix", "Cómo solucionarlo"],
      ["check", "Compruébalo en tu PC"],
      ["platforms", "Mejor CPU por plataforma"],
      ["faq", "Preguntas frecuentes"],
    ],
    body: (T) => `        <section id="what-is">
          <h2>¿Qué es un cuello de botella en un PC?</h2>
          <p>Cada fotograma de un juego se crea en dos fases. Primero el <strong>procesador (CPU)</strong> calcula la lógica del juego, la física, la IA y las llamadas de dibujado. Después la <strong>tarjeta gráfica (GPU)</strong> convierte ese fotograma en píxeles. Las dos piezas trabajan en cadena, así que tu tasa de FPS nunca puede superar a la más lenta de las dos. Esa pieza más lenta es el <strong>cuello de botella</strong>.</p>
          <p>Una calculadora de cuello de botella estima cuántos fotogramas puede entregar cada pieza por sí sola y los compara. Si tu CPU puede preparar 110 fotogramas por segundo pero tu GPU podría renderizar 180, la GPU pasa cerca del 39% del tiempo esperando a la CPU. Ese rendimiento de la gráfica se desperdicia, y esa es la cifra que esta herramienta muestra como porcentaje de cuello de botella.</p>
          <div class="callout"><p><strong>En resumen:</strong> siempre hay algo de cuello de botella, porque una pieza siempre es la más lenta. Lo que importa es <em>qué</em> pieza te limita, cuánto, y si tus FPS son suficientes para tu monitor. Un cuello de botella de GPU a 4K es normal y sano. Un cuello de botella grande de CPU a 1080p significa que has pagado por potencia gráfica que no puedes usar.</p></div>
        </section>

        <section id="how-to-use">
          <h2>Cómo usar esta calculadora de cuello de botella</h2>
          <ol class="steps">
            <li><strong>Elige tu CPU y tu GPU.</strong> Empieza a escribir un número de modelo como «5600», «14600K» o «5070 Ti». Se incluyen los chips de portátil y las gráficas integradas.</li>
            <li><strong>Elige la resolución y la calidad.</strong> Son lo que más cambia la carga de la GPU. Pon la resolución a la que juegas de verdad, no la máxima que admite tu monitor.</li>
            <li><strong>Selecciona el tipo de juegos.</strong> Los esports, los simuladores y los juegos con ray tracing cargan la CPU y la GPU de formas muy distintas.</li>
            <li><strong>Ajusta el escalado, la frecuencia y la RAM.</strong> DLSS/FSR reduce la carga de la GPU, la frecuencia del monitor indica cuántos fotogramas puedes ver realmente y 8 GB de RAM provocan tirones por sí solos.</li>
            <li><strong>Lee el veredicto y las recomendaciones.</strong> Revisa la tabla por resolución, la tabla por tipo de juego y las tarjetas de mejora. Copia el enlace del resultado para compartir tu equipo en Reddit o Discord.</li>
          </ol>
        </section>

        <section id="how-it-works">
          <h2>Cómo calculamos el cuello de botella y los FPS</h2>
          <p>Muchas calculadoras de cuello de botella comparan puntuaciones sintéticas como PassMark o Cinebench. Esas pruebas miden renderizado multinúcleo, no rendimiento en juegos, así que colocan un procesador de estación de trabajo de 16 núcleos muy por encima de una CPU gaming X3D de 8 núcleos. En juegos es justo al revés. Esta calculadora usa <strong>índices de rendimiento específicos para juegos</strong>.</p>
          <h3>1. Límite de FPS de la CPU</h3>
          <p>Cada CPU tiene un índice gaming calibrado con medias de benchmarks publicados limitados por CPU (1080p, la GPU más rápida, juegos actuales). El Ryzen 7 9800X3D vale 100. Ese índice se convierte en un límite de fotogramas por segundo y después se ajusta según el tipo de juego, la calidad gráfica, la cantidad de RAM y la carga del streaming. El límite de la CPU no depende de la resolución, porque la CPU hace el mismo trabajo por fotograma a 1080p que a 4K.</p>
          <h3>2. Límite de FPS de la GPU</h3>
          <p>Cada GPU tiene un índice de rendimiento en rasterización (RTX 4090 = 100) calibrado con medias de benchmarks limitados por GPU. Lo escalamos según la resolución con una curva medida (número de píxeles<sup>−0,62</sup>, no una caída lineal ingenua). Después aplicamos la calidad, el escalado, la eficiencia en ray tracing (distinta entre las arquitecturas de NVIDIA, AMD e Intel) y una penalización de VRAM cuando tus ajustes necesitan más memoria de vídeo de la que tiene la tarjeta.</p>
          <h3>3. Cómo se combinan</h3>
<div class="formula">Límite CPU = índice CPU × 2,0 × tipo de juego × calidad × RAM × streaming
Límite GPU = índice GPU × 2,3 × (píxeles ÷ 1080p)^−0,62 × tipo de juego
             × calidad × escalado × ray tracing × VRAM
FPS medios = mín. suave(límite CPU, límite GPU)
Cuello de botella = (límite mayor − límite menor) ÷ límite mayor × 100%</div>
          <p>El mínimo suave refleja lo que pasa en la realidad: cuando las dos piezas están cerca de su límite, el ritmo de fotogramas empeora y el resultado queda un poco por debajo de ambos límites. Los mínimos del 1% se estiman a partir de la pieza que limita. Los juegos limitados por CPU tienen peores mínimos, y los chips X3D, con su caché extra, los tienen mejores.</p>
          <p><strong>Precisión:</strong> de media en muchos juegos, las estimaciones suelen quedar a un 10–15% de los benchmarks reales. Un juego concreto puede variar más por particularidades del motor, versiones de drivers, parches, refrigeración, límites de potencia, velocidad de la RAM y aplicaciones en segundo plano. Usa el resultado para valorar el equilibrio y las mejoras, no como una cifra exacta de FPS para un juego.</p>
        </section>

        <section id="thresholds">
          <h2>¿Qué porcentaje de cuello de botella es aceptable?</h2>
          <p>Estos son los umbrales que usamos en todo el sitio. La calculadora, esta tabla y las preguntas frecuentes usan las mismas cifras.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Cuello de botella</th><th>Si limita la CPU</th><th>Si limita la GPU</th></tr></thead>
              <tbody>
                <tr><td><span class="dot" data-tone="excellent"></span><strong>0–10%</strong></td><td>Equilibrio excelente</td><td>Equilibrio excelente</td></tr>
                <tr><td><span class="dot" data-tone="good"></span><strong>10–20%</strong></td><td>Leve. Apenas se nota</td><td>Bien equilibrado. Es el estado ideal para jugar</td></tr>
                <tr><td><span class="dot" data-tone="moderate"></span><strong>20–35%</strong></td><td>Moderado. Peores mínimos y GPU parcialmente ociosa</td><td>Limitado por GPU. Tu CPU podrá con una GPU más potente en el futuro</td></tr>
                <tr><td><span class="dot" data-tone="severe"></span><strong>35%+</strong></td><td>Grave. Cambia la CPU antes que la GPU</td><td>Muy limitado por la GPU. Bien si los FPS te bastan; si no, cambia la GPU</td></tr>
              </tbody>
            </table>
          </div>
          <p>Fíjate en que las dos columnas no se tratan igual. Un cuello de botella de GPU solo significa que tu tarjeta gráfica trabaja a pleno rendimiento, que es justo para lo que la compraste. Un cuello de botella de CPU provoca tiempos de fotograma irregulares, tirones en las escenas cargadas y una GPU parada.</p>
        </section>

        <section id="cpu-vs-gpu">
          <h2>Cuello de botella de CPU o de GPU: ¿cuál es peor?</h2>
          <p><strong>Para jugar, un cuello de botella de CPU es peor.</strong> Cuando limita la CPU, los tiempos de fotograma se disparan con cada explosión, multitud o evento de física, así que los mínimos del 1% caen y el juego va a trompicones aunque la media de FPS parezca buena. Bajar los gráficos apenas ayuda, porque el problema no era la GPU.</p>
          <p><strong>Un cuello de botella de GPU es el estado normal y preferible.</strong> Los fotogramas llegan de forma regular y controlas el rendimiento con los ajustes: bajar las sombras, activar DLSS o FSR o reducir la resolución. La mayoría de los PC gaming bien montados están ligeramente limitados por la GPU a su resolución objetivo.</p>
          <h3>Señales de que tu CPU es el cuello de botella</h3>
          <ul>
            <li>El uso de la GPU se queda muy por debajo del 95% en partida mientras los FPS son más bajos de lo que quieres.</li>
            <li>Bajar la resolución o los ajustes gráficos no sube los FPS.</li>
            <li>Tirones en zonas concurridas, como ciudades, batallas grandes o partidas con muchos jugadores.</li>
            <li>Uno o dos hilos de la CPU están cerca del 100% aunque el uso total parezca moderado.</li>
          </ul>
        </section>

        <section id="resolution">
          <h2>Por qué la resolución cambia el cuello de botella</h2>
          <p>El trabajo de la CPU por fotograma es casi el mismo a cualquier resolución. El de la GPU crece con cada píxel extra, y 4K tiene cuatro veces los píxeles de 1080p. Por eso, al subir de resolución bajan los FPS de la GPU mientras el límite de la CPU se mantiene. El cuello de botella se desplaza de la CPU hacia la GPU.</p>
          <p>Este es un Ryzen 5 3600 con una RTX 4070 Super en calidad Alta, calculado con esta herramienta:</p>
          ${T.resExample}
          <p>La misma GPU está muy frenada a 1080p, casi equilibrada a 1440p y aprovechada al completo a 4K. Por eso la pregunta «¿me hará cuello de botella?» solo tiene sentido si va acompañada de una resolución. También explica por qué el escalado (que renderiza a una resolución interna más baja) puede <em>aumentar</em> un cuello de botella de CPU.</p>
        </section>

        <section id="min-cpu">
          <h2>La mejor CPU para tu GPU (CPU mínima sin cuello de botella)</h2>
          <p>Esta es la CPU popular más asequible que mantiene cada tarjeta gráfica por debajo de un 10% de cuello de botella en calidad Alta y juegos AAA. Cualquier procesador más rápido también sirve. «Ryzen 5 3600+» significa que basta con cualquier CPU moderna de 6 núcleos. Calculado con los mismos datos que la herramienta de arriba.</p>
          ${T.minCpu}
          <p>¿Juegas a esports a 240 Hz o más? Elige una CPU más rápida de lo que indica la tabla. Los juegos competitivos en calidad baja trasladan casi todo el trabajo a la CPU, y ahí es donde brillan los chips X3D como el Ryzen 7 7800X3D y el 9800X3D.</p>
        </section>

        <section id="popular">
          <h2>Combinaciones populares de CPU y GPU</h2>
          <p>Resultados en directo de los equipos por los que más se pregunta. Haz clic en cualquier tarjeta para cargarla en la calculadora y cambiar los ajustes.</p>
          ${T.combos}
          <p><a href="../bottleneck/" hreflang="en"><strong>Ver todas las combinaciones populares de CPU y GPU</strong></a> (en inglés), con el cuello de botella y los FPS ya calculados a 1080p, 1440p y 4K.</p>
        </section>

        <section id="fix">
          <h2>Cómo solucionar un cuello de botella</h2>
          <h3>Si el cuello de botella es la CPU</h3>
          <ul>
            <li><strong>Sube la resolución o la calidad gráfica.</strong> Casi no cuesta nada cuando la GPU está ociosa, y el juego se ve mejor con prácticamente los mismos FPS.</li>
            <li><strong>Activa XMP/EXPO y usa la RAM en doble canal.</strong> Un solo módulo de memoria o la RAM a los 2133/4800 MT/s de fábrica pueden costar un 10–25% de rendimiento cuando limita la CPU.</li>
            <li><strong>Mejora primero dentro de tu socket.</strong> En AM4, un Ryzen 7 5700X3D o 5800X3D suele ser el salto grande más barato, sin cambiar de placa base.</li>
            <li><strong>Cierra las aplicaciones en segundo plano y usa codificación por hardware</strong> (NVENC, AMF o Quick Sync) para hacer streaming.</li>
            <li><strong>Usa la generación de fotogramas</strong> (DLSS 3/4 Frame Generation o FSR 3/4) para ganar fluidez percibida cuando limita la CPU. No añade fotogramas «reales», pero puede ayudar en juegos para un jugador.</li>
            <li><strong>Revisa la refrigeración.</strong> Una CPU que llega a 95–100 °C baja frecuencias y se convierte en un cuello de botella que no debería ser.</li>
          </ul>
          <h3>Si el cuello de botella es la GPU</h3>
          <ul>
            <li><strong>Activa DLSS, FSR o XeSS</strong> en modo Calidad. Normalmente da un 30–50% más de FPS con poca pérdida visible.</li>
            <li><strong>Baja los ajustes más pesados:</strong> ray tracing, sombras, niebla volumétrica y reflejos en espacio de pantalla, en ese orden.</li>
            <li><strong>Reduce la calidad de las texturas si te quedas sin VRAM.</strong> Los tirones y las texturas borrosas en tarjetas de 8 GB son un cuello de botella de VRAM.</li>
            <li><strong>Actualiza los drivers gráficos</strong> y asegúrate de que el cable del monitor está conectado a la tarjeta gráfica, no a la placa base.</li>
            <li><strong>Cambia de GPU.</strong> Las tarjetas de mejora de arriba muestran qué modelos encajan con tu CPU sin crear un nuevo cuello de botella de CPU.</li>
          </ul>
        </section>

        <section id="check">
          <h2>Cómo comprobar el cuello de botella en tu propio PC</h2>
          <p>Una calculadora te da una predicción. Para confirmarla en un juego real, usa una superposición de rendimiento gratuita:</p>
          <ol>
            <li>Instala <strong>MSI Afterburner</strong> con RivaTuner Statistics Server, o usa la superposición de la NVIDIA App o de AMD Adrenalin.</li>
            <li>Activa en pantalla el <strong>uso de la GPU, el uso de la CPU por hilo, los FPS y el tiempo de fotograma</strong>.</li>
            <li>Juega unos minutos en la parte más exigente de tu juego con el V-Sync y los límites de FPS desactivados.</li>
            <li><strong>Un uso de GPU del 95–99%</strong> significa que estás limitado por la GPU, lo cual es sano. <strong>Un uso de GPU claramente por debajo del 90%</strong> con FPS inferiores a tu objetivo significa que el cuello de botella es la CPU (o la RAM).</li>
            <li>Compruébalo bajando la resolución. Si los FPS no suben, estás limitado por la CPU.</li>
          </ol>
          <p>El Administrador de tareas de Windows no es fiable para esto. Su porcentaje total de CPU promedia todos los núcleos, así que un juego que satura dos hilos de una CPU de 16 hilos muestra solo un «25% de uso de CPU» aunque esté completamente limitado por la CPU.</p>
        </section>

        <section id="platforms">
          <h2>Las mejores CPU gaming para actualizar, por plataforma</h2>
          <p>Cambiar la CPU manteniendo la placa base es la forma más barata de eliminar un cuello de botella de CPU. Actualiza la BIOS antes de cambiar el procesador.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Socket</th><th>La mejor para jugar</th><th>La de mejor calidad-precio</th><th>Notas</th></tr></thead>
              <tbody>
                <tr><td><strong>AM4</strong></td><td>Ryzen 7 5800X3D / 5700X3D</td><td>Ryzen 5 5600 / 5600X</td><td>Los X3D son las mejores CPU AM4 para jugar. Evita los 5600G/5700G con gráficas rápidas: tienen la mitad de caché y PCIe 3.0.</td></tr>
                <tr><td><strong>AM5</strong></td><td>Ryzen 7 9850X3D / 9800X3D</td><td>Ryzen 5 7600 / 9600X</td><td>El 7800X3D sigue siendo una compra excelente. AMD se ha comprometido a dar soporte a AM5 en futuras CPU.</td></tr>
                <tr><td><strong>LGA1700</strong></td><td>Core i7-14700K / i9-14900K</td><td>Core i5-13400F / i5-14600K</td><td>Instala la última BIOS con el microcódigo de estabilidad de Intel para 13.ª y 14.ª generación antes de cambiar de CPU.</td></tr>
                <tr><td><strong>LGA1851</strong></td><td>Core Ultra 9 285K</td><td>Core Ultra 5 245K</td><td>Muy buena en productividad. En juegos está cerca de la 14.ª generación, así que la DDR5 rápida ayuda.</td></tr>
                <tr><td><strong>LGA1200</strong></td><td>Core i9-11900K / i9-10900K</td><td>Core i5-11400F</td><td>Plataforma sin futuro. Vale para GPU del nivel de una RTX 4060; para tarjetas más rápidas, plantéate cambiar de plataforma.</td></tr>
              </tbody>
            </table>
          </div>
        </section>`,
    faqTitle: "Preguntas frecuentes",
    faq: [
      ["¿Qué porcentaje de cuello de botella es bueno?",
        "Por debajo del 10% es un equilibrio excelente y entre el 10 y el 20% está bien para jugar. Entre el 20 y el 35%, un cuello de botella de CPU empieza a notarse en los mínimos del 1%. Por encima del 35% estás desperdiciando buena parte de tu GPU. Si la pieza que limita es la GPU, incluso porcentajes más altos están bien mientras tus FPS lleguen a tu objetivo."],
      ["¿Qué precisión tiene una calculadora de cuello de botella?",
        "Una buena es precisa para valorar el equilibrio y obtener unos FPS aproximados, normalmente con un margen de un 10–15% respecto a la media de los benchmarks. Ninguna calculadora puede predecir exactamente un juego concreto, porque el motor, los parches, los drivers, la refrigeración, la velocidad de la RAM y el software en segundo plano cambian los resultados. Las herramientas basadas en puntuaciones sintéticas como PassMark son mucho menos fiables para juegos que las basadas en benchmarks de juegos."],
      ["¿Es mejor tener cuello de botella de CPU o de GPU?",
        "De GPU. Un juego limitado por la GPU tiene tiempos de fotograma suaves y constantes, y puedes subir los FPS con los ajustes o con el escalado. Un juego limitado por la CPU tiene peores mínimos del 1% y tirones, y bajar los ajustes no ayuda."],
      ["¿Jugar a más resolución reduce el cuello de botella de CPU?",
        "Sí. Las resoluciones más altas añaden trabajo a la GPU pero apenas cambian el de la CPU, así que la GPU pasa a ser la pieza que limita. Pasar de 1080p a 1440p suele ser la solución más sencilla para una GPU potente con una CPU antigua. Tus FPS medios no subirán, pero la calidad de imagen mejora casi sin coste."],
      ["¿DLSS o FSR solucionan un cuello de botella de CPU?",
        "No. El escalado renderiza a una resolución interna más baja, lo que reduce el trabajo de la GPU y te mete todavía más en un cuello de botella de CPU. La generación de fotogramas es distinta: inserta fotogramas generados sin intervención de la CPU, así que puede mejorar la fluidez percibida cuando limita la CPU, a cambio de una latencia algo mayor."],
      ["¿La RAM puede provocar un cuello de botella?",
        "Sí. 8 GB de RAM se quedan cortos para los juegos actuales y provocan tirones. Usar un solo módulo (un canal) u olvidarse de activar XMP/EXPO también puede recortar entre un 10 y un 25% el rendimiento cuando limita la CPU. Para jugar en 2026, lo ideal son 32 GB de DDR5 en doble canal (o 16–32 GB de DDR4-3600)."],
      ["¿Un cuello de botella puede dañar mi PC?",
        "No. Un cuello de botella es un desajuste de rendimiento, no una avería. Ninguna pieza trabaja por encima de lo que permite su diseño. El único coste es el rendimiento que has pagado y no puedes aprovechar."],
      ["¿Es posible un cuello de botella del 0%?",
        "En la práctica, no. En cada fotograma una pieza termina después que la otra, y el equilibrio cambia entre juegos e incluso entre escenas. Un resultado por debajo del 10% significa que las piezas están todo lo bien emparejadas que se puede conseguir."],
      ["¿La calculadora sirve para portátiles?",
        "Sí. Incluye los procesadores y las gráficas de portátil más populares, marcados como «Portátil». Las GPU de portátil varían mucho según su límite de potencia (TGP) y su refrigeración, así que los modelos finos y ligeros pueden rendir un 10–25% por debajo de la estimación."],
      ["¿Por qué cada calculadora de cuello de botella da un resultado distinto?",
        "Porque usan datos y fórmulas diferentes. Muchas comparan puntuaciones sintéticas de CPU que no reflejan el rendimiento en juegos, ignoran la resolución o tratan un cuello de botella de GPU como un problema. Esta calculadora usa índices específicos para juegos, tiene en cuenta la resolución, la calidad, el escalado, la VRAM y el tipo de juego, y muestra su fórmula completa más arriba."],
    ],
    updates: `        <section id="updates">
          <h2>Actualizaciones de datos</h2>
          <p><strong>Octubre de 2026:</strong> añadidos el Ryzen 7 9850X3D, la RTX 5050, la RX 9060 XT y la Arc B570. Recalibrados los índices de GPU con los resultados de los últimos drivers. Añadidas las gráficas de portátil e integradas, el modelo de eficiencia en ray tracing y la penalización por VRAM.</p>
          <p>¿Falta alguna CPU o GPU? La base de datos se actualiza con regularidad a medida que sale hardware nuevo.</p>
        </section>`,
  },

  // ======================================================================
  // Calculadora de FPS (/es/calculadora-fps/)
  // ======================================================================
  fps: {
    title: "Calculadora de FPS (2026): calcula los FPS de tu CPU, GPU y juego",
    description: "Calculadora de FPS gratis: elige tu procesador, tu tarjeta gráfica y el juego para ver los FPS estimados y los mínimos del 1% a 1080p, 1440p y 4K, de Bajo a Ultra. CS2, Valorant, Fortnite, Cyberpunk 2077, Warzone y más.",
    ogTitle: "Calculadora de FPS: ¿cuántos FPS dará tu PC?",
    ogDescription: "FPS estimados y mínimos del 1% para tu CPU y tu GPU en 12 juegos populares, a cualquier resolución y preajuste de calidad.",
    appName: "Calculadora de FPS",
    appDescription: "Calculadora de FPS gratuita que estima los FPS medios y los mínimos del 1% de cualquier CPU y GPU en juegos populares a 1080p, 1440p y 4K, con ajustes de Bajo a Ultra.",
    trademarks: "Los nombres de productos y de juegos son marcas registradas de sus respectivos propietarios. Este sitio no está afiliado a AMD, Intel, NVIDIA ni a ningún editor de videojuegos.",
    eyebrow: "Actualizado en octubre de 2026 · 12 juegos populares",
    h1: "Calculadora de FPS",
    lead: "Elige tu procesador, tu tarjeta gráfica y el juego para ver cuántos fotogramas por segundo puedes esperar, de 1080p en Bajo a 4K en Ultra.",
    calcAria: "Calculadora de FPS",
    nav: [
      ["es/", "Calculadora de cuello de botella"],
      ["es/calculadora-fps/", "Calculadora de FPS", true],
      ["#builds", "Equipos"],
      ["#faq", "FAQ"],
    ],
    toc: [
      ["what-is", "¿Qué es una calculadora de FPS?"],
      ["how-to-use", "Cómo usarla"],
      ["how-it-works", "Cómo estimamos los FPS"],
      ["games", "Juegos compatibles"],
      ["builds", "FPS en equipos populares"],
      ["targets-guide", "Cuántos FPS necesitas"],
      ["lows", "FPS medios y mínimos del 1%"],
      ["boost", "Cómo ganar FPS"],
      ["faq", "Preguntas frecuentes"],
    ],
    body: (T) => `        <section id="what-is">
          <h2>¿Qué es una calculadora de FPS?</h2>
          <p>Una calculadora de FPS estima a cuántos <strong>fotogramas por segundo</strong> moverá un PC un juego antes de que compres o mejores nada. Introduces el procesador, la tarjeta gráfica y el juego, y predice la tasa media de fotogramas y los mínimos del 1% a la resolución y con el preajuste gráfico que piensas usar.</p>
          <p>La respuesta depende de dos límites distintos. La <strong>CPU</strong> decide cuántos fotogramas puede preparar la lógica del juego cada segundo, algo que apenas cambia con la resolución. La <strong>GPU</strong> decide cuántos de esos fotogramas puede dibujar, y esa cifra cae en picado al añadir píxeles o subir la calidad. Tus FPS reales quedan cerca del límite más bajo. Esta herramienta calcula los dos límites para cada juego, así que también te dice <em>por qué</em> obtienes esos FPS y qué los subiría.</p>
          <div class="callout"><p><strong>En resumen:</strong> si un juego está limitado por la CPU, bajar los ajustes no sumará FPS y un procesador más rápido sí. Si está limitado por la GPU, lo harán unos ajustes más bajos, DLSS/FSR o una tarjeta gráfica más rápida. La columna «Limitado por» te dice en qué caso estás.</p></div>
        </section>

        <section id="how-to-use">
          <h2>Cómo usar la calculadora de FPS</h2>
          <ol class="steps">
            <li><strong>Elige tu CPU y tu GPU.</strong> Escribe un número de modelo como «5600», «14600K» o «5070 Ti». Los chips de portátil y las gráficas integradas están incluidos y marcados.</li>
            <li><strong>Elige un juego.</strong> Escoge uno de los 12 títulos compatibles o, para cualquier otro, un tipo de juego (AAA, esports, exigente en CPU o ray tracing).</li>
            <li><strong>Ajusta la resolución.</strong> Elige la resolución a la que juegas de verdad. Abre <em>Ajustes</em> para cambiar la calidad, la RAM, el escalado y la frecuencia de tu monitor.</li>
            <li><strong>Lee la tabla de FPS.</strong> Muestra todas las combinaciones de 1080p, 1440p y 4K con calidad de Bajo a Ultra, coloreadas según la tasa de FPS. Selecciona cualquier celda para cargar esos ajustes.</li>
            <li><strong>Revisa los objetivos de frecuencia.</strong> La calculadora te dice si llegas a 60, 144 y 240 Hz y qué cambiar si no llegas. Copia el enlace para compartir tu resultado.</li>
          </ol>
        </section>

        <section id="how-it-works">
          <h2>Cómo estimamos los FPS</h2>
          <p>La calculadora de FPS usa el mismo motor que nuestra <a href="../">calculadora de cuello de botella</a>. Cada CPU y cada GPU tienen un índice de rendimiento en juegos construido a partir de medias de benchmarks, no de puntuaciones sintéticas. El Ryzen 7 9800X3D vale 100 en el lado de la CPU y la RTX 4090 vale 100 en el de la GPU.</p>
          <h3>1. Un perfil para cada juego</h3>
          <p>Cada juego carga el hardware de forma muy distinta. Valorant puede ir a 800 FPS con una CPU rápida porque cada fotograma es barato de preparar y de dibujar. Microsoft Flight Simulator 2024 apenas pasa de 100 FPS con la misma CPU porque simula un planeta entero. Por eso cada juego parte de uno de cuatro tipos de motor (AAA, esports, exigente en CPU o ray tracing) y recibe encima sus propios multiplicadores de CPU, GPU y VRAM. Los calibramos con medias de resultados de una RTX 4060 a 1080p en Alto y de un Ryzen 7 9800X3D con ajustes bajos.</p>
          <h3>2. Límites de FPS de la CPU y de la GPU</h3>
          <p>El límite de la CPU es su índice multiplicado por el factor de CPU del juego, ajustado según el preajuste de calidad y la RAM. El límite de la GPU es su índice escalado por la resolución (número de píxeles<sup>−0,62</sup>, que encaja mejor con los resultados medidos que una caída lineal), la calidad, el escalado, el factor de GPU del juego y una penalización cuando el juego necesita más VRAM de la que tiene la tarjeta.</p>
          <h3>3. Cómo se combinan</h3>
<div class="formula">Límite CPU = índice CPU × 2,0 × tipo de juego × factor CPU del juego × calidad × RAM
Límite GPU = índice GPU × 2,3 × (píxeles ÷ 1080p)^−0,62 × tipo de juego
             × factor GPU del juego × calidad × escalado × VRAM
FPS medios = mín. suave(límite CPU, límite GPU), con el tope de FPS del juego
Mín. 1%    ≈ 70–78% de la media, mejor con CPU X3D, peor con 8 GB de RAM</div>
          <p><strong>Precisión:</strong> en muchos equipos, las estimaciones suelen quedar a un 10–15% de la media de los benchmarks. Una prueba concreta puede variar más, porque los parches, los drivers, el mapa o la escena que pruebes, la velocidad de la RAM, la refrigeración y las aplicaciones en segundo plano mueven la cifra. Usa el resultado para comparar piezas y ajustes, no como una garantía para una sesión de juego concreta.</p>
        </section>

        <section id="games">
          <h2>Juegos compatibles y cómo cargan tu PC</h2>
          <p>El perfil de cada juego de un vistazo. El «tipo de motor» es la carga de trabajo en la que se basa el perfil, y el tope es un límite de FPS que impone el propio juego.</p>
          ${T.profiles}
          <p>¿Juegas a otra cosa? Elige el tipo de juego que encaje. <strong>AAA</strong> sirve para la mayoría de los grandes lanzamientos para un jugador, <strong>Esports</strong> para shooters competitivos ligeros y MOBA, <strong>Exigentes en CPU</strong> para juegos de estrategia, simuladores y MMO, y <strong>Ray tracing</strong> para juegos con RT o path tracing activado.</p>
        </section>

        <section id="builds">
          <h2>FPS en juegos populares con equipos habituales</h2>
          <p>FPS medios estimados en calidad Alta y resolución nativa, cada equipo a la resolución para la que se suele comprar. Selecciona un número para abrir ese equipo y ese juego en la calculadora.</p>
          ${T.builds}
          <p>¿Prefieres ver el cuello de botella de un equipo? Usa la <a href="../"><strong>calculadora de cuello de botella</strong></a> o consulta las <a href="../../bottleneck/" hreflang="en">combinaciones populares de CPU y GPU</a> (en inglés).</p>
        </section>

        <section id="targets-guide">
          <h2>¿Cuántos FPS necesitas? 60, 144 y 240 Hz</h2>
          <p>Más FPS solo ayudan hasta lo que tu monitor puede mostrar. Un monitor de 144 Hz enseña como mucho 144 fotogramas por segundo, así que 300 FPS no se verán más fluidos, aunque sí reducen un poco la latencia en juegos competitivos.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Objetivo</th><th>Para quién</th><th>Qué hace falta</th></tr></thead>
              <tbody>
                <tr><td><strong>60 FPS</strong></td><td>Juegos para un jugador, de historia y de simulación en un monitor o una tele de 60 Hz</td><td>Normalmente limita la GPU. Casi cualquier CPU moderna de 6 núcleos basta.</td></tr>
                <tr><td><strong>144 FPS</strong></td><td>La mayoría de jugadores con un monitor de 144–180 Hz, shooters y juegos de acción</td><td>Una GPU de gama media a 1080p o 1440p y una CPU de 2022 o posterior.</td></tr>
                <tr><td><strong>240 FPS</strong></td><td>Jugadores competitivos de CS2, Valorant, Fortnite y Apex</td><td>Sobre todo limita la CPU. Los chips X3D como el 7800X3D y el 9800X3D brillan aquí, con ajustes bajos o medios.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Si tus FPS no llegan a la frecuencia de tu monitor, activa <strong>G-Sync o FreeSync</strong>. La frecuencia variable hace que 90 FPS en una pantalla de 144 Hz se vean fluidos y sin tearing. Si la superas, limita los FPS 3 o 4 fotogramas por debajo de la frecuencia del monitor para un ritmo de fotogramas más estable, menos latencia y menos calor.</p>
        </section>

        <section id="lows">
          <h2>FPS medios frente a mínimos del 1%</h2>
          <p>Los FPS medios son la cifra que citan la mayoría de los benchmarks, pero los <strong>mínimos del 1%</strong> (1% lows) deciden lo fluido que se siente un juego. El mínimo del 1% es la tasa del 1% de fotogramas más lentos, es decir, los tirones que notas en un tiroteo o al cargar una zona nueva. Un juego con una media de 120 FPS y mínimos de 50 se siente peor que otro con una media de 100 y mínimos de 80.</p>
          <p>Los mínimos sufren más cuando el límite es la <strong>CPU</strong>, porque los momentos de más acción añaden trabajo a una CPU que ya va al máximo. Las cachés L3 grandes ayudan mucho, y por eso los procesadores X3D tienen mínimos del 1% bastante mejores de lo que sugieren sus medias. La falta de RAM o de VRAM también provoca tirones: 8 GB de memoria del sistema y las tarjetas de 8 GB con texturas altas son las causas más habituales.</p>
        </section>

        <section id="boost">
          <h2>Cómo ganar FPS</h2>
          <h3>Si limita la GPU</h3>
          <ul>
            <li><strong>Activa DLSS, FSR o XeSS</strong> en modo Calidad para ganar en torno a un 30–50% de FPS con poca pérdida visible.</li>
            <li><strong>Baja primero los ajustes más pesados:</strong> ray tracing, sombras, niebla volumétrica y reflejos en espacio de pantalla. Las texturas apenas afectan a los FPS si tienes VRAM suficiente.</li>
            <li><strong>Prueba la generación de fotogramas</strong> (DLSS Frame Generation, FSR Frame Generation) en juegos para un jugador cuando ya tengas 60 FPS o más.</li>
          </ul>
          <h3>Si limita la CPU</h3>
          <ul>
            <li><strong>Activa XMP o EXPO</strong> y usa dos módulos de RAM en doble canal. La memoria lenta o en un solo canal puede costar un 10–25% de FPS en juegos exigentes en CPU.</li>
            <li><strong>Baja los ajustes que cargan la CPU:</strong> densidad de multitudes, distancia de visión, física y nivel de simulación. La calidad gráfica apenas importa aquí.</li>
            <li><strong>Cierra las aplicaciones en segundo plano</strong>, como navegadores y launchers, y usa el codificador por hardware de tu GPU al hacer streaming.</li>
            <li><strong>Mejora dentro de tu socket.</strong> En AM4, un Ryzen 7 5700X3D suele ser el salto grande más barato. La <a href="../">calculadora de cuello de botella</a> te dice qué CPU aprovecha al completo tu GPU.</li>
          </ul>
        </section>`,
    faqTitle: "Preguntas frecuentes",
    faq: [
      ["¿Qué precisión tiene esta calculadora de FPS?",
        "En muchos equipos, las estimaciones suelen quedar a un 10–15% de la media de los benchmarks. Los resultados concretos varían con los parches del juego, los drivers, el mapa o la escena, la velocidad de la RAM, la refrigeración y las aplicaciones en segundo plano. Usa las cifras para comparar hardware y ajustes, no como una promesa exacta para una partida."],
      ["¿Cómo calculo los FPS que dará mi PC?",
        "Elige tu CPU, tu tarjeta gráfica y el juego en la calculadora de arriba, y después ajusta la resolución y la calidad. La herramienta estima cuántos fotogramas puede preparar la CPU y cuántos puede renderizar la GPU, y muestra el menor de los dos como tus FPS medios, junto con los mínimos del 1% para cada resolución y preajuste."],
      ["¿Qué importa más para los FPS, la CPU o la GPU?",
        "Depende del juego y de la resolución. A 1440p y 4K en juegos AAA, lo que más importa es la GPU. En esports como CS2 y Valorant, a 1080p o en simuladores como Microsoft Flight Simulator, la CPU suele marcar el límite. La columna «Limitado por» de la calculadora te dice qué pieza limita en cada juego."],
      ["¿Por qué Elden Ring da 60 FPS en cualquier PC?",
        "Elden Ring está bloqueado a 60 FPS por el propio juego. Un hardware más rápido no sube ese tope, pero mantiene los tiempos de fotograma más estables y la tasa más cerca de unos 60 constantes. Apex Legends tiene un tope integrado parecido de 300 FPS."],
      ["¿Son suficientes 60 FPS para jugar?",
        "Sí: en juegos para un jugador y de historia, 60 FPS se sienten fluidos y responden bien. En shooters competitivos, 144 FPS o más en un monitor de alta frecuencia dan un movimiento claramente más suave y menos latencia. Muy poca gente se beneficia de más de 240 FPS."],
      ["¿La RAM afecta a los FPS?",
        "Sí, sobre todo a través de los mínimos del 1%. 8 GB de RAM provocan tirones en los juegos actuales, y la memoria en un solo canal o sin XMP/EXPO puede recortar un 10–25% los FPS cuando limita la CPU. Para jugar en 2026, lo ideal son 32 GB en doble canal."],
      ["¿Cuántos FPS añade DLSS o FSR?",
        "En juegos limitados por la GPU, el modo Calidad suele añadir un 30–50% de FPS y el modo Rendimiento un 60–90%. Si la CPU ya es el límite, el escalado aporta poco, porque la GPU no era lo que te frenaba. La generación de fotogramas es aparte y más o menos duplica los fotogramas mostrados, con un pequeño coste de latencia."],
      ["¿Por qué mis FPS reales son más bajos que la estimación?",
        "Las causas habituales son la RAM a velocidad de fábrica sin XMP/EXPO, un portátil o una caja pequeña que se calienta y baja frecuencias, el cable del monitor conectado a la placa base en lugar de a la tarjeta gráfica, drivers desactualizados, aplicaciones en segundo plano o un mapa o una escena especialmente exigentes. Comprueba el uso de la GPU con una superposición como MSI Afterburner: por debajo del 90% apunta a la CPU o a la RAM."],
      ["¿La calculadora de FPS sirve para portátiles?",
        "Sí. Incluye los procesadores y las gráficas de portátil más populares, marcados como «Portátil». Las GPU de portátil varían mucho según su límite de potencia y su refrigeración, así que los modelos finos y ligeros pueden ir un 10–25% por debajo de la estimación."],
    ],
  },
};
