# OpenClaw SaaS — Frontend

> **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Vercel  
> **MVP scope:** Auth + Dashboard quản lý 1 container/user + Auto Wake polling

---

## 1. Tại sao Next.js + Vercel (và tradeoff)

**Chọn vì:**
- App Router + Server Components: fetch data trên server, không lộ API key ra client
- SSR cho landing page → SEO tốt để acquire user
- Vercel: zero-config deploy, preview URL mỗi PR, Edge network global
- Ecosystem lớn: dễ tuyển developer, nhiều library hỗ trợ
- Better-Auth có official Next.js plugin

**Tradeoff phải chấp nhận:**
- Bundle lớn hơn Lit (~300KB vs ~20KB) — không quan trọng cho dashboard app
- Vendor lock-in Vercel (có thể self-host Next.js nếu cần, nhưng mất tính năng Edge)
- Cold start trên Vercel free tier ~300ms — dùng paid nếu cần consistent latency

---

## 2. Cấu trúc thư mục (App Router)

```
frontend/
├── app/
│   ├── layout.tsx               ← Root layout: font, metadata, providers
│   ├── page.tsx                 ← Landing page (public, SSG, có SEO)
│   ├── login/
│   │   └── page.tsx             ← Login + Register
│   ├── dashboard/
│   │   ├── layout.tsx           ← Auth guard: redirect nếu chưa login
│   │   └── page.tsx             ← Dashboard chính
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts     ← Better-Auth Next.js handler
├── components/
│   ├── project-card.tsx         ← Container card (status, domain, actions)
│   ├── status-badge.tsx         ← running/stopped/starting/creating/error
│   └── wake-screen.tsx          ← Loading UI khi container đang khởi động
├── lib/
│   ├── api.ts                   ← Fetch wrapper gọi Control Plane
│   ├── auth.ts                  ← Better-Auth client config
│   └── wake.ts                  ← Auto-wake polling logic
├── types/
│   └── project.ts               ← TypeScript types
├── public/
└── next.config.ts
```

---

## 3. Pages & Chức năng MVP

### Landing page (`/`) — SSG, public
- Hero section giới thiệu OpenClaw
- Pricing (free tier)
- CTA → `/login`
- SEO meta tags, OG image

### Login / Register (`/login`)
- Email + password hoặc OAuth Google qua Better-Auth
- Session lưu HttpOnly cookie — client không cần lưu token
- Sau login → redirect `/dashboard`

### Dashboard (`/dashboard`) — Server Component + Client islands

```
┌──────────────────────────────────────────────────────────┐
│  OpenClaw                        [user@email]  [Logout]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Dự án của bạn                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🟢 Running    abc123.openclaw.ai        [↗ Mở]   │  │
│  │  Platform: Telegram, Zalo                          │  │
│  │  Active 2 phút trước                               │  │
│  │  [Cấu hình Bot]  [Logs]  [Dừng]                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Free tier: tối đa 1 dự án                               │
└──────────────────────────────────────────────────────────┘
```

**5 trạng thái container:**

| Status | UI | Actions |
|---|---|---|
| `running` | 🟢 + domain link | Dừng |
| `stopped` | ⚫ "Đang ngủ" | Khởi động |
| `starting` | 🟡 nhấp nháy + spinner | disabled |
| `creating` | 🟣 "Đang tạo lần đầu..." | disabled |
| `error` | 🔴 + message | Thử lại |

---

## 4. Auth — Better-Auth với Next.js

```typescript
// lib/auth.ts — server-side config
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  database: { provider: 'pg', url: process.env.DATABASE_URL },
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    cookieOptions: { httpOnly: true, secure: true, sameSite: 'lax' },
  },
  plugins: [nextCookies()],
});

// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
export const { GET, POST } = toNextJsHandler(auth);
```

```typescript
// Auth guard trong dashboard/layout.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  return <>{children}</>;
}
```

---

## 5. Data Fetching — Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getMyProject } from '@/lib/api';
import ProjectCard from '@/components/project-card';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const project = await getMyProject(session!.user.id);

  return (
    <main>
      <h1>Dự án của bạn</h1>
      {project
        ? <ProjectCard project={project} />
        : <CreateProjectButton />
      }
    </main>
  );
}
```

```typescript
// lib/api.ts — gọi Control Plane từ server
const BASE = process.env.CONTROL_PLANE_URL; // không lộ ra client

