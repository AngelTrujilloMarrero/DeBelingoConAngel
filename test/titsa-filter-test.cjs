// Script de prueba para detectar paradas conflictivas y probar el sistema mejorado
// Importación directa para pruebas
const fs = require('fs');
const path = require('path');

// Cargar el fichero de datos
const titsaLinesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../titsa_lines.json'), 'utf8'));

// Funciones simplificadas para la prueba
function esParadaEngañosa(nombreParada, municipioBuscado) {
  const nombreLower = nombreParada.toLowerCase();
  const municipioLower = municipioBuscado.toLowerCase();
  
  const municipiosValidos = [
    'santa cruz de tenerife', 'san cristóbal de la laguna', 'adeje', 'arona',
    'granadilla de abona', 'san miguel de abona', 'arafo', 'candelaria', 'güímar',
    'puerto de la cruz', 'la orotava', 'los realejos', 'san juan de la rambla',
    'la guancha', 'icod de los vinos', 'garachico', 'los silos', 'buenavista del norte',
    'santiago del teide', 'el tanque', 'guía de isora', 'la matanza de acentejo',
    'la victoria de acentejo', 'el sauzal', 'tacoronte', 'el rosario', 'fasnia',
    'arico', 'vilaflor', 'santa úrsula', 'tegui'
  ];

  for (const municipio of municipiosValidos) {
    const municipioShort = municipio
      .replace('de ', '')
      .replace('san ', '')
      .replace('santa ', '')
      .replace('la ', '')
      .replace('el ', '')
      .replace('los ', '')
      .replace('las ', '')
      .trim();
    
    if ((nombreLower.includes(municipio.toLowerCase()) || 
         nombreLower.includes(municipioShort.toLowerCase())) && 
        !municipioLower.includes(municipio.toLowerCase()) &&
        !municipioLower.includes(municipioShort.toLowerCase())) {
      
      const excepciones = ['santa cruz de tenerife', 'la laguna'];
      if (!excepciones.includes(municipio.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

function tieneParadasConflictivas(linea, municipioBuscado) {
  const paradasConflictivas = [];
  
  const allStops = [
    ...linea.stopsIda,
    ...linea.stopsVuelta
  ];

  for (const stop of allStops) {
    if (esParadaEngañosa(stop.name, municipioBuscado)) {
      paradasConflictivas.push(stop.name);
    }
  }

  return {
    tieneConflictos: paradasConflictivas.length > 0,
    paradasConflictivas
  };
}

function debugParadasConflictivas(municipio) {
  console.log(`🔍 Analizando paradas conflictivas para: ${municipio}`);
  
  let totalConflictos = 0;

  for (const linea of titsaLinesData) {
    const analisis = tieneParadasConflictivas(linea, municipio);
    if (analisis.tieneConflictos) {
      totalConflictos++;
      console.log(`⚠️  Línea ${linea.number} (${linea.name}):`);
      console.log(`   Paradas conflictivas: ${analisis.paradasConflictivas.join(', ')}`);
    }
  }

  console.log(`📊 Total líneas con conflictos: ${totalConflictos} de ${titsaLinesData.length}`);
}

// Casos de prueba específicos para detectar conflictos
const CASOS_PRUEBA = [
  {
    municipio: 'Garachico',
    lugar: undefined,
    descripcion: 'Municipio pequeño donde puede haber paradas con nombres de otros municipios'
  },
  {
    municipio: 'Icod de los Vinos',
    lugar: undefined,
    descripcion: 'Donde puede aparecer paradas "Arona" o "La Orotava" que son engañosas'
  },
  {
    municipio: 'Adeje',
    lugar: 'Centro Comercial',
    descripcion: 'Zona turística donde deben aparecer las líneas correctas sin conflictos'
  },
  {
    municipio: 'Arona',
    lugar: 'Los Cristianos',
    descripcion: 'Debe encontrar líneas específicas sin confusiones con otros municipios'
  },
  {
    municipio: 'La Orotava',
    lugar: 'Centro Histórico',
    descripcion: 'Debe evitar líneas que tengan paradas "Arona" en otros contextos'
  }
];

// Función para ejecutar pruebas del sistema
function ejecutarPruebasSistema() {
  console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA MEJORADO');
  console.log('=' .repeat(60));

  CASOS_PRUEBA.forEach((caso, index) => {
    console.log(`\n📍 PRUEBA ${index + 1}: ${caso.descripcion}`);
    console.log(`Municipio: ${caso.municipio}, Lugar: ${caso.lugar || 'No especificado'}`);
    console.log('-'.repeat(50));

    // 1. Depurar conflictos
    console.log('\n🔍 Análisis de paradas conflictivas:');
    debugParadasConflictivas(caso.municipio);

    // 2. Probar sistema mejorado
    console.log('\n✅ Sistema mejorado - Líneas recomendadas:');
    const lineasMejoradas = obtenerMejoresLineasConAnálisis(
      normalizarMunicipio(caso.municipio), 
      caso.lugar
    );
    
    if (lineasMejoradas.length > 0) {
      console.log(`🎯 Encontradas ${lineasMejoradas.length} líneas óptimas:`);
      lineasMejoradas.forEach((linea, idx) => {
        console.log(`   ${idx + 1}. Línea ${linea}`);
      });
    } else {
      console.log('❌ No se encontraron líneas óptimas');
    }

    // 3. Probar sistema filtrado
    console.log('\n🛡️  Sistema filtrado (sin conflictos):');
    const lineasFiltradas = obtenerLineasPorMunicipioFiltradas(
      normalizarMunicipio(caso.municipio),
      caso.lugar
    );
    
    console.log(`📊 Resultado: ${lineasFiltradas.length} líneas válidas`);
    if (lineasFiltradas.length > 0) {
      lineasFiltradas.forEach((linea, idx) => {
        console.log(`   ${idx + 1}. Línea ${linea}`);
      });
    }

    // 4. Detectar venue relevante
    const venue = encontrarVenueRelevante(
      normalizarMunicipio(caso.municipio), 
      caso.lugar
    );
    
    if (venue) {
      console.log(`\n🏛️  Venue relevante detectado: ${venue.name}`);
      console.log(`   Tipo de eventos: ${venue.eventTypes.join(', ')}`);
      console.log(`   Líneas prioritarias: ${venue.priorityLines.join(', ')}`);
    } else {
      console.log('\n🏛️  No se detectó un venue específico');
    }

    console.log('\n' + '='.repeat(60));
  });
}

// Función específica para probar el caso que mencionaste
function probarCasoAronaEnGarachico() {
  console.log('\n🎯 PRUEBA ESPECÍFICA: Parada "Arona" en Garachico');
  console.log('=' .repeat(60));

  // Buscar líneas que tengan "Arona" en sus paradas pero vayan a Garachico
  const lineasData = require('../../titsa_lines.json');
  
  let lineasConflictivas = 0;
  let lineasCorrectas = 0;

  for (const linea of lineasData) {
    const allStops = [
      ...linea.stopsIda,
      ...linea.stopsVuelta
    ];

    const tieneArona = allStops.some(stop => 
      stop.name.toLowerCase().includes('arona')
    );
    
    const tieneGarachico = allStops.some(stop => 
      stop.name.toLowerCase().includes('garachico')
    );

    if (tieneArona && tieneGarachico) {
      console.log(`⚠️  Línea ${linea.number}: Contiene "Arona" y "Garachico" - POSIBLE CONFLICTO`);
      console.log(`   Nombre: ${linea.name}`);
      const paradasArona = allStops.filter(s => s.name.toLowerCase().includes('arona'));
      const paradasGarachico = allStops.filter(s => s.name.toLowerCase().includes('garachico'));
      console.log(`   Paradas Arona: ${paradasArona.map(p => p.name).join(', ')}`);
      console.log(`   Paradas Garachico: ${paradasGarachico.map(p => p.name).join(', ')}`);
      lineasConflictivas++;
    } else if (tieneGarachico && !tieneArona) {
      lineasCorrectas++;
      console.log(`✅ Línea ${linea.number}: Solo Garachico (correcta)`);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Líneas con conflicto (Arona + Garachico): ${lineasConflictivas}`);
  console.log(`   Líneas correctas (solo Garachico): ${lineasCorrectas}`);
  console.log(`   Total líneas analizadas: ${lineasData.length}`);

  // Probar el sistema filtrado
  console.log('\n🛡️  Probando sistema filtrado para Garachico:');
  const lineasFiltradas = obtenerLineasPorMunicipioFiltradas('Garachico');
  console.log(`Líneas válidas encontradas: ${lineasFiltradas.length}`);
  lineasFiltradas.forEach((linea, idx) => {
    console.log(`   ${idx + 1}. Línea ${linea}`);
  });
}

// Ejecutar las pruebas
if (require.main === module) {
  ejecutarPruebasSistema();
  probarCasoAronaEnGarachico();
}

module.exports = {
  ejecutarPruebasSistema,
  probarCasoAronaEnGarachico
};