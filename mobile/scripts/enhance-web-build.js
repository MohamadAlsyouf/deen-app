#!/usr/bin/env node
/**
 * Post-build script to enhance the web build with SEO and custom styling
 * Run after: expo export --platform web
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

// Check if dist exists
if (!fs.existsSync(distPath)) {
  console.log('No dist folder found. Run expo export --platform web first.');
  process.exit(1);
}

// Read the generated index.html to get the script src
let originalHtml = fs.readFileSync(indexPath, 'utf8');

// Extract the script src from the original file
const scriptMatch = originalHtml.match(/<script src="([^"]+)" defer><\/script>/);
const scriptSrc = scriptMatch ? scriptMatch[1] : '/_expo/static/js/web/index.js';

// Create enhanced HTML
const enhancedHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />

    <!-- Primary Meta Tags -->
    <title>Deen Learning - Your Journey to Islamic Knowledge</title>
    <meta name="title" content="Deen Learning - Your Journey to Islamic Knowledge" />
    <meta name="description" content="A comprehensive platform to learn and deepen your understanding of Deen. Explore the Quran, learn the 99 Names of Allah, and understand the pillars of Islam and Iman." />
    <meta name="keywords" content="Islam, Quran, Islamic learning, Pillars of Islam, Pillars of Iman, Asma ul Husna, 99 Names of Allah, Muslim education, Deen" />
    <meta name="author" content="Deen Learning" />

    <!-- Theme Color -->
    <meta name="theme-color" content="#1B4332" />
    <meta name="msapplication-navbutton-color" content="#1B4332" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-capable" content="yes" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://deenlearning.com/" />
    <meta property="og:title" content="Deen Learning - Your Journey to Islamic Knowledge" />
    <meta property="og:description" content="A comprehensive platform to learn and deepen your understanding of Deen. Explore the Quran, learn the 99 Names of Allah, and understand the pillars of Islam and Iman." />
    <meta property="og:image" content="/assets/og-image.png" />
    <meta property="og:site_name" content="Deen Learning" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://deenlearning.com/" />
    <meta property="twitter:title" content="Deen Learning - Your Journey to Islamic Knowledge" />
    <meta property="twitter:description" content="A comprehensive platform to learn and deepen your understanding of Deen. Explore the Quran, learn the 99 Names of Allah, and understand the pillars of Islam and Iman." />
    <meta property="twitter:image" content="/assets/og-image.png" />

    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/icon.png" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

    <!-- Expo Reset + Custom Styles -->
    <style id="expo-reset">
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      body {
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #FFFFFF;
      }
      #root {
        display: flex;
        height: 100%;
        flex: 1;
      }
      .arabic-text {
        font-family: 'Amiri', serif;
        direction: rtl;
      }
      /* Loading Screen */
      #loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.4s ease-out;
      }
      #loading-screen.fade-out {
        opacity: 0;
        pointer-events: none;
      }
      .loader-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 1.5rem;
        animation: pulse 2s ease-in-out infinite;
      }
      .loader-arabic {
        font-family: 'Amiri', serif;
        color: #D4A373;
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
        direction: rtl;
      }
      .loader-title {
        color: #FFFFFF;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
      }
      .loader-subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1rem;
        margin-bottom: 2rem;
      }
      .loader-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: #D4A373;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      ::selection {
        background-color: #2D6A4F;
        color: #FFFFFF;
      }
      :focus-visible {
        outline: 2px solid #D4A373;
        outline-offset: 2px;
      }
    </style>
  </head>

  <body>
    <!-- Loading Screen -->
    <div id="loading-screen">
      <svg class="loader-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="#D4A373" stroke-width="2" opacity="0.3"/>
        <path d="M50 10 L50 25 M50 75 L50 90 M10 50 L25 50 M75 50 L90 50" stroke="#D4A373" stroke-width="2" stroke-linecap="round"/>
        <circle cx="50" cy="50" r="20" fill="#D4A373" opacity="0.2"/>
        <path d="M50 35 C45 40 42 48 50 55 C58 48 55 40 50 35Z" fill="#D4A373"/>
        <circle cx="50" cy="50" r="8" fill="#1B4332"/>
      </svg>
      <p class="loader-arabic">بِسْمِ اللَّهِ</p>
      <h1 class="loader-title">Deen Learning</h1>
      <p class="loader-subtitle">Your Journey to Islamic Knowledge</p>
      <div class="loader-spinner"></div>
    </div>

    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>

    <script src="${scriptSrc}" defer></script>
    <script>
      window.addEventListener('load', function() {
        var loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          setTimeout(function() {
            loadingScreen.classList.add('fade-out');
            setTimeout(function() {
              loadingScreen.style.display = 'none';
            }, 400);
          }, 800);
        }
      });
    </script>
  </body>
</html>`;

// Write enhanced HTML
fs.writeFileSync(indexPath, enhancedHtml);
console.log('Enhanced index.html with SEO, fonts, and loading screen.');
