# Tienda Distribuidos — Proyecto Docker (5 servicios)

E-commerce de prueba con 5 servicios contenedorizados, gestionado con Portainer
y publicado en internet mediante un Cloudflare Tunnel sobre el dominio
`distribuidos.lat`.

## Los 5 servicios

| # | Servicio | Imagen           | Rol en el e-commerce                          |
|---|----------|------------------|-----------------------------------------------|
| 1 | db       | postgres:16      | Base de datos: productos y pedidos            |
| 2 | redis    | redis:7          | Cache: guarda el carrito por sesion           |
| 3 | mail     | mailhog/mailhog  | Servidor SMTP + bandeja web de correos        |
| 4 | api      | node:20 (build)  | Backend Express: productos, carrito, checkout |
| 5 | web      | nginx:alpine     | Frontend de la tienda + proxy a api y mail    |

Portainer corre aparte como herramienta de gestion visual de contenedores.

Flujo: el cliente agrega productos -> el carrito se guarda en **Redis** ->
al finalizar, la **API** guarda el pedido en **PostgreSQL** y envia un correo de
confirmacion que llega a **MailHog**, todo servido por **Nginx**.

---

## PASO 1 — Subir el proyecto al VPS

Desde tu maquina, comprime la carpeta y subela (o usa git / scp con Termius):

```bash
scp -r ecommerce root@108.174.155.246:/root/
```

Conectate al VPS:

```bash
ssh root@108.174.155.246
cd /root/ecommerce
```

## PASO 2 — Levantar los 5 servicios

```bash
docker compose up -d --build
docker compose ps        # verifica que los 5 esten "Up"
```

La tienda queda en `http://108.174.155.246:8080`
La bandeja de correos en `http://108.174.155.246:8080/mail/`

> Nota de RAM: el VPS tiene 4 GB y ya corren OpenClaw + Hermes.
> Si va justo, pausa los agentes durante la demo:
> `docker stop moltbot-clawdbot-1` y `systemctl stop hermes-gateway`.

## PASO 3 — Instalar Portainer

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Entra a `http://108.174.155.246:9000`, crea el usuario admin y ya veras
los 5 contenedores del e-commerce para administrarlos visualmente.

## PASO 4 — Publicar con Cloudflare Tunnel

El profe ya tiene el dominio `distribuidos.lat` en Cloudflare. Vas a crear un
tunel que conecta tu VPS con ese dominio SIN abrir puertos.

### 4.1 Instalar cloudflared en el VPS

```bash
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb
```

### 4.2 Autenticar (abre un link, lo pegas en tu navegador ya logueado en Cloudflare)

```bash
cloudflared tunnel login
```

Selecciona el dominio `distribuidos.lat`. Esto guarda un certificado en
`~/.cloudflared/`.

### 4.3 Crear el tunel

```bash
cloudflared tunnel create tienda-dayan
```

Anota el **Tunnel ID** que devuelve. El credencial queda en
`~/.cloudflared/<TUNNEL_ID>.json`.

### 4.4 Crear el archivo de configuracion

Crea `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: dayan.distribuidos.lat
    service: http://localhost:8080
  - service: http_status:404
```

> Usa un subdominio tuyo (ej. `dayan.distribuidos.lat`) para no chocar con el
> trabajo de otros companeros que comparten el mismo dominio.

### 4.5 Crear el registro DNS y arrancar

```bash
cloudflared tunnel route dns tienda-dayan dayan.distribuidos.lat
cloudflared tunnel run tienda-dayan
```

Prueba en el navegador: `https://dayan.distribuidos.lat`

### 4.6 Dejarlo como servicio (para que sobreviva reinicios)

```bash
cloudflared service install
systemctl enable --now cloudflared
```

---

## PASO 5 — Demostrar que funciona

1. Abre `https://dayan.distribuidos.lat` -> ves el catalogo (viene de PostgreSQL).
2. Agrega productos -> el carrito se guarda en Redis.
3. Finaliza compra con nombre y correo -> la API guarda el pedido.
4. Abre `/mail/` -> ves el correo de confirmacion en MailHog.
5. Abre Portainer -> muestras los 5 contenedores corriendo.

## Comandos utiles

```bash
docker compose logs -f api     # ver logs de la API
docker compose down            # apagar todo
docker compose ps              # estado
```

## Seguridad (no olvidar para la entrega)

- Cambia `ecom123` por una contrasena real en `docker-compose.yml`.
- En el reporte, censura cualquier token o credencial.
- Los puertos 8080 y 9000 quedan expuestos por IP; idealmente solo accede por el
  tunel y cierras esos puertos con firewall (`ufw`) si el profe lo pide.
