module.exports = {
  apps: [
    {
      name: "uglyteam",
      script: "npm",
      args: "start",
      cwd: "/var/www/uglyteam",
      env: {
        NODE_ENV: "production",
        PORT: "8080",
      },
    },
  ],
};
