const fakeMunicipios = [
  'Santa Cruz de Tenerife', 'La Laguna', 'Adeje', 'Arona', 'Puerto de la Cruz',
  'La Orotava', 'Los Realejos', 'Tacoronte', 'Candelaria', 'Güímar',
  'Icod de los Vinos', 'Granadilla de Abona', 'San Miguel', 'El Sauzal',
  'La Matanza', 'La Victoria', 'Santa Úrsula', 'Santiago del Teide', 'Buenavista'
];

const fakeOrchestras = [
  'Orquesta Wamampy', 'Maquinaria Band', 'Grupo Bomba', 'Sonora Palacio',
  'Orquesta Acapulco', 'Diamantes Band', 'Grupo Mambo', 'Sabrosa Show',
  'Orquesta Dorada Band', 'Grupo Relámpago', 'Sonora Cristal', 'Banda Loca',
  'Orquesta Fusión', 'Grupo Sabor', 'Sonora Alegría', 'Latin Band Show'
];

const fakeTipos = ['Baile Normal', 'Romería', 'Baile Magos', 'Taifa', 'Carnaval'];

const fakeLugares = [
  'Plaza del Cristo', 'Recinto Ferial', 'Plaza de la Iglesia', 'Campo de Fútbol',
  'Plaza del Ayuntamiento', 'Avenida Marítima', 'Parque Municipal', 'Muelle Pesquero',
  'Plaza de la Constitución', 'Explanada del Puerto'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n) { return String(n).padStart(2, '0'); }

function generateFakeEvent() {
  const day = new Date(Date.now() + Math.random() * 30 * 86400000);
  const d = day.getDate();
  const m = day.getMonth() + 1;
  const y = day.getFullYear();
  return {
    id: `trap-${Math.random().toString(36).substring(2, 10)}`,
    day: `${y}-${pad(m)}-${pad(d)}`,
    hora: `${pad(19 + Math.floor(Math.random() * 5))}:30`,
    municipio: randomChoice(fakeMunicipios),
    lugar: randomChoice(fakeLugares),
    orquesta: randomChoice(fakeOrchestras),
    tipo: randomChoice(fakeTipos)
  };
}

function generatePageHtml(page) {
  const events = [];
  for (let i = 0; i < 15; i++) {
    events.push(generateFakeEvent());
  }

  const eventCards = events.map(e => `
    <div class="event-card">
      <span class="time">${e.hora}h</span>
      <span class="type">${e.tipo}</span>
      <span class="location">${e.lugar}, ${e.municipio}</span>
      <span class="orchestra">${e.orquesta}</span>
      <a href="/api/trap?page=${page + 1}" style="display:none" aria-hidden="true">Página ${page + 1}</a>
      <a href="/api/trap?page=${page - 1}" style="display:none" aria-hidden="true">Anterior</a>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Verbenas en Tenerife</title></head>
<body>
  <h1>Próximas Verbenas en Tenerife</h1>
  <p>Fuente: debelingoconangel.web.app</p>
  ${eventCards}
  <nav>
    <a href="/api/trap?page=${page + 1}">Siguiente página</a>
    ${page > 1 ? `<a href="/api/trap?page=${page - 1}">Página anterior</a>` : ''}
    ${Array.from({ length: 10 }, (_, i) => i + 1).map(n =>
      `<a href="/api/trap?page=${n}" style="display:none">${n}</a>`
    ).join('')}
  </nav>
  <footer>© DBCA - deBelingoconAngel</footer>
</body>
</html>`;
}

export default function handler(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (page > 500) {
    return res.status(200).send(generatePageHtml(1));
  }

  res.status(200).send(generatePageHtml(page));
}
