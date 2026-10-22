import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { glesysProxy, type Glesys } from "../src/client.js";
import { buildServer } from "../src/server.js";

process.env.GLESYS_ENABLE_DESTRUCTIVE ??= "true";

export function connectedClient(glesys: Glesys) {
  const server = buildServer(glesys, "cl12345");
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  return Promise.all([server.connect(serverTransport), client.connect(clientTransport)]).then(
    () => client,
  );
}

export function capturingGlesys() {
  const calls: Record<string, unknown>[] = [];
  const paths: string[] = [];

  const glesys = glesysProxy((path, data) => {
    paths.push(path);
    calls.push(data);

    return Promise.resolve({});
  });

  return { glesys, calls, paths };
}

export async function listAllTools() {
  const server = buildServer({} as Glesys, "cl12345");
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const { tools } = await client.listTools();

  return tools;
}
