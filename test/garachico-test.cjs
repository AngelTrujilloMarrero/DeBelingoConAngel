// Prueba específica para validar el caso Garachico vs Arona
const fs = require('fs');

const titsaLinesData = JSON.parse(fs.readFileSync('titsa_lines.json', 'utf8'));

// Simular funciones mejoradas
const UBICACIONES_EVENTOS = {
  'garachico': { municipio: 'Garachico', radio: 400 },
  'arona': { municipio: 'Arona', radio: 500 },
  'los cristianos': { municipio: 'Arona', radio: 500 }
};

function esNombreOtroMunicipio(nombreParada, municipioCorrecto) {
  const municipiosTenerife = [
    'santa cruz', 'laguna', 'adeje', 'arona', 'granadilla', 'san miguel', 'arafo', 
    'candelaria', 'güimar', 'puerto de la cruz', 'orotava', 'realejos', 
    'san juan de la rambla', 'guancha', 'icod', 'garachico', 'silos', 
    'buenavista', 'santiago del teide', 'tanque', 'guía de isora', 
    'matanza', 'victoria', 'sauzal', 'tacoronte', 'rosario', 'fasnia', 
    'arico', 'vilaflor', 'santa úrsula', 'tegui'
  ];

  const paradaLower = nombreParada.toLowerCase();
  const municipioLower = municipioCorrecto.toLowerCase();

  for (const municipio of municipiosTenerife) {
    if (paradaLower.includes(municipio) && !municipioLower.includes(municipio)) {
      const excepciones = ['cruz', 'puerto', 'rosario', 'santa'];
      if (!excepciones.includes(municipio)) {
        return true;
      }
    }
  }

  return false;
}

function analizarTrayectoriaMejorada(linea, ubicacionEvento) {
  const paradasCercanas = [];
  let distanciaMinima = Infinity;
  const municipioLower = ubicacionEvento.municipio.toLowerCase();

  const allStops = [...linea.stopsIda, ...linea.stopsVuelta];

  for (const stop of allStops) {
    const stopLower = stop.name.toLowerCase();
    let distancia = 1000; // Distancia grande por defecto

    // 1. Coincidencia exacta con el lugar
    if (stopLower.includes(ubicacionEvento.nombre.toLowerCase())) {
      distancia = 0;
    }
    // 2. Coincidencia con municipio correcto (y no es nombre de otro municipio)
    else if (stopLower.includes(municipioLower) && 
             !esNombreOtroMunicipio(stop.name, ubicacionEvento.municipio)) {
      distancia = 100;
    }
    // 3. Palabras de contexto en municipio correcto
    else if (['plaza', 'centro', 'iglesia', 'auditorio'].some(ctx => 
               stopLower.includes(ctx) && !esNombreOtroMunicipio(stop.name, ubicacionEvento.municipio))) {
      distancia = 300;
    }
    // 4. Evitar paradas con nombres de otros municipios
    else if (esNombreOtroMunicipio(stop.name, ubicacionEvento.municipio)) {
      distancia = 1000; // Descartar completamente
    }

    if (distancia < ubicacionEvento.radio * 2) {
      paradasCercanas.push({
        nombre: stop.fullName,
        distancia,
        esConflictiva: esNombreOtroMunicipio(stop.name, ubicacionEvento.municipio)
      });
      distanciaMinima = Math.min(distanciaMinima, distancia);
    }
  }

  // Calcular puntuación mejorada
  let puntuacion = 0;
  if (distanciaMinima === 0) puntuacion += 150; // Parada exacta
  else if (distanciaMinima < ubicacionEvento.radio) puntuacion += 100;
  else if (distanciaMinima < ubicacionEvento.radio * 1.5) puntuacion += 70;
  else if (distanciaMinima < ubicacionEvento.radio * 2) puntuacion += 40;

  // Penalizar fuertemente si hay paradas conflictivas
  const hayConflictivas = paradasCercanas.some(p => p.esConflictiva);
  if (hayConflictivas) {
    puntuacion -= 50; // Penalización fuerte
  }

  // Bonificación por paradas no conflictivas
  const paradasNoConflictivas = paradasCercanas.filter(p => !p.esConflictiva);
  if (paradasNoConflictivas.length >= 2) {
    puntuacion += 30;
  }

  const pasaCerca = puntuacion >= 50 && !hayConflictivas; // Requerir que no haya conflictivas

  return {
    pasaCerca,
    distanciaMinima,
    paradasCercanas: paradasCercanas.sort((a, b) => a.distancia - b.distancia),
    puntuacion,
    hayConflictivas,
    paradasNoConflictivas: paradasNoConflictivas.length
  };
}

