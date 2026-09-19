# ProofOfHustle (PoH) — Project Rules & Engineering Standards

> **CRITICAL DIRECTIVE**: All agentic actions, code generations, and architectural decisions in this repository MUST strictly adhere to the **IMPECCABLE Craftsmanship Standard** and enforce an **Absolute Zero AI Slop Policy**.

---

## 1. IMPECCABLE Craftsmanship Standard

1. **"Precision Studio" Design System**:
   - **Theme**: Deep obsidian dark palette (`#0E1015` base, `#151821` card surface, `#1B1E2B` input background).
   - **Borders**: Clean hairline borders (`border-white/[0.08]`, `border-white/[0.12]` on active/focus).
   - **Accents**: Monad Iris (`#7C5CFC`), Emerald (`#10B981` / `#34D399`), Amber (`#F59E0B` / `#FBBF24`), Flame Red (`#F87171`).
   - **Ergonomics**: Fluid micro-animations, active click haptics (`active:scale-[0.98]`), sliding drawers, and global keyboard navigation (`/` to focus search, `Esc` to close all modals).
2. **Sub-Second Feedback Loop**:
   - Monad 400ms block finality and Alchemy RPC transport indicators must be prominently honored.
   - Any transaction confirmation must feel immediate without blocking or freezing UI threads.
3. **High Information Density & Visual Scannability**:
   - Avoid empty or bland layouts. Present tabular stats, activity tickers, and onchain badges with crisp typography and clean spacing.

---

## 2. Absolute Zero AI Slop Policy (Strict Prohibition)

### A. Zero Fake / Mock Cryptography
- **STRICTLY FORBIDDEN**: Using `Math.random()`, `Math.floor()`, or pseudo-random string generation to simulate hashes, signatures, keys, or ciphertexts.
- **MANDATORY**: All cryptographic operations must use genuine **Web Crypto API (`window.crypto.subtle`)** or browser WebAuthn hardware extensions (`PublicKeyCredential` PRF).
- Any sealed commit mechanism must generate authentic SHA-256 or Keccak-256 hashes matching Solidity's `bytes32` escrow parameter, along with an interactive live decryption test demonstrating zero-knowledge reveal.

### B. Zero Hallucinated API Keys & Environment Variables
- **STRICTLY FORBIDDEN**: Fabricating non-existent API keys or environment variables (e.g. inventing `DEVNADS_API_KEY`, `NEXT_PUBLIC_MERA_APP_ID`, `ENVIO_API_KEY`).
- **MANDATORY**: Always verify against official documentation, sponsor specifications, and live endpoints before declaring an environment variable. If an endpoint is an unauthenticated open public API (like Devnads verification), document it as open with zero required keys.

### C. Zero Dead-End or Cosmetic-Only Buttons
- Every button, drawer, and modal must perform a real functional action, update verifiable state, or interact with real smart contracts / Web Crypto routines.

### D. Zero Sensitive Secret Exposure in Git
- Real private keys, mnemonic phrases, and production secrets must **NEVER** be committed to Git.
- The `.gitignore` must strictly ignore all `.env` files. Only sanitized `.env.example` templates with clear documentation may be tracked.

---

## 3. Technology Stack & Verification Requirements

- **Smart Contracts (`contracts/`)**: Foundry, Solidity 0.8.28, OpenZeppelin v5. All unit tests must pass (`forge test`).
- **Indexer (`indexer/`)**: Envio HyperIndex v3, GraphQL schema, real-time TypeScript event handlers for Monad testnet (Chain ID 10143).
- **Frontend (`web/`)**: Next.js 15 App Router, TypeScript (strict mode), Tailwind CSS, Viem, Wagmi, Privy. Zero TypeScript or build errors (`npm run build`).
