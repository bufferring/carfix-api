
# CarFix API - Automotive Parts Marketplace

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-brightgreen.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)
![Organization](https://img.shields.io/badge/org-Buffer%20Ring-purple.svg)

**Developed by:** [Buffer Ring Organization](https://github.com/bufferring)

---

## English

### 📋 Overview

CarFix is a marketplace platform for automotive parts that connects businesses selling parts with customers who need them. The platform allows businesses to register, publish their products and manage their sales, while customers can search, compare and purchase parts for their vehicles.

### 🛠️ Technology Stack

#### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6.0+-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)

#### Authentication & Security
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-4.0+-CA4245?style=for-the-badge&logo=letsencrypt&logoColor=white)

#### File Storage
![Multer](https://img.shields.io/badge/Multer-Local%20Storage-FF6600?style=for-the-badge)

#### Development Tools
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=.env&logoColor=black)

### 🏗️ Architecture

- **Backend**: Node.js with Express.js framework
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Token)
- **File Storage**: Local storage (with cloud migration capability)
- **API Style**: RESTful API

### 📁 Project Structure

```
carfix/
├── config/             # Application configuration
│   └── database.js     # Database configuration
├── controllers/        # API controllers
├── middleware/         # Custom middleware
│   └── auth.js         # Authentication middleware
├── models/             # Sequelize models
│   └── index.js        # Model associations
├── routes/             # API routes
├── utils/              # Utilities
├── public/             # Static files
│   └── uploads/        # Uploaded files
├── .env                # Environment variables
├── server.js           # Application entry point
└── package.json        # Dependencies and scripts
```

### 🗄️ Database Connection

The application uses Sequelize as ORM to interact with MySQL database:

```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
```

### 📊 Main Models

#### User
- **Purpose**: Platform users (customers, businesses, admins)
- **Key attributes**: `name`, `email`, `password`, `role`, `phone`, `address`

#### Business
- **Purpose**: Businesses selling parts
- **Key attributes**: `business_name`, `rif`, `location_lat`, `location_lng`

#### SparePart
- **Purpose**: Parts offered by businesses
- **Key attributes**: `name`, `oem_code`, `price`, `stock`, `description`, `part_condition`

#### Category
- **Purpose**: Part categories
- **Key attributes**: `name`, `description`, `parent_id`

#### Brand / Model / Vehicle
- **Purpose**: Vehicle information hierarchy
- **Relationships**: Brand → Model → Vehicle

#### Order / Payment
- **Purpose**: Purchase orders and payments
- **Key attributes**: Order status, payment methods, amounts

### 🔐 Authentication & Authorization

JWT-based authentication with role-based access control:

- **protect**: Verifies valid JWT token
- **authorize**: Checks user role permissions

```javascript
// Usage example
router.get('/protected-route', protect, authorize('admin'), controllerFunction);
```

### 🛣️ API Routes

#### Public Routes
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
GET    /api/spare-parts       # Get all spare parts
GET    /api/spare-parts/:id   # Get specific spare part
GET    /api/businesses        # Get all businesses
GET    /api/categories        # Get all categories
GET    /api/brands            # Get all brands
```

#### Protected Routes
```
GET    /api/auth/me           # Get current user (auth required)
POST   /api/spare-parts       # Create spare part (business role)
PUT    /api/spare-parts/:id   # Update spare part (owner/admin)
DELETE /api/spare-parts/:id   # Delete spare part (owner/admin)
POST   /api/orders            # Create order (auth required)
GET    /api/orders/my-orders  # Get user orders (auth required)
```

### 🚀 Getting Started

#### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bufferring/carfix-api.git
   cd carfix-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create database
   mysql -u root -p < carfix.sql
   
   # Run migrations (if using migrations)
   npm run migrate
   ```

5. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### 📡 API Examples

#### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"customer"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

#### Create Spare Part
```bash
curl -X POST http://localhost:5000/api/spare-parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Oil Filter","category_id":1,"price":25.99,"stock":10}'
```

### 🚀 Deployment

