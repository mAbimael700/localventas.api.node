# Multi-stage build para optimizar tamaño
FROM node:18-alpine AS builder

# Instalar dependencias del sistema necesarias para compilar módulos nativos
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /usr/src/app

# Copiar package files
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Etapa de producción
FROM node:18-alpine AS production

# Instalar dependencias runtime necesarias
RUN apk add --no-cache \
    libc6-compat \
    dumb-init

WORKDIR /usr/src/app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copiar package files y instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código desde builder
COPY --from=builder --chown=nodeuser:nodejs /usr/src/app .

# Cambiar propietario de archivos
RUN chown -R nodeuser:nodejs /usr/src/app

# Cambiar al usuario no-root
USER nodeuser

# Exponer puerto - Coolify puede usar cualquier puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production

# Healthcheck para Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Usar dumb-init como PID 1 para mejor manejo de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "./bin/www.mjs"]