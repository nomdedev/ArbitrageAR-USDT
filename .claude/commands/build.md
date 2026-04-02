---
commandName: /build
description: Construye la extensión para producción
---

# Comando: /build

## Ejecución
```bash
# Build desarrollo
npm run build

# Build producción (optimizado)
npm run build:prod

# Crear package para Chrome Store
npm run package
```

## Proceso de build
1. Limpia directorio dist/
2. Copia archivos estáticos (html, css, icons)
3. Minifica JavaScript con Terser
4. Optimiza CSS con clean-css
5. Valida manifest.json
6. Crea ZIP para distribución

## Output
```
dist/
├── manifest.json
├── src/
│   ├── popup.html
│   ├── popup.js (minificado)
│   ├── popup.css (optimizado)
│   └── ...
└── icons/
```

## Verificación post-build
- [ ] manifest.json válido
- [ ] Archivos minificados
- [ ] Sin errores de sintaxis
- [ ] Tamaño total < 5MB