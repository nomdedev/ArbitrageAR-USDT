# MCP Configuration

## Estado Actual
Sin servidores MCP configurados.

## Servidores MCP Potenciales

### Para Debugging
```json
{
  "chrome-devtools": {
    "command": "chrome-devtools-mcp",
    "args": ["--port", "9222"]
  }
}
```

### Para APIs
```json
{
  "fetch": {
    "command": "fetch-mcp",
    "args": []
  }
}
```

### Para Testing
```json
{
  "jest": {
    "command": "jest-mcp",
    "args": ["--config", "jest.config.js"]
  }
}
```

## Cómo Añadir un MCP Server

1. Editar `.claude/mcp/mcp-config.json`
2. Añadir configuración del servidor
3. Reiniciar Claude Code
4. El servidor estará disponible

## Notas
- MCP = Model Context Protocol
- Permite extender capacidades de Claude
- Útil para integraciones específicas