# Shotage Credit System: Strategic Architecture & Implementation Plan

---

## 1. Executive Summary

As Shotage matures into a production-grade visual design and screenshot mockup tool, transitioning from a completely free utility to a sustainable monetization model requires a frictionless, user-friendly billing mechanism.

This document defines the **Pay-As-You-Go Credit System**, detailing:
- Pricing economics and unit costs.
- Psychological safeguards against **"Export Anxiety"**.
- Technical architecture (Auth, Database, Payments, API).
- Step-by-step implementation phases.

---

## 2. Pricing Economics & Model Analysis

### 2.1 Analysis of the Initial Proposal
- **Pack Price:** $10 for 2,000 credits
- **Image Export:** 100 credits
- **Video Export:** 250 – 400 credits

#### The Math:
| Action | Credit Cost | Total Exports per $10 Pack | Effective Cost per Export |
| :--- | :--- | :--- | :--- |
| **Image Export** | 100 credits | **20 image exports** | **$0.50 / image** |
| **Video Export (Short)** | 250 credits | **8 video exports** | **$1.25 / video** |
| **Video Export (Long)** | 400 credits | **5 video exports** | **$2.00 / video** |

#### Why $0.50/Image is Risky: The "Export Anxiety" Effect
1. **Iterative Design Workflow:** Users rarely export once. They export 3 to 6 times per session (checking layout on mobile, tweaking background, fixing text typos, or testing different aspect ratios like 16:9 vs 1:1).
2. **Punishing Iteration:** If a user re-exports 4 times to fix a spelling mistake, they spend $2.00 in 3 minutes.
3. **Zero Server Compute Cost:** Because Shotage generates images locally in the browser canvas/WebGL, users know it costs nothing in server GPU time. A $0.50/image charge feels disproportionate compared to tools like Canva ($12/mo unlimited) or Shots.so.

---

### 2.2 Recommended Pricing Models

#### Option A: High Perceived Value ("Big Numbers" Model) ⭐ *Recommended*
Keep the attractive **2,000 Credits for $10**, but calibrate the deduction rate so users feel generous value while preserving strong margins.

| Action | Credits Deducted | Total Exports per $10 Pack | Effective Cost | Value Perception |
| :--- | :--- | :--- | :--- | :--- |
| **Standard Image (1x/2x)** | **15 credits** | **~133 images** | **~$0.075 / image** | Fast, frictionless exports |
| **High-Res 4K Image (4x)** | **30 credits** | **~66 images** | **~$0.15 / image** | Premium print/marketing quality |
| **Video Export (5–10s)** | **75 credits** | **~26 videos** | **~$0.38 / video** | High value for social motion |
| **Video Export (15–30s)** | **120 credits** | **~16 videos** | **~$0.62 / video** | Heavy animated showcases |

> **Why this wins:**
> - $0.075 per image is the sweet spot for creator tools—cheap enough that users never hesitate to re-export, but high enough to generate recurring top-ups.
> - A user sees "2,000 credits" and feels like they received a mountain of value.

---

#### Option B: Clean 1:1 Transparent Model (Zero Mental Math)
If you prefer a model where users never need a conversion calculator:

- **$10 = 100 Credits** ($0.10 per credit)
- **1 Image Export (1x/2x)** = **1 Credit** ($0.10)
- **1 4K Image Export** = **2 Credits** ($0.20)
- **1 Video Export** = **5 to 8 Credits** ($0.50 – $0.80)

---

### 2.3 Tiered Credit Packages

Instead of offering only a single $10 tier, offer 3 tiers to maximize Average Order Value (AOV):

| Tier | Price | Credits (Option A) | Bonus / Savings | Target User |
| :--- | :--- | :--- | :--- | :--- |
| **Starter** | **$5** | 900 credits | Standard rate | Occasional creator |
| **Popular** | **$10** | 2,000 credits | **+10% Bonus** | Regular product builder |
| **Pro Pack** | **$25** | 6,000 credits | **+20% Bonus** | Agencies & power creators |

---

## 3. User Experience & Growth Mechanics

### 3.1 The Free Onboarding Hook
- **Welcome Gift:** Give **100 free credits** upon account registration.
- **Immediate Aha! Moment:** Users can immediately test 4–6 exports without pulling out a credit card.
- **Conversion Trigger:** Once their balance drops below 20 credits, display a sleek modal:
  > *"You've used all free credits! Top up with 2,000 credits for $10 to continue exporting in 4K."*

