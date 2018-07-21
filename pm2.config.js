module.exports = {
  apps: [
    {
      name: 'blog-api',
      script: './dist/index.js',
      env: {
        NODE_ENV: 'development',
        HOST: '127.0.0.1',
        PORT: 8800
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 8800
      }
    }
  ]
}
