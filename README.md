# Sistema de Gestión de Inventario y Ventas – Mueblería El Márquez

Sistema web desarrollado para optimizar la gestión comercial de **Mueblería El Márquez**, permitiendo administrar productos, clientes, ventas e información del negocio desde una plataforma centralizada.

La aplicación busca mejorar el control de inventario, facilitar el registro de operaciones comerciales y proporcionar información útil para la toma de decisiones mediante un dashboard administrativo.

---


## 📖 Descripción del proyecto

El Sistema de Gestión de Inventario y Ventas de Mueblería El Márquez es una aplicación web que permite gestionar los principales procesos comerciales de una mueblería.

El sistema centraliza la información de productos, clientes y ventas, reduciendo la dependencia de registros manuales y facilitando el seguimiento de las operaciones del negocio.

La solución utiliza una arquitectura cliente-servidor, donde el frontend se encarga de la interfaz de usuario, el backend procesa las operaciones y la base de datos almacena la información de manera persistente.

## 🎯 Objetivos

### Objetivo general

Desarrollar e implementar un sistema web para mejorar la gestión comercial de Mueblería El Márquez mediante la digitalización de los procesos de inventario, clientes y ventas.

### Objetivos específicos

- Automatizar el registro y administración de productos.
- Facilitar la gestión de clientes.
- Optimizar el registro y seguimiento de ventas.
- Permitir el control de pagos y abonos.
- Generar boletas de venta en formato PDF.
- Proporcionar información resumida mediante un dashboard.
- Implementar autenticación y autorización mediante JWT.
- Centralizar la información en una base de datos PostgreSQL.

---

## 🚀 Funcionalidades principales

### 1. Autenticación y seguridad

- Inicio de sesión administrativo.
- Validación de credenciales.
- Generación de tokens JWT.
- Protección de rutas del backend.
- Gestión de sesiones mediante almacenamiento del token.
- Control de acceso a los módulos protegidos.

### 2. Gestión de productos e inventario

- Registro de productos.
- Consulta de productos.
- Actualización de información.
- Eliminación de registros.
- Administración de información relacionada con el inventario.

### 3. Gestión de clientes

- Registro de clientes.
- Consulta de información.
- Actualización de datos.
- Visualización de información comercial.
- Consulta del historial de ventas.

### 4. Gestión de ventas

- Registro de operaciones de venta.
- Asociación de ventas con clientes.
- Registro de productos vendidos.
- Consulta del historial de ventas.
- Visualización del detalle de cada operación.

### 5. Gestión de pagos y abonos

- Registro de abonos realizados por los clientes.
- Consulta de montos pagados.
- Visualización de saldos pendientes.
- Actualización del estado de pago.
- Seguimiento del progreso de los pagos.

### 6. Generación de boletas PDF

- Generación de documentos PDF de las ventas.
- Consulta de boletas mediante el identificador de venta.
- Descarga y visualización de documentos.
- Protección de las solicitudes mediante autenticación JWT.

### 7. Dashboard administrativo

- Visualización resumida de información comercial.
- Presentación de indicadores del negocio.
- Consulta de información relevante para el seguimiento de las operaciones.

---

## 🛠️ Tecnologías utilizadas

El proyecto utiliza tecnologías modernas para desarrollar una aplicación web con separación entre frontend, backend y base de datos.

| Tecnología | Aplicación |
|---|---|
| React.js | Desarrollo de interfaces de usuario |
| JavaScript | Lógica del frontend y backend |
| Node.js | Entorno de ejecución del servidor |
| Express.js | Desarrollo de API REST |
| PostgreSQL | Sistema de gestión de base de datos |
| Supabase | Servicio de base de datos PostgreSQL |
| Axios | Comunicación HTTP entre frontend y backend |
| JWT | Autenticación y protección de rutas |
| Bcrypt | Verificación y manejo de contraseñas |
| PDFKit | Generación de documentos PDF |
| Git | Control de versiones |
| GitHub | Repositorio y colaboración |
| Vercel | Despliegue del frontend |
| Render | Despliegue del backend |

