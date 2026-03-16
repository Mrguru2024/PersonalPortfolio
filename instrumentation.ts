/** Convert ErrorEvent or any error with read-only .message to a plain Error so nothing tries to set .message and throws */
function toPlainError(e: unknown): Error {
  if (e instanceof Error && e.constructor?.name === 'Error') return e;
  const msg =
    e != null && typeof (e as { message?: unknown }).message === 'string'
      ? (e as { message: string }).message
      : String(e);
  return new Error(msg);
}

export async function register() {
  // Convert ErrorEvent or any error with read-only .message to plain Error so Next.js/Node never try to set .message
  process.on('uncaughtException', function onUncaught(err: unknown) {
    const isPlainError = err instanceof Error && err.constructor?.name === 'Error';
    const isErrorLike = err != null && typeof err === 'object' && 'message' in err;
    if (isErrorLike && !isPlainError) {
      process.removeListener('uncaughtException', onUncaught);
      throw toPlainError(err);
    }
  });
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
