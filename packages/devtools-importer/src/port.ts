import net from "node:net";

/**
 * Find a free TCP port in [min, max].
 */
export async function findAvailablePort(min: number, max: number): Promise<number> {
  const tried = new Set<number>();
  const tryOnce = (port: number) =>
    new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on("error", reject);
      server.listen(port, () => {
        const { port: chosen } = server.address() as any;
        server.close(() => resolve(chosen));
      });
    });

  while (tried.size < Math.max(0, max - min + 1)) {
    const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    try {
      return await tryOnce(candidate);
    } catch {
      // try next
    }
  }

  throw new Error(`No available port in range [${min}, ${max}]`);
}