---

### Descripción de los componentes

**Frontend – React**

Se encarga de presentar las interfaces del sistema, gestionar las interacciones del usuario y consumir los servicios del backend mediante solicitudes HTTP.

**Backend – Node.js y Express**

Procesa las solicitudes del frontend, ejecuta las operaciones comerciales, valida la autenticación y administra la comunicación con la base de datos.

**Base de datos – Supabase PostgreSQL**

Almacena la información del sistema y permite realizar consultas y operaciones de persistencia mediante PostgreSQL.

---

## 🔐 Seguridad y autenticación

El sistema implementa autenticación basada en JSON Web Tokens (JWT).

El proceso de autenticación funciona de la siguiente manera:

1. El usuario introduce sus credenciales.
2. El frontend envía los datos al endpoint de autenticación.
3. El backend valida las credenciales.
4. Si son correctas, genera un token JWT firmado con una clave secreta.
5. El frontend almacena el token para utilizarlo en las solicitudes protegidas.
6. El backend valida el token antes de permitir el acceso a las rutas restringidas.

### Medidas de seguridad implementadas

- Autenticación mediante JWT.
- Verificación de contraseñas utilizando Bcrypt.
- Middleware para proteger las rutas privadas.
- Configuración de CORS para controlar los orígenes permitidos.
- Variables de entorno para almacenar información sensible.
- Protección de las solicitudes de generación de boletas.

---

## 🗄️ Base de datos

El sistema utiliza **PostgreSQL**, administrado mediante Supabase.

La conexión se realiza desde el backend utilizando el paquete `pg` de Node.js.

La configuración utiliza un pool de conexiones para administrar las solicitudes a la base de datos.

### Características de la conexión

- Conexión mediante `DATABASE_URL`.
- Administración de conexiones mediante `pg.Pool`.
- Configuración SSL para la conexión con Supabase.
- Verificación de conectividad al iniciar el servidor.
- Manejo de errores de conexión.


---

## ⚙️ Instalación y ejecución local

### Requisitos previos

Antes de ejecutar el proyecto, es necesario contar con:

- Node.js.
- npm.
- Git.
- Acceso a una base de datos PostgreSQL.
- Editor de código, como Visual Studio Code.

### 1. Clonar el repositorio

```bash
git clone https://github.com/JossSoriano06/INVENTARIOMUEBLERIA.git
```

Ingresar al proyecto:

```bash
cd INVENTARIOMUEBLERIA
```

### 2. Instalar dependencias del frontend

```bash
cd cliente
npm install
```

### 3. Instalar dependencias del backend

Abrir otra terminal:

```bash
cd servidor
npm install
```

### 4. Configurar variables de entorno

Crear los archivos `.env` correspondientes al frontend y backend, utilizando las variables indicadas en la siguiente sección.

### 5. Ejecutar el backend

Desde la carpeta `servidor`:

```bash
node sever.js
```

El servidor utilizará el puerto configurado en `PORT` o el puerto local `3004` cuando no exista esa variable.

### 6. Ejecutar el frontend

Desde la carpeta `cliente`:

```bash
npm start
```

La aplicación estará disponible normalmente en:

```text
http://localhost:3000
```

Y el backend local en:

```text
http://localhost:3004
```

---


## ☁️ Despliegue en producción

El sistema está desplegado utilizando servicios independientes para el frontend, backend y base de datos.

### Frontend – Vercel

La aplicación React está publicada en Vercel.

**URL de producción:**

Vercel permite automatizar los despliegues mediante la integración con GitHub.

### Backend – Render

El servidor Node.js y Express está desplegado en Render.

**backend:**

Render ejecuta el servidor y mantiene la comunicación con Supabase.

### Base de datos – Supabase

PostgreSQL con el uso de Supabase.



---


## 👨‍💻 Autor

**Desarrollado por:** Joss Soriano

**Proyecto:** Sistema de Gestión de Inventario y Ventas – Mueblería El Márquez.

**Repositorio GitHub:**

https://github.com/JossSoriano06/INVENTARIOMUEBLERIA

---



