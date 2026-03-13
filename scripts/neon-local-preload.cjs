const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

if (isLocal) {
  const origRequire = module.constructor.prototype.require;
  let patched = false;

  module.constructor.prototype.require = function (id) {
    const result = origRequire.apply(this, arguments);
    if (!patched && id === '@neondatabase/serverless' && result.neonConfig) {
      result.neonConfig.wsProxy = () => 'localhost:5488/v2';
      result.neonConfig.useSecureWebSocket = false;
      result.neonConfig.pipelineTLS = false;
      result.neonConfig.pipelineConnect = false;
      patched = true;
    }
    return result;
  };
}
