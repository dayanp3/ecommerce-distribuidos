-- ============================================================
--  NEXUS GAMES — esquema y catálogo (tienda de videojuegos)
--  Imágenes reales servidas como estáticos por Nginx (/img)
-- ============================================================

CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(160) NOT NULL,
  descripcion     TEXT,
  categoria       VARCHAR(60)  NOT NULL,
  plataforma      VARCHAR(40),
  precio          NUMERIC(10,2) NOT NULL,
  precio_anterior NUMERIC(10,2),            -- si existe, se muestra descuento
  stock           INT DEFAULT 10,
  rating          NUMERIC(2,1) DEFAULT 4.5,
  imagen          VARCHAR(120)              -- archivo en /img
);

CREATE TABLE IF NOT EXISTS pedidos (
  id        SERIAL PRIMARY KEY,
  cliente   VARCHAR(120) NOT NULL,
  email     VARCHAR(120) NOT NULL,
  telefono  VARCHAR(40),
  direccion TEXT,
  total     NUMERIC(10,2) NOT NULL,
  detalle   TEXT,
  estado    VARCHAR(30) DEFAULT 'confirmado',
  creado    TIMESTAMP DEFAULT NOW()
);

-- ---------- CONSOLAS ----------
INSERT INTO productos (nombre, descripcion, categoria, plataforma, precio, precio_anterior, stock, rating, imagen) VALUES
('PlayStation 5',           'Consola Sony PS5, 1TB SSD ultrarrápido, gráficos 4K y DualSense.',          'Consolas', 'PS5',    2499000, 2799000, 7, 4.9, 'ps5.png'),
('Xbox Series X',           'La Xbox más potente: 12 TFLOPS, 1TB, 4K hasta 120fps.',                     'Consolas', 'Xbox',   2399000, NULL,    6, 4.8, 'xboxsx.png'),
('Nintendo Switch OLED',    'Pantalla OLED 7", 64GB, modo portátil y dock para TV.',                     'Consolas', 'Switch', 1699000, NULL,    9, 4.9, 'switch.png'),
('Steam Deck OLED 512GB',   'PC gamer portátil con SteamOS y pantalla OLED HDR.',                         'Consolas', 'PC',     2899000, 3099000, 4, 4.7, 'steamdeck.jpg');

-- ---------- VIDEOJUEGOS ----------
INSERT INTO productos (nombre, descripcion, categoria, plataforma, precio, precio_anterior, stock, rating, imagen) VALUES
('Elden Ring',                  'RPG de mundo abierto de FromSoftware. Game of the Year.',                'Videojuegos', 'Multi',  229000, NULL,   14, 4.9, 'eldenring.jpg'),
('God of War Ragnarök',         'La épica nórdica de Kratos y Atreus, ahora en PC y PS5.',                'Videojuegos', 'PS5',    249000, 299000, 15, 4.9, 'gow.jpg'),
('EA Sports FC 25',             'El fútbol más realista, con Ultimate Team y modo carrera.',              'Videojuegos', 'Multi',  279000, NULL,   20, 4.4, 'fc25.jpg'),
('Halo Infinite',               'El regreso del Jefe Maestro: campaña y multijugador.',                   'Videojuegos', 'Xbox',   199000, 249000, 18, 4.5, 'halo.jpg'),
('Marvel''s Spider-Man',        'Balancéate por Nueva York como el trepamuros. Edición Remasterizada.',   'Videojuegos', 'PS5',    269000, 319000, 11, 4.8, 'spiderman.jpg'),
('Cyberpunk 2077',              'RPG futurista en Night City. Incluye Phantom Liberty.',                  'Videojuegos', 'Multi',  189000, 259000, 13, 4.6, 'cyberpunk.jpg'),
('Hogwarts Legacy',             'Vive tu propia aventura mágica en el mundo de Harry Potter.',            'Videojuegos', 'Multi',  239000, NULL,   16, 4.7, 'hogwarts.jpg'),
('Red Dead Redemption 2',       'Épica del lejano oeste, mundo abierto inmersivo de Rockstar.',           'Videojuegos', 'Multi',  159000, 229000, 12, 4.9, 'rdr2.jpg'),
('Baldur''s Gate 3',            'RPG por turnos basado en Dungeons & Dragons. GOTY 2023.',                'Videojuegos', 'PC',     249000, NULL,   10, 5.0, 'bg3.jpg'),
('The Witcher 3: Wild Hunt',    'Caza monstruos como Geralt en esta obra maestra de CD Projekt.',         'Videojuegos', 'Multi',  119000, 179000, 17, 4.9, 'witcher3.jpg'),
('Forza Horizon 5',             'Carreras de mundo abierto por los paisajes de México.',                  'Videojuegos', 'Xbox',   209000, NULL,   14, 4.8, 'forza.jpg'),
('Resident Evil 4',             'El remake del clásico survival horror de Capcom.',                       'Videojuegos', 'Multi',  219000, 269000, 13, 4.8, 're4.jpg');

-- ---------- ACCESORIOS ----------
INSERT INTO productos (nombre, descripcion, categoria, plataforma, precio, precio_anterior, stock, rating, imagen) VALUES
('Control Xbox Inalámbrico',    'Mando ergonómico oficial, compatible con Xbox y PC.',                    'Accesorios', 'Xbox',   289000, NULL,   17, 4.6, 'xboxctrl.jpg'),
('Mouse Gamer 16000 DPI',       'Sensor óptico de alta precisión y botones programables.',                'Accesorios', 'PC',     129000, 169000, 25, 4.5, 'mouse.jpg');

-- ---------- PC GAMER ----------
INSERT INTO productos (nombre, descripcion, categoria, plataforma, precio, precio_anterior, stock, rating, imagen) VALUES
('Tarjeta Gráfica RTX 4070',    'GPU NVIDIA con Ray Tracing y DLSS 3, 12GB GDDR6X.',                      'PC Gamer', 'PC',     2799000, NULL,    4, 4.8, 'rtx.jpg');
