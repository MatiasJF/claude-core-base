# Instrucciones globales (plantilla de claude-core-base)

Copia este fichero a `~/.claude/CLAUDE.md` en cada máquina. Las notas de proyecto
o de empresa no van aquí: van en el `CLAUDE.md` de su repo.

## Patrones de trabajo

### Exploración en paralelo
Al analizar varias carpetas, lanza un agente de exploración por carpeta en un
solo mensaje, en lugar de recorrerlas una a una.

### Entorno de Python
Para dependencias de Python usa siempre un entorno virtual del proyecto:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install <paquete>
python script.py
```

### Generación de documentación
1. Explorar → reunir información
2. Preparar → entorno virtual y dependencias
3. Generar → script de Python
4. Ejecutar → lanzar el script
5. Verificar → comprobar los ficheros de salida
