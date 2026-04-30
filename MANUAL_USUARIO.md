# Manual de usuario — Peña de apuestas

Este manual explica cómo usar la aplicación desde el navegador (frontend) y qué puede hacer cada rol.

## Acceso / Login

1. Abre `http://localhost:3000/login`
2. Introduce tu email.
3. Pulsa **Entrar**.

Notas:
- No hay contraseña (peña privada).
- El backend permite login si el email existe en la base de datos y/o está en la whitelist (`AUTH_EMAIL_WHITELIST`).

## Dashboard

Una vez dentro, entrarás en `http://localhost:3000/dashboard`.

En la parte superior verás:
- Tu **email** (sesión).
- Tu **rol** (`admin` o `user`).
- Un botón **Salir**.

### Pestañas (persistencia)

En el Dashboard puedes alternar:
- **Apuestas**: `http://localhost:3000/dashboard?tab=bets`
- **Usuarios**: `http://localhost:3000/dashboard?tab=users`

La pestaña se mantiene al recargar porque se guarda en la URL (`tab=...`).

## Roles y permisos

### Usuario (role = `user`)

- Puede **ver** el dashboard, apuestas y usuarios.
- No puede crear/editar/borrar (la UI no muestra acciones y el backend lo bloquea igualmente).

### Administrador (role = `admin`)

Además de lo anterior, puede:
- Crear apuestas.
- Registrar movimientos de dinero (depósitos, ajustes, etc.).
- CRUD de apuestas (modificar estado/premio, modificar datos, borrar).
- CRUD de usuarios (crear, editar, borrar).

## Apuestas (tab = `bets`)

### Ver apuestas

En la tabla se muestran:
- Código, fecha, importe, estado y link al archivo (si existe).

### Crear apuesta (solo admin)

En el panel **Nueva apuesta**:
- **Código**: identificador (ej. `BET-0019`).
- **Importe**: en € en la interfaz; internamente se guarda en céntimos.
- **Archivo** (opcional): imagen/PDF.

Al crear una apuesta, se registra automáticamente un movimiento de tipo **bet** con su importe.

### Modificar apuesta (solo admin)

En cada fila:
- **Modificar**: permite editar **código**, **importe (€)** y **fecha/hora**.
  - El importe acepta coma o punto (ej. `10,50` o `10.50`).
  - Si cambias el importe, el sistema ajusta el balance del grupo registrando el delta.

### Validar / premiar (solo admin)

En cada fila:
- Cambia el **estado** (`pending`, `won`, `lost`).
- Opcional: indica **premio €**.
- Pulsa **Guardar**.

### Borrar apuesta (solo admin)

El botón **Borrar** elimina la apuesta.

Nota:
- Al borrar se registra un **adjustment** para revertir el impacto del importe en el balance.

## Usuarios (tab = `users`)

### Ver usuarios

Se listan nombre, email, rol y fecha de alta.

### Crear usuario (solo admin)

En la parte superior de la pestaña:
- Email
- Nombre
- Rol (`user` o `admin`)
- Botón **Crear**

### Editar usuario (solo admin)

Cada fila permite:
- Cambiar nombre, email y rol.
- Botón **Guardar**.

### Borrar usuario (solo admin)

Cada fila tiene botón **Borrar**.

## Movimientos de dinero (solo admin)

En el panel **Movimiento de dinero** puedes registrar:
- `deposit`: suma al balance
- `bet`: resta al balance (normalmente lo crea el sistema al crear una apuesta)
- `prize`: suma al balance
- `adjustment`: ajuste libre (puede ser positivo o negativo)

### Ajustes negativos

Para bajar saldo puedes usar `adjustment` con importe negativo.
Ejemplo: `-600,00` (o `-600.00`).

## Errores comunes

### “API error 401 Unauthorized”

- No hay sesión o caducó.
- Solución: vuelve a `http://localhost:3000/login` y entra de nuevo.

### “fetch failed / ECONNREFUSED”

- El backend puede estar reiniciando mientras recompila.
- Solución: espera unos segundos y recarga.

