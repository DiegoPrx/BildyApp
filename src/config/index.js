// Configuración centralizada de la aplicación
export const config = {
  port: process.env.PORT || 3000,
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    uri: process.env.DB_URI
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  upload: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    dest: 'uploads/'
  }
};
