export async function register() {
  const { neonConfig } = await import('@neondatabase/serverless');

  const dbUrl = process.env.DATABASE_URL || '';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  if (isLocal) {
    neonConfig.wsProxy = () => 'localhost:5488/v2';
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
  }
}
