module.exports = {
  apps: [
    {
      name: 'blog-api',
      script: './dist/server.js',
      env: {
        NODE_ENV: 'development',
        HOST: '0.0.0.0',
        PORT: 8800
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 8800
      }
    }
  ]
}
