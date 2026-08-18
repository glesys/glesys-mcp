import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { GleSYSAPI } from "glesys-api";
import { buildServer } from "../src/server.js";

export function connectedClient(glesys: GleSYSAPI) {
  const server = buildServer(glesys);
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  return Promise.all([server.connect(serverTransport), client.connect(clientTransport)]).then(
    () => client,
  );
}

export function capturingGlesys() {
  const calls: Record<string, unknown>[] = [];

  const capture = (data?: Record<string, unknown>) => {
    calls.push(data ?? {});

    return Promise.resolve({
      body: { response: { status: { code: 200, text: "OK", timestamp: "now" } } },
    });
  };

  const modules = [
    "server",
    "serverDisk",
    "sshKey",
    "ip",
    "networkAdapter",
    "privateNetwork",
    "loadBalancer",
    "domain",
    "email",
    "objectStorage",
    "fileStorage",
    "archive",
    "database",
  ];
  const glesys = Object.fromEntries(modules.map((m) => [m, new Proxy({}, { get: () => capture })]));

  return { glesys: glesys as unknown as GleSYSAPI, calls };
}

export async function listAllTools() {
  const server = buildServer({} as GleSYSAPI);
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const { tools } = await client.listTools();

  return tools;
}
