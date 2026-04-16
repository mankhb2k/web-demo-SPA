/**
 * shared.js — Lit CSS shared across all tab components.
 *
 * Usage in any LitElement:
 *   import { sharedStyles } from '../styles/shared.js';
 *   static styles = [sharedStyles, css`...component-specific...`];
 *
 * NOTE: @keyframes must be re-declared inside shadow DOM to work.
 */
import { css } from 'https://esm.sh/lit@3';

export const sharedStyles = css`
  /* ── Keyframes (must live inside shadow DOM) ── */
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes ping  { 75%,100%{transform:scale(2.2);opacity:0} }
  @keyframes slide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

  .anim-pulse { animation: pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
  .anim-ping  { animation: ping  1.2s ease-out infinite; }
  .anim-slide { animation: slide .28s ease both; }

  /* ── Typography ── */
  .mono { font-family: 'Cascadia Code','Fira Code','Consolas',monospace; }

  /* ── Section heading ── */
  .section-title {
    font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;
    display: flex; align-items: center; gap: .5rem; color: #ffffff;
    letter-spacing: -0.025em;
  }

  /* ── Panel (card container) ── */
  .panel {
    background: #0d0d0d; border: 1px solid #777780ff;
    border-radius: 8px; padding: 1.25rem;
  }
  .panel-title {
    font-size: 0.875rem; font-weight: 600; 
    color: #ffffff; margin-bottom: 1rem;
    display: flex; align-items: center; gap: .4rem;
    letter-spacing: -0.025em;
  }

  /* ── Buttons ── */
  .btn-primary {
    width: 100%; padding: .5rem 1rem; border-radius: 99px; border: none;
    background: #ffffff;
    color: #000000; font-weight: 600; font-size: 0.875rem; cursor: pointer;
    transition: all .2s; font-family: inherit;
    display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  }
  .btn-primary:hover  { background: #f4f4f5; transform: scale(0.98); }
  .btn-primary:active { transform: scale(0.96); }

  .btn-ghost {
    padding: .35rem .8rem; border-radius: 99px;
    border: 1px solid #27272a; background: transparent; color: #a1a1aa;
    font-size: .75rem; font-weight: 500; cursor: pointer; transition: all .2s;
    font-family: inherit; display: inline-flex; align-items: center; gap: .35rem;
  }
  .btn-ghost:hover { background: #27272a; color: #ffffff; }

  .btn-danger {
    padding: .3rem .55rem; border-radius: 6px; border: none;
    background: transparent; color: #a1a1aa; cursor: pointer;
    transition: all .15s; font-size: .75rem; font-family: inherit;
  }
  .btn-danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

  /* ── Info cards (used in storage + compare) ── */
  .info-card {
    background: #0d0d0d; border: 1px solid #1c1c1f; border-radius: 8px; padding: 1rem;
    display: flex; gap: .75rem; align-items: flex-start; margin-bottom: .75rem;
  }
  .info-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: .1rem; }
  .info-body { font-size: .875rem; line-height: 1.5; color: #a1a1aa; }
  .info-body strong { color: #ffffff; font-weight: 600; }
  .info-blue  { border-left: 3px solid #3b82f6; }
  .info-amber { border-left: 3px solid #f59e0b; }
  .info-green { border-left: 3px solid #22c55e; }

  /* ── Pro/con list (compare tab) ── */
  .pro-con { font-size: .75rem; line-height: 1.7; }
  .pro  { color: #4ade80; } .pro::before { content: '✓ '; }
  .con  { color: #f87171; } .con::before { content: '✕ '; }
  .neu  { color: #94a3b8; } .neu::before { content: '◉ '; }

  /* ── File tree (storage tab) ── */
  .tree        { font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: .78rem; line-height: 2; }
  .tree-root   { color: #64748b; }
  .tree-dir    { color: #60a5fa; }
  .tree-file   { color: #94a3b8; }
  .tree-tag    { color: #374151; font-size: .65rem; }
  .tree-indent { padding-left: 1.2rem; }

  /* ── Flow visual (architecture + docker101) ── */
  .flow-visual {
    display: flex; align-items: center; gap: .6rem; flex-wrap: wrap;
    background: #000000; border: 1px solid #18181b; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem;
  }
  .flow-box {
    padding: .5rem .9rem; border-radius: 8px; font-size: .78rem; font-weight: 700;
    text-align: center; flex-shrink: 0;
  }
  .flow-arrow { color: #1e3a5f; font-size: 1.2rem; flex-shrink: 0; }
  .fb-file { background: #1c1200; border: 1px solid #d97706; color: #fcd34d; }
  .fb-cmd  { background: #0c1d40; border: 1px solid #1d4ed8; color: #93c5fd;
             font-family: 'Cascadia Code','Fira Code',monospace; font-size: .7rem; }
  .fb-img  { background: #1e1040; border: 1px solid #7c3aed; color: #c4b5fd; }
  .fb-ctr  { background: #052e16; border: 1px solid #16a34a; color: #4ade80; }
`;
