// ==UserScript==
// @name         YT Max
// @namespace    http://tampermonkey.net/
// @version      5.5.0
// @description  Hash Routing, Instant Dashboard, Editable Notes, Seekbar Hover Tooltips
// @match        https://www.youtube.com/*
// @author       Shivaam Singh Rajput
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  "use strict";

  const syncChannel = new BroadcastChannel("yt_notes_sync");

  const style = document.createElement("style");

  style.textContent = `
body.yt-notes-active ytd-app,
body.yt-notes-active #content,
body.yt-notes-active #early-body,
body.yt-notes-active > *:not(#yt-custom-notes-dashboard) {
  display: none !important;
}

/* 1. App Background Locked Completely */
body.yt-notes-active {
  background: #000 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

#yt-custom-notes-dashboard {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 2147483647;
  overflow: hidden;
  color: #e1e1e1;
  font-family: "YouTube Sans", Roboto, Arial, sans-serif;
}

body.yt-notes-active #yt-custom-notes-dashboard {
  display: block !important;
}

/* 2. Container Transformed into a Flush Screen-Filling App Window */
.yt-notes-container {
  max-width: 1860px;
  height: 100vh;
  margin: 0 auto;
  background: #121212;
  padding: 15px 20px 0 20px;
  border-radius: 0;
  border: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 3. Hide the ⚡ Tips permanently */
.yt-notes-container > p,
.yt-notes-header + p,
.yt-notes-tips {
  display: none !important;
}

/* 4. Ultra-Slimmed Header & Search */
.yt-notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}


/* --- Premium Golden Gradient Heading --- */
.yt-notes-h1 {
  user-select: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 22px; /* Adjust to your preferred size */
  font-weight: 800;
  letter-spacing: 1.5px;
  margin: 0;
  padding-bottom: 4px;

  /* 1. The Metallic Gradient (Bright highlight to deep amber) */
  background: linear-gradient(135deg, #FFF8D6 0%, #FFD700 40%, #D4AF37 80%, #996500 100%);

  /* 2. Paint the gradient strictly inside the text */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* 3. A subtle ambient glow (text-shadow doesn't work well with clipped backgrounds, but drop-shadow does!) */
  filter: drop-shadow(0px 4px 12px rgba(255, 215, 0, 0.3));

}


.yt-notes-btn { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.05); padding: 7px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s ease; margin-left: 8px; }
.yt-notes-btn:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
#backtoyt { background: rgba(62, 255, 99, 0.15); color: #3eff63; border-color: rgba(62, 255, 99, 0.3); }
#backtoyt:hover { background: rgba(62, 255, 99, 0.25); }
.yt-notes-btn-danger { background: rgba(204, 0, 0, 0.15); color: #ff4e45; border-color: rgba(204, 0, 0, 0.3); }
.yt-notes-btn-danger:hover { background: rgba(204, 0, 0, 0.25); }

.yt-notes-search-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-shrink: 0; }
.yt-notes-search { flex: 1; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.08); color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; }
.yt-notes-search:focus, .yt-notes-type-filter:focus { border-color: #3ea6ff; background: #0f0f0f; box-shadow: 0 0 0 3px rgba(62, 166, 255, 0.15); }

.yt-notes-type-filter { background: #1a1a1a; color: #fff; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 9px 14px; outline: none; cursor: pointer; font-weight: 600; font-size: 13px; }

.yt-notes-current-vid-label { display: flex; align-items: center; gap: 6px; background: #1a1a1a; color: #ccc; padding: 9px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); cursor: pointer; font-weight: 600; font-size: 13px; transition: 0.2s; }
.yt-notes-current-vid-label:hover { background: #252525; color: #fff; }
.yt-notes-current-vid-checkbox { cursor: pointer; width: 14px; height: 14px; accent-color: #3ea6ff; }

/* 4. Master List Container */
#yt-notes-list-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 15px;
}

/* 5. INDEPENDENT SCROLLING COLUMNS */
.yt-notes-main-column {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 14px;
}

/* --- THE FIX: NEW MASONRY FLEX CONTAINER --- */
.yt-notes-pinned-container {
  box-sizing: border-box;
  width: 920px;
  max-width: 53%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 10px 40px 10px;
  margin: 0;
}

.yt-notes-pinned-columns-wrapper {
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: 100%;
  align-items: flex-start;
}

.yt-notes-pinned-inner-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

/* Universal sleek scrollbars */
.yt-notes-main-column::-webkit-scrollbar, .yt-notes-pinned-container::-webkit-scrollbar { width: 5px; }
.yt-notes-main-column::-webkit-scrollbar-track, .yt-notes-pinned-container::-webkit-scrollbar-track { background: transparent; }
.yt-notes-main-column::-webkit-scrollbar-thumb, .yt-notes-pinned-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 10px; }
.yt-notes-main-column::-webkit-scrollbar-thumb:hover, .yt-notes-pinned-container::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

/* Sticky Pinned Header */
.yt-notes-pinned-header {
  width: 100%;
  box-sizing: border-box;
  font-size: 12px; font-weight: 700; color: #aaa; letter-spacing: 1.2px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 12px;
  position: sticky; top: 0; z-index: 100; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px);
}



.yt-notes-pinned-card:hover {
  border-color: rgba(255, 215, 0, 0.35); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.15); z-index: 200;
}

/* NATIVE DIMENSIONS FOR SHORTS */
.yt-notes-pinned-img-wrap {
  position: relative;
  width: 100%;
  overflow: hidden; background: #000; border-bottom: 1px solid rgba(255, 255, 255, 0.05); flex-shrink: 0; border-radius: 11px 11px 0 0; z-index: 10;
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s, border-radius 0.25s;
  will-change: transform, box-shadow, border-radius;
}

/* Anchor mapping for the physical Flex Columns */
.yt-notes-pinned-left-col .yt-notes-pinned-img-wrap { transform-origin: 2% center; }
.yt-notes-pinned-right-col .yt-notes-pinned-img-wrap { transform-origin: 98% center; }

.yt-notes-pinned-img-wrap:hover {
  transform: scale(1.24) translateZ(0);
  z-index: 400;
  border-radius: 8px;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.yt-notes-pinned-img {
  width: 100%; height: auto; display: block; object-fit: contain;
}

.yt-notes-pinned-img-wrap::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.6)); pointer-events: none; }

.yt-notes-pinned-unpin {
  position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; opacity: 0; transform: scale(0.9); transition: all 0.2s ease; z-index: 10; cursor: pointer;
}
.yt-notes-pinned-img-wrap:hover .yt-notes-pinned-unpin { opacity: 1; transform: scale(1); }
.yt-notes-pinned-unpin:hover { background: rgba(255, 215, 0, 0.2); color: #ffd700; border-color: #ffd700; }

.yt-notes-pinned-details { padding: 16px 14px; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; flex: 1 0 auto; }
.yt-notes-pinned-top { display: flex; justify-content: space-between; align-items: center; }
.yt-notes-pinned-input { width: 100%; box-sizing: border-box; background: rgba(255, 255, 255, 0.03); border: 1px solid transparent; color: #fff; font-size: 14px; font-weight: 500; resize: none; overflow: hidden; outline: none; padding: 8px; border-radius: 6px; font-family: inherit; line-height: 1.4; min-height: 36px; transition: 0.2s; flex-shrink: 0; }
.yt-notes-pinned-input:hover { background: rgba(255, 255, 255, 0.05); }
.yt-notes-pinned-input:focus { background: #0f0f0f; border-color: rgba(255, 255, 255, 0.12); box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.06); }

.yt-notes-pinned-vid-name { font-size: 10px; font-weight: 600; color: #777; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 10px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Unpinned Main Column Styles */
.yt-notes-group { margin-bottom: 20px; background: #161616; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); transition: z-index 0s; }
.yt-notes-group:hover { z-index: 100; position: relative; }
.yt-notes-group-header { background: rgba(255, 255, 255, 0.03); padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; cursor: pointer; user-select: none; transition: background 0.2s ease; }
.yt-notes-group-header:hover { background: rgba(255, 255, 255, 0.06); }
.yt-notes-group-title { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; }
.yt-notes-group-subtitle { font-size: 12px; font-weight: 500; color: #9a9a9a; }

.yt-notes-header-right { display: flex; align-items: center; gap: 12px; position: relative; z-index: 60; flex-shrink: 0; margin-top: 2px; }
.yt-notes-group-content { display: block; }
.yt-notes-group.is-folded .yt-notes-group-content { display: none; }


.yt-notes-note:last-child { border-bottom: none; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
.yt-notes-note:hover { background: rgba(255, 255, 255, 0.02); }
.yt-notes-left { flex: 1; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
.yt-notes-tag-row { display: flex; align-items: center; gap: 10px; width: 100%; }
.yt-notes-time { cursor: pointer; color: #888; font-weight: 700; font-size: 13px; flex-shrink: 0; background: rgba(255, 255, 255, 0.05); padding: 4px 8px; border-radius: 6px; }

.yt-notes-badge-row { margin-bottom: 2px; display: flex; }
.yt-notes-type-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.yt-notes-type-question { background: rgba(204, 0, 0, 0.15); color: #ff4e45; border: 1px solid rgba(204, 0, 0, 0.3); }
.yt-notes-type-concept { background: rgba(62, 255, 99, 0.15); color: #3eff63; border: 1px solid rgba(62, 255, 99, 0.3); }

.yt-notes-edit-input { box-sizing: border-box; min-width: 150px; max-width: 100%; width: auto; background: transparent; border: 1px solid transparent; color: #fff; font-size: 16px; font-weight: 500; padding: 4px 8px; border-radius: 6px; outline: none; transition: background 0.2s, box-shadow 0.2s; font-family: inherit; resize: none; overflow: hidden; line-height: 1.4; word-break: break-word; }
.yt-notes-edit-input:hover { background: rgba(255, 255, 255, 0.05); }
.yt-notes-edit-input:focus { border-color: #444; background: #000; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); }

.yt-notes-right { display: flex; align-items: center; gap: 15px; margin-left: 20px; flex-shrink: 0; }
.yt-notes-action-btns { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; justify-content: center; opacity: 0; transition: opacity 0.2s ease; }
.yt-notes-note:hover .yt-notes-action-btns { opacity: 1; }
.yt-notes-copy-btn, .yt-notes-pin-btn, .yt-notes-del-btn { display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; background: rgba(255, 255, 255, 0.08); color: #fff; border-radius: 8px; min-width: 50px !important; max-width: 50px !important; height: 32px; padding: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; flex-shrink: 0; }
.yt-notes-btn-icon { font-size: 14px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease; }
.yt-notes-btn-text { font-size: 11px; font-weight: 700; white-space: nowrap; max-width: 0; opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.yt-notes-copy-btn:hover, .yt-notes-pin-btn:hover, .yt-notes-del-btn:hover { min-width: 90px !important; max-width: 120px !important; padding: 0 12px !important; background: rgba(255, 255, 255, 0.15); }
.yt-notes-copy-btn:hover .yt-notes-btn-text, .yt-notes-pin-btn:hover .yt-notes-btn-text, .yt-notes-del-btn:hover .yt-notes-btn-text { max-width: 100px; opacity: 1; margin-left: 6px; }
.yt-notes-del-btn:hover { background: #cc0000 !important; color: #fff; }
.yt-notes-del-btn:hover .yt-notes-btn-icon { font-weight: 900; }
.yt-notes-pin-btn.is-pinned { background: rgba(255, 215, 0, 0.15); color: #ffd700; }

.yt-notes-thumb { height: 100px; width: auto; max-width: 180px; border-radius: 8px; object-fit: contain; background: #000; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; position: relative; z-index: 1; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s; transform-origin: right center; transform: translateZ(0); will-change: transform, box-shadow; }
.yt-notes-note:hover .yt-notes-thumb { transform: scale(1.12) translateZ(0); border-color: rgba(255, 255, 255, 0.15); box-shadow: 0 12px 25px rgba(0, 0, 0, 0.5); z-index: 200; }
.yt-notes-thumb:hover { transform: scale(1.4) translateZ(0) !important; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7) !important; z-index: 400 !important; border: 1px solid rgba(255,255,255,0.2) !important; }

.yt-notes-empty { color: #666; font-style: italic; text-align: center; padding: 40px; font-size: 16px; width: 100%; }
.yt-notes-folded-badge { display: none; background: rgba(255, 255, 255, 0.08); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #ccc; border: 1px solid rgba(255, 255, 255, 0.05); white-space: nowrap; }
.yt-notes-group.is-folded .yt-notes-folded-badge { display: block; }
.yt-notes-mini-thumbs-wrapper { position: relative; display: none; width: 100%; margin-top: 8px; }
.yt-notes-group.is-folded .yt-notes-mini-thumbs-wrapper { display: block; }
.yt-notes-mini-thumbs { display: flex; align-items: center; gap: 6px; width: 100%; overflow-x: auto; scrollbar-width: none; padding: 25px 25px; margin: -25px -25px; scroll-behavior: smooth; }
.yt-notes-mini-thumbs::-webkit-scrollbar { display: none; }
.yt-notes-mini-thumb { height: 28px; width: auto; max-width: 50px; border-radius: 4px; object-fit: cover; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); will-change: transform; transform: translateZ(0); flex-shrink: 0; position: relative; z-index: 1; }
.yt-notes-mini-thumb:hover { transform: scale(2.2) translateZ(0); border-color: #fff; z-index: 50; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.8); }

#yt-notes-global-tooltip { position: absolute; background: rgba(15, 15, 15, 0.95); color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 13px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); pointer-events: none; z-index: 2147483647; opacity: 0; transition: opacity 0.1s ease; max-width: 300px; backdrop-filter: blur(8px); display: flex; flex-direction: column; gap: 6px; }
.yt-notes-tt-text { font-weight: 500; line-height: 1.5; color: #e1e1e1; white-space: pre-wrap; word-wrap: break-word; }
.yt-notes-tt-hint { font-size: 11px; color: #3ea6ff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 6px; }

/* THE FIX: MOBILE-STATE MEDIA QUERY */
@media (max-width: 1500px) {
  .yt-notes-pinned-container {
    width: 530px;
    max-width: 55%;
    padding: 4px 70px 40px 60px;
  }

  .yt-notes-pinned-columns-wrapper {
    flex-direction: column;
  }

  .yt-notes-pinned-left-col .yt-notes-pinned-img-wrap,
  .yt-notes-pinned-right-col .yt-notes-pinned-img-wrap {
    transform-origin: center center;
  }

  .yt-notes-pinned-inner-col {
    min-width: 0 !important;
    width: 100%;
  }

  .yt-notes-pinned-card {
    width: 100% !important;
  }

  .yt-notes-pinned-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #121212;
    border-radius: 12px 12px 0 0;
    overflow: hidden;
    flex-shrink: 0;
    display: block;
  }

  .yt-notes-pinned-img {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    object-position: left center;
    display: block;
    transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .yt-notes-pinned-img-wrap:hover .yt-notes-pinned-img {
    transform: scale(1.03);
  }
}

/* --- 1. BASE STYLES (Updated with Opacity Transitions) --- */
.yt-notes-note {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  border-left: 4px solid transparent;
  /* UPDATED: Added opacity and border-left transitions */
  transition: background 0.2s ease, opacity 0.3s ease, border-left-color 0.2s ease;
}

.yt-notes-pinned-card {
  width: 100%;
  min-width: 0;
  background: linear-gradient(180deg, #1a1a1a, #121212);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  height: max-content;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  overflow: visible;
  /* UPDATED: Added opacity to your existing transitions */
  transition: border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
}

/* --- 2. THE ISOLATION EFFECT (Dim everything) --- */
/* When ANY input inside the dashboard is focused, dim all notes to 35% opacity */
#yt-custom-notes-dashboard:focus-within .yt-notes-note,
#yt-custom-notes-dashboard:focus-within .yt-notes-pinned-card {
  opacity: 0.35;
}

/* --- 3. THE ACTIVE HIGHLIGHT (Bring the focused note back to 100%) --- */

/* For Unpinned Notes: Restore opacity, light up left border, and slightly brighten background */
.yt-notes-note:focus-within {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border-left-color: rgba(255, 255, 255, 0.6) !important;
}

/* For Pinned Cards: Restore opacity, pop to the front, and brighten the border/shadow */
.yt-notes-pinned-card:focus-within {
  opacity: 1 !important;
  z-index: 2 !important; /* Forces the active card above the dimmed ones */
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
}



/* --- GOLDEN PINNED GROUP THEME --- */
.yt-notes-golden-group {
  border: 1px solid rgba(255, 215, 0, 0.4) !important;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.05), transparent) !important;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.05);
}
.yt-notes-golden-group .yt-notes-group-header {
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}
.yt-notes-golden-group .yt-notes-group-title {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}



/* --- YouTube Progress Bar Markers --- */
.yt-custom-note-marker {
  /* Use !important to safely override the inline JavaScript styles when hovering */
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.yt-custom-note-marker:hover {
  /* Keeps it perfectly centered while blowing it up to 180% size */
  transform: translate(-50%, -50%) scale(1.8) !important;
  z-index: 99 !important; /* Forces it above all other timeline UI */

  /* Adds a bright white glow to show it is actively focused */
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 0 2px rgba(24, 24, 24, 0.8) !important;
}


/* 1. Force the top header to split left and right */
.yt-notes-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 15px; /* Adjust based on your current spacing */
}

/* 2. Group the title and subtitle so they stay together on the left */
.yt-notes-header-text-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 3. Group the buttons on the right */

/* 4. The button aesthetic */
.yt-notes-util-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #a3a3a3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}

.yt-notes-util-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}




/* MAXIMIZED GOLDEN PINNED THEME (Golden Glassmorphism)
========================================================= */

/* 1. The Main Wrapper (Warm, Golden Frosted Glass) */

/* 1. The Main Wrapper (Solid Golden Glass) */
.yt-notes-pinned-container {
  /* Increased opacity to 0.85 and 0.95 to make the background deeply solid and readable */
  background: linear-gradient(180deg, rgba(50, 45, 25, 0.85), rgba(20, 18, 15, 0.95));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 215, 0, 0.25);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 215, 0, 0.15);
  border-radius: 16px;
  margin-bottom: 24px;
}


/* 2. The Header (Richer Ambient Gold Glow) */
.yt-notes-pinned-header {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.12), transparent);
  color: #FFD700 !important; /* Pure classic gold */
  font-weight: 600;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4); /* Makes the text actually glow */
}
/* 2. The Header (Slimmer Profile) */
.yt-notes-pinned-header {
  padding: 6px 22px; /* Decreased vertical padding to reduce the height */
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.12), transparent);
  color: #FFD700 !important;
  font-weight: 600;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

/* 3. The Minimize Button (Golden Pill) */
.yt-notes-pinned-header button {
  background: rgba(255, 215, 0, 0.1) !important;
  border: 1px solid rgba(255, 215, 0, 0.3) !important;
  border-radius: 20px;
  padding: 6px 14px !important;
  color: #FFD700 !important;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.yt-notes-pinned-header button:hover {
  background: rgba(255, 215, 0, 0.2) !important;
  border-color: rgba(255, 215, 0, 0.5) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.15);
}

/* 4. The Individual Cards (Amber/Gold Tinted Glass) */

/* 4. The Individual Cards (Thicker Amber Tint) */
.yt-notes-pinned-card {
  /* Increased from 0.55 to 0.85 so the cards don't feel hollow */
  background: rgba(45, 40, 25, 0.85) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 215, 0, 0.2) !important;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 5. Smooth Hover Lift (Enhancing the Gold Aura) */
.yt-notes-pinned-card:hover {
  background: rgba(55, 48, 28, 0.75) !important;
  border-color: rgba(255, 215, 0, 0.4) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.15) !important;
  transform: translateY(-3px);
}

/* 6. Active Focus Glow (Brilliant Gold Outline) */
.yt-notes-pinned-card:focus-within {
  border-color: rgba(255, 215, 0, 0.8) !important;
  background: rgba(60, 52, 25, 0.9) !important;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.25), 0 12px 35px rgba(0, 0, 0, 0.5) !important;
}

/* 7. Floating "Unpin" Button (Golden Frosted) */
.yt-notes-pinned-unpin {
  background: rgba(40, 35, 20, 0.7) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 215, 0, 0.3) !important;
  color: #FFD700 !important;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.yt-notes-pinned-unpin:hover {
  background: rgba(255, 215, 0, 0.25) !important;
  border-color: rgba(255, 215, 0, 0.6) !important;
  transform: scale(1.05);
}
`;

  document.documentElement.appendChild(style);

  function getShortsId(pathname) {
    if (!pathname.startsWith("/shorts/")) return null;
    return pathname.split("/")[2] || null;
  }

  function handleNavigation() {
    const shortId = getShortsId(window.location.pathname);
    if (shortId) {
      window.location.replace(`https://www.youtube.com/watch?v=${shortId}`);
    }
  }

  window.addEventListener("yt-navigate-finish", () => {
    handleNavigation();
    setTimeout(() => {
      renderPlayerMarkers();
      initProgressBarHover();
    }, 1500);
  });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    handleNavigation();
  };
  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    handleNavigation();
  };
  window.addEventListener("popstate", handleNavigation);

  handleNavigation();

  function showDashboard(targetTime = null) {
    if (!document.body) return;
    document.body.classList.add("yt-notes-active");
    const currentOnly = localStorage.getItem("yt_notes_current_only") === "true";
    const choosedType = localStorage.getItem("yt_notes_type_filter") || "all";
    showToast(`Videos: ${currentOnly ? 'Current Only' : 'All'}\nType: ${choosedType}${(choosedType !== "all") ? 's only' : ''}`)

    // --- THE ANTI-AUTOPLAY SHIELD ---
    const video = document.querySelector("video");
    if (video) {
      window.ytNotesWasPlaying = !video.paused
      video.pause();
    }

    buildDashboard(targetTime);
  }

  function hideDashboard() {
    if (document.body) {
      document.body.classList.remove("yt-notes-active");
    }
    const video = document.querySelector("video");
    if (video && window.ytNotesWasPlaying) {
      video.play();
    }
  }

  function getVisibleProgressBar() {
    const bars = [...document.querySelectorAll(".ytp-progress-bar")];

    return (
      bars.find((bar) => {
        const rect = bar.getBoundingClientRect();
        const style = getComputedStyle(bar);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      }) || null
    );
  }

  function renderPlayerMarkers() {
    if (window.location.pathname !== "/watch") return;

    const progressBar = getVisibleProgressBar();
    const video = document.querySelector("video");
    const player =
      progressBar?.closest(".html5-video-player") ||
      document.querySelector(".html5-video-player") ||
      document.body;

    if (!progressBar || !video || isNaN(video.duration)) {
      setTimeout(renderPlayerMarkers, 1000);
      return;
    }

    document
      .querySelectorAll(".yt-custom-note-marker")
      .forEach((el) => el.remove());

    let container = document.getElementById("yt-custom-tooltip-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "yt-custom-tooltip-container";
      container.style.cssText =
        "position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2147483647; display:block;";
    }

    if (container.parentElement !== player) {
      player.appendChild(container);
    } else {
      container.replaceChildren();
    }

    const vidId = new URL(window.location.href).searchParams.get("v");
    if (!vidId) return;

    const db = GM_getValue("yt_notes_db", []);
    const vidNotes = db.filter((note) => {
      try {
        return new URL(note.url).searchParams.get("v") === vidId;
      } catch (e) {
        return false;
      }
    });
    let nlen = vidNotes.length;
    if (nlen !== 0) {
      setTimeout(() => {
        showToast(`${nlen} Snapshot${nlen !== 1 ? "s" : ""} Synced\n[Ctrl] + Click timeline markers to expand`, themeData.noteSynced);
      }, 2000);
    }
    vidNotes.forEach((note) => {
      const timeStr = new URL(note.url).searchParams.get("t");
      if (!timeStr) return;

      const timeSec = parseInt(timeStr.replace("s", ""));
      const percent = (timeSec / video.duration) * 100;

      // Premium Geometric Markers
      let color = note.type === "question" ? "#ff4e45" : "#3eff63";
      let size = "8px";
      let glow = "0 0 4px rgba(0,0,0,0.6)";

      if (note.pinned) {
        color = "#fbbc04";
        size = "12px";
        glow = `0 0 10px ${color}`;
      }

      const marker = document.createElement("div");
      marker.className = "yt-custom-note-marker";
      marker.style.cssText = `
        position: absolute;
        left: ${percent}%;
        top: 50%;
        width: ${size};
        height: ${size};
        background-color: ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 60;
        pointer-events: auto; /* Changed from 'none' so the mouse can actually interact with it! */
        cursor: pointer;      /* Gives you the clicky finger icon */
        box-shadow: ${glow}, 0 0 0 2px rgba(24, 24, 24, 0.8);
      `;
      progressBar.appendChild(marker);

      let badgeText = note.type === "question" ? "QUESTION" : "CONCEPT";
      if (note.pinned) badgeText += " • PINNED";

      const tooltip = document.createElement("div");
      tooltip.className = "yt-custom-note-tooltip-multi";
      tooltip.dataset.time = timeSec;
      tooltip.dataset.percent = percent;
      tooltip.style.cssText = `
      position: absolute;
      background: rgba(18, 18, 18, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 320px;
      backdrop-filter: blur(12px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.8);
      transform: translate(-50%, calc(-100% - 10px)) scale(0.9);
      transform-origin: bottom center;
      transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease, visibility 0.2s;
      opacity: 0;
      visibility: hidden;
    `;

      const headerRow = document.createElement("div");
      headerRow.style.cssText =
        "display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;";

      const badgeEl = document.createElement("div");
      badgeEl.style.cssText = `color:${color}; font-weight:800; font-size:10px; letter-spacing:0.8px;`;
      badgeEl.textContent = badgeText;

      headerRow.appendChild(badgeEl);

      const tagEl = document.createElement("div");
      tagEl.style.cssText =
        "font-size:13px; line-height:1.5; color:#e1e1e1; white-space:pre-wrap; word-wrap:break-word;";
      tagEl.textContent = note.tag;

      tooltip.appendChild(headerRow);
      tooltip.appendChild(tagEl);
      container.appendChild(tooltip);
    });
  }

  function initProgressBarHover() {
    if (window.location.pathname !== "/watch") return;

    const progressBar = getVisibleProgressBar();
    if (!progressBar || progressBar.dataset.ytNotesHoverInited === "true")
      return;
    progressBar.dataset.ytNotesHoverInited = "true";

    progressBar.addEventListener("mousemove", (e) => {
      if (window.location.pathname !== "/watch") return;

      const video = document.querySelector("video");
      const container = document.getElementById("yt-custom-tooltip-container");
      if (!video || !video.duration || !container) return;

      const rect = progressBar.getBoundingClientRect();
      const hoverRatio = (e.clientX - rect.left) / rect.width;
      const hoverTime = hoverRatio * video.duration;

      const snapPixelThreshold = 20;
      const snapTimeThreshold =
        (snapPixelThreshold / rect.width) * video.duration;

      const tooltips = container.querySelectorAll(
        ".yt-custom-note-tooltip-multi",
      );

      let closestTooltip = null;
      let minDiff = Infinity;

      tooltips.forEach((tooltip) => {
        const noteTime = parseFloat(tooltip.dataset.time);
        const diff = Math.abs(noteTime - hoverTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestTooltip = tooltip;
        }
      });

      tooltips.forEach((tooltip) => {
        if (tooltip === closestTooltip && minDiff <= snapTimeThreshold) {
          const notePercent = parseFloat(tooltip.dataset.percent);
          const fixedLeftPosition =
            rect.left + (notePercent / 100) * rect.width;

          tooltip.style.left = fixedLeftPosition + "px";
          tooltip.style.top = rect.top + "px";
          tooltip.style.transform =
            "translate(-50%, calc(-100% - 20px)) scale(1)";
          tooltip.style.opacity = "1";
          tooltip.style.visibility = "visible";
        } else {
          tooltip.style.transform =
            "translate(-50%, calc(-100% - 10px)) scale(0.9)";
          tooltip.style.opacity = "0";
          tooltip.style.visibility = "hidden";
        }
      });
    });

    progressBar.addEventListener("mouseleave", () => {
      const container = document.getElementById("yt-custom-tooltip-container");
      if (!container) return;

      container
        .querySelectorAll(".yt-custom-note-tooltip-multi")
        .forEach((tooltip) => {
          tooltip.style.transform =
            "translate(-50%, calc(-100% - 10px)) scale(0.9)";
          tooltip.style.opacity = "0";
          tooltip.style.visibility = "hidden";
        });
    });

    // --- SMART CLICK INTERCEPTOR (Ctrl + Click to Edit) ---
    progressBar.addEventListener("click", (e) => {
      // 1. Only hijack the click if Ctrl (Windows) or Cmd (Mac) is held
      if (!e.ctrlKey && !e.metaKey) return;

      const video = document.querySelector("video");
      const container = document.getElementById("yt-custom-tooltip-container");

      if (!video || !video.duration || !container) return;

      // 2. Calculate exactly where the user clicked
      const rect = progressBar.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      const clickTime = clickRatio * video.duration;

      // 3. Define the "Snap" radius (20 pixels)
      const snapPixelThreshold = 20;
      const snapTimeThreshold =
        (snapPixelThreshold / rect.width) * video.duration;

      const tooltips = container.querySelectorAll(
        ".yt-custom-note-tooltip-multi",
      );

      let closestTooltip = null;
      let minDiff = Infinity;

      // 4. Find the closest note
      tooltips.forEach((tooltip) => {
        const noteTime = parseFloat(tooltip.dataset.time);
        const diff = Math.abs(noteTime - clickTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestTooltip = tooltip;
        }
      });

      // 5. If a note is within the 20px snap radius, trigger the action!
      if (closestTooltip && minDiff <= snapTimeThreshold) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Stops YouTube from skipping the video to this spot

        const exactNoteTime = parseFloat(closestTooltip.dataset.time);

        // --- TRIGGER YOUR EDIT ACTION HERE ---
        // I don't know the exact name of your edit function, but you would call it here!
        // For example:
        // openEditDialog(exactNoteTime);
        // OR
        // video.currentTime = exactNoteTime;

        showDashboard(exactNoteTime);
        // alert(exactNoteTime);
      }
    });
  }

  function renderNotes(freshData, targetTime) {
    const notesList = document.getElementById("yt-notes-list-container");
    if (!notesList) return;

    notesList.replaceChildren();

    const notes = Array.isArray(freshData)
      ? freshData
      : GM_getValue("yt_notes_db", []);

    if (notes.length === 0) {
      const emptyText = document.createElement("p");
      emptyText.className = "yt-notes-empty";
      emptyText.textContent = "No timestamps saved yet.";
      notesList.appendChild(emptyText);
      return;
    }

    const notesWithIndex = notes.map((note, index) => ({
      ...note,
      dbIndex: index,
    }));

    // Split Notes into Pinned and Unpinned Arrays
    const pinnedNotes = notesWithIndex.filter((n) => n.pinned).reverse();
    pinnedNotes.sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
    const unpinnedNotes = notesWithIndex.filter((n) => !n.pinned);

    // Group only the Unpinned notes for the main column
    const groupedNotes = unpinnedNotes.reduce((acc, note) => {
      const groupName =
        (note.channel ? `${note.channel} • ` : "") + note.videoTitle;
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(note);
      return acc;
    }, {});

    const sortedGroupNames = Object.keys(groupedNotes).sort((a, b) => {
      const newestNoteA = Math.max(...groupedNotes[a].map((n) => n.dbIndex));
      const newestNoteB = Math.max(...groupedNotes[b].map((n) => n.dbIndex));
      return newestNoteB - newestNoteA;
    });

    // --- SHARED LIGHTBOX & NAV HELPERS ---
    const getHelpers = (note) => {
      const fallbackVidId = new URL(note.url).searchParams.get("v");
      const imgSrc =
        note.frameData ||
        (fallbackVidId
          ? `https://i.ytimg.com/vi/${fallbackVidId}/maxresdefault.jpg`
          : "");

      const triggerNavigation = () => {
        const currentVidId = new URL(window.location.href).searchParams.get(
          "v",
        );
        if (fallbackVidId === currentVidId) {
          const timeParam = new URL(note.url).searchParams.get("t");
          const timeInSeconds = parseInt(timeParam.replace("s", "")) || 0;
          history.replaceState(
            null,
            null,
            window.location.pathname + window.location.search,
          );
          hideDashboard();
          const player = document.getElementById("movie_player");
          const mainVideo = document.querySelector(".html5-main-video");
          if (player && typeof player.seekTo === "function") {
            player.seekTo(timeInSeconds, true);
            player.playVideo();
          } else if (mainVideo) {
            mainVideo.currentTime = timeInSeconds;
            mainVideo.play();
          }
        } else {
          const timeParam = new URL(note.url).searchParams.get("t");
          const relativeUrl = `/watch?v=${fallbackVidId}${timeParam ? "&t=" + timeParam : ""}`;
          history.replaceState(
            null,
            null,
            window.location.pathname + window.location.search,
          );
          hideDashboard();
          showToast(note.tag)
          spaNavigate(relativeUrl, false);
        }
      };

      const triggerLightbox = () => {
        if (!imgSrc) return;
        const dashboard =
          document.getElementById("yt-custom-notes-dashboard") || document.body;
        const currentScroll = dashboard.scrollTop || window.scrollY || 0;
        const visibleHeight = dashboard.clientHeight || window.innerHeight;

        const lightbox = document.createElement("div");
        lightbox.style.cssText = `position:absolute; top:${currentScroll}px; left:0; width:100%; height:${visibleHeight}px; background:rgba(0,0,0,0.9); z-index:2147483646; display:flex; justify-content:center; align-items:center; cursor:zoom-out; backdrop-filter:blur(10px);`;
        const img = document.createElement("img");
        img.src = imgSrc;

        img.style.cssText =
          "width:95%; height:95%; border-radius:12px; box-shadow:0 40px 80px rgba(0,0,0,0.95); object-fit:contain;";

        lightbox.appendChild(img);
        dashboard.appendChild(lightbox);
        showToast("Click Anywhere or press ESC to Exit.");

        const originalOverflow = dashboard.style.overflow;
        dashboard.style.overflow = "hidden";

        const closeLightbox = () => {
          dashboard.style.overflow = originalOverflow;
          lightbox.remove();
          window.removeEventListener("keydown", escHandler, true);
        };
        lightbox.addEventListener("click", (clickEvent) => {
          clickEvent.stopPropagation();
          closeLightbox();
        });

        const escHandler = (escEvent) => {
          if (escEvent.key === "Escape") {
            escEvent.preventDefault();
            escEvent.stopImmediatePropagation();
            closeLightbox();
          }
        };
        window.addEventListener("keydown", escHandler, true);
        lightbox.addEventListener("remove", () => {
          window.removeEventListener("keydown", escHandler, true);
          dashboard.style.overflow = originalOverflow;
        });
      };

      return { fallbackVidId, imgSrc, triggerNavigation, triggerLightbox };
    };

    // --- CREATE GLOBAL TOOLTIP ONCE ---
    let globalTooltip = document.getElementById("yt-notes-global-tooltip");
    if (!globalTooltip) {
      globalTooltip = document.createElement("div");
      globalTooltip.id = "yt-notes-global-tooltip";
      const ttText = document.createElement("div");
      ttText.className = "yt-notes-tt-text";
      const ttHint = document.createElement("div");
      ttHint.className = "yt-notes-tt-hint";
      ttHint.textContent = "Ctrl+Click • Expand & Edit";
      globalTooltip.append(ttText, ttHint);
      const dashboard =
        document.getElementById("yt-custom-notes-dashboard") || document.body;
      dashboard.appendChild(globalTooltip);
    }

    // --- BUILD THE NEW DUAL COLUMNS ---
    const pinnedCol = document.createElement("div");
    pinnedCol.className = "yt-notes-pinned-column";
    const mainCol = document.createElement("div");
    mainCol.className = "yt-notes-main-column";

    // --- POPULATE PINNED SIDEBAR ---
    // --- POPULATE PINNED SIDEBAR (MASONRY FIX) ---
    // --- POPULATE PINNED SIDEBAR (MASONRY FIX) ---
    const isPinnedMinimized =
      localStorage.getItem("yt_notes_pinned_minimized") === "true";

    if (pinnedNotes.length > 0) {
      if (isPinnedMinimized) {
        // INJECTION: Push pinned notes into the normal group pipeline!
        groupedNotes["PINNED_GOLDEN_GROUP"] = pinnedNotes;
        sortedGroupNames.unshift("PINNED_GOLDEN_GROUP"); // Forces it to the absolute top
      } else {
        // 1. Create the new wrapper container
        const pinnedContainer = document.createElement("div");
        pinnedContainer.className = "yt-notes-pinned-container";

        // 2. Add the Sticky Header WITH MINIMIZE BUTTON
        const pinHeader = document.createElement("div");
        pinHeader.className = "yt-notes-pinned-header";
        pinHeader.style.display = "flex";
        pinHeader.style.justifyContent = "space-between";
        pinHeader.style.alignItems = "center";
        pinHeader.style.userSelect = "none";

        const titleSpan = document.createElement("span");
        titleSpan.textContent = "📌 Critical/Pinned Notes";

        const minBtn = document.createElement("button");
        minBtn.textContent = "🗕 Minimize";
        minBtn.style.cssText =
          "background: rgba(255,255,255,0.1); color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s;";
        minBtn.onmouseover = () =>
          (minBtn.style.background = "rgba(255,255,255,0.2)");
        minBtn.onmouseleave = () =>
          (minBtn.style.background = "rgba(255,255,255,0.1)");
        minBtn.addEventListener("click", () => {
          localStorage.setItem("yt_notes_pinned_minimized", "true");
          renderNotes(); // Instantly re-renders into a normal group!
        });

        pinHeader.append(titleSpan, minBtn);
        pinnedContainer.appendChild(pinHeader);

        // 3. Create the Physical Columns
        const columnsWrapper = document.createElement("div");
        columnsWrapper.className = "yt-notes-pinned-columns-wrapper";

        const leftCol = document.createElement("div");
        leftCol.className =
          "yt-notes-pinned-inner-col yt-notes-pinned-left-col";

        const rightCol = document.createElement("div");
        rightCol.className =
          "yt-notes-pinned-inner-col yt-notes-pinned-right-col";

        columnsWrapper.append(leftCol, rightCol);

        // 4. Distribute the notes natively!
        pinnedNotes.forEach((note, index) => {
          const { fallbackVidId, imgSrc, triggerNavigation, triggerLightbox } =
            getHelpers(note);

          const card = document.createElement("div");
          card.className = "yt-notes-pinned-card";

          const timeStr = new URL(note.url).searchParams.get("t");
          const timeSec = timeStr ? parseInt(timeStr.replace("s", "")) : 0;
          card.dataset.time = timeSec;
          card.dataset.vidId = fallbackVidId;
          card.dataset.noteType = note.type || "concept";
          card.dataset.videoTitle = (note.videoTitle || "").toLowerCase();

          // Image Wrapper
          const imgWrap = document.createElement("div");
          imgWrap.className = "yt-notes-pinned-img-wrap";

          const img = document.createElement("img");
          img.className = "yt-notes-pinned-img";
          img.src = imgSrc;
          img.addEventListener("click", triggerNavigation);
          img.addEventListener("auxclick", (e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
              showToast(note.tag + "\n(Opened in Background)")
              window.open(note.url, "_blank");
            }
          });
          img.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerLightbox();
          });

          // Floating Unpin Button
          const unpinBtn = document.createElement("div");
          unpinBtn.className = "yt-notes-pinned-unpin";
          unpinBtn.textContent = "📌";
          unpinBtn.title = "Unpin note";
          unpinBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const db = GM_getValue("yt_notes_db", []);
            if (db[note.dbIndex]) {
              db[note.dbIndex].pinned = false;
              delete db[note.dbIndex].pinnedAt;
              GM_setValue("yt_notes_db", db);
              renderNotes();
              syncChannel.postMessage("db_updated");
              renderPlayerMarkers();
            }
          });

          imgWrap.append(img, unpinBtn);

          // Details Section
          const details = document.createElement("div");
          details.className = "yt-notes-pinned-details";

          const topRow = document.createElement("div");
          topRow.className = "yt-notes-pinned-top";

          const badge = document.createElement("span");
          badge.className =
            "yt-notes-type-badge " +
            (note.type === "question"
              ? "yt-notes-type-question"
              : "yt-notes-type-concept");
          badge.textContent = note.type === "question" ? "Question" : "Concept";

          // Instant Pin-Toggle Logic
          badge.style.cursor = "pointer";
          badge.style.transition = "all 0.2s ease";
          badge.addEventListener("mouseenter", () => {
            if (badge.dataset.justClicked === "true") return;
            badge.textContent =
              note.type === "question"
                ? "Switch to Concept"
                : "Switch to Question";
            badge.style.background = "#e1e1e1";
            badge.style.color = "#0f0f0f";
            badge.style.borderColor = "transparent";
          });
          badge.addEventListener("mouseleave", () => {
            badge.dataset.justClicked = "false";
            badge.textContent =
              note.type === "question" ? "Question" : "Concept";
            badge.style.background = "";
            badge.style.color = "";
            badge.style.borderColor = "";
          });
          badge.addEventListener("click", (e) => {
            e.stopPropagation();
            const db = GM_getValue("yt_notes_db", []);
            if (db[note.dbIndex]) {
              const newType =
                db[note.dbIndex].type === "question" ? "concept" : "question";
              db[note.dbIndex].type = newType;
              note.type = newType;
              GM_setValue("yt_notes_db", db);
              syncChannel.postMessage("db_updated");
              badge.dataset.justClicked = "true";
              badge.className =
                "yt-notes-type-badge " +
                (note.type === "question"
                  ? "yt-notes-type-question"
                  : "yt-notes-type-concept");
              badge.textContent =
                note.type === "question" ? "Question" : "Concept";
              badge.style.background = "";
              badge.style.color = "";
              badge.style.borderColor = "";
              renderPlayerMarkers();
            }
          });

          const timeSpan = document.createElement("span");
          timeSpan.className = "yt-notes-pinned-time";
          timeSpan.textContent = `@${note.timeFormatted}`;

          topRow.append(badge, timeSpan);

          const editInput = document.createElement("textarea");
          editInput.className = "yt-notes-pinned-input";
          editInput.value = note.tag;
          editInput.rows = 1;
          editInput.addEventListener("input", () => {
            editInput.style.height = "auto";
            editInput.style.height = editInput.scrollHeight + "px";
          });
          setTimeout(() => editInput.dispatchEvent(new Event("input")), 0);
          editInput.addEventListener("blur", (e) => {
            const newText = e.target.value.trim();
            const db = GM_getValue("yt_notes_db", []);
            if (db[note.dbIndex]) {
              if (newText !== "") {
                db[note.dbIndex].tag = newText;
              } else {
                editInput.value = note.tag;
              }
              GM_setValue("yt_notes_db", db);
              syncChannel.postMessage("db_updated");
              renderPlayerMarkers();
            }
          });
          editInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              if (e.shiftKey || e.ctrlKey) {
                e.stopPropagation();
                if (e.ctrlKey) {
                  e.preventDefault();
                  const start = editInput.selectionStart;
                  const end = editInput.selectionEnd;
                  editInput.value =
                    editInput.value.substring(0, start) +
                    "\n" +
                    editInput.value.substring(end);
                  editInput.selectionStart = editInput.selectionEnd = start + 1;
                }
                editInput.dispatchEvent(new Event("input"));
                return;
              }
              e.preventDefault();
              editInput.blur();
            }
          });

          const vidName = document.createElement("div");
          vidName.className = "yt-notes-pinned-vid-name";
          vidName.textContent = note.videoTitle || "Unknown Video";
          vidName.title = note.videoTitle || "Unknown Video";

          details.append(topRow, editInput, vidName);
          card.append(imgWrap, details);

          if (index % 2 === 0) leftCol.appendChild(card);
          else rightCol.appendChild(card);
        });

        pinnedContainer.appendChild(columnsWrapper);
        notesList.appendChild(pinnedContainer);
      }
    }

    // --- POPULATE MAIN COLUMN ---
    // --- POPULATE MAIN COLUMN ---
    const foldedDb = GM_getValue("yt_notes_folded_groups", []);

    sortedGroupNames.forEach((groupName) => {
      const isGoldenGroup = groupName === "PINNED_GOLDEN_GROUP";
      const groupItems = groupedNotes[groupName];
      if (groupItems.length === 0) return;

      // Ensure the golden group has its own unique ID for folding logic
      const targetVidId = isGoldenGroup
        ? "PINNED_GOLDEN_GROUP"
        : new URL(groupItems[0].url).searchParams.get("v") || groupName;
      const isInitiallyFolded = foldedDb.includes(targetVidId);

      const groupContainer = document.createElement("div");
      groupContainer.className =
        "yt-notes-group" +
        (isInitiallyFolded ? " is-folded" : "") +
        (isGoldenGroup ? " yt-notes-golden-group" : "");

      // --- HEADER START ---
      const groupHeader = document.createElement("div");
      groupHeader.className = "yt-notes-group-header";
      groupHeader.title = "Click to fold/unfold notes";

      const titleWrapper = document.createElement("div");
      titleWrapper.style.display = "flex";
      titleWrapper.style.flexDirection = "column";
      titleWrapper.style.gap = "4px";
      titleWrapper.style.flex = "1";
      titleWrapper.style.minWidth = "0";

      const firstNote = groupItems[0];
      const actualTitle = isGoldenGroup
        ? "📌 Critical/Pinned Notes"
        : firstNote.videoTitle || "Unknown Video";
      const actualChannel = firstNote.channel || "Unknown Channel";

      const titleEl = document.createElement("div");
      titleEl.className = "yt-notes-group-title";
      titleEl.textContent = actualTitle;
      titleEl.style.whiteSpace = "nowrap";
      titleEl.style.overflow = "hidden";
      titleEl.style.textOverflow = "ellipsis";

      const subtitleEl = document.createElement("div");
      subtitleEl.className = "yt-notes-group-subtitle";

      const createHighlight = (text) => {
        const span = document.createElement("span");
        span.textContent = text;
        span.style.color = "#cc00ff";
        span.style.fontWeight = "600";
        return span;
      };

      if (isGoldenGroup) {
        subtitleEl.textContent = "High-Yield Priority Concepts";
        subtitleEl.style.color = "rgba(255, 215, 0, 0.7)";
      } else {
        let hasDuration = false;
        if (firstNote.duration) {
          const parts = firstNote.duration
            .split(":")
            .map((num) => parseInt(num, 10));
          const addTime = (val, label) => {
            if (val > 0) {
              subtitleEl.appendChild(createHighlight(val));
              subtitleEl.appendChild(document.createTextNode(` ${label} `));
              hasDuration = true;
            }
          };
          if (parts.length === 3) {
            addTime(parts[0], "hr");
            addTime(parts[1], "min");
            //addTime(parts[2], "sec");
          } else if (parts.length === 2) {
            addTime(parts[0], "min");
            addTime(parts[1], "sec");
          } else if (parts.length == 1) {
            addTime(parts[(0, "sec")]);
          }
        }

        if (hasDuration)
          subtitleEl.appendChild(document.createTextNode("video by "));
        else subtitleEl.appendChild(document.createTextNode("Video by "));
        subtitleEl.appendChild(createHighlight(actualChannel));
      }

      // Clean Image Gallery
      const thumbsWrapper = document.createElement("div");
      thumbsWrapper.className = "yt-notes-mini-thumbs-wrapper";
      const miniThumbsContainer = document.createElement("div");
      miniThumbsContainer.className = "yt-notes-mini-thumbs";
      thumbsWrapper.appendChild(miniThumbsContainer);
      titleWrapper.append(titleEl, subtitleEl, thumbsWrapper);

      // Right Side Header Elements
      const headerRight = document.createElement("div");
      headerRight.className = "yt-notes-header-right";

      const foldBadge = document.createElement("div");
      foldBadge.className = "yt-notes-folded-badge";
      foldBadge.textContent = `${groupItems.length} Saved Note${(groupItems.length !== 1) ? "s" : ""}`;

      if (isGoldenGroup) {
        // Render Maximize Button for Golden Group
        const maxBtn = document.createElement("button");
        maxBtn.textContent = "🗖 Maximize";
        maxBtn.style.cssText =
          "background: rgba(255, 215, 0, 0.2); color: #ffd700; border: 1px solid rgba(255,215,0,0.4); padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; flex-shrink: 0; transition: 0.2s;";
        maxBtn.onmouseover = () =>
          (maxBtn.style.background = "rgba(255, 215, 0, 0.3)");
        maxBtn.onmouseleave = () =>
          (maxBtn.style.background = "rgba(255, 215, 0, 0.2)");
        maxBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          localStorage.setItem("yt_notes_pinned_minimized", "false");
          renderNotes();
        });
        headerRight.append(foldBadge, maxBtn);
      } else {
        // Render Delete Video Button for Normal Folders
        const deleteVideoBtn = document.createElement("button");
        deleteVideoBtn.textContent = "🗑️ Delete Video";
        deleteVideoBtn.style.cssText =
          "background: #cc0000; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; flex-shrink: 0;";

        deleteVideoBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm("Delete ALL notes for this video?")) {
            const currentDb = GM_getValue("yt_notes_db", []);
            const updatedDb = currentDb.filter(
              (n) =>
                new URL(n.url).searchParams.get("v") !== targetVidId ||
                n.pinned,
            );
            GM_setValue("yt_notes_db", updatedDb);
            if (typeof syncChannel !== "undefined")
              syncChannel.postMessage("db_updated");
            renderNotes();
            renderPlayerMarkers();
          }
        });
        headerRight.append(foldBadge, deleteVideoBtn);
      }

      groupHeader.append(titleWrapper, headerRight);

      // Folding Event Listener
      groupHeader.addEventListener("click", (e) => {
        if (
          e.target.closest("button") ||
          e.target.closest(".yt-notes-mini-thumb")
        )
          return;
        const isNowFolded = groupContainer.classList.toggle("is-folded");
        const currentFoldedDb = GM_getValue("yt_notes_folded_groups", []);
        if (isNowFolded) {
          if (!currentFoldedDb.includes(targetVidId))
            currentFoldedDb.push(targetVidId);
        } else {
          const idx = currentFoldedDb.indexOf(targetVidId);
          if (idx !== -1) currentFoldedDb.splice(idx, 1);
          setTimeout(() => {
            const textareas = groupContainer.querySelectorAll(
              ".yt-notes-edit-input",
            );
            textareas.forEach((ta) => ta.dispatchEvent(new Event("input")));
          }, 0);
        }
        GM_setValue("yt_notes_folded_groups", currentFoldedDb);
      });

      groupContainer.appendChild(groupHeader);
      // --- HEADER END ---

      // --- NOTES CONTENT ---
      const groupContent = document.createElement("div");
      groupContent.className = "yt-notes-group-content";

      // Reverse normal groups to show newest at the top, but leave the already-sorted Golden Group alone!
      const sortedItems = isGoldenGroup
        ? [...groupItems]
        : [...groupItems].reverse();

      sortedItems.forEach((note) => {
        const { fallbackVidId, imgSrc, triggerNavigation, triggerLightbox } =
          getHelpers(note);

        const noteEl = document.createElement("div");
        noteEl.className = "yt-notes-note";
        const timeStr = new URL(note.url).searchParams.get("t");
        const timeSec = timeStr ? parseInt(timeStr.replace("s", "")) : 0;

        noteEl.dataset.time = timeSec;

        // --- MINI THUMBNAIL CREATION ---
        if (imgSrc) {
          const miniThumb = document.createElement("img");
          miniThumb.className = "yt-notes-mini-thumb";
          miniThumb.src = imgSrc;

          miniThumb.addEventListener("mouseenter", () => {
            groupHeader.removeAttribute("title");
            globalTooltip.querySelector(".yt-notes-tt-text").textContent =
              note.tag ? note.tag : "No text in this note";
            globalTooltip.style.opacity = "1";
          });
          miniThumb.addEventListener("mousemove", (e) => {
            const dashboard = document.getElementById(
              "yt-custom-notes-dashboard",
            );
            const currentScroll = dashboard ? dashboard.scrollTop : 0;
            globalTooltip.style.left = e.clientX + 15 + "px";
            globalTooltip.style.top = e.clientY + currentScroll + 15 + "px";
          });
          miniThumb.addEventListener("mouseleave", () => {
            groupHeader.title = "Click to fold/unfold notes";
            globalTooltip.style.opacity = "0";
          });

          miniThumb.addEventListener("click", (e) => {
            e.stopPropagation();
            globalTooltip.style.opacity = "0";
            if (e.ctrlKey) {
              if (groupContainer.classList.contains("is-folded")) {
                groupContainer.classList.remove("is-folded");
                const currentFoldedDb = GM_getValue(
                  "yt_notes_folded_groups",
                  [],
                );
                const idx = currentFoldedDb.indexOf(targetVidId);
                if (idx !== -1) {
                  currentFoldedDb.splice(idx, 1);
                  GM_setValue("yt_notes_folded_groups", currentFoldedDb);
                }
              }
              setTimeout(() => {
                const textareas = groupContainer.querySelectorAll(
                  ".yt-notes-edit-input",
                );
                textareas.forEach((ta) => ta.dispatchEvent(new Event("input")));
                noteEl.scrollIntoView({ behavior: "smooth", block: "center" });
                const editInputBox = noteEl.querySelector(
                  ".yt-notes-edit-input",
                );
                if (editInputBox) {
                  editInputBox.focus();
                  editInputBox.style.background = "rgba(62, 166, 255, 0.2)";
                  editInputBox.style.boxShadow = "0 0 0 2px #3ea6ff";
                  setTimeout(() => {
                    editInputBox.style.background = "";
                    editInputBox.style.boxShadow = "";
                  }, 1200);
                }
              }, 50);
              return;
            }
            triggerNavigation();
          });

          miniThumb.addEventListener("auxclick", (e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
              globalTooltip.style.opacity = "0";
              showToast(note.tag + "\nOpend in Background")
              window.open(note.url, "_blank");
            }
          });
          miniThumb.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            globalTooltip.style.opacity = "0";
            triggerLightbox();
          });
          miniThumbsContainer.appendChild(miniThumb);
        }

        noteEl.addEventListener("click", (e) => {
          if (
            e.target.tagName !== "BUTTON" &&
            e.target.tagName !== "TEXTAREA" &&
            e.target.tagName !== "INPUT"
          )
            triggerNavigation();
        });
        noteEl.addEventListener("auxclick", (e) => {
          if (
            e.button === 1 &&
            e.target.tagName !== "BUTTON" &&
            e.target.tagName !== "TEXTAREA" &&
            e.target.tagName !== "INPUT" &&
            e.target.tagName !== "IMG"
          )
            showToast(note.tag + "\nOpend in Background")
          window.open(note.url, "_blank");
        });
        noteEl.addEventListener("contextmenu", (e) => {
          if (
            e.target.tagName !== "SPAN" &&
            e.target.tagName !== "BUTTON" &&
            e.target.tagName !== "INPUT"
          ) {
            e.preventDefault();
            e.stopPropagation();
            triggerLightbox();
          }
        });

        const leftCol = document.createElement("div");
        leftCol.className = "yt-notes-left";
        const tagRow = document.createElement("div");
        tagRow.className = "yt-notes-tag-row";

        noteEl.dataset.vidId = fallbackVidId;
        noteEl.dataset.noteType = note.type || "concept";

        const badgeRow = document.createElement("div");
        badgeRow.className = "yt-notes-badge-row";
        const badge = document.createElement("span");
        badge.className =
          "yt-notes-type-badge " +
          (note.type === "question"
            ? "yt-notes-type-question"
            : "yt-notes-type-concept");
        badge.textContent = note.type === "question" ? "Question" : "Concept";

        badge.style.cursor = "pointer";
        badge.style.transition = "all 0.2s ease";
        badge.addEventListener("mouseenter", () => {
          if (badge.dataset.justClicked === "true") return;
          badge.textContent =
            note.type === "question"
              ? "Switch to Concept"
              : "Switch to Question";
          badge.style.background = "#e1e1e1";
          badge.style.color = "#0f0f0f";
          badge.style.borderColor = "transparent";
        });
        badge.addEventListener("mouseleave", () => {
          badge.dataset.justClicked = "false";
          badge.textContent = note.type === "question" ? "Question" : "Concept";
          badge.style.background = "";
          badge.style.color = "";
          badge.style.borderColor = "";
        });
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          const db = GM_getValue("yt_notes_db", []);
          if (db[note.dbIndex]) {
            const newType =
              db[note.dbIndex].type === "question" ? "concept" : "question";
            db[note.dbIndex].type = newType;
            note.type = newType;
            GM_setValue("yt_notes_db", db);
            syncChannel.postMessage("db_updated");
            badge.dataset.justClicked = "true";
            badge.className =
              "yt-notes-type-badge " +
              (note.type === "question"
                ? "yt-notes-type-question"
                : "yt-notes-type-concept");
            badge.textContent =
              note.type === "question" ? "Question" : "Concept";
            badge.style.background = "";
            badge.style.color = "";
            badge.style.borderColor = "";
            renderPlayerMarkers();
          }
        });

        badgeRow.appendChild(badge);

        const timeSpan = document.createElement("span");
        timeSpan.className = "yt-notes-time";
        timeSpan.textContent = `@${note.timeFormatted}`;
        const editInput = document.createElement("textarea");
        editInput.className = "yt-notes-edit-input";
        editInput.value = note.tag;
        editInput.rows = 1;

        editInput.addEventListener("input", () => {
          editInput.style.width = "0px";
          editInput.style.height = "auto";
          const originalWrap = editInput.style.whiteSpace;
          editInput.style.whiteSpace = "pre";
          editInput.style.width =
            Math.max(150, editInput.scrollWidth + 10) + "px";
          editInput.style.whiteSpace = originalWrap;
          editInput.style.height = editInput.scrollHeight + "px";
        });

        setTimeout(() => editInput.dispatchEvent(new Event("input")), 0);
        editInput.title = "Click to edit this note";
        editInput.addEventListener("click", (e) => e.stopPropagation());
        editInput.addEventListener("dblclick", (e) => e.stopPropagation());
        editInput.addEventListener("contextmenu", (e) => e.stopPropagation());

        editInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            if (e.shiftKey || e.ctrlKey) {
              e.stopPropagation();
              if (e.ctrlKey) {
                e.preventDefault();
                const start = editInput.selectionStart;
                const end = editInput.selectionEnd;
                editInput.value =
                  editInput.value.substring(0, start) +
                  "\n" +
                  editInput.value.substring(end);
                editInput.selectionStart = editInput.selectionEnd = start + 1;
              }
              editInput.dispatchEvent(new Event("input"));
              return;
            }
            e.preventDefault();
            editInput.blur();
          }
        });

        editInput.addEventListener("blur", (e) => {
          const newText = e.target.value.trim();
          const db = GM_getValue("yt_notes_db", []);
          if (db[note.dbIndex]) {
            if (newText !== "") {
              db[note.dbIndex].tag = newText;
            } else {
              editInput.value = note.tag;
            }
            GM_setValue("yt_notes_db", db);
            syncChannel.postMessage("db_updated");
            renderPlayerMarkers();
          }
        });

        tagRow.append(timeSpan, editInput);
        leftCol.appendChild(badgeRow);
        leftCol.appendChild(tagRow);

        // --- NEW: INJECT VIDEO NAME & DURATION FOR MINIMIZED PINNED NOTES ---
        if (groupName === "PINNED_GOLDEN_GROUP") {
          const sourceInfo = document.createElement("div");
          // Styled to match your glassmorphism golden aesthetic
          sourceInfo.style.cssText =
            "font-size: 11.5px; color: rgba(255, 215, 0, 0.65); margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 2px; font-weight: 500;";

          let durationText = "";
          if (note.duration) {
            const parts = note.duration
              .split(":")
              .map((num) => parseInt(num, 10));
            if (parts.length === 3) {
              durationText = `${parts[0]} hr ${parts[1]} min`;
            } else if (parts.length === 2) {
              durationText = `${parts[0]} min ${parts[1]} sec`;
            } else if (parts.length === 1) {
              durationText = `${parts[0]} sec`;
            }
          }

          sourceInfo.textContent = `${note.videoTitle || "Unknown Video"}${durationText ? ` (${durationText} long)` : ""}`;
          sourceInfo.title = sourceInfo.textContent; // Adds a hover tooltip in case the title is super long and truncates
          leftCol.appendChild(sourceInfo);
        }
        // --------------------------------------------------------------------

        const rightCol = document.createElement("div");
        rightCol.className = "yt-notes-right";
        const actionBtns = document.createElement("div");
        actionBtns.className = "yt-notes-action-btns";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "yt-notes-copy-btn";
        copyBtn.title = "Copy Timestamp URL";
        const copyIcon = document.createElement("span");
        copyIcon.className = "yt-notes-btn-icon";
        copyIcon.textContent = "🔗";
        const copyText = document.createElement("span");
        copyText.className = "yt-notes-btn-text";
        copyText.textContent = "Copy Link";
        copyBtn.append(copyIcon, copyText);
        copyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(note.url).then(() => {
            copyText.textContent = "✔ Copied!";
            showToast("🔗 Link copied to clipboard", themeData.copied);
            copyBtn.style.background = "#4eff22";
            copyBtn.style.color = "#000";
            setTimeout(() => {
              copyText.textContent = "Copy Again";
              copyBtn.style.background = "";
              copyBtn.style.color = "";
            }, 1500);
          });
        });
        // -------------
        // copy image bnt replication of copy button
        const copyImgBtn = document.createElement("button");
        copyImgBtn.type = "button";
        copyImgBtn.className = "yt-notes-copy-btn";
        copyImgBtn.title = "Copy Image to Clipboard";
        const copyImgIcon = document.createElement("span");
        copyImgIcon.className = "yt-notes-btn-icon";
        copyImgIcon.textContent = "📸";
        const copyImgText = document.createElement("span");
        copyImgText.className = "yt-notes-btn-text";
        copyImgText.textContent = "Copy Image";
        copyImgBtn.append(copyImgIcon, copyImgText);
        copyImgBtn.addEventListener("click", async (e) => {
          e.stopPropagation(); // Prevents clicking the note/jumping the video

          // Get the image source (Update 'note.imageData' to match your actual variable)

          if (!imgSrc) {
            showToast("No image to copy!");
            return;
          }

          try {
            // We use a Promise to handle the image loading asynchronously
            await new Promise((resolve, reject) => {
              const img = new Image();
              // Crucial for avoiding Cross-Origin (CORS) errors if the image is external
              img.crossOrigin = "anonymous";

              img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                // Force the format to exactly 'image/png' so the clipboard accepts it
                canvas.toBlob(async (blob) => {
                  if (!blob) return reject("Canvas empty");
                  try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    resolve();
                  } catch (clipboardErr) {
                    reject(clipboardErr);
                  }
                }, "image/png");
              };

              img.onerror = () => reject("Image failed to load");
              img.src = imgSrc;
            });

            showToast("📸 Image copied to clipboard", themeData.copied);
          } catch (err) {
            console.error("Copy failed:", err);
            showToast("Failed to copy image");
          }
        });
        // -------------

        // --- DYNAMIC PIN / UNPIN BUTTON ---
        const pinBtn = document.createElement("button");
        pinBtn.type = "button";
        pinBtn.className = "yt-notes-pin-btn";

        const isPinned = note.pinned;
        pinBtn.title = isPinned ? "Unpin this note" : "Pin this note to top";

        const pinIcon = document.createElement("span");
        pinIcon.className = "yt-notes-btn-icon";
        pinIcon.textContent = "📌";

        const pinText = document.createElement("span");
        pinText.className = "yt-notes-btn-text";
        pinText.textContent = isPinned ? "Unpin" : "Pin";

        // Highlight the unpin button slightly if it's already pinned
        if (isPinned) {
          pinBtn.style.background = "rgba(255, 215, 0, 0.15)";
          pinBtn.style.color = "#ffd700";
          pinBtn.style.border = "1px solid rgba(255, 215, 0, 0.3)";
        }

        pinBtn.append(pinIcon, pinText);

        pinBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const db = GM_getValue("yt_notes_db", []);
          if (db[note.dbIndex]) {
            if (isPinned) {
              db[note.dbIndex].pinned = false;
              delete db[note.dbIndex].pinnedAt;
            } else {
              db[note.dbIndex].pinned = true;
              db[note.dbIndex].pinnedAt = Date.now();
            }
            GM_setValue("yt_notes_db", db);
            renderNotes();
            syncChannel.postMessage("db_updated");
            renderPlayerMarkers();
          }
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "yt-notes-del-btn";
        delBtn.title = "Delete this note";
        const delIcon = document.createElement("span");
        delIcon.className = "yt-notes-btn-icon";
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        const polyline = document.createElementNS(svgNS, "polyline");
        polyline.setAttribute("points", "3 6 5 6 21 6");
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute(
          "d",
          "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
        );
        const line1 = document.createElementNS(svgNS, "line");
        line1.setAttribute("x1", "10");
        line1.setAttribute("y1", "11");
        line1.setAttribute("x2", "10");
        line1.setAttribute("y2", "17");
        const line2 = document.createElementNS(svgNS, "line");
        line2.setAttribute("x1", "14");
        line2.setAttribute("y1", "11");
        line2.setAttribute("x2", "14");
        line2.setAttribute("y2", "17");
        svg.append(polyline, path, line1, line2);
        delIcon.appendChild(svg);
        const delText = document.createElement("span");
        delText.className = "yt-notes-btn-text";
        delText.textContent = "Delete";
        delBtn.append(delIcon, delText);

        delBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const db = GM_getValue("yt_notes_db", []);
          db.splice(note.dbIndex, 1);
          GM_setValue("yt_notes_db", db);
          renderNotes();
          syncChannel.postMessage("db_updated");
          renderPlayerMarkers();
        });

        actionBtns.append(copyBtn, copyImgBtn, pinBtn, delBtn);

        rightCol.appendChild(actionBtns);
        if (imgSrc) {
          const thumbImg = document.createElement("img");
          thumbImg.className = "yt-notes-thumb";
          thumbImg.src = imgSrc;
          rightCol.appendChild(thumbImg);
          thumbImg.addEventListener("auxclick", (e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
              showToast(note.tag + "\nOpend in Background")
              window.open(note.url, "_blank");
            }
          });
        }

        noteEl.appendChild(leftCol);
        noteEl.appendChild(rightCol);
        groupContent.appendChild(noteEl);
      });

      groupContainer.appendChild(groupContent);
      mainCol.appendChild(groupContainer);
    });

    notesList.appendChild(mainCol);

    const activeSearch = document.querySelector(".yt-notes-search");
    if (activeSearch) activeSearch.dispatchEvent(new Event("input"));

    // --- SMART RESIZE OBSERVER ---
    // The exact millisecond the dashboard becomes visible on your screen, this wakes up
    // all the textareas and forces them to recalculate their true heights!
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        document
          .querySelectorAll(".yt-notes-pinned-input, .yt-notes-edit-input")
          .forEach((ta) => {
            ta.dispatchEvent(new Event("input"));
          });
      }
    });
    observer.observe(notesList);

    // Add this to the very bottom of renderNotes()
    if (targetTime !== null) {
      setTimeout(() => {
        // 1. Convert targetTime to a clean integer
        const searchTime = parseInt(targetTime);

        // 2. CHECK PINNED NOTES FIRST
        const pinnedTarget = document.querySelector(
          `.yt-notes-pinned-card[data-time="${searchTime}"]`,
        );

        if (pinnedTarget) {
          pinnedTarget.scrollIntoView({ behavior: "smooth", block: "center" });
          const input = pinnedTarget.querySelector(".yt-notes-pinned-input");
          if (input) {
            input.focus();
            input.style.boxShadow = "0 0 0 2px #3ea6ff"; // Quick blue highlight
            setTimeout(() => (input.style.boxShadow = ""), 1000);
          }
          return; // Stop here so it doesn't execute the code below
        }

        // 3. FALLBACK TO UNPINNED FOLDERS
        const listTarget = document.querySelector(
          `.yt-notes-note[data-time="${searchTime}"]`,
        );

        const globalNoteType = document.querySelector(
          "select.yt-notes-type-filter",
        );
        // alert(listTarget.dataset.noteType)

        if (listTarget) {
          if (globalNoteType.value !== listTarget.dataset.noteType) {
            globalNoteType.value = "all";
          }
          const parentGroup = listTarget.closest(".yt-notes-group");
          if (parentGroup) parentGroup.classList.remove("is-folded"); // Unfold the video group

          // Wait exactly one visual frame for the fold to open, THEN calculate height and focus
          requestAnimationFrame(() => {
            listTarget.scrollIntoView({ behavior: "smooth", block: "center" });
            const input = listTarget.querySelector(".yt-notes-edit-input");

            if (input) {
              // Force height recalculation to prevent the squashed text box bug
              if (input.tagName === "TEXTAREA") {
                input.style.height = "auto";
                input.style.height = input.scrollHeight + "px";
              }
              // Wake up any auto-resize listeners
              input.dispatchEvent(new Event("input", { bubbles: true }));

              input.focus();
              input.style.boxShadow = "0 0 0 2px #3ea6ff"; // Quick blue highlight
              setTimeout(() => (input.style.boxShadow = ""), 1000);
            }
          });
        }
      }, 50);
    }
  }

  function buildDashboard(targetTime = null) {
    if (document.getElementById("yt-custom-notes-dashboard")) {
      renderNotes(GM_getValue("yt_notes_db", []), targetTime);
      return;
    }

    const dashboard = document.createElement("div");
    dashboard.id = "yt-custom-notes-dashboard";

    const container = document.createElement("div");
    container.className = "yt-notes-container";

    const header = document.createElement("div");
    header.className = "yt-notes-header";

    const titleArea = document.createElement("div");
    titleArea.style.display = "flex";
    titleArea.style.flexDirection = "column";
    titleArea.style.gap = "6px";

    const h1 = document.createElement("h1");
    h1.className = "yt-notes-h1";
    h1.textContent = "YT Timestamps";

    //const subtitle = document.createElement("span");
    // Added \n for the line break
    //subtitle.textContent = "⚡ Left-Click to seek\n⚡ Middle-Click to seek in new tab\n⚡ Right-Click to view snapshot";

    // Added white-space: pre-line to render the \n, and line-height so the lines aren't squished
    //subtitle.style.cssText = "color: #9a9a9a; font-size: 13px; font-weight: 500; white-space: pre-line; line-height: 1.5;";

    titleArea.appendChild(h1);
    //titleArea.appendChild(subtitle);

    const btnGroup = document.createElement("div");

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "yt-notes-btn";
    backBtn.id = "backtoyt";
    backBtn.textContent = "Back to YT";
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      history.replaceState(
        null,
        null,
        window.location.pathname + window.location.search,
      );
      hideDashboard();
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "yt-notes-btn yt-notes-btn-danger";
    clearBtn.textContent = "Clear All DB";
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (
        confirm(
          "Are you sure you want to clear the DataBase? This can't be undone",
        )
      ) {
        GM_setValue("yt_notes_db", []);
        renderNotes([]);
        syncChannel.postMessage("db_updated");
        renderPlayerMarkers();
      }
    });

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "yt-notes-btn";
    exportBtn.style.marginRight = "10px";

    exportBtn.textContent = "⬆ Export JSON";
    exportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const db = GM_getValue("yt_notes_db", []);
      const blob = new Blob([JSON.stringify(db, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `YT_Timestamps_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".json";
    importInput.style.display = "none";
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedDb = JSON.parse(event.target.result);
          if (Array.isArray(importedDb)) {
            const currentDb = GM_getValue("yt_notes_db", []);
            const combinedDb = [...currentDb, ...importedDb];
            const uniqueDb = Array.from(
              new Map(
                combinedDb.map((note) => [note.url + note.tag, note]),
              ).values(),
            );
            GM_setValue("yt_notes_db", uniqueDb);
            syncChannel.postMessage("db_updated");
            const addedCount = uniqueDb.length - currentDb.length;
            alert(
              `Successfully imported ${addedCount} new timestamps! (Total: ${uniqueDb.length})`,
            );
            renderNotes();
            renderPlayerMarkers();
          } else {
            alert("Invalid JSON format.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
        importInput.value = "";
      };
      reader.readAsText(file);
    });

    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "yt-notes-btn";
    importBtn.style.marginRight = "10px";
    importBtn.textContent = "⬇ Import JSON";
    importBtn.addEventListener("click", (e) => {
      e.preventDefault();
      importInput.click();
    });

    btnGroup.appendChild(importInput);
    btnGroup.appendChild(importBtn);
    btnGroup.appendChild(exportBtn);

    btnGroup.appendChild(backBtn);
    btnGroup.appendChild(clearBtn);
    header.appendChild(titleArea);
    header.appendChild(btnGroup);
    container.appendChild(header);

    const searchRow = document.createElement("div");
    searchRow.className = "yt-notes-search-row";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "yt-notes-search";
    searchInput.placeholder = 'Search... [ press "/" to search]';

    // 2. Change the text the exact moment the user clicks or presses [ / ]
    searchInput.addEventListener("focus", () => {
      searchInput.placeholder = "Search Anything... [ ESC to cancel ]";
    });

    // 3. Revert back to the hotkey hint when they click away
    searchInput.addEventListener("blur", () => {
      searchInput.placeholder = "Search... [ / ]";
    });

    // 1. Create the hint element
    const typeFilterSelect = document.createElement("select");
    typeFilterSelect.className = "yt-notes-type-filter";

    // 2. Append both the select and the hint to your target container
    // (Assuming your container is called 'controlsContainer')

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "All Types (Alt+s to switch)";

    const optConcept = document.createElement("option");
    optConcept.value = "concept";
    optConcept.textContent = "Concepts Only (Alt+s)";

    const optQuestion = document.createElement("option");
    optQuestion.value = "question";
    optQuestion.textContent = "Questions Only (Alt+s)";

    typeFilterSelect.append(optAll, optConcept, optQuestion);
    typeFilterSelect.value =
      localStorage.getItem("yt_notes_type_filter") || "all";

    const currentVidLabel = document.createElement("label");
    currentVidLabel.className = "yt-notes-current-vid-label";

    const currentVidCheckbox = document.createElement("input");
    currentVidCheckbox.type = "checkbox";
    currentVidCheckbox.className = "yt-notes-current-vid-checkbox";
    currentVidCheckbox.checked =
      localStorage.getItem("yt_notes_current_only") === "true";

    currentVidLabel.appendChild(currentVidCheckbox);
    currentVidLabel.appendChild(
      document.createTextNode("This video only [ Alt+t ]"),
    );

    searchRow.appendChild(searchInput);
    searchRow.appendChild(typeFilterSelect);
    searchRow.appendChild(currentVidLabel);
    container.appendChild(searchRow);

    function applyFilters() {
      const term = searchInput.value.toLowerCase();
      const selectedType = typeFilterSelect.value;
      const currentUrlVidId = new URL(window.location.href).searchParams.get(
        "v",
      );
      let currentOnly = false;

      if (currentUrlVidId) {
        currentVidLabel.style.display = "flex";
        currentOnly = currentVidCheckbox.checked;
        localStorage.setItem("yt_notes_current_only", currentOnly);
      } else {
        currentVidLabel.style.display = "none";
        currentOnly = false;
      }

      h1.textContent =
        `YT Timestamps : ${currentOnly ? "Current Video" : "All Videos"}` +
        (selectedType !== "all"
          ? ` (${selectedType.toUpperCase()}S only)`
          : "");

      localStorage.setItem("yt_notes_type_filter", selectedType);

      // --- 1. FILTER UNPINNED NOTES ---
      const groups = document.querySelectorAll(".yt-notes-group");
      groups.forEach((group) => {
        let hasVisibleNote = false;
        const notes = group.querySelectorAll(".yt-notes-note");
        const headerText = group
          .querySelector(".yt-notes-group-header")
          .textContent.toLowerCase();
        const headerMatches = headerText.includes(term);

        notes.forEach((noteEl) => {
          const noteText = noteEl
            .querySelector(".yt-notes-edit-input")
            .value.toLowerCase();
          const noteVidId = noteEl.dataset.vidId;
          const noteType = noteEl.dataset.noteType;

          const matchesSearch = noteText.includes(term) || headerMatches;
          const matchesVideo = !currentOnly || noteVidId === currentUrlVidId;
          const matchesType =
            selectedType === "all" || noteType === selectedType;

          if (matchesSearch && matchesVideo && matchesType) {
            noteEl.style.display = "flex";
            hasVisibleNote = true;
          } else {
            noteEl.style.display = "none";
          }
        });

        group.style.display = hasVisibleNote ? "block" : "none";
      });

      // --- 2. FILTER PINNED NOTES ---
      const pinnedCards = document.querySelectorAll(".yt-notes-pinned-card");
      let hasVisiblePinnedNote = false; // NEW: The tracker variable

      pinnedCards.forEach((card) => {
        const noteInput = card.querySelector(".yt-notes-pinned-input");
        const noteText = noteInput ? noteInput.value.toLowerCase() : "";
        const noteVidId = card.dataset.vidId;
        const noteType = card.dataset.noteType;
        const videoTitle = card.dataset.videoTitle;

        // Matches if the search term is in the note text OR the video title
        const matchesSearch =
          noteText.includes(term) || videoTitle.includes(term);
        const matchesVideo = !currentOnly || noteVidId === currentUrlVidId;
        const matchesType = selectedType === "all" || noteType === selectedType;

        if (matchesSearch && matchesVideo && matchesType) {
          card.style.display = "flex"; // Restores normal flexbox card layout
          hasVisiblePinnedNote = true; // NEW: A match was found, trip the alarm!
        } else {
          card.style.display = "none";
        }
      });

      // --- 3. HIDE/SHOW ENTIRE PINNED PANEL ---
      // Replace ".yt-critical-notes-panel" with the exact class of your outer wrapper
      const criticalPanelWrapper = document.querySelector(".yt-notes-pinned-container");
      if (criticalPanelWrapper) {
        // If we found at least one note, show the panel (use "flex" or "block" depending on your layout). Otherwise, hide it!
        criticalPanelWrapper.style.display = hasVisiblePinnedNote ? "flex" : "none";
      }
    }

    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 150);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.blur();
      } else if (e.key.toLowerCase() === "t" && e.altKey) {
        currentVidCheckbox.checked = !currentVidCheckbox.checked;
        applyFilters();
      } else if (e.key.toLowerCase() === "s" && event.altKey) {
        const selector = document.querySelector("select.yt-notes-type-filter");
        if (selector) {
          // A simple map of what comes next
          const nextType = {
            all: "concept",
            concept: "question",
            question: "all",
          };
          selector.value = nextType[selector.value] || "all";
          selector.dispatchEvent(new Event("change"));
        }
      }
    });

    typeFilterSelect.addEventListener("change", () => {
      applyFilters();
      typeFilterSelect.blur();
    });

    currentVidCheckbox.addEventListener("change", () => {
      applyFilters();
      currentVidCheckbox.blur();
    });

    const notesListContainer = document.createElement("div");
    notesListContainer.id = "yt-notes-list-container";
    container.appendChild(notesListContainer);

    dashboard.appendChild(container);
    document.body.appendChild(dashboard);
    renderNotes(GM_getValue("yt_notes_db", []), targetTime);

    if (!window.ytNotesListenerAttached) {
      syncChannel.onmessage = (event) => {
        if (event.data === "db_updated") {
          if (document.getElementById("yt-custom-notes-dashboard")) {
            const freshDb = GM_getValue("yt_notes_db", []);
            renderNotes(freshDb);
          }
          renderPlayerMarkers();
        }
      };
      window.ytNotesListenerAttached = true;
    }
  }

  function checkHash() {
    if (window.location.hash === "#timestamps") {
      if (document.body) {
        showDashboard();
      } else {
        const observer = new MutationObserver(() => {
          if (document.body) {
            observer.disconnect();
            showDashboard();
          }
        });
        observer.observe(document.documentElement, { childList: true });
      }
    } else {
      hideDashboard();
    }
  }

  window.addEventListener("hashchange", checkHash);
  checkHash();

  const SKIP_INTERVAL = 45;
  const eLinks = {
    y: "/",
    h: "/feed/history",
    p: "/feed/playlists",
    w: "/playlist?list=WL",
    d: "/feed/downloads",
    s: "/feed/subscriptions",
  };
  const routeNames = {
    "/": "Homescreen",
    "/feed/history": "History",
    "/feed/playlists": "Playlists",
    "/playlist?list=WL": "Watch Later",
    "/feed/downloads": "Downloads",
    "/feed/subscriptions": "Subscriptions",
    "/#timestamps": "Timestamps Dashboard"
  };
  const themeData = {
    navigation: "#ffffff",
    settingON: "#10b981",
    settingOFF: "#f59e0b",
    saved: "#fbbf24",
    copied: "#2dd4bf",
    noteSynced: "#3b82f6"
  }


  document.addEventListener("DOMContentLoaded", (event) => {
    // alert("domloaded")
    const dummydiv = document.createElement("div");
    dummydiv.style.display = "none";
    // Your UI initialization code goes here
    Object.values(eLinks).forEach((l) => {
      const dummyLink = document.createElement("a");
      dummyLink.href = l;
      dummyLink.setAttribute("is", "yt-endpoint");
      dummyLink.className = "yt-simple-endpoint";
      dummydiv.appendChild(dummyLink);
      // document.body.appendChild(dummyLink);
    });
    document.body.appendChild(dummydiv);
  });

  function clickIfExist(url, showinfo) {
    const existingLinks = document.querySelectorAll(`a[href$="${url}"]`);
    if (existingLinks.length !== 0) {
      existingLinks[0].click();
      if (showinfo) {
        const urlTXT = routeNames[url] || url;
        showToast(`switched to ${urlTXT}`, themeData.navigation)
      }
      // alert("existed")
      return true;
    }
    return false;
  }
  function spaNavigate(url, showinfo = true) {

    if (clickIfExist(url, showinfo)) return

    const dummyLink = document.createElement("a");
    dummyLink.href = url;
    dummyLink.setAttribute("is", "yt-endpoint");
    dummyLink.className = "yt-simple-endpoint";
    document.body.appendChild(dummyLink);
    // alert("dne");
    dummyLink.click();
    if (showinfo) {
      const urlTXT = routeNames[url] || url;
      showToast(`switched to ${urlTXT}`, themeData.navigation)
    }
    document.body.removeChild(dummyLink);
  }

//toast START
  // 1. THE SINGLE-STATE CONTROLLER
  // Consolidates all global variables into one clean object to prevent namespace pollution

window.ytNotesToastSys = window.ytNotesToastSys || {
  queue: [],
  isActive: false,
  styleInjected: false,
  forceCloseActive: null // <-- NEW: A direct line to kill the current toast
};

if (!window.ytNotesToastSys.styleInjected) {
  const style = document.createElement("style");
  style.textContent = `
    .yt-custom-toast-base {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px) scale(0.9);
      background: rgba(18, 18, 18, 0.85);
      padding: 14px 28px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      z-index: 2147483647;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.3px;
      pointer-events: auto !important; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      white-space: pre-line;
      text-align: center;
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease, border-color 0.2s ease;
      color: var(--yt-toast-color, #fff);
      text-shadow: 0 0 8px var(--yt-toast-color, #fff), 0 0 16px var(--yt-toast-color, #fff);
      cursor: var(--yt-toast-cursor, default) !important;
    }
  `;
  document.head.appendChild(style);
  window.ytNotesToastSys.styleInjected = true;
}

function showToast(message, color = "#fff", userClick = false) {
    window.ytNotesToastSys.queue.push({ message, color, userClick });
    
    // --- THE AGGRESSIVE OVERRIDE CHECK ---
    // If a toast is currently on screen, tell it to self-destruct immediately
    if (window.ytNotesToastSys.isActive && window.ytNotesToastSys.forceCloseActive) {
      window.ytNotesToastSys.forceCloseActive();
    } else {
      processToastQueue();
    }
}

function processToastQueue() {
    if (window.ytNotesToastSys.isActive || window.ytNotesToastSys.queue.length === 0) return;

    window.ytNotesToastSys.isActive = true;
    const { message, color, userClick } = window.ytNotesToastSys.queue.shift();

    const toast = document.createElement("div");
    toast.id = "yt-custom-modern-toast";
    toast.className = "yt-custom-toast-base"; 
    toast.textContent = message;

    toast.style.setProperty("--yt-toast-color", color || "#fff");
    toast.style.setProperty("--yt-toast-cursor", userClick ? "pointer" : "default");

    const fsElement = document.fullscreenElement;
    const dashboard = document.getElementById("yt-custom-notes-dashboard");
    
    if (fsElement) {
      fsElement.appendChild(toast);
    } else if (document.body.classList.contains("yt-notes-active") && dashboard) {
      dashboard.appendChild(toast);
    } else {
      document.body.appendChild(toast);
    }

    toast.style.setProperty("display", "block", "important");
    toast._isHovering = false;

    // --- THE INSTANT KILL SWITCH ---
    window.ytNotesToastSys.forceCloseActive = () => {
      // If the user is currently hovering, ignore the kill command.
      // The new toast will wait safely in the queue.
      if (toast._isHovering) return; 

      clearTimeout(toast._hideTimer);
      clearTimeout(toast._removeTimer);
      
      // Strip away CSS transitions so it vanishes instantly in 0.0ms
      toast.style.transition = "none"; 
      toast.remove();
      
      // Reset state and instantly pull the next toast from the queue
      window.ytNotesToastSys.isActive = false;
      window.ytNotesToastSys.forceCloseActive = null;
      processToastQueue(); 
    };

    const beginFadeOut = () => {
      clearTimeout(toast._hideTimer);
      clearTimeout(toast._removeTimer);
      
      toast._hideTimer = setTimeout(() => {
        if (toast._isHovering) return; 

        toast.style.transform = "translateX(-50%) translateY(10px) scale(0.95)";
        toast.style.opacity = "0";

        toast._removeTimer = setTimeout(() => {
          if (toast.parentNode) toast.remove();
          
          window.ytNotesToastSys.isActive = false;
          window.ytNotesToastSys.forceCloseActive = null;
          processToastQueue(); 
        }, 300);
      }, 2500); 
    };

    const cancelFadeOut = () => {
      clearTimeout(toast._hideTimer);
      clearTimeout(toast._removeTimer);
      toast.style.transform = "translateX(-50%) translateY(0) scale(1)";
      toast.style.opacity = "1";
    };

    toast.addEventListener("pointerenter", () => {
      toast._isHovering = true;
      toast.style.borderColor = "rgba(255, 255, 255, 0.5)"; 
      cancelFadeOut();
    });

    toast.addEventListener("pointerleave", () => {
      toast._isHovering = false;
      toast.style.borderColor = "rgba(255, 255, 255, 0.1)"; 
      
      // If there's already another toast waiting in line when the mouse leaves, 
      // instantly kill this one instead of waiting 2.5 seconds.
      if (window.ytNotesToastSys.queue.length > 0) {
        window.ytNotesToastSys.forceCloseActive();
      } else {
        beginFadeOut();
      }
    });

    if (userClick) {
      toast.addEventListener("click", (e) => {
        userClick(e);
        clearTimeout(toast._hideTimer);
        clearTimeout(toast._removeTimer);
        toast.remove(); 
        
        window.ytNotesToastSys.isActive = false;
        window.ytNotesToastSys.forceCloseActive = null;
        processToastQueue();
      });
    }

    void toast.offsetHeight; 
    toast.style.transform = "translateX(-50%) translateY(0) scale(1)";
    toast.style.opacity = "1";

    beginFadeOut();
}
  //toast END

  function formatTime(seconds, hms = false) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (!hms) {
      if (h > 0)
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      return `${m}:${s.toString().padStart(2, "0")}`;
    } else {
      if (h > 0) return `${h}hr_${m}min_${s}sec`
      return `${m}min_${s}sec`
    }
  }

  function showFullscreenPrompt(playerContainer, callback) {
    const existing = document.getElementById("yt-custom-prompt-overlay");
    if (existing) existing.remove();

    if (
      playerContainer &&
      getComputedStyle(playerContainer).position === "static"
    ) {
      playerContainer.style.position = "relative";
    }

    const fullscreenHost = document.fullscreenElement || playerContainer;

    if (navigator.keyboard && navigator.keyboard.lock) {
      navigator.keyboard.lock(["Escape"]).catch(() => { });
    }

    const overlay = document.createElement("div");
    overlay.id = "yt-custom-prompt-overlay";
    overlay.style.cssText = `position:absolute; inset:0; width:100%; height:100%; background:rgba(0,0,0,0.52); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:99999999; overflow:hidden;`;

    const dialog = document.createElement("div");
    dialog.style.cssText = `width:min(440px, calc(100% - 32px)); background:linear-gradient(180deg, rgba(28,28,28,0.98), rgba(14,14,14,0.98)); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:18px; box-shadow: 0 24px 70px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04); display:flex; flex-direction:column; gap:14px; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:#fff;`;

    // 1. THE MAIN HEADER WRAPPER (Forces left/right split)
    const headerContainer = document.createElement("div");
    headerContainer.style.cssText = "display: flex !important; justify-content: space-between !important; align-items: flex-start !important; width: 100% !important; margin-bottom: 4px !important;";

    // 2. THE LEFT TEXT STACK
    const textStack = document.createElement("div");
    textStack.style.cssText = "display: flex !important; flex-direction: column !important; gap: 4px !important;";

    const title = document.createElement("div");
    const video = document.querySelector("video");
    title.textContent = `Tag timestamp ${video ? `@${formatTime(Math.floor(video.currentTime))}` : ""}`;
    title.style.cssText = `font-size:15px; font-weight:700; color:#f2f2f2; letter-spacing:0.2px;`;

    const subtitle = document.createElement("div");
    subtitle.textContent = "[ Enter ] save · [ Esc ] close";
    subtitle.style.cssText = `font-size:11px; color:rgba(255,255,255,0.35); margin-top:1px; letter-spacing:0.3px; font-weight:500; pointer-events:none;`;

    textStack.appendChild(title);
    textStack.appendChild(subtitle);

    // 3. THE RIGHT BUTTON GROUP (The main horizontal row)
    const toolsContainer = document.createElement("div");
    toolsContainer.style.cssText = "display: flex !important; gap: 12px !important; margin-top: 2px !important;";

    // --- SUB-WRAPPER 1: COPY ---
    const copyWrapper = document.createElement("div");
    copyWrapper.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; gap: 6px !important;";

    const copyBtn = document.createElement("button");
    copyBtn.className = "yt-notes-util-btn";
    copyBtn.textContent = `📋 Copy Frame`;

    const copyHint = document.createElement("div");
    copyHint.textContent = "[ Alt + c ]";
    copyHint.style.cssText = "font-size: 10px !important; color: rgba(255,255,255,0.35) !important; letter-spacing: 0.3px !important; font-weight: 500 !important; pointer-events: none !important;";

    copyWrapper.appendChild(copyBtn);
    copyWrapper.appendChild(copyHint);

    // --- SUB-WRAPPER 2: SAVE ---
    const saveWrapper = document.createElement("div");
    saveWrapper.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; gap: 6px !important;";

    const saveBtn = document.createElement("button");
    saveBtn.className = "yt-notes-util-btn";
    saveBtn.textContent = `💾 Save Frame`;

    const saveHint = document.createElement("div");
    saveHint.textContent = "[ Alt + v ]";
    saveHint.style.cssText = "font-size: 10px !important; color: rgba(255,255,255,0.35) !important; letter-spacing: 0.3px !important; font-weight: 500 !important; pointer-events: none !important;";

    saveWrapper.appendChild(saveBtn);
    saveWrapper.appendChild(saveHint);

    // 4. ASSEMBLE
    toolsContainer.appendChild(copyWrapper);
    toolsContainer.appendChild(saveWrapper);


    // --- BUTTON LOGIC ---
    // --- BUTTON LOGIC ---
    function captureVideoFrame() {
      if (!video) return null;

      const canvas = document.createElement("canvas");
      // Grabs the raw, native resolution of the active stream (e.g., 1920x1080)
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      // Draws the raw frame exactly 1:1 with zero scaling or stretching
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas;
    }

    const copyIMG = (e) => {
      if (e) e.stopPropagation();
      const canvas = captureVideoFrame();
      if (!canvas) return;

      // Exports as a lossless PNG to the clipboard
      canvas.toBlob((blob) => {
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => {
          showToast("🔗 Copied frame to clipboard", themeData.copied);
        });
      }, "image/png");
    }

    const saveIMG = (e) => {
      if (e) e.stopPropagation();
      const canvas = captureVideoFrame();
      if (!canvas) return;

      const timeStr = formatTime(video.currentTime, true)
      const link = document.createElement("a");
      link.download = `${input.value ? input.value.replaceAll(" ", "_") : "yt-snapshot"}-${timeStr}.png`;

      // Exports as a lossless PNG to the hard drive
      link.href = canvas.toDataURL("image/png");
      link.click();

      showToast("📸 saved frame to disk", themeData.saved);
    }
    copyBtn.addEventListener("click", copyIMG);

    saveBtn.addEventListener("click", saveIMG);

    // 4. ASSEMBLE
    // toolsContainer.appendChild(copyBtn);
    // toolsContainer.appendChild(saveBtn);

    headerContainer.appendChild(textStack);
    headerContainer.appendChild(toolsContainer);

    const typeRow = document.createElement("div");
    typeRow.style.cssText = "display:flex; gap:10px;";

    function createTypeBtn(val, labelText, color, checked) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.value = val;
      btn.textContent = labelText;
      btn.style.cssText = `flex:1; padding:10px 12px; border-radius:12px; border:1px solid transparent; background:rgba(255,255,255,0.04); color:#9c9c9c; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.18s ease; user-select:none;`;

      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("mouseenter", () => {
        if (btn.style.borderColor === "transparent") {
          btn.style.background = "rgba(255,255,255,0.07)";
          btn.style.color = "#d0d0d0";
        }
      });
      btn.addEventListener("mouseleave", () => {
        if (btn.style.borderColor === "transparent") {
          btn.style.background = "rgba(255,255,255,0.04)";
          btn.style.color = "#9c9c9c";
        }
      });

      btn.addEventListener("click", () => {
        [...typeRow.children].forEach((c) => {
          c.style.borderColor = "transparent";
          c.style.background = "rgba(255,255,255,0.04)";
          c.style.color = "#9c9c9c";
        });
        btn.style.borderColor = color;
        btn.style.background = `${color}22`;
        btn.style.color = color;
      });

      if (checked) setTimeout(() => btn.click(), 0);
      return btn;
    }

    const conceptBtn = createTypeBtn("concept", "Concept", "#4cff88", true);
    const questionBtn = createTypeBtn("question", "Question", "#ff5c5c", false);
    typeRow.appendChild(conceptBtn);
    typeRow.appendChild(questionBtn);

    // --- NEW: HOTKEY HINT TEXT ---
    const hotkeyHint = document.createElement("div");
    hotkeyHint.textContent = "Press [ Alt + s ] to switch type";
    hotkeyHint.style.cssText = `font-size:11px; color:rgba(255,255,255,0.35); text-align:center; margin-top:-6px; letter-spacing:0.3px; font-weight:500; pointer-events:none;`;

    // --- HD CHECKBOX ROW ---
    const checkboxRow = document.createElement("div");
    checkboxRow.style.cssText =
      "display:flex; align-items:center; gap:8px; padding-left:4px;";

    const hdCheckbox = document.createElement("input");
    hdCheckbox.type = "checkbox";
    hdCheckbox.id = "yt-hd-checkbox";
    hdCheckbox.style.cursor = "pointer";

    const hdLabel = document.createElement("label");
    hdLabel.htmlFor = "yt-hd-checkbox";
    hdLabel.textContent = "Critical Note • HD Capture [ Alt+t ]";
    hdLabel.style.cssText =
      "font-size:13px; font-weight:600; color:#d0d0d0; cursor:pointer; user-select:none;";

    checkboxRow.appendChild(hdCheckbox);
    checkboxRow.appendChild(hdLabel);

    checkboxRow.addEventListener("click", (e) => {
      e.stopPropagation();
      input.focus();
    });
    checkboxRow.addEventListener("mousedown", (e) => e.stopPropagation());

    const input = document.createElement("textarea");
    input.rows = 4;
    input.autocomplete = "off";
    input.spellcheck = true;
    input.placeholder = 'Define this snapshot...\n\n[ Ctrl+Enter ] or [ Shift+Enter ] for line break';
    input.style.cssText = `width:100%; min-height:110px; padding:14px 15px; border-radius:14px; border:1px solid rgba(255,255,255,0.10); background:linear-gradient(180deg, rgba(9,9,9,0.98), rgba(13,13,13,0.98)); color:#fff; font-size:14px; outline:none; resize:none; box-sizing:border-box; line-height:1.5; box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);`;

    let closed = false;
    let restoreFullscreenAfterClose = false;
    let restoreInFlight = false;

    function cleanupPrompt(keepFullscreenListener = false) {
      document.removeEventListener("keydown", windowLevelShield, true);
      document.removeEventListener("keyup", windowLevelShield, true);

      input.removeEventListener("keydown", handleInputKeys, true);
      input.removeEventListener("keyup", inputKeyShield, true);
      input.removeEventListener("keypress", inputKeyShield, true);
      input.removeEventListener("beforeinput", inputKeyShield, true);
      input.removeEventListener("paste", inputKeyShield, true);
      input.removeEventListener("cut", inputKeyShield, true);
      input.removeEventListener("copy", inputKeyShield, true);

      overlay.removeEventListener("mousedown", blockOutsideInteraction, true);
      overlay.removeEventListener("click", blockOutsideInteraction, true);
      overlay.removeEventListener("pointerdown", blockOutsideInteraction, true);
      overlay.removeEventListener("touchstart", blockOutsideInteraction, true);

      document.removeEventListener(
        "fullscreenchange",
        onFullscreenChange,
        true,
      );
      setTimeout(() => {
        if (navigator.keyboard && navigator.keyboard.unlock) {
          navigator.keyboard.unlock();
        }
      }, 500);
    }

    function getRestoreTarget() {
      return fullscreenHost && fullscreenHost.isConnected
        ? fullscreenHost
        : playerContainer;
    }

    async function requestFullscreenAgain() {
      if (closed && !restoreFullscreenAfterClose) return;
      if (document.fullscreenElement || restoreInFlight) return;

      restoreInFlight = true;
      try {
        const target = getRestoreTarget();
        await target.requestFullscreen({ navigationUI: "hide" });
      } catch {
        try {
          await playerContainer.requestFullscreen({ navigationUI: "hide" });
        } catch { }
      } finally {
        restoreInFlight = false;
      }
    }

    function onFullscreenChange() {
      if (closed) {
        if (restoreFullscreenAfterClose && !document.fullscreenElement) {
          requestFullscreenAgain();
        }
        if (restoreFullscreenAfterClose && document.fullscreenElement) {
          restoreFullscreenAfterClose = false;
          document.removeEventListener(
            "fullscreenchange",
            onFullscreenChange,
            true,
          );
        }
        return;
      }

      if (!document.fullscreenElement) {
        requestFullscreenAgain();
      }
    }

    function getSelectedType() {
      const activeBtn = [...typeRow.children].find(
        (c) => c.style.borderColor !== "transparent",
      );
      return activeBtn ? activeBtn.dataset.value : "concept";
    }

    function closePrompt(isSave, restoreFullscreen = false) {
      if (closed) return;
      closed = true;
      restoreFullscreenAfterClose = restoreFullscreen;
      overlay.remove();

      if (isSave) {
        const text = input.value.trim();
        if (text) {
          callback(text, getSelectedType(), hdCheckbox.checked);
        } else {
          callback(null, null, false);
        }
      } else {
        callback(null, null, false);
      }

      if (restoreFullscreen) {
        requestFullscreenAgain();
      }
      cleanupPrompt(restoreFullscreen);
    }

    function inputKeyShield(e) {
      e.stopPropagation();
    }

    function submit() {
      if (input.value.trim() === "") {
        closePrompt(false, false);
      } else {
        closePrompt(true, false);
      }
    }

    function handleInputKeys(e) {
      if (e.key === "Enter") {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          e.stopPropagation();
          if (e.ctrlKey) {
            input.value += "\n";
          }
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        submit();
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closePrompt(false, document.fullscreenElement);
        return;
      } else if (e.altKey) {
        const eKey = e.key?.toLowerCase()
        if (eKey === "t") {
          hdCheckbox.checked = !hdCheckbox.checked;
        } else if (eKey === "s") {
          e.preventDefault(); // Stop default browser behaviors
          e.stopPropagation();

          // If concept is currently selected, click question. Otherwise, click concept.
          if (conceptBtn.style.borderColor !== "transparent") {
            questionBtn.click();
          } else {
            conceptBtn.click();
          }
          return; // Exit early so it doesn't trigger anything else
        } else if (eKey === "c") {
          copyIMG(false)
        } else if (eKey === "v") {
          saveIMG(false)
        }
      }

      e.stopPropagation();
    }

    function blockOutsideInteraction(e) {
      if (dialog.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }

    function windowLevelShield(e) {
      if (closed) return;
      const isInsideInput = e.target === input || input.contains(e.target);
      if (isInsideInput) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    input.addEventListener("keydown", handleInputKeys, true);
    input.addEventListener("keyup", inputKeyShield, true);
    input.addEventListener("keypress", inputKeyShield, true);
    input.addEventListener("beforeinput", inputKeyShield, true);
    input.addEventListener("paste", inputKeyShield, true);
    input.addEventListener("cut", inputKeyShield, true);
    input.addEventListener("copy", inputKeyShield, true);

    document.addEventListener("fullscreenchange", onFullscreenChange, true);
    document.addEventListener("keydown", windowLevelShield, true);
    document.addEventListener("keyup", windowLevelShield, true);

    overlay.addEventListener("mousedown", blockOutsideInteraction, true);
    overlay.addEventListener("click", blockOutsideInteraction, true);
    overlay.addEventListener("pointerdown", blockOutsideInteraction, true);
    overlay.addEventListener("touchstart", blockOutsideInteraction, true);

    dialog.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    dialog.addEventListener("click", (e) => {
      e.stopPropagation();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    dialog.addEventListener("pointerdown", (e) => e.stopPropagation());

    dialog.appendChild(headerContainer); // Wraps both text and buttons perfectly!
    dialog.appendChild(typeRow);
    dialog.appendChild(hotkeyHint); // Appends the tiny text directly below the buttons
    dialog.appendChild(checkboxRow);
    dialog.appendChild(input);
    overlay.appendChild(dialog);
    playerContainer.appendChild(overlay);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 50);
  }

  function blockSpacebar(event) {
    if (event.code === "Space") {
      const target = event.target;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        (target.closest && target.closest("#contenteditable-root"));

      if (isTyping) {
        target.addEventListener(
          event.type,
          function stopBubble(e) {
            e.stopPropagation();
            target.removeEventListener(event.type, stopBubble, false);
          },
          false,
        );
        return;
      }
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function freezeVideo() {
    const video = document.querySelector("video");
    if (video) {
      video.pause();
    }
    window.addEventListener("keydown", blockSpacebar, true);
    window.addEventListener("keyup", blockSpacebar, true);
    window.addEventListener("keypress", blockSpacebar, true);
  }

  function unfreezeVideo() {
    window.removeEventListener("keydown", blockSpacebar, true);
    window.removeEventListener("keyup", blockSpacebar, true);
    window.removeEventListener("keypress", blockSpacebar, true);
  }

  function toggleMiniPlayer() {
    const iEvent = new KeyboardEvent("keydown", {
      key: "i",
      code: "KeyI",
      keyCode: 73,
      which: 73,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    document.dispatchEvent(iEvent);
  }

  // var firstUserInteraction = false; //fk-val
  var firstUserInteraction = window.location.pathname === "/watch";
  window.addEventListener(
    "keydown",
    (event) => {
      const eKey = event.key ? event.key.toLowerCase() : "";
      if (!eKey) return;

      const isHotkey =
        eLinks[eKey] !== undefined ||
        eKey === "x" ||
        eKey === "/" ||
        eKey === "t" ||
        eKey === "l" ||
        eKey === "j" ||
        eKey === "k" ||
        eKey === "i" ||
        eKey === "q" ||
        eKey === "escape";
      if (!isHotkey) return;

      const activeTag = document.activeElement
        ? document.activeElement.tagName.toLowerCase()
        : "";

      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      if (
        eLinks[eKey] !== undefined &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const url = eLinks[eKey];
        if (window.location.pathname === "/watch") {
          toggleMiniPlayer()
          if (url === "/") {
            firstUserInteraction = false;
          }
          setTimeout(
            () => {
              if (firstUserInteraction) {
                spaNavigate("/", false);
                setTimeout(() => {
                  spaNavigate(url);
                  firstUserInteraction = false;
                }, 2000);
              } else {
                spaNavigate(url);
              }
            },
            (firstUserInteraction ? 900 : 0) + 600,
          );
        } else {
          spaNavigate(url);
        }
        if (document.body.classList.contains("yt-notes-active")) {
          history.replaceState(
            null,
            null,
            window.location.pathname + window.location.search,
          );
          hideDashboard();
        }
        return;
      }


      if (eKey === "q") {
        // 1. Select the actual clickable button inside the voice search container
        const voiceSearchBtn = document.querySelector("#voice-search-button button");

        // 2. Ensure it exists before trying to click it
        if (voiceSearchBtn) {
          voiceSearchBtn.click();
          if (window.location.pathname === "/watch") toggleMiniPlayer()
        }
      }
      if (event.shiftKey) {
        if (eKey === "x") {
          event.preventDefault();
          event.stopImmediatePropagation();

          const dashboardOpen =
            document.body.classList.contains("yt-notes-active");

          if (dashboardOpen) {
            history.replaceState(
              null,
              null,
              window.location.pathname + window.location.search,
            );
            hideDashboard();
          } else {
            history.replaceState(
              null,
              null,
              window.location.pathname + window.location.search + "#timestamps",
            );
            showDashboard();
          }
          return;
        } else if (eKey === "k") {
          event.preventDefault();
          event.stopImmediatePropagation();
          autoPauseEnabled = !autoPauseEnabled;
          localStorage.setItem("yt_auto_pause_enabled", autoPauseEnabled);
          showToast(`Smart Pause: ${autoPauseEnabled ? "ACTIVE" : "INACTIVE"}`, autoPauseEnabled ? themeData.settingON : themeData.settingOFF);
          return;
        } else if (eKey === "i" && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const video = document.querySelector("video");

          if (video) {
            // Check if the video is already in Picture-in-Picture mode
            if (document.pictureInPictureElement) {
              document.exitPictureInPicture();
              showToast("PiP: OFF", themeData.settingOFF)
            } else {
              video.requestPictureInPicture();
              showToast("PiP: ON", themeData.settingON)
            }
          }
        }
      }

      // shortcuts on the timestamps dashboard
      if (document.body.classList.contains("yt-notes-active")) {
        if (eKey === "/") {
          event.preventDefault(); // Stops the '/' from typing into the search bar instantly
          showToast("Target: Search")
          document.getElementsByClassName("yt-notes-search")[0].focus();
        } else if (
          eKey === "t" &&
          event.altKey &&
          window.location.pathname === "/watch"
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();

          const currentVidCheckbox = document.querySelector(
            ".yt-notes-current-vid-checkbox",
          );
          if (currentVidCheckbox) {
            const check = !currentVidCheckbox.checked
            currentVidCheckbox.checked = check;
            showToast(check ? "This Video Only" : "All Videos", check ? themeData.settingON : themeData.settingOFF)
            currentVidCheckbox.dispatchEvent(new Event("change"));
          }
        } else if (eKey === "s" && event.altKey) {
          const selector = document.querySelector("select.yt-notes-type-filter");
          if (selector) {
            // A simple map of what comes next
            const nextType = {
              all: "concept",
              concept: "question",
              question: "all",
            };
            selector.value = nextType[selector.value] || "all";
            showToast(`${selector.value}${(selector.value !== "all") ? "s only" : " types"}`)
            selector.dispatchEvent(new Event("change"));
          }
        }
      }

      if (window.location.pathname === "/watch") {
        const video = document.querySelector("video");

        if (eKey === "x" && !event.shiftKey) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (video) {
            const playerContainer =
              video.closest(".html5-video-player") || document.body;
            const wasPlaying = !video.paused;
            freezeVideo();

            // --- RECEIVING THE isImportant VARIABLE HERE ---
            showFullscreenPrompt(
              playerContainer,
              (tag, noteType, isImportant) => {
                if (tag !== null && tag.trim() !== "") {
                  const timeInSeconds = Math.floor(video.currentTime);
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set("t", timeInSeconds + "s");
                  const channelEl = document.querySelector(
                    "#upload-info .yt-formatted-string, #owner-name a",
                  );
                  const channelName = channelEl
                    ? channelEl.innerText
                    : "Unknown Channel";
                  const videoTitle = document.title
                    .replace(/^\(\d+\)\s/, "")
                    .replace(" - YouTube", "");

                  let canvas = document.createElement("canvas");

                  // Use 1280px max resolution for HD, 480px for standard
                  const maxRes = isImportant ? 1280 : 480;

                  // Prevent scaling UP if the video is smaller than our maxRes
                  const scale = Math.min(
                    1,
                    Math.min(
                      maxRes / video.videoWidth,
                      maxRes / video.videoHeight,
                    ),
                  );

                  canvas.width = video.videoWidth * scale;
                  canvas.height = video.videoHeight * scale;

                  const ctx = canvas.getContext("2d", { alpha: false });
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = isImportant ? "high" : "low";
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                  // Use 85% quality for HD, 40% for standard
                  const imgQuality = isImportant ? 0.85 : 0.4;
                  const frameDataUrl = canvas.toDataURL(
                    "image/jpeg",
                    imgQuality,
                  );

                  canvas.width = 0;
                  canvas.height = 0;
                  canvas = null;

                  const vidDuration = document.querySelector(
                    ".ytp-time-duration",
                  )
                    ? document.querySelector(".ytp-time-duration").textContent
                    : "";

                  let dbNotes = GM_getValue("yt_notes_db", []);
                  dbNotes.push({
                    videoTitle: videoTitle,
                    timeFormatted: formatTime(timeInSeconds),
                    tag: tag.trim(),
                    url: currentUrl.toString(),

                    // --- AUTO-PIN BASED ON CHECKBOX ---
                    pinned: Boolean(isImportant),
                    pinnedAt: isImportant ? Date.now() : null,

                    channel: channelName,
                    frameData: frameDataUrl,
                    type: noteType || "concept",
                    duration: vidDuration,
                  });

                  GM_setValue("yt_notes_db", dbNotes);
                  syncChannel.postMessage("db_updated");
                  renderPlayerMarkers();

                  showToast(`${isImportant ? "HD " : " "}${tag}\n\nNote Captured • @${formatTime(timeInSeconds)}\n[Click to Expand]`, themeData.saved, () => { showDashboard(timeInSeconds) });

                }
                unfreezeVideo();
                if (wasPlaying) video.play();
              },
            );
          }
          return;
        }

        if (event.shiftKey) {
          if (eKey === "l") {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (video) video.currentTime += SKIP_INTERVAL;
            showToast(`+ ${SKIP_INTERVAL}s`);
            return;
          } else if (eKey === "j") {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (video) video.currentTime -= SKIP_INTERVAL;
            showToast(`-${SKIP_INTERVAL}s`);
            return;
          }
        }
      }
    },
    true,
  );



  // --- AUTO PAUSE/PLAY ON BACKGROUND FEATURE ---
  let autoPauseEnabled =
    localStorage.getItem("yt_auto_pause_enabled") === "true";
  let wasPlayingBeforeBlur = false;

  window.addEventListener("blur", () => {
    // Stop if feature is off, or if we aren't watching a video
    if (!autoPauseEnabled || window.location.pathname !== "/watch") return;

    const video = document.querySelector("video");
    const dashboardOpen = document.body.classList.contains("yt-notes-active");

    // Only auto-pause if the video is actually playing, AND the dashboard isn't currently open
    if (video && !video.paused && !dashboardOpen && !document.pictureInPictureElement) {
      wasPlayingBeforeBlur = true;
      video.pause();
    } else {
      wasPlayingBeforeBlur = false;
    }
  });

  window.addEventListener("focus", () => {
    if (!autoPauseEnabled || window.location.pathname !== "/watch") return;

    const video = document.querySelector("video");
    const dashboardOpen = document.body.classList.contains("yt-notes-active");

    // Only auto-resume if WE were the ones who paused it, AND the dashboard isn't open
    if (video && wasPlayingBeforeBlur && !dashboardOpen && !document.pictureInPictureElement) {
      video.play();
      wasPlayingBeforeBlur = false; // Reset the state
    }
  });

  // The 'true' at the end is CRUCIAL. Media events (like 'playing') do not "bubble" up the DOM. 
  // Using 'true' (Event Capturing) allows us to intercept the event from the top down.
  document.addEventListener("playing", (e) => {
    if (!autoPauseEnabled || e.target.tagName.toLowerCase() !== "video") return
    if (!document.hasFocus()) {
      e.target.pause();
      wasPlayingBeforeBlur = true
    } else if (document.body.classList.contains("yt-notes-active")) {
      e.target.pause();
      window.ytNotesWasPlaying = true
    }

  }, true);

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      document.body?.classList.contains("yt-notes-active")
    ) {
      renderNotes();
    }
  });
})();
