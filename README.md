# BITHOME CLIENT

Client-facing minimal frontend for BITHOME — **state, risk, signal, result; not mechanics.**

Growth-account app showing only classifications and outcomes:
customers see system state, confidence, risk, automation, portfolio, activity
and billing. No raw trust/power series, no cycle coordinates, no zones,
no trading methodology.

## Screens

1. **HOME** — SYSTEM STATE: `EXPANSION / NORMAL / CAPITULATION`, confidence,
   risk, automation, risk-gate status.
2. **PORTFOLIO** — equity, BTC held, realized PnL %, win rate, trades, cash.
3. **ACTIVITY** — last BUY / last SELL (facts only) + recent actions.
4. **BILLING** — plan, blocks remaining, PAUSE / RESUME / MANAGE.

## API

- Endpoint: `GET /api/client/state?key=<LICENSE>`
- Base: `https://api-proxy.allximika.workers.dev` (Cloudflare worker proxy)
- Auth: license key, stored locally in `localStorage` (`bithome.client.key`).
- Polling: 30 s.

### Response shape

```json
{
  "valid": true,
  "client": "…", "plan": "pro", "blocks_remaining": 0,
  "state": { "state": "NORMAL|EXPANSION|CAPITULATION",
             "confidence": "HIGH|MEDIUM|LOW",
             "risk": "HIGH|MEDIUM|LOW",
             "automation": "ACTIVE|INACTIVE",
             "gate": "OPEN|CLOSED" },
  "portfolio": { "equity": 0, "cash": 0, "btc_held": 0,
                 "pnl_pct": 0, "win_rate_pct": 0, "trades": 0, "hwm": 0 },
  "activity": { "last_buy": {"t": 0, "price": 0},
                "last_sell": {"t": 0, "price": 0},
                "recent": [ {"action": "BUY|SELL", "price": 0, "t": 0, "pnl": null} ] }
}
```

The server decides every classification; the client renders only labels.

## Run locally

```bash
python -m http.server 8000   # serve this folder
# open http://localhost:8000
```

Deploy as a static site under `app.bithome.pro`.