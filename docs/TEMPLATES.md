# Plantillas para documentación técnica

Usa estas plantillas para documentar funciones, proveedores y ADRs.

---

## Plantilla: Documentación de una función

- Título: `functionName`
- Propósito: breve descripción
- Contrato:
  - Inputs: (tipo, descripción)
  - Output: (tipo, estructura)
  - Side-effects: almacenamiento, network, DOM
  - Errores posibles: lista
- Ejemplo de uso (snippet)
- Tests sugeridos: (happy path + 1-2 edge cases)

---

## Plantilla: Proveedor (DataService)

- Nombre: `ProveedorX`
- Endpoints usados: `https://...`
- Ejemplo de respuesta cruda:
```
{ ... }
```
- Normalización: cómo se mapea a `{compra, venta, timestamp, source}`
- Reglas especiales: rate-limit, parsing HTML
- Tests recomendados: mock de respuesta y validación de normalización

---

## Plantilla: ADR (Architecture Decision Record)

- Título:
- Estado: proposed | accepted | deprecated
- Contexto:
- Decisión:
- Consecuencias:
- Alternativas consideradas:

---

Guarda siempre tu documentación en `docs/` y referencia la plantilla usada al inicio del archivo.
