CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL,
  stock INT DEFAULT 10,
  imagen VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  detalle TEXT,
  creado TIMESTAMP DEFAULT NOW()
);

INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Teclado Mecanico RGB', 'Switches azules, retroiluminado', 120000, 15, '⌨️'),
('Mouse Gamer 7200dpi', 'Sensor optico de alta precision', 85000, 20, '🖱️'),
('Monitor 24" Full HD', 'Panel IPS, 75Hz, HDMI', 480000, 8, '🖥️'),
('Audifonos Bluetooth', 'Cancelacion de ruido, 30h bateria', 160000, 12, '🎧'),
('Webcam 1080p', 'Microfono integrado, autoenfoque', 95000, 18, '📷'),
('Disco SSD 1TB', 'Lectura 550MB/s, garantia 3 anos', 320000, 10, '💾');