export async function getMyProject(userId: string) {
  const res = await fetch(`${BASE}/api/projects/mine`, {
    headers: { 'x-user-id': userId, 'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}` },
    next: { revalidate: 0 },  // không cache — luôn fresh
  });
  if (!res.ok) return null;
  return res.json();
}
```

---

## 6. Auto Wake — Polling Flow (MVP)

Container stopped → user bấm "Khởi động" → frontend poll đến khi `running`.

```typescript
// lib/wake.ts
export async function pollUntilRunning(
  projectId: string,
  onRunning: () => void,
  onError: (msg: string) => void,
) {
  const MAX_MS = 45_000;
  const INTERVAL_MS = 2_000;
  const start = Date.now();

  const timer = setInterval(async () => {
    if (Date.now() - start > MAX_MS) {
      clearInterval(timer);
      onError('Timeout — container mất quá lâu để khởi động');
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/health`);
      const { status } = await res.json();
      if (status === 'running') {
        clearInterval(timer);
        onRunning();
      }
    } catch {
      // ignore lỗi mạng trong quá trình startup, tiếp tục poll
    }
  }, INTERVAL_MS);

  return () => clearInterval(timer);
}
```

```typescript
// components/project-card.tsx — Client Component
'use client';
import { useState } from 'react';
import { pollUntilRunning } from '@/lib/wake';

export default function ProjectCard({ project: initial }) {
  const [project, setProject] = useState(initial);
  const [waking, setWaking] = useState(false);

  async function handleStart() {
    setWaking(true);
    await fetch(`/api/projects/${project.id}/start`, { method: 'POST' });
    const stop = pollUntilRunning(
      project.id,
      () => { setWaking(false); setProject(p => ({ ...p, status: 'running' })); },
      (err) => { setWaking(false); console.error(err); },
    );
  }

  if (waking) return <WakeScreen />;

  return (
    <div>
      <StatusBadge status={project.status} />
      <span>{project.subdomain}.openclaw.ai</span>
      {project.status === 'stopped' && (
        <button onClick={handleStart}>Khởi động</button>
      )}
      {project.status === 'running' && (
        <button onClick={() => fetch(`/api/projects/${project.id}/stop`, { method: 'POST' })}>
          Dừng
        </button>
      )}
    </div>
  );
}
```

---

## 7. Next.js Route Handlers (BFF — proxy đến Control Plane)

```typescript
// app/api/projects/[id]/start/route.ts
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.CONTROL_PLANE_URL}/api/projects/${params.id}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
      'x-user-id': session.user.id,
    },
  });

  return Response.json(await res.json(), { status: res.status });
}
```

> Dùng Next.js Route Handlers làm BFF (Backend For Frontend): client không gọi trực tiếp Control Plane, không lộ URL/secret. Tất cả auth check nằm ở đây.

---

## 8. Deploy — Vercel

```
Framework:        Next.js (auto-detect)
Build command:    next build
Output:           .next
```

**Environment variables trên Vercel:**
```env
CONTROL_PLANE_URL=https://api.openclaw.ai   # Railway NestJS
INTERNAL_API_SECRET=...                      # Next.js ↔ Control Plane
DATABASE_URL=postgresql://...                # Dùng bởi Better-Auth
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://app.openclaw.ai  # chỉ var này lộ ra client
```

**Domain mapping:**
- `app.openclaw.ai` → Vercel (custom domain)
- `api.openclaw.ai` → Railway (NestJS Control Plane)
- `*.openclaw.ai`   → VPS (Wildcard A record → Traefik)

> Cloudflare vẫn làm DNS manager. `app.openclaw.ai` trỏ CNAME đến Vercel, **Proxy OFF** (Cloudflare proxy không compatible tốt với Vercel).

---

## 9. Vercel vs Cloudflare Pages — Tradeoff

| | Vercel | Cloudflare Pages |
|---|---|---|
| Next.js support | First-class (Vercel làm Next.js) | Hạn chế (không phải mọi feature) |
| Edge Functions | Vercel Edge (V8) | Cloudflare Workers (V8, nhanh hơn) |
| Free tier | 100GB bandwidth/tháng | Unlimited bandwidth |
| Cold start | ~100–300ms | ~0ms (Cloudflare Workers) |
| Server Components | Full support | Partial |
| Vendor lock-in | Cao (một số feature chỉ chạy Vercel) | Thấp hơn |

**Kết luận:** Vercel là lựa chọn đúng cho Next.js. Nếu sau này muốn thoát Vercel, self-host Next.js bằng `next start` trên Railway hoặc VPS riêng — không đổi code.

---

## 10. Không làm cho MVP

| Feature | Khi nào |
|---|---|
| Traefik transparent wake (wake-proxy) | Khi user phàn nàn về UX bấm nút |
| Platform config UI (nhập token bot) | Sprint 2 |
| Real-time logs (WebSocket) | Khi polling logs không đủ |
| Dark/light theme | Nice-to-have |
| i18n (EN/VI) | Khi có user quốc tế |
