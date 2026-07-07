# BOOSTR Labs Backend — Setup & Testing

## 1. Environment Variables (Cloudflare Pages)

Verifica que estos estén configurados en Pages > Settings > Environment variables:

- **DB** → Binding automático (ya configurado en wrangler.toml)
- **MANAGER_PIN** → Tu PIN personal (que acabas de crear)

## 2. Database Migrations

Si es la **primera vez**, ejecuta la migración:

```bash
wrangler d1 migrations apply boostr_labs_core --local
wrangler d1 migrations apply boostr_labs_core --remote
```

Esto crea las tablas: `audit_submissions`, `leads`, `lead_events`, etc.

## 3. Deploy

```bash
npm run build
wrangler pages deploy
```

O si Cloudflare Pages tiene CI/CD automático, solo haz un push a `main`:

```bash
git add .
git commit -m "Backend: Add audit and leads endpoints"
git push origin main
```

Cloudflare Pages desplegará automáticamente.

## 4. Verificar que Funciona

### Test 1: Health Check
```bash
curl https://boostrlabs.pages.dev/api/health
```

Debe devolver:
```json
{
  "ok": true,
  "service": "BOOSTR Labs API",
  "version": "0.3.0-backend",
  "db": {
    "bound": true,
    "writable": true,
    "tables": ["leads", "audit_submissions", "lead_events", ...],
    "missing_tables": []
  },
  "manager": {
    "pin_configured": true
  }
}
```

**Si `pin_configured` es `false`:** El MANAGER_PIN no se ve. Revisa que esté en **Production** env vars, no solo Preview.

### Test 2: Audit Submit
```bash
curl -X POST https://boostrlabs.pages.dev/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "source": "test",
    "language": "es",
    "name": "Test User",
    "email": "test@example.com",
    "business_name": "Test Business",
    "answers": {
      "identity": ["Creador"],
      "current": ["Contenido"],
      "future": ["Productos"],
      "assets": ["Logo"],
      "stage": "Ya paga parte de mi vida",
      "friction": ["Cobrar no es fácil/limpio"],
      "traffic": "Podrían comprar sin preguntarme"
    }
  }'
```

Debe devolver:
```json
{
  "ok": true,
  "id": "uuid-here",
  "stored": true,
  "recommended_modules": ["BOOSTR Review", ...]
}
```

### Test 3: Manager Leads
1. Abre: `https://boostrlabs.pages.dev/manager/leads`
2. Ingresa tu MANAGER_PIN
3. Click "Load audit leads"
4. Debe aparecer el lead que enviaste en Test 2

## 5. Troubleshooting

| Problema | Solución |
|----------|----------|
| `db.writable: false` | Ejecuta migraciones: `wrangler d1 migrations apply` |
| `pin_configured: false` | Revisa que MANAGER_PIN esté en **Production env vars** (no Preview) |
| Audit no guarda | Revisa `/api/health` → `db.missing_tables` |
| Manager PIN no funciona | El PIN que ingresaste ¿coincide exactamente con el de Cloudflare? |

## 6. Para Producción

- [ ] Ejecuta migraciones en D1 **remoto**
- [ ] Confirma MANAGER_PIN en **Production** env vars
- [ ] Deploy a main branch
- [ ] Test /api/health
- [ ] Completa un Audit en /audit
- [ ] Verifica que aparezca en /manager/leads
