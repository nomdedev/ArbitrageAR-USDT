# 📝 Instrucciones para Subir a GitHub

## ✅ Pasos Completados:
- [x] Repositorio Git inicializado
- [x] Archivos agregados (.gitignore, LICENSE)
- [x] Primer commit realizado
- [x] 15 archivos listos para subir

## 🚀 Próximos Pasos:

### Opción 1: Crear Repositorio desde GitHub Web

#### 1. Crear el repositorio en GitHub.com:
```
1. Ve a https://github.com/new
2. Nombre del repositorio: ArbitrageAR-USDT
3. Descripción: Extensión Chrome para arbitraje Dólar Oficial → USDT en Argentina
4. Público o Privado (tu elección)
5. NO inicializar con README (ya tenemos uno)
6. NO agregar .gitignore (ya tenemos uno)
7. NO agregar LICENSE (ya tenemos uno)
8. Click en "Create repository"
```

#### 2. Conectar tu repositorio local:
```powershell
# Reemplaza 'TU_USUARIO' con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/ArbitrageAR-USDT.git

# O si prefieres SSH:
git remote add origin git@github.com:TU_USUARIO/ArbitrageAR-USDT.git
```

#### 3. Subir el código:
```powershell
# Cambiar nombre de rama a 'main' si es necesario
git branch -M main

# Push inicial
git push -u origin main
```

---

### Opción 2: Crear Repositorio desde la Terminal (GitHub CLI)

Si tienes GitHub CLI instalado:

```powershell
# Crear repositorio público
gh repo create ArbitrageAR-USDT --public --source=. --remote=origin --push

# O crear repositorio privado
gh repo create ArbitrageAR-USDT --private --source=. --remote=origin --push
```

---

## 📋 Comandos Completos (Copia y Pega)

### Para GitHub Web (Reemplaza TU_USUARIO):

```powershell
# 1. Agregar remoto
git remote add origin https://github.com/TU_USUARIO/ArbitrageAR-USDT.git

# 2. Verificar remoto
git remote -v

# 3. Push inicial
git branch -M main
git push -u origin main
```

### Para GitHub CLI:

```powershell
# Instalar GitHub CLI si no lo tienes (ejecuta como administrador):
winget install GitHub.cli

# Autenticarte:
gh auth login

# Crear y subir repositorio público:
gh repo create ArbitrageAR-USDT --public --source=. --remote=origin --push
```

---

## 🔒 Configurar Autenticación

### Si usas HTTPS:
GitHub ya no acepta contraseñas. Necesitas un Personal Access Token (PAT):

```
1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Nombre: ArbitrageAR-USDT
4. Permisos: Marca "repo" (todos los sub-permisos)
5. Expiration: 90 días o más
6. Click "Generate token"
7. COPIA EL TOKEN (solo se muestra una vez)
8. Al hacer push, usa el token como contraseña
```

### Si usas SSH:
```powershell
# Generar clave SSH (si no tienes):
ssh-keygen -t ed25519 -C "tu_email@example.com"

# Agregar a GitHub:
# 1. Copia tu clave pública:
Get-Content ~/.ssh/id_ed25519.pub | clip

# 2. Ve a: https://github.com/settings/keys
# 3. Click "New SSH key"
# 4. Pega la clave y guarda
```

---

## ✨ Después de Subir

### 1. Verificar que subió correctamente:
```
Ve a: https://github.com/TU_USUARIO/ArbitrageAR-USDT
```

### 2. Agregar Topics (etiquetas) al repositorio:
```
Topics sugeridos:
- chrome-extension
- arbitrage
- cryptocurrency
- usdt
- argentina
- fintech
- dolar-oficial
```

### 3. Agregar Descripción y Website:
```
Descripción: 
Extensión Chrome para arbitraje Dólar Oficial → USDT en Argentina con UI/UX moderna

Website: (opcional)
https://github.com/TU_USUARIO/ArbitrageAR-USDT
```

### 4. Habilitar Issues y Discussions:
```
Settings → Features → Issues: ON
Settings → Features → Discussions: ON (opcional)
```

---

## 🎯 Comandos para Futuras Actualizaciones

```powershell
# 1. Hacer cambios en el código

# 2. Ver cambios
git status

# 3. Agregar cambios
git add .

# 4. Commit
git commit -m "Descripción del cambio"

# 5. Subir a GitHub
git push
```

---

## 🐛 Solución de Problemas

### Error: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/ArbitrageAR-USDT.git
```

### Error: "Authentication failed"
```powershell
# Usa un Personal Access Token en vez de contraseña
# O configura SSH (ver arriba)
```

### Error: "Updates were rejected"
```powershell
# Forzar push (solo en repositorio nuevo y vacío)
git push -f origin main
```

---

## 📊 Estado Actual del Repositorio

```
Rama: main
Commit: 08eea58
Archivos: 15
Líneas de código: 2,179
Tamaño: ~50 KB
```

### Archivos incluidos:
- ✅ .gitignore
- ✅ LICENSE (MIT)
- ✅ README.md
- ✅ CHANGELOG.md
- ✅ GUIA_USO.md
- ✅ INSTALACION.md
- ✅ manifest.json
- ✅ background.js
- ✅ popup.html/css/js
- ✅ icons/ (4 iconos)

---

## 🎉 ¡Listo para Subir!

El repositorio local está configurado y listo. Solo falta:
1. Crear el repositorio en GitHub
2. Conectarlo con `git remote add`
3. Hacer `git push`

**¿Necesitas ayuda con algún paso?** 🚀
