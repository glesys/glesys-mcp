#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./client.js";
import { buildServer } from "./server.js";

const { glesys, project } = createClient();
const server = buildServer(glesys);

await server.connect(new StdioServerTransport());
console.error(`glesys-mcp running for project ${project}`);