#### Local Development
```bash
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=carfix
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

#### Production Options

**Option 1: Render + Railway**
- Database: Railway MySQL
- Backend: Render Web Service

**Option 2: Heroku + JawsDB**
- Database: JawsDB MySQL Add-on
- Backend: Heroku Dyno

### 🎨 Frontend Development

Recommended frontend stack:
- **React.js** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **React Query** for server state management

---

## Español

### 📋 Descripción General

CarFix es una plataforma de marketplace para repuestos automotrices que conecta a negocios que venden repuestos con clientes que los necesitan. La plataforma permite a los negocios registrarse, publicar sus productos y gestionar sus ventas, mientras que los clientes pueden buscar, comparar y comprar repuestos para sus vehículos.

### 🛠️ Stack Tecnológico

#### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6.0+-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)

#### Autenticación y Seguridad
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-4.0+-CA4245?style=for-the-badge&logo=letsencrypt&logoColor=white)

#### Almacenamiento de Archivos
![Multer](https://img.shields.io/badge/Multer-Almacenamiento%20Local-FF6600?style=for-the-badge)

#### Herramientas de Desarrollo
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=.env&logoColor=black)

### 🏗️ Arquitectura

- **Backend**: Node.js con framework Express.js
- **Base de datos**: MySQL con Sequelize ORM
- **Autenticación**: JWT (JSON Web Token)
- **Almacenamiento**: Local (con capacidad de migración a la nube)
- **Estilo API**: API RESTful

### 📁 Estructura del Proyecto

```
carfix/
├── config/             # Configuración de la aplicación
│   └── database.js     # Configuración de la base de datos
├── controllers/        # Controladores de la API
├── middleware/         # Middleware personalizado
│   └── auth.js         # Middleware de autenticación
├── models/             # Modelos de Sequelize
│   └── index.js        # Asociaciones entre modelos
├── routes/             # Rutas de la API
├── utils/              # Utilidades
├── public/             # Archivos estáticos
│   └── uploads/        # Archivos subidos
├── .env                # Variables de entorno
├── server.js           # Punto de entrada de la aplicación
└── package.json        # Dependencias y scripts
```

### 🗄️ Conexión a la Base de Datos

La aplicación utiliza Sequelize como ORM para interactuar con la base de datos MySQL:

```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
```

### 📊 Modelos Principales

#### User (Usuario)
- **Propósito**: Usuarios de la plataforma (clientes, negocios, admins)
- **Atributos clave**: `name`, `email`, `password`, `role`, `phone`, `address`

#### Business (Negocio)
- **Propósito**: Negocios que venden repuestos
- **Atributos clave**: `business_name`, `rif`, `location_lat`, `location_lng`

#### SparePart (Repuesto)
- **Propósito**: Repuestos ofrecidos por los negocios
- **Atributos clave**: `name`, `oem_code`, `price`, `stock`, `description`, `part_condition`

#### Category (Categoría)
- **Propósito**: Categorías de repuestos
- **Atributos clave**: `name`, `description`, `parent_id`

#### Brand / Model / Vehicle (Marca / Modelo / Vehículo)
- **Propósito**: Jerarquía de información de vehículos
- **Relaciones**: Marca → Modelo → Vehículo

#### Order / Payment (Orden / Pago)
- **Propósito**: Órdenes de compra y pagos
- **Atributos clave**: Estado de orden, métodos de pago, montos

### 🔐 Autenticación y Autorización

Autenticación basada en JWT con control de acceso por roles:

- **protect**: Verifica token JWT válido
- **authorize**: Verifica permisos de rol de usuario

```javascript
// Ejemplo de uso
router.get('/ruta-protegida', protect, authorize('admin'), controllerFunction);
```

### 🛣️ Rutas de la API

#### Rutas Públicas
```
POST   /api/auth/register     # Registro de usuario
POST   /api/auth/login        # Inicio de sesión
GET    /api/spare-parts       # Obtener todos los repuestos
GET    /api/spare-parts/:id   # Obtener repuesto específico
GET    /api/businesses        # Obtener todos los negocios
GET    /api/categories        # Obtener todas las categorías
GET    /api/brands            # Obtener todas las marcas
```

#### Rutas Protegidas
```
GET    /api/auth/me           # Obtener usuario actual (autenticación requerida)
POST   /api/spare-parts       # Crear repuesto (rol negocio)
PUT    /api/spare-parts/:id   # Actualizar repuesto (propietario/admin)
DELETE /api/spare-parts/:id   # Eliminar repuesto (propietario/admin)
POST   /api/orders            # Crear orden (autenticación requerida)
GET    /api/orders/my-orders  # Obtener órdenes del usuario (autenticación requerida)
```

### 🚀 Comenzando

#### Prerequisitos
- Node.js 18+
- MySQL 8.0+
- npm o yarn

#### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/bufferring/carfix-api.git
   cd carfix-api
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configuración del entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tu configuración
   ```

4. **Configuración de la base de datos**
   ```bash
   # Crear base de datos
   mysql -u root -p < carfix.sql
   
   # Ejecutar migraciones (si se usan migraciones)
   npm run migrate
   ```

5. **Iniciar la aplicación**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

### 📡 Ejemplos de API

#### Registro de Usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@ejemplo.com","password":"contraseña123","role":"customer"}'
```

#### Inicio de Sesión
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@ejemplo.com","password":"contraseña123"}'
```

#### Crear Repuesto
```bash
curl -X POST http://localhost:5000/api/spare-parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{"name":"Filtro de Aceite","category_id":1,"price":25.99,"stock":10}'
```

### 🚀 Despliegue

#### Desarrollo Local
```bash
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=carfix
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRE=30d
```

#### Opciones de Producción

**Opción 1: Render + Railway**
- Base de datos: Railway MySQL
- Backend: Render Web Service

**Opción 2: Heroku + JawsDB**
- Base de datos: JawsDB MySQL Add-on
- Backend: Heroku Dyno

### 🎨 Desarrollo Frontend

Stack frontend recomendado:
- **React.js** con TypeScript
- **React Router** para navegación
- **Axios** para llamadas a la API
- **Tailwind CSS** para estilos
- **React Query** para gestión de estado del servidor

---

## 📄 License & Documentation

- **License**: [MIT License](./LICENSE)
- **API Documentation**: Available in this README
- **Contributing**: [Contributing Guidelines](./CONTRIBUTING.md)

## 🏢 Organization

**Buffer Ring** - Building innovative software solutions

- 🌐 **GitHub**: [@bufferring](https://github.com/bufferring)
- 💼 **Projects**: Specialized in marketplace platforms and automotive solutions
- 🎯 **Mission**: Creating robust, scalable, and user-friendly software solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/bufferring/carfix-api/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/bufferring/carfix-api/discussions)
- 📧 **Contact**: Through Buffer Ring GitHub organization

---

⭐ **Star this repository if you find it useful!**

**Made with ❤️ by [Buffer Ring](https://github.com/bufferring)**

---

*CarFix is a trademark of Buffer Ring Organization. All rights reserved.*
