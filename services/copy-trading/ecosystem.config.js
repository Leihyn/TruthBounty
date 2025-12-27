module.exports = {
  apps: [{
    name: 'copy-trading-simulator',
    script: 'simulator.ts',
    interpreter: 'node',
    interpreter_args: '--require ts-node/register',
    cwd: __dirname,
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production'
    },
    // Log configuration
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }]
};
