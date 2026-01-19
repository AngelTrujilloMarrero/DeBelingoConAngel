// Prueba específica para validar el análisis de trayectoria
const fs = require('fs');

// Cargar datos de líneas
const titsaLinesData = JSON.parse(fs.readFileSync('titsa_lines.json', 'utf8'));

// Simular funciones simplificadas de trayectoria
const UBICACIONES_EVENTOS = {
  'magma arts congress': { municipio: 'Adeje', radio: 400 },
  'los cristianos': { municipio: 'Arona', radio: 500 },
  'puerto de la cruz': { municipio: 'Puerto de la Cruz', radio: 600 },
  'garachico': { municipio: 'Garachico', radio: 400 },
  'icod de los vinos': { municipio: 'Icod de los Vinos', radio: 500 }
};

function encontrarUbicacionEvento(municipio, lugar) {
  const municipioLower = municipio.toLowerCase();
  const lugarLower = lugar?.toLowerCase() || '';

  for (const [nombreLugar, ubicacion] of Object.entries(UBICACIONES_EVENTOS)) {
    if (lugarLower && (
      lugarLower.includes(nombreLugar) || 
      nombreLugar.includes(lugarLower) ||
      ubicacion.municipio.toLowerCase() === municipioLower
    )) {
      return { ...ubicacion, tipo: 'lugar_especifico', nombre: nombreLugar };
    }
  }

  return { municipio, radio: 500, tipo: 'centro_municipio', nombre: `Centro ${municipio}` };
}

function analizarTrayectoriaLinea(linea, ubicacionEvento) {
  const paradasCercanas = [];
  let distanciaMinima = Infinity;

  const allStops = [...linea.stopsIda, ...linea.stopsVuelta];

  for (const stop of allStops) {
    const stopLower = stop.name.toLowerCase();
    const eventoLower = ubicacionEvento.nombre.toLowerCase();
    
    let distancia = 1000; // Distancia grande por defecto

    // Coincidencia exacta o muy cercana
    if (stopLower.includes(eventoLower) || eventoLower.includes(stopLower)) {
      distancia = 0;
    }
    // Coincidencias parciales
    else if (eventoLower.split(/\s+/).some(palabra => 
             palabra.length > 2 && stopLower.includes(palabra))) {
      distancia = 200;
    }
    // Palabras de contexto
    else if (['plaza', 'centro', 'iglesia', 'auditorio', 'teatro', 'museo'].some(palabra => 
             stopLower.includes(palabra) && eventoLower.includes(palabra))) {
      distancia = 300;
    }

    if (distancia < ubicacionEvento.radio * 2) {
      paradasCercanas.push({
        nombre: stop.fullName,
        distancia
      });
      distanciaMinima = Math.min(distanciaMinima, distancia);
    }
  }

  // Calcular puntuación
  let puntuacion = 0;
  if (distanciaMinima < ubicacionEvento.radio) puntuacion += 100;
  else if (distanciaMinima < ubicacionEvento.radio * 1.5) puntuacion += 70;
  else if (distanciaMinima < ubicacionEvento.radio * 2) puntuacion += 40;

  if (paradasCercanas.length >= 3) puntuacion += 20;
  else if (paradasCercanas.length >= 2) puntuacion += 10;

  const pasaCerca = puntuacion >= 40;

  return {
    pasaCerca,
    distanciaMinima,
    paradasCercanas: paradasCercanas.sort((a, b) => a.distancia - b.distancia),
    puntuacion
  };
}

function probarTrayectoria() {
  console.log('🎯 PRUEBA DE ANÁLISIS DE TRAYECTORIA');
  console.log('='.repeat(60));

  const casosPrueba = [
    { municipio: 'Adeje', lugar: 'Magma Arts Congress', descripcion: 'Evento específico con ubicación conocida' },
    { municipio: 'Arona', lugar: 'Los Cristianos', descripcion: 'Población turística importante' },
    { municipio: 'Puerto de la Cruz', lugar: undefined, descripcion: 'Municipio sin lugar específico' },
    { municipio: 'Garachico', lugar: undefined, descripcion: 'Municipio pequeño que debe evitar líneas de paso' },
    { municipio: 'Icod de los Vinos', lugar: undefined, descripcion: 'Municipio norte con paradas conflictivas' }
  ];

  casosPrueba.forEach((caso, index) => {
    console.log(`\n📍 CASO ${index + 1}: ${caso.descripcion}`);
    console.log(`   Municipio: ${caso.municipio}, Lugar: ${caso.lugar || 'No especificado'}`);
    console.log('-'.repeat(50));

    const ubicacion = encontrarUbicacionEvento(caso.municipio, caso.lugar);
    console.log(`🎯 Ubicación detectada: ${ubicacion.nombre} (Radio: ${ubicacion.radio}m)`);

    let lineasCercanas = 0;
    let lineasLejanas = 0;
    const mejoresLineas = [];

    for (const linea of titsaLinesData) {
      const analisis = analizarTrayectoriaLinea(linea, ubicacion);
      
      if (analisis.pasaCerca) {
        lineasCercanas++;
        if (mejoresLineas.length < 5) {
          mejoresLineas.push({
            linea: linea.number,
            nombre: linea.name,
            puntuacion: analisis.puntuacion,
            paradas: analisis.paradasCercanas.slice(0, 2).map(p => p.nombre)
          });
        }
      } else {
        lineasLejanas++;
      }
    }

    mejoresLineas.sort((a, b) => b.puntuacion - a.puntuacion);

    console.log(`\n📊 Resultados:`);
    console.log(`   Líneas que pasan cerca: ${lineasCercanas}`);
    console.log(`   Líneas que no pasan cerca: ${lineasLejanas}`);
    console.log(`   Porcentaje de cobertura: ${((lineasCercanas / titsaLinesData.length) * 100).toFixed(1)}%`);

    if (mejoresLineas.length > 0) {
      console.log(`\n🏆 Mejores líneas para este evento:`);
      mejoresLineas.forEach((linea, idx) => {
        console.log(`   ${idx + 1}. Línea ${linea.linea}: ${linea.nombre}`);
        console.log(`      Puntuación: ${linea.puntuacion}`);
        console.log(`      Paradas: ${linea.paradas.join(', ')}`);
      });
    } else {
      console.log('\n❌ No se encontraron líneas cercanas');
    }

    // Ejemplo de línea que NO debería aparecer
    console.log(`\n🚫 Ejemplo de líneas que NO deberían aparecer:`);
    for (const linea of titsaLinesData.slice(0, 10)) {
      const analisis = analizarTrayectoriaLinea(linea, ubicacion);
      if (!analisis.pasaCerca) {
        console.log(`   ❌ Línea ${linea.number}: ${linea.name}`);
        console.log(`      Razón: Distancia mínima ${analisis.distanciaMinima}m > ${ubicacion.radio}m`);
        break;
      }
    }

    console.log('\n' + '='.repeat(60));
  });
}

// Ejecutar la prueba
probarTrayectoria();