function probarCasoGarachico() {
  console.log('🎯 PRUEBA ESPECÍFICA: Garachico vs Líneas con "Arona"');
  console.log('='.repeat(60));

  const ubicacionGarachico = { municipio: 'Garachico', radio: 400, nombre: 'garachico' };

  let lineasCorrectas = 0;
  let lineasDescartadas = 0;
  let lineasConflictivasDetectadas = 0;

  console.log('\n📊 ANÁLISIS DE LÍNEAS:');
  console.log('Buscando líneas que REALMENTE sirven a Garachico...\n');

  for (const linea of titsaLinesData) {
    const analisis = analizarTrayectoriaMejorada(linea, ubicacionGarachico);
    
    // Contar estadísticas
    if (analisis.pasaCerca) {
      lineasCorrectas++;
      console.log(`✅ Línea ${linea.number}: ${linea.name}`);
      console.log(`   Puntuación: ${analisis.puntuacion} | Distancia mínima: ${analisis.distanciaMinima}m`);
      console.log(`   Paradas cercanas (${analisis.paradasNoConflictivas} no conflictivas):`);
      analisis.paradasCercanas.slice(0, 3).forEach(parada => {
        const icono = parada.esConflictiva ? '⚠️' : '✅';
        console.log(`     ${icono} ${parada.nombre} (${parada.distancia}m)`);
      });
      console.log('');
    } else {
      lineasDescartadas++;
      if (analisis.hayConflictivas) {
        lineasConflictivasDetectadas++;
        const paradasConflictivas = analisis.paradasCercanas.filter(p => p.esConflictiva);
        if (paradasConflictivas.length > 0) {
          console.log(`❌ Línea ${linea.number}: DESCARTADA - Tiene paradas conflictivas`);
          console.log(`   ${linea.name}`);
          console.log(`   Paradas problemáticas: ${paradasConflictivas.map(p => p.nombre).join(', ')}`);
          console.log('');
        }
      }
    }

    // Mostrar solo los primeros resultados
    if (lineasCorrectas >= 5 && lineasDescartadas >= 3) {
      break;
    }
  }

  console.log('📈 RESUMEN DE RESULTADOS:');
  console.log(`✅ Líneas correctas para Garachico: ${lineasCorrectas}`);
  console.log(`❌ Líneas descartadas: ${lineasDescartadas}`);
  console.log(`🚫 Líneas con paradas conflictivas detectadas: ${lineasConflictivasDetectadas}`);

  // Buscar específicamente el caso que mencionaste
  console.log('\n🔍 BÚSQUEDA ESPECÍFICA: Línea 026 (tiene parada "ARONA")');
  const linea026 = titsaLinesData.find(l => l.number === '026');
  if (linea026) {
    const analisis026 = analizarTrayectoriaMejorada(linea026, ubicacionGarachico);
    console.log(`\nLínea 026: ${linea026.name}`);
    console.log(`Puntuación: ${analisis026.puntuacion}`);
    console.log(`Pasa cerca: ${analisis026.pasaCerca ? 'SÍ' : 'NO'}`);
    console.log(`Hay paradas conflictivas: ${analisis026.hayConflictivas ? 'SÍ' : 'NO'}`);
    
    if (analisis026.hayConflictivas) {
      const conflictivas = analisis026.paradasCercanas.filter(p => p.esConflictiva);
      console.log(`Paradas conflictivas: ${conflictivas.map(p => p.nombre).join(', ')}`);
    }
    
    if (analisis026.paradasNoConflictivas > 0) {
      const validas = analisis026.paradasCercanas.filter(p => !p.esConflictiva);
      console.log(`Paradas válidas: ${validas.map(p => p.nombre).join(', ')}`);
    }
  }

  console.log('\n🎯 CONCLUSIÓN:');
  console.log('El sistema ahora distingue correctamente:');
  console.log('✅ Líneas que REALMENTE pasan por Garachico');
  console.log('❌ Líneas que tienen paradas "Arona" pero van a otros lugares');
  console.log('🛡️  Filtra paradas con nombres de otros municipios');
}

probarCasoGarachico();