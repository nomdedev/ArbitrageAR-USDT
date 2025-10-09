# 💵 GUÍA DE USO - CONFIGURACIÓN AVANZADA DEL PRECIO DEL DÓLAR

## 🎯 ¿Qué cambió?

Ahora la extensión puede obtener el precio exacto del dólar según tu banco específico o usar un precio que tú definas manualmente. Esto hace que los cálculos de arbitraje sean mucho más precisos y realistas.

---

## 🔧 CONFIGURACIÓN AUTOMÁTICA (Recomendada)

### **Paso 1:** Abrir Configuración
1. Haz click en el ícono ⚙️ en la esquina superior derecha del popup
2. Busca la sección **"💵 Configuración del Precio del Dólar"**

### **Paso 2:** Seleccionar Automático
1. Marca la opción **"Automático desde Dolarito.ar"**
2. En el dropdown **"Banco preferido"**, selecciona tu banco:
   - **Banco Nación**
   - **Banco Provincia** 
   - **BBVA Banco Francés**
   - **Banco Galicia**
   - **Banco Santander Río**
   - **Banco Macro**
   - Y más...

### **Paso 3:** ¿No encuentras tu banco?
- Selecciona **"Promedio de todos los bancos"**
- Esto calculará el precio promedio de 10+ bancos argentinos

---

## ✋ CONFIGURACIÓN MANUAL (Para usuarios avanzados)

### **Cuándo usar precio manual:**
- Compraste USD a un precio específico y quieres cálculos exactos
- Tu banco no está en la lista
- Quieres experimentar con diferentes precios

### **Paso 1:** Configurar Precio Manual
1. En Configuración, marca **"Precio manual"**
2. Ingresa el precio exacto al que compraste USD (ej: 945.50)
3. Guarda la configuración

### **Paso 2:** Resultado
- Todos los cálculos usarán tu precio exacto
- Verás **"Fuente: Manual"** en el popup

---

## 🔄 RECÁLCULO RÁPIDO (¡NUEVO!)

### **¿Qué es?**
Puedes probar diferentes precios del dólar **sin cambiar tu configuración permanente**.

### **Cómo usarlo:**
1. En el popup principal, verás una barra con información del dólar actual
2. Haz click en **"🔄 Recalcular"**
3. Ingresa un precio temporal (ej: 960)
4. ¡Los resultados se actualizan instantáneamente!

### **Ejemplo práctico:**
```
Configuración permanente: Banco Galicia ($950)
Recálculo temporal: $970
→ Ves cómo cambian las ganancias con $970
→ Tu configuración sigue siendo Banco Galicia
```

---

## 📊 INTERPRETANDO LA INFORMACIÓN

### **En el Popup Principal:**
```
💵 $952.30
📍 Fuente: Banco Galicia
```
- **Precio:** El valor exacto usado en cálculos
- **Fuente:** De dónde viene este precio

### **En las Tarjetas de Arbitraje:**
Cada tarjeta ahora muestra:
```
💵 Dólar Oficial: $952.30
📍 Fuente: Banco Galicia
```

### **Tipos de Fuente:**
- **🏦 Banco específico:** "Banco Nación", "BBVA", etc.
- **📊 Promedio:** "Promedio (12 bancos)"
- **👤 Manual:** "Manual"
- **🔄 DolarAPI:** "DolarAPI (fallback)" - cuando Dolarito.ar falla

---

## ⚠️ CASOS ESPECIALES

### **Si Dolarito.ar no responde:**
- La extensión automáticamente usa DolarAPI como backup
- Si todo falla, usa un precio de emergencia ($950)
- Verás la fuente claramente indicada

### **Si tu banco no aparece:**
1. Selecciona "Promedio de todos los bancos"
2. O usa "Precio manual" con tu valor exacto

### **Para máxima precisión:**
1. Usa "Precio manual" con el valor exacto al que compraste USD
2. O selecciona tu banco específico si está disponible

---

## 🚀 CONSEJOS PRO

### **Para Trading Activo:**
- Usa el **recálculo rápido** para probar diferentes escenarios
- Cambia entre bancos para ver cuál te conviene más

### **Para Uso Casual:**
- Configura tu banco una vez y olvídate
- La extensión se actualiza automáticamente cada 5 minutos

### **Para Análisis Detallado:**
- Usa "Precio manual" con el valor exacto de tu última compra
- Compara con "Promedio" para ver si obtuviste buen precio

---

## 🔧 TROUBLESHOOTING

### **Problem:** No veo la nueva sección
**Solución:** Actualiza la página de configuración

### **Problem:** Los precios no cambian
**Solución:** Haz click en "Actualizar" (⟳) en el popup principal

### **Problem:** Mi banco no está en la lista
**Solución:** Usa "Promedio" o "Precio manual"

### **Problem:** Los cálculos parecen incorrectos
**Solución:** Verifica que el precio mostrado coincida con tu banco

---

## 📱 FLUJO RECOMENDADO

### **Primera configuración:**
1. Ir a Configuración
2. Seleccionar tu banco específico
3. Guardar y cerrar

### **Uso diario:**
1. Abrir popup
2. Ver precio automático de tu banco
3. Si quieres probar otro precio, usar "Recalcular"

### **Análisis avanzado:**
1. Usar recálculo con diferentes precios
2. Comparar ganancias
3. Decidir el mejor momento para operar

---

**💡 Tip Final:** La configuración automática con tu banco específico es la opción más práctica para la mayoría de usuarios. Solo usa precio manual si necesitas precisión extrema o tu banco no está disponible.