### 3.2 The 5-Minute "Typo Protection" Window
To completely eliminate export anxiety:
- If a user exports the same project again within **5 minutes** (e.g. to fix a typo or swap background color), **charge 0 credits** or a nominal 1 credit.
- Users will fall in love with Shotage because it respects their mistakes rather than punishing them.

### 3.3 Top Bar & Modal Feedback
- **Header Badge:** Live pill showing remaining balance (e.g., `⚡ 1,850 credits`). Clicking it opens the top-up drawer.
- **Export Modal Preview:** In `ExportModal.tsx`, clearly display:
  > *"Exporting PNG (2x) — Cost: 15 credits (Balance: 1,850 → 1,835)"*
- **One-Click Top-Up:** If credits are insufficient, replace the export button with *"Get 2,000 Credits for $10"*.

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Browser)                      │
│                                                             │
│  [TopBar Credit Pill]     [CanvasStage]     [ExportModal]   │
│           │                                       │         │
└───────────┼───────────────────────────────────────┼─────────┘
            │                                       │
            ▼ (Read Balance)                        ▼ (Deduct Request)
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next/Vercel)                  │
│                                                             │
│   GET  /api/user/credits       POST /api/export/deduct      │
│   POST /api/checkout/create    POST /api/webhooks/stripe    │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│     Supabase / PostgreSQL     │ │    Stripe / LemonSqueezy  │
│  - users (id, email, credits) │ │  - Hosted checkout        │
│  - credit_transactions        │ │  - Webhook delivery       │
└───────────────────────────────┘ └───────────────────────────┘
```

### 4.1 Database Schema (PostgreSQL / Supabase)

```sql
-- 1. Users profile extension
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  credits_balance integer default 100 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Transaction log for audit & refund safety
create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null, -- positive for purchase/grant, negative for deduction
  action_type text not null, -- 'signup_bonus', 'pack_purchase', 'export_image', 'export_video'
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Atomic deduction function (prevents race conditions)
create or replace function deduct_user_credits(p_user_id uuid, p_amount integer, p_action text)
returns boolean
language plpgsql
as $$
declare
  current_bal integer;
begin
  select credits_balance into current_bal from public.profiles where id = p_user_id for update;
  
  if current_bal is null or current_bal < p_amount then
    return false;
  end if;

  update public.profiles 
  set credits_balance = credits_balance - p_amount 
  where id = p_user_id;

  insert into public.credit_transactions (user_id, amount, action_type, description)
  values (p_user_id, -p_amount, p_action, 'Deduction for ' || p_action);

  return true;
end;
$$;
```

---

## 5. Implementation Roadmap

### Phase 1: Authentication & User Accounts (Week 1)
1. Integrate Supabase Auth (or Firebase Auth) supporting:
   - Google One-Tap Sign-In.
   - GitHub Sign-In (developer-focused).
   - Email Magic Link.
2. Initialize newly signed-up users with **100 free credits**.

### Phase 2: Payment Provider Integration (Week 2)
1. Setup **Stripe Checkout** or **Lemon Squeezy** (Lemon Squeezy acts as Merchant of Record handling global VAT/tax).
2. Create webhook handler `/api/webhooks/payment` to verify HMAC signature and credit the user account atomically.

### Phase 3: Export Interceptor (Week 3)
1. In `src/components/ExportModal.tsx`:
   - Check if user is logged in. If not, prompt quick signup with 100 free credits.
   - Display deduction amount before triggering render.
   - Call `/api/export/deduct` before finalizing `canvas.toBlob()` / `canvasRecord`.
   - Update user's local credit state immediately on success.

### Phase 4: UI Polish & Account Management (Week 4)
1. Add credit indicator in the Top Navigation bar.
2. Add "Top-up Credits" popup modal.
3. Add a simple "Billing & Credit History" drawer under User Settings.

---

## 6. Summary Checklist

- [x] Initial proposal analyzed ($0.50/image is too punishing for iterative mockup tools).
- [x] Recommended rebalance defined (2,000 credits for $10, with 15 credits/image and 75–120 credits/video).
- [x] Free tier onboarding hook (100 welcome credits).
- [x] 5-minute typo protection policy established.
- [x] Database schema & atomic deduction functions designed.
- [x] 4-phase technical roadmap structured.
