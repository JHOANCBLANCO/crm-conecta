# CRM DE VENTAS - Control por Campaña

Sistema web integral de gestión comercial, validación documental y analítica de ventas por campaña, diseñado para ejecutarse en **macOS** y desplegable de manera idéntica en servidores **Linux**.

---

## 🌟 Características Principales

1. **Gestión de Campañas (Movistar, WOM, etc.)**:
   - **Buscador global por campaña** en la cabecera superior con coincidencia en tiempo real.
   - Botón `+ Crear Campaña` con paleta de colores personalizada y descripción.
   - Botón **Ocultar / Archivar**: Oculta campañas en desuso de la vista principal sin borrarlas.
   - Búsqueda inteligente: Si buscas una campaña por nombre, **aparece siempre**, incluso si está archivada u oculta.
   - Interruptor para visualizar todas las campañas archivadas.

2. **Catálogo de Planes por Campaña**:
   - Cada campaña contiene sus planes asociados con **precio en COP** y lista de **características**.
   - Botón directo en cada plan: *"Ofrecer y Radicar Venta"*.

3. **Flujo de Roles y Validaciones**:
   - **Asesor de Ventas**:
     - Diligencia datos del cliente (Cédula de Ciudadanía, Nombre, Teléfono, Correo).
     - Asigna el plan ofrecido y el valor correspondiente.
     - Carga la documentación del cliente (Cédula en PDF, JPG, PNG con drag & drop o visor de muestra para demos).
     - Radica y envía automáticamente a la bandeja de Back Office.
     - Sección *"Mis Ventas"* con alertas para ventas devueltas y botón *"Subsanar y Reenviar"*.
   - **Back Office**:
     - Bandeja de entrada con contadores de ventas pendientes, aprobadas, devueltas y rechazadas.
     - Visor modal integrado para revisar la cédula sin salir de la plataforma.
     - Decisiones en un clic:
       - **Aprobar**: Confirma la venta y la pasa a estado exitoso.
       - **Devolver con Causal**: Permite elegir o redactar la causal (ej. *Cédula borrosa*, *Documento incompleto*, etc.) y notifica al asesor.
       - **Rechazar**: Cierre definitivo de la solicitud indicando motivo comercial o de riesgo.
       - Trazabilidad y auditoría completa de cada cambio de estado.
   - **Administrador**:
     - Control total de usuarios, roles, campañas y planes.
     - Selector rápido en la cabecera para alternar entre roles y probar los distintos flujos sin cerrar sesión.

4. **Dashboard Analítico & Reportes Ejecutivos**:
   - Filtros combinados en cascada:
     - Por **Campaña**
     - Por **Asesor de Ventas**
     - Por **Plan**
     - Por **Rango de Tiempo** (*Este mes*, *Mes anterior*, *Últimos 30 días*, *Histórico* o *Rango personalizado de fechas*)
   - Métricas clave (KPIs):
     - **Total Vendido Aprobado (\$)** y Total Radicado (\$).
     - **Total de Ventas (#)**.
     - **Clientes Únicos Atendidos** (conteo de cédulas distintas).
     - **Tasa de Aprobación (%)**.
   - Gráficos y analítica:
     - Distribución de ventas y cuota por campaña.
     - **Ranking de Asesores (Leaderboard)** con medallas y totales.
     - Tabla detallada de clientes atendidos.
   - **Exportación Oficial a PDF**: Generación con 1 clic de un reporte ejecutivo profesional con membrete, filtros aplicados, KPIs y tablas.
   - **Exportación a Excel / CSV**: Descarga inmediata con formato compatible con Excel en español.

---

## 🚀 Puesta en Marcha en macOS (Desarrollo)

### 1. Iniciar el servidor de desarrollo:
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### 2. Reiniciar o re-sembrar la base de datos de prueba (opcional):
```bash
node prisma/seed.js
```

---

## 🐧 Despliegue en Linux (Producción)

El proyecto utiliza **Next.js** y **SQLite / Prisma**, lo que garantiza que no requiere instalar motores de base de datos externos pesados si no se desea. Funciona directamente en cualquier distribución Linux (Ubuntu, Debian, CentOS, AlmaLinux, Fedora, etc.).

### Paso 1: Clonar o copiar la carpeta en el servidor Linux
```bash
cd /opt/crm-ventas # o tu ruta preferida
```

### Paso 2: Instalar dependencias y compilar
```bash
npm install
npx prisma db push
node prisma/seed.js
npm run build
```

### Paso 3: Iniciar en producción
```bash
npm start
```
(Por defecto escucha en el puerto 3000. Puedes cambiar el puerto con `PORT=8080 npm start`).

### Opción Recomendada con PM2 (Proceso en segundo plano con auto-reinicio):
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación
pm2 start npm --name "crm-ventas" -- start

# Configurar para que inicie automáticamente al encender el servidor Linux
pm2 startup
pm2 save
```

### Opción con Nginx (Reverse Proxy):
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 👥 Usuarios Preconfigurados para Pruebas

Puedes alternar entre cualquiera de ellos desde el menú superior:
1. **Carlos Mendoza** - Rol: `ADMIN` (Control total)
2. **Andrés Gómez** - Rol: `ASESOR` (Asesor de ventas)
3. **Mariana López** - Rol: `ASESOR` (Asesora de ventas)
4. **Valentina Silva** - Rol: `BACKOFFICE` (Auditora de validación)
