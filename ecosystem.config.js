module.exports = {
  apps: [
    {
      name: "web-server",
      script: "npx serve -s dist --single",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "data-updater",
      script: "src/service/scheduleCSV_retencion.js",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};