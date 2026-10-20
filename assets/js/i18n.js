/*
 * UI strings for the calculators (English, Spanish, Japanese).
 *
 * I18N.t(key, vars) picks the language from <html lang> (or I18N.override,
 * which the build scripts set while pre-rendering a localized page) and falls
 * back to English. Values are strings with {name} placeholders or functions
 * of vars. English strings must stay identical to the original copy.
 * Load this before engine.js (engine.js requires it itself under Node).
 */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const LOCALES = { en: "en-US", es: "es-ES", ja: "ja-JP" };

  const en = {
    // ---- Engine tables
    "res.1080p.label": "1080p", "res.1080p.full": "1080p (1920×1080)",
    "res.1440p.label": "1440p", "res.1440p.full": "1440p (2560×1440)",
    "res.uw1440.label": "UW 1440p", "res.uw1440.full": "Ultrawide 1440p (3440×1440)",
    "res.4k.label": "4K", "res.4k.full": "4K (3840×2160)",
    "quality.low.label": "Low", "quality.medium.label": "Medium", "quality.high.label": "High", "quality.ultra.label": "Ultra",
    "workload.general.label": "AAA / mixed games", "workload.general.short": "AAA games",
    "workload.general.examples": "Cyberpunk 2077, Black Myth: Wukong, Elden Ring",
    "workload.esports.label": "Competitive esports", "workload.esports.short": "Esports",
    "workload.esports.examples": "CS2, Valorant, Fortnite (Performance), League of Legends",
    "workload.cpuheavy.label": "CPU-heavy (strategy, sims, MMO)", "workload.cpuheavy.short": "CPU-heavy",
    "workload.cpuheavy.examples": "MS Flight Simulator, Cities: Skylines II, WoW, Baldur's Gate 3 Act 3",
    "workload.raytracing.label": "Ray tracing / path tracing", "workload.raytracing.short": "Ray tracing",
    "workload.raytracing.examples": "Cyberpunk RT Overdrive, Alan Wake 2, Indiana Jones",
    "upscale.off.label": "Off (native)", "upscale.quality.label": "DLSS/FSR Quality",
    "upscale.balanced.label": "DLSS/FSR Balanced", "upscale.performance.label": "DLSS/FSR Performance",
    // Game types as used in a sentence ("≈120 FPS in AAA games").
    "gtype.general": "AAA games", "gtype.esports": "esports games", "gtype.cpuheavy": "CPU-heavy games", "gtype.raytracing": "ray-traced games",

    // ---- Verdicts
    "sev.excellent": "Excellent balance", "sev.good": "Minor bottleneck", "sev.moderate": "Moderate bottleneck", "sev.severe": "Severe bottleneck",
    "verdict.cpu.good": "Minor CPU bottleneck", "verdict.cpu.moderate": "Moderate CPU bottleneck", "verdict.cpu.severe": "Severe CPU bottleneck",
    "verdict.gpu.excellent": "Excellent balance", "verdict.gpu.good": "Well balanced (GPU-bound)",
    "verdict.gpu.moderate": "GPU-limited, CPU has headroom", "verdict.gpu.severe": "Heavily GPU-limited",

    // ---- Summary paragraph (engine)
    "sum.excellent": (v) => `The ${v.c} and ${v.g} are an excellent match at ${v.res}. Neither part holds the other back, and you can expect around ${v.fps} FPS in ${v.wl.toLowerCase()} at ${v.q} settings.`,
    "sum.cpu": "The {c} limits the {g} at {res}. Your graphics card could render about {diff} more FPS, but the CPU can only prepare around {cpuFps} frames per second.",
    "sum.cpu.big": " Upgrading the CPU, or playing at a higher resolution, will make better use of this GPU.",
    "sum.cpu.small": " That's a small gap you're unlikely to notice.",
    "sum.gpu": "Your {g} is the limiting part at {res}, which is the normal and preferred situation for gaming. The {c} has headroom for about {cpuFps} FPS, so it can handle a faster GPU later.",
    "sum.gpu.low": " FPS is below 60, so lower settings or enable upscaling.",

    // ---- Tips (engine)
    "tip.res": "Your GPU has headroom. Playing at 1440p would cost little FPS (≈{fps} FPS) and drops the bottleneck to {pct}%.",
    "tip.upscaleCpu": "You are CPU-bound, so DLSS/FSR upscaling adds little FPS here. Try running native resolution or DLAA for sharper image quality at nearly the same frame rate.",
    "tip.qualityFree": "Raising graphics quality is almost free while CPU-bound — the GPU is idling anyway.",
    "tip.below60": "Below 60 FPS and GPU-bound: enable DLSS/FSR/XeSS Quality mode or drop to Medium settings for a big frame-rate gain.",
    "tip.vram": "{vram} GB of VRAM is below the ~{need} GB these settings need. Lower texture quality to avoid stutter and texture pop-in.",
    "tip.ram8": "8 GB of RAM is a bottleneck by itself in 2026 — expect stutter. 16 GB is the minimum, 32 GB is recommended.",
    "tip.noRt": "{gpu} has no hardware ray tracing cores. Ray tracing will run very slowly or not at all.",
    "tip.stream": "Streaming? Use your GPU's hardware encoder (NVENC, AMD AMF or Intel Quick Sync) instead of x264 to take the encoding load off your CPU.",
    "tip.overHz": "You'll exceed your {hz} Hz monitor (≈{fps} FPS). Cap FPS a few frames below {hz} for lower latency and less heat, or consider a higher refresh-rate monitor.",
    "tip.underHz": "Your {hz} Hz monitor can show more frames than this build delivers. Variable refresh (G-Sync/FreeSync) will keep motion smooth.",
    "tip.laptop": "Laptop results assume a well-cooled chassis at full power. Thin laptops with lower TGP limits can be 10–25% slower.",
    "tip.none": "This build is well matched for your settings. No changes needed.",

    // ---- Upgrade picks
    "up.stepUp": "Step up", "up.big": "Big upgrade", "up.match": "Best match for your CPU",
    "up.cpu.title": "CPU upgrades that fix this", "up.cpu.sub": "Slowest CPUs that keep your {g} fully fed. Click to try one.",
    "up.dropIn": "Drop-in upgrade · {socket}", "up.sameSocket": "Same socket · {socket}", "up.newPlatform": "New platform · {socket}",
    "up.gpu.title": "GPU upgrades for your CPU", "up.gpu.sub": "Your {c} can drive a faster card. Click to try one.",
    "up.title": "Upgrade suggestions", "up.sub": "The smallest upgrades that balance your build.",
    "up.laptop": "Laptop and integrated parts can't be upgraded separately. Use the recommendations to get the most out of this system.",
    "up.none": "No upgrade needed. These parts are well matched at these settings.",
    "up.balanced": "balanced",

    // ---- Calculator UI
    "meta.cpu": "{cores} cores / {threads} threads · {socket} · {year}",
    "meta.vram": "{vram} GB VRAM · ", "meta.shared": "Shared memory · ", "meta.rt": "Ray tracing ✓", "meta.noRt": "No hardware RT",
    "gauge.balanced": "bottleneck", "gauge.limited": "{lim} bottleneck",
    "pill.balanced": "Balanced", "pill.cpu": "CPU-limited", "pill.gpu": "GPU-limited",
    "limit.balanced": "Balanced",
    "pipe.aria": "CPU can deliver {cpu} FPS, GPU {gpu} FPS, display {hz} Hz.",
    "ctx.q": "{q}",
    "opt.upscaling": " · Upscaling", "opt.streaming": " · Streaming",
    "wl.sub": "At {res}, {q} settings.",
    "title.build": "{c} + {g} Bottleneck – Bottleneck Calculator",
    "toast.copied": "Result link copied", "prompt.copy": "Copy this link:",
    "combo.empty": "No match. Try only the model number, e.g. “4060”.",
    "badge.laptop": "Laptop", "badge.igpu": "iGPU",

    // ---- FPS calculator
    "fps.at": "{res} {q}",
    "fps.sum.capped": "{game} is locked to {cap} FPS, and the {c} with the {g} holds that cap at {at} with room to spare (≈{unc} FPS uncapped).",
    "fps.sum.lead": "Expect about {fps} FPS with 1% lows near {low} at {at}.",
    "fps.sum.excellent": "{lead} Both parts work close to their limit, so this build is well matched for {game}.",
    "fps.sum.cpu": "{lead} The {c} is the limit: the {g} could render about {gpuFps} FPS, so lowering graphics settings won't add much. Raising quality is nearly free.",
    "fps.sum.gpu": "{lead} The {g} sets the pace. Lower settings or DLSS/FSR raise FPS, and the {c} has headroom up to about {cpuFps} FPS.",
    "fps.tgt.capped": "{label}: not possible. {game} is locked to {cap} FPS.",
    "fps.tgt.reached": (v) => `${v.label}: reached at your settings (≈${v.fps} FPS)${v.q ? `, even at ${v.q}` : ""}.`,
    "fps.tgt.drop": "{label}: drop to {q} for ≈{fps} FPS.",
    "fps.tgt.cpu": "{label}: out of reach. The {c} tops out near {fps} FPS here even at Low, so a faster CPU is needed.",
    "fps.tgt.upscale": "{label}: possible at Low with {up} (≈{fps} FPS).",
    "fps.tgt.gpu": "{label}: out of reach at {res}. Even at Low the GPU manages about {fps} FPS.",
    "fps.gauge": "avg FPS · {hz} Hz",
    "fps.pill.capped": "Capped at {cap} FPS",
    "fps.title": "≈{fps} FPS in {game}",
    "fps.limit.cap": "Cap", "fps.limit.both": "Both", "fps.limit.game": "Game cap",
    "fps.grid.sub": "{game}, {mode}. Select a cell to use those settings.",
    "fps.grid.native": "native resolution",
    "fps.cell.aria": "{res} {q}: {fps} FPS",
    "fps.tip.type": "Averaged across {ex} and similar games. Pick a specific game for a closer estimate.",
    "fps.games.sub": "{c} + {g} at {res} {q}. Select a game to load it.",
    "fps.doc.title": "{game} FPS: {c} + {g} – FPS Calculator",
  };

  const es = {
    "res.uw1440.full": "Ultrawide 1440p (3440×1440)",
    "quality.low.label": "Bajo", "quality.medium.label": "Medio", "quality.high.label": "Alto", "quality.ultra.label": "Ultra",
    "workload.general.label": "AAA / juegos variados", "workload.general.short": "Juegos AAA",
    "workload.esports.label": "Esports competitivos", "workload.esports.short": "Esports",
    "workload.esports.examples": "CS2, Valorant, Fortnite (modo Rendimiento), League of Legends",
    "workload.cpuheavy.label": "Exigentes en CPU (estrategia, simuladores, MMO)", "workload.cpuheavy.short": "Exigentes en CPU",
    "workload.cpuheavy.examples": "MS Flight Simulator, Cities: Skylines II, WoW, Baldur's Gate 3 (acto 3)",
    "upscale.off.label": "Desactivado (nativo)", "upscale.quality.label": "DLSS/FSR Calidad",
    "upscale.balanced.label": "DLSS/FSR Equilibrado", "upscale.performance.label": "DLSS/FSR Rendimiento",
    "gtype.general": "juegos AAA", "gtype.esports": "juegos de esports", "gtype.cpuheavy": "juegos exigentes en CPU", "gtype.raytracing": "juegos con ray tracing",

    "sev.excellent": "Equilibrio excelente", "sev.good": "Cuello de botella leve", "sev.moderate": "Cuello de botella moderado", "sev.severe": "Cuello de botella grave",
    "verdict.cpu.good": "Cuello de botella de CPU leve", "verdict.cpu.moderate": "Cuello de botella de CPU moderado", "verdict.cpu.severe": "Cuello de botella de CPU grave",
    "verdict.gpu.excellent": "Equilibrio excelente", "verdict.gpu.good": "Bien equilibrado (limitado por GPU)",
    "verdict.gpu.moderate": "Limitado por GPU, la CPU tiene margen", "verdict.gpu.severe": "Muy limitado por la GPU",

    "sum.excellent": "El {c} y la {g} forman una pareja excelente a {res}. Ninguno frena al otro y puedes esperar unos {fps} FPS en {wlInline} con ajustes en {q}.",
    "sum.cpu": "El {c} frena a la {g} a {res}. Tu tarjeta gráfica podría renderizar unos {diff} FPS más, pero el procesador solo puede preparar unos {cpuFps} fotogramas por segundo.",
    "sum.cpu.big": " Cambiar de procesador, o jugar a una resolución más alta, aprovechará mucho mejor esta GPU.",
    "sum.cpu.small": " Es una diferencia pequeña que difícilmente notarás.",
    "sum.gpu": "Tu {g} es la pieza que marca el límite a {res}, que es la situación normal y la preferible para jugar. El {c} tiene margen para unos {cpuFps} FPS, así que podrá con una GPU más rápida en el futuro.",
    "sum.gpu.low": " No llegas a 60 FPS: baja los ajustes o activa el escalado.",

    "tip.res": "Tu GPU tiene margen. Jugar a 1440p apenas te costaría FPS (≈{fps} FPS) y reduciría el cuello de botella al {pct}%.",
    "tip.upscaleCpu": "Estás limitado por la CPU, así que el escalado DLSS/FSR apenas suma FPS aquí. Prueba la resolución nativa o DLAA: más nitidez casi con la misma tasa de fotogramas.",
    "tip.qualityFree": "Subir la calidad gráfica sale casi gratis mientras la CPU sea el límite: la GPU está esperando de todos modos.",
    "tip.below60": "Menos de 60 FPS y limitado por la GPU: activa DLSS/FSR/XeSS en modo Calidad o baja a ajustes medios para ganar muchos FPS.",
    "tip.vram": "{vram} GB de VRAM se quedan por debajo de los ~{need} GB que piden estos ajustes. Baja la calidad de las texturas para evitar tirones y texturas que cargan tarde.",
    "tip.ram8": "En 2026, 8 GB de RAM son un cuello de botella por sí solos: habrá tirones. 16 GB es el mínimo y 32 GB lo recomendable.",
    "tip.noRt": "La {gpu} no tiene núcleos de ray tracing por hardware. El ray tracing irá muy lento o directamente no funcionará.",
    "tip.stream": "¿Haces streaming? Usa el codificador por hardware de tu tarjeta gráfica (NVENC, AMD AMF o Intel Quick Sync) en lugar de x264 para quitarle esa carga al procesador.",
    "tip.overHz": "Superarás los {hz} Hz de tu monitor (≈{fps} FPS). Limita los FPS unos fotogramas por debajo de {hz} para reducir latencia y temperatura, o plantéate un monitor con más hercios.",
    "tip.underHz": "Tu monitor de {hz} Hz puede mostrar más fotogramas de los que da este equipo. La frecuencia variable (G-Sync/FreeSync) mantendrá la imagen fluida.",
    "tip.laptop": "Los resultados de portátiles suponen un chasis bien refrigerado a máxima potencia. Los portátiles finos con un TGP más bajo pueden rendir un 10–25% menos.",
    "tip.none": "Este equipo está bien equilibrado para tus ajustes. No hace falta cambiar nada.",

    "up.stepUp": "Un paso más", "up.big": "Gran salto", "up.match": "La pareja ideal para tu CPU",
    "up.cpu.title": "Procesadores que lo solucionan", "up.cpu.sub": "Las CPU más modestas que ya exprimen al máximo tu {g}. Haz clic para probar una.",
    "up.dropIn": "Cambio directo · {socket}", "up.sameSocket": "Mismo socket · {socket}", "up.newPlatform": "Nueva plataforma · {socket}",
    "up.gpu.title": "Tarjetas gráficas para tu CPU", "up.gpu.sub": "Tu {c} puede mover una tarjeta más rápida. Haz clic para probar una.",
    "up.title": "Sugerencias de mejora", "up.sub": "Las mejoras mínimas que equilibran tu equipo.",
    "up.laptop": "Las piezas de portátil y las gráficas integradas no se pueden cambiar por separado. Sigue las recomendaciones para sacar el máximo partido a este equipo.",
    "up.none": "No hace falta mejorar nada. Estas piezas están bien emparejadas con estos ajustes.",
    "up.balanced": "equilibrado",

    "meta.cpu": "{cores} núcleos / {threads} hilos · {socket} · {year}",
    "meta.shared": "Memoria compartida · ", "meta.noRt": "Sin RT por hardware",
    "socket.Laptop": "Portátil",
    "gauge.balanced": "cuello de botella", "gauge.limited": "cuello de botella de {lim}",
    "pill.balanced": "Equilibrado", "pill.cpu": "Limitado por CPU", "pill.gpu": "Limitado por GPU",
    "limit.balanced": "Equilibrado",
    "pipe.aria": "La CPU puede entregar {cpu} FPS, la GPU {gpu} FPS y el monitor {hz} Hz.",
    "opt.upscaling": " · Escalado", "opt.streaming": " · Streaming",
    "wl.sub": "A {res}, con ajustes en {q}.",
    "title.build": "Cuello de botella {c} + {g} – Calculadora de cuello de botella",
    "toast.copied": "Enlace del resultado copiado", "prompt.copy": "Copia este enlace:",
    "combo.empty": "Sin resultados. Prueba solo con el número de modelo, p. ej. «4060».",
    "badge.laptop": "Portátil",

    "fps.at": "{res} en {q}",
    "fps.sum.capped": "{game} está limitado a {cap} FPS, y el {c} con la {g} mantiene ese tope a {at} con margen de sobra (≈{unc} FPS sin límite).",
    "fps.sum.lead": "Espera unos {fps} FPS, con mínimos del 1% cerca de {low}, a {at}.",
    "fps.sum.excellent": "{lead} Ambas piezas trabajan cerca de su límite, así que este equipo está bien equilibrado para {game}.",
    "fps.sum.cpu": "{lead} El límite lo pone el {c}: la {g} podría renderizar unos {gpuFps} FPS, así que bajar los gráficos no sumará mucho. Subir la calidad sale casi gratis.",
    "fps.sum.gpu": "{lead} La {g} marca el ritmo. Bajar ajustes o usar DLSS/FSR sube los FPS, y el {c} tiene margen hasta unos {cpuFps} FPS.",
    "fps.tgt.capped": "{label}: imposible. {game} está limitado a {cap} FPS.",
    "fps.tgt.reached": (v) => `${v.label}: lo alcanzas con tus ajustes (≈${v.fps} FPS)${v.q ? `, incluso en ${v.q}` : ""}.`,
    "fps.tgt.drop": "{label}: baja a {q} para ≈{fps} FPS.",
    "fps.tgt.cpu": "{label}: fuera de alcance. Aquí el {c} se queda en unos {fps} FPS incluso en Bajo, así que hace falta un procesador más rápido.",
    "fps.tgt.upscale": "{label}: posible en Bajo con {up} (≈{fps} FPS).",
    "fps.tgt.gpu": "{label}: fuera de alcance a {res}. Incluso en Bajo la GPU solo da unos {fps} FPS.",
    "fps.gauge": "FPS medios · {hz} Hz",
    "fps.pill.capped": "Limitado a {cap} FPS",
    "fps.title": "≈{fps} FPS en {game}",
    "fps.limit.cap": "Tope", "fps.limit.both": "Ambas", "fps.limit.game": "Tope del juego",
    "fps.grid.sub": "{game}, {mode}. Selecciona una celda para usar esos ajustes.",
    "fps.grid.native": "resolución nativa",
    "fps.cell.aria": "{res} {q}: {fps} FPS",
    "fps.tip.type": "Media de {ex} y juegos similares. Elige un juego concreto para una estimación más precisa.",
    "fps.games.sub": "{c} + {g} a {res} en {q}. Selecciona un juego para cargarlo.",
    "fps.doc.title": "FPS en {game}: {c} + {g} – Calculadora de FPS",

    "note.cs2": "Source 2 exige más a la GPU que CS:GO. Los jugadores competitivos usan ajustes bajos o medios para lograr la tasa de FPS más alta.",
    "note.valorant": "Muy ligero para la GPU. Por encima de unos 400 FPS, la CPU y la velocidad de la RAM deciden tu tasa de fotogramas.",
    "note.fortnite": "DirectX 12, preajuste Alto sin Lumen ni Nanite. El modo Rendimiento va mucho más rápido en cualquier GPU.",
    "note.cyberpunk": "Solo rasterización. El ray tracing reduce estas cifras más o menos a la mitad; elige el tipo de juego Ray tracing para RT Overdrive.",
    "note.elden-ring": "El propio juego está bloqueado a 60 FPS. Una cifra más alta aquí solo significa más margen para unos tiempos de fotograma estables.",
    "note.gta-5": "GTA V Enhanced sin ray tracing. Las zonas concurridas de la ciudad y la distancia de dibujado son lo que más carga la CPU.",
    "note.warzone": "Consume mucha VRAM. Las tarjetas de 8 GB necesitan bajar las texturas para evitar tirones.",
    "note.apex": "El motor lo limita a 300 FPS. Las peleas grandes con muchos efectos son los momentos más exigentes.",
    "note.marvel-rivals": "Unreal Engine 5 con iluminación Lumen. Los ajustes bajos o el escalado ayudan mucho en tarjetas de gama media.",
    "note.bg3": "El acto 3 (la ciudad de Baldur's Gate) va un 25% más lento que estas medias y está limitado por la CPU en la mayoría de equipos.",
    "note.msfs-2024": "Los aeropuertos densos y las ciudades con fotogrametría son lo que más carga la CPU y la VRAM. La generación de fotogramas ayuda mucho aquí.",
    "note.minecraft": "Java vanilla a 12 chunks. Sodium puede casi duplicar estas cifras; los shaders lo vuelven exigente para la GPU.",
  };

  const ja = {
    "res.uw1440.full": "ウルトラワイド 1440p (3440×1440)",
    "quality.low.label": "低", "quality.medium.label": "中", "quality.high.label": "高", "quality.ultra.label": "最高",
    "workload.general.label": "AAA・一般的なゲーム", "workload.general.short": "AAAタイトル",
    "workload.general.examples": "Cyberpunk 2077、Black Myth: Wukong、ELDEN RING",
    "workload.esports.label": "競技系eスポーツ", "workload.esports.short": "eスポーツ",
    "workload.esports.examples": "CS2、VALORANT、フォートナイト（パフォーマンス）、League of Legends",
    "workload.cpuheavy.label": "CPU負荷大（ストラテジー・シム・MMO）", "workload.cpuheavy.short": "CPU負荷大",
    "workload.cpuheavy.examples": "MS Flight Simulator、Cities: Skylines II、WoW、バルダーズ・ゲート3（Act 3）",
    "workload.raytracing.label": "レイトレーシング／パストレーシング", "workload.raytracing.short": "レイトレーシング",
    "workload.raytracing.examples": "Cyberpunk RTオーバードライブ、Alan Wake 2、インディ・ジョーンズ",
    "upscale.off.label": "オフ（ネイティブ）", "upscale.quality.label": "DLSS/FSR クオリティ",
    "upscale.balanced.label": "DLSS/FSR バランス", "upscale.performance.label": "DLSS/FSR パフォーマンス",
    "gtype.general": "AAAタイトル", "gtype.esports": "eスポーツタイトル", "gtype.cpuheavy": "CPU負荷の高いゲーム", "gtype.raytracing": "レイトレーシング対応ゲーム",

    "sev.excellent": "非常に良いバランス", "sev.good": "軽度のボトルネック", "sev.moderate": "中程度のボトルネック", "sev.severe": "深刻なボトルネック",
    "verdict.cpu.good": "軽度のCPUボトルネック", "verdict.cpu.moderate": "中程度のCPUボトルネック", "verdict.cpu.severe": "深刻なCPUボトルネック",
    "verdict.gpu.excellent": "非常に良いバランス", "verdict.gpu.good": "バランス良好（GPU律速）",
    "verdict.gpu.moderate": "GPU律速・CPUに余裕あり", "verdict.gpu.severe": "強いGPU律速",

    "sum.excellent": "{c}と{g}は{res}で非常に相性の良い組み合わせです。どちらも足を引っ張らず、{q}画質の{wlInline}でおよそ{fps} FPSが期待できます。",
    "sum.cpu": "{res}では{c}が{g}の足を引っ張っています。グラボはあと約{diff} FPS多く描画できますが、CPUが準備できるのは毎秒約{cpuFps}フレームまでです。",
    "sum.cpu.big": "CPUをアップグレードするか、より高い解像度でプレイすれば、このGPUをもっと活かせます。",
    "sum.cpu.small": "差は小さく、体感することはほぼないでしょう。",
    "sum.gpu": "{res}では{g}が性能の上限になっています。これはゲーミングPCとしてごく普通で、むしろ望ましい状態です。{c}には約{cpuFps} FPSまで余裕があるので、将来もっと速いGPUに載せ替えても対応できます。",
    "sum.gpu.low": "60 FPSを下回っているので、画質を下げるかアップスケーリングを有効にしましょう。",

    "tip.res": "GPUには余裕があります。1440pでプレイしてもFPSはほとんど下がらず（≈{fps} FPS）、ボトルネックは{pct}%まで縮まります。",
    "tip.upscaleCpu": "CPU律速なので、DLSS/FSRのアップスケーリングではFPSがほとんど伸びません。ネイティブ解像度やDLAAにすれば、ほぼ同じフレームレートのまま画質がシャープになります。",
    "tip.qualityFree": "CPU律速の間は、画質設定を上げてもほぼノーコストです。どのみちGPUは手が空いています。",
    "tip.below60": "60 FPS未満でGPU律速です。DLSS/FSR/XeSSのクオリティモードを有効にするか、画質を「中」に下げると大きくFPSが伸びます。",
    "tip.vram": "VRAM {vram}GBは、この設定に必要な約{need}GBを下回っています。テクスチャ品質を下げれば、カクつきやテクスチャの遅延表示を防げます。",
    "tip.ram8": "2026年の今、RAM 8GBはそれだけでボトルネックになり、カクつきが出ます。最低16GB、推奨は32GBです。",
    "tip.noRt": "{gpu}はハードウェアのレイトレーシングコアを搭載していません。レイトレーシングは非常に重いか、そもそも動作しません。",
    "tip.stream": "配信をするなら、x264ではなくグラボのハードウェアエンコーダー（NVENC、AMD AMF、Intel Quick Sync）を使えば、CPUのエンコード負荷をなくせます。",
    "tip.overHz": "{hz}Hzモニターの上限を超えます（≈{fps} FPS）。FPSを{hz}より数フレーム低く制限すると遅延と発熱を抑えられます。より高リフレッシュレートのモニターも検討の価値ありです。",
    "tip.underHz": "{hz}Hzモニターは、この構成が出せる以上のフレームを表示できます。可変リフレッシュレート（G-SYNC/FreeSync）を使えば動きを滑らかに保てます。",
    "tip.laptop": "ノートPCの結果は、冷却が十分でフルパワーで動作する筐体を想定しています。TGPの低い薄型ノートでは10〜25%遅くなることがあります。",
    "tip.none": "この設定ならバランスの取れた構成です。変更の必要はありません。",

    "up.stepUp": "ワンランク上", "up.big": "大幅アップグレード", "up.match": "このCPUに最適",
    "up.cpu.title": "ボトルネックを解消するCPU", "up.cpu.sub": "{g}の性能を引き出せる、必要十分なCPUです。クリックで試せます。",
    "up.dropIn": "載せ替えのみ · {socket}", "up.sameSocket": "同じソケット · {socket}", "up.newPlatform": "新プラットフォーム · {socket}",
    "up.gpu.title": "このCPUに合うグラボ", "up.gpu.sub": "{c}なら、もっと速いグラボも活かせます。クリックで試せます。",
    "up.title": "アップグレード候補", "up.sub": "構成のバランスを整える最小限のアップグレードです。",
    "up.laptop": "ノートPCや内蔵GPUのパーツは個別に交換できません。おすすめの設定を参考に、この構成の性能を引き出しましょう。",
    "up.none": "アップグレードは不要です。この設定ではパーツのバランスが取れています。",
    "up.balanced": "バランス良好",

    "meta.cpu": "{cores}コア / {threads}スレッド · {socket} · {year}",
    "meta.shared": "共有メモリ · ", "meta.rt": "レイトレーシング ✓", "meta.noRt": "RTコア非搭載",
    "socket.Laptop": "ノートPC",
    "gauge.balanced": "ボトルネック", "gauge.limited": "{lim}ボトルネック",
    "pill.balanced": "バランス良好", "pill.cpu": "CPU律速", "pill.gpu": "GPU律速",
    "limit.balanced": "バランス良好",
    "pipe.aria": "CPUは{cpu} FPS、GPUは{gpu} FPSまで出力でき、ディスプレイは{hz} Hzです。",
    "ctx.q": "{q}画質",
    "opt.upscaling": " · アップスケーリング", "opt.streaming": " · 配信",
    "wl.sub": "{res}・{q}画質の場合。",
    "title.build": "{c} + {g} のボトルネック – ボトルネックチェッカー",
    "toast.copied": "結果のリンクをコピーしました", "prompt.copy": "このリンクをコピーしてください:",
    "combo.empty": "該当なし。型番だけで検索してみてください（例: 4060）。",
    "badge.laptop": "ノート",

    "fps.at": "{res}・{q}画質",
    "fps.sum.capped": "{game}はゲーム側で{cap} FPSに制限されています。{c}と{g}なら、{at}でも余裕をもってその上限を維持できます（制限なしなら≈{unc} FPS）。",
    "fps.sum.lead": "{at}で平均約{fps} FPS、1% Lowは{low}前後の見込みです。",
    "fps.sum.excellent": "{lead}両パーツとも限界近くまで働いており、{game}に対してバランスの良い構成です。",
    "fps.sum.cpu": "{lead}上限を決めているのは{c}です。{g}は約{gpuFps} FPSまで描画できるので、画質を下げてもFPSはあまり伸びません。逆に画質を上げてもほぼノーコストです。",
    "fps.sum.gpu": "{lead}ペースを決めているのは{g}です。画質を下げるかDLSS/FSRを使えばFPSが伸び、{c}には約{cpuFps} FPSまで余裕があります。",
    "fps.tgt.capped": "{label}：達成不可。{game}は{cap} FPSに制限されています。",
    "fps.tgt.reached": (v) => `${v.label}：今の設定で達成（≈${v.fps} FPS）${v.q ? `。${v.q}画質でも届きます` : ""}。`,
    "fps.tgt.drop": "{label}：{q}画質に下げれば≈{fps} FPS。",
    "fps.tgt.cpu": "{label}：届きません。このゲームでは{c}は低画質でも約{fps} FPSが上限なので、より速いCPUが必要です。",
    "fps.tgt.upscale": "{label}：低画質＋{up}なら可能（≈{fps} FPS）。",
    "fps.tgt.gpu": "{label}：{res}では届きません。低画質でもGPUは約{fps} FPSにとどまります。",
    "fps.gauge": "平均FPS · {hz} Hz",
    "fps.pill.capped": "{cap} FPSで頭打ち",
    "fps.title": "{game}で≈{fps} FPS",
    "fps.limit.cap": "上限", "fps.limit.both": "両方", "fps.limit.game": "ゲーム側上限",
    "fps.grid.sub": "{game}・{mode}。セルを選ぶとその設定を適用します。",
    "fps.grid.native": "ネイティブ解像度",
    "fps.cell.aria": "{res} {q}画質: {fps} FPS",
    "fps.tip.type": "{ex}などの平均値です。個別のゲームを選ぶと、より正確に推定できます。",
    "fps.games.sub": "{c} + {g}、{res}・{q}画質。ゲームを選ぶと読み込みます。",
    "fps.doc.title": "{game}のFPS：{c} + {g} – FPS計算ツール",

    "note.cs2": "Source 2はCS:GOよりGPU負荷が高めです。競技勢は少しでもFPSを稼ぐため低〜中設定を使います。",
    "note.valorant": "GPU負荷は非常に軽め。約400 FPSを超えると、CPUとメモリの速度がフレームレートを決めます。",
    "note.fortnite": "DirectX 12、Lumen・Naniteなしの「高」プリセット。パフォーマンスモードならどのGPUでも大幅に速くなります。",
    "note.cyberpunk": "ラスタライズのみ。レイトレーシングを有効にするとおおむね半分になります。RTオーバードライブはゲームタイプ「レイトレーシング」を選んでください。",
    "note.elden-ring": "ゲーム側で60 FPSに固定されています。ここで高い数値が出ても、フレームタイムを安定させる余裕が増えるだけです。",
    "note.gta-5": "レイトレーシングなしのGTA V Enhanced。人の多い市街地と長い描画距離がCPUに最も負荷をかけます。",
    "note.warzone": "VRAMを多く使います。8GBのグラボではカクつきを避けるためにテクスチャ設定を下げる必要があります。",
    "note.apex": "エンジン側で300 FPSが上限です。エフェクトの多い大規模戦闘が最も重い場面です。",
    "note.marvel-rivals": "Lumenライティングを使うUnreal Engine 5タイトル。ミドルクラスのグラボでは低設定やアップスケーリングが大きく効きます。",
    "note.bg3": "Act 3（バルダーズ・ゲートの街）はこの平均より約25%重く、ほとんどのPCでCPU律速になります。",
    "note.msfs-2024": "密集した空港やフォトグラメトリーの都市がCPUとVRAMに最も負荷をかけます。フレーム生成の効果が大きいタイトルです。",
    "note.minecraft": "バニラのJava版、描画距離12チャンク。Sodiumを入れるとおおむね2倍近くになり、シェーダーパックを入れるとGPU負荷が高くなります。",
  };

  const I18N = { en, es, ja, override: null, LOCALES };

  // Current language: build-time override, else <html lang>, else English.
  I18N.lang = function () {
    const l = (I18N.override || (typeof document !== "undefined" && document.documentElement.lang) || "en").slice(0, 2).toLowerCase();
    return LOCALES[l] ? l : "en";
  };

  I18N.t = function (key, vars, fallback) {
    const l = I18N.lang();
    let s = I18N[l][key];
    if (s === undefined) s = en[key];
    if (s === undefined) s = fallback;
    if (s === undefined) return key;
    if (typeof s === "function") return s(vars || {});
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
  };

  // Rounded integer in the page's locale (en-US for English, as before).
  I18N.fmt = (n) => Math.round(n).toLocaleString(LOCALES[I18N.lang()]);
  // One decimal place (frame times). English keeps toFixed's output.
  I18N.dec1 = (n) => I18N.lang() === "en" ? n.toFixed(1)
    : n.toLocaleString(LOCALES[I18N.lang()], { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // Spec lines under the CPU/GPU pickers (shared by both calculators and the build).
  I18N.meta = {
    cpu: (c) => I18N.t("meta.cpu", { cores: c.cores, threads: c.threads, socket: I18N.t(`socket.${c.socket}`, null, c.socket), year: c.year }),
    gpu: (g) => `${g.vram ? I18N.t("meta.vram", { vram: g.vram }) : I18N.t("meta.shared")}${I18N.t(g.rt ? "meta.rt" : "meta.noRt")} · ${g.year}`,
  };

  root.I18N = I18N;
})();
