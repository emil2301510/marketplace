# 🛍 Marketplace — Full-Stack + ML

**Стек:** Next.js 14 · NestJS 10 · FastAPI · PostgreSQL · Redis

---

## ✅ Исправленные ошибки (v3)

1. **ERESOLVE peer deps** — `@nestjs/common@11` несовместим с `@nestjs/config@3`. Весь NestJS переведён на **v10** (все пакеты совместимы)
2. **`.npmrc`** — добавлен `legacy-peer-deps=true` в `backend-core/` и `frontend/` — защита от peer-dep конфликтов
3. **`order.entity.ts`** — исправлена связь `OneToMany → item.order`
4. **`product.entity.ts`** — убран неподдерживаемый `generatedType: 'STORED'`
5. **`recommendations.module.ts`** — добавлен `ConfigModule`
6. **`next.config.ts`** — `images.domains` → `images.remotePatterns`
7. **`cart-context.tsx`** — удалена неиспользуемая переменная

---

## 🚀 Запуск в VS Code (Windows)

### Требования
- Node.js 20+ → https://nodejs.org
- Python 3.11+ → https://python.org
- Docker Desktop → https://docker.com/products/docker-desktop

### ШАГ 1 — Открыть проект
File → Open Folder → выбери папку `marketplace-fixed`
Открой терминал: Ctrl+`

### ШАГ 2 — Запустить базы данных
> Убедись что Docker Desktop запущен!

```powershell
docker-compose up -d
docker ps
```

### ШАГ 3 — Backend (новый терминал +)
```powershell
cd backend-core
npm install
npm run dev
```
Готово когда видишь: `🚀 Backend running on http://localhost:3001`

### ШАГ 4 — Frontend (новый терминал +)
```powershell
cd frontend
npm install
npm run dev
```
Готово когда видишь: `Local: http://localhost:3000`

### ШАГ 5 — ML сервис (новый терминал +, опционально)
```powershell
cd backend-ml
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Если PowerShell блокирует скрипты:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🐛 Частые проблемы

**npm error ERESOLVE** — запусти вручную:
```powershell
npm install --legacy-peer-deps
```

**Cannot connect to database:**
```powershell
docker-compose down && docker-compose up -d
```

**Port already in use:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 👤 Смена роли пользователя

```powershell
# Продавец:
docker exec -it marketplace_postgres psql -U postgres -d marketplace -c "UPDATE users SET role='seller' WHERE email='твой@email.com';"

# Администратор:
docker exec -it marketplace_postgres psql -U postgres -d marketplace -c "UPDATE users SET role='admin' WHERE email='твой@email.com';"
```
