# Prompt for Codex — Apply Text Direction Update Only

Use this prompt inside the local BOOSTR Labs folder.

```text
NO programes. NO implementes features. NO cambies código funcional. NO instales dependencias. NO ejecutes build. NO rediseñes. NO borres assets.

Tu tarea es actualizar la documentación, textos internos, manifiestos, roadmap y dirección estratégica de la carpeta local BOOSTR Labs usando el ZIP `BOOSTR_CODEX_TEXT_DIRECTION_UPDATE_v1_0`.

Primero lee:
- README.md
- CODEX_START_HERE.md
- docs/*
- manifests/*

Luego actualiza la carpeta local de BOOSTR Labs para que refleje esta dirección actual.

Reglas:
1. Preserva assets, HTMLs, screenshots, ZIPs, frontend modules y rutas existentes.
2. Si encuentras docs viejos contradictorios, no los borres; márcalos como SUPERSEDED o DEPRECATED.
3. Si encuentras información incompleta, agrégala a `docs/18_MISSING_OR_UNCLEAR.md`.
4. Crea/actualiza todos los archivos documentales requeridos.
5. No cambies UI ni copy visible de prototipos salvo que solo estés documentando que está viejo.
6. No intentes construir backend.
7. No conviertas BOOSTR en agencia, disquera, marketplace abierto o builder self-service.
8. Mantén BOOSTR como infraestructura + inteligencia + data + conversión.

Al final entrega resumen:
- archivos creados;
- archivos actualizados;
- assets preservados;
- docs obsoletos marcados;
- conflictos encontrados;
- pendientes antes de subir a GitHub.
```
