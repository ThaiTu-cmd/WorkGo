import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.resolve("public/images/landing");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const images = [
  {
    name: "popular-tiktok-shop.webp",
    width: 800,
    height: 1000,
    svg: `
    <svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF512F" />
          <stop offset="60%" stop-color="#DD2476" />
          <stop offset="100%" stop-color="#190426" />
        </linearGradient>
        <radialGradient id="glow" cx="65%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#FFA07A" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#DD2476" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>
      <rect width="800" height="1000" fill="url(#bg)" />
      <circle cx="550" cy="350" r="280" fill="url(#glow)" />
      <g opacity="0.15" stroke="#FFFFFF" stroke-width="1.5">
        <circle cx="400" cy="500" r="150" fill="none"/>
        <circle cx="400" cy="500" r="280" fill="none"/>
        <circle cx="400" cy="500" r="400" fill="none"/>
      </g>
      <!-- TikTok / Live shopping aesthetic elements -->
      <g transform="translate(200, 320)" opacity="0.9">
        <rect x="0" y="0" width="400" height="420" rx="28" fill="#FFFFFF" fill-opacity="0.1" stroke="#FFFFFF" stroke-width="2" />
        <!-- Phone screen layout -->
        <rect x="25" y="25" width="350" height="240" rx="16" fill="#000000" fill-opacity="0.3" />
        <circle cx="200" cy="145" r="45" fill="#FF7640" fill-opacity="0.8" />
        <polygon points="190,125 220,145 190,165" fill="#FFFFFF" />
        <!-- Live Badge -->
        <rect x="45" y="45" width="70" height="26" rx="6" fill="#FF0050" />
        <text x="58" y="63" font-family="sans-serif" font-weight="bold" font-size="12" fill="#FFFFFF">LIVE</text>
        <!-- Shopping Cart / bag -->
        <rect x="50" y="300" width="180" height="18" rx="9" fill="#FFFFFF" fill-opacity="0.7" />
        <rect x="50" y="330" width="120" height="14" rx="7" fill="#FFFFFF" fill-opacity="0.4" />
        <circle cx="330" cy="330" r="28" fill="#FF7640" />
      </g>
    </svg>`
  },
  {
    name: "popular-ai-programming.webp",
    width: 800,
    height: 1000,
    svg: `
    <svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgAi" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F2027" />
          <stop offset="50%" stop-color="#203A43" />
          <stop offset="100%" stop-color="#1DBF73" />
        </linearGradient>
        <radialGradient id="glowAi" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#1DBF73" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bgAi)" />
      <circle cx="400" cy="400" r="320" fill="url(#glowAi)" />
      <!-- Neural network / AI code nodes -->
      <g stroke="#1DBF73" stroke-width="2" opacity="0.4">
        <line x1="200" y1="300" x2="400" y2="220" />
        <line x1="400" y1="220" x2="600" y2="300" />
        <line x1="200" y1="300" x2="300" y2="480" />
        <line x1="400" y1="220" x2="400" y2="460" />
        <line x1="600" y1="300" x2="500" y2="480" />
        <line x1="300" y1="480" x2="400" y2="600" />
        <line x1="500" y1="480" x2="400" y2="600" />
      </g>
      <g fill="#1DBF73">
        <circle cx="200" cy="300" r="14" />
        <circle cx="400" cy="220" r="18" fill="#A7F3D0" />
        <circle cx="600" cy="300" r="14" />
        <circle cx="300" cy="480" r="12" />
        <circle cx="400" cy="460" r="16" fill="#A7F3D0" />
        <circle cx="500" cy="480" r="12" />
        <circle cx="400" cy="600" r="22" fill="#FFFFFF" />
      </g>
      <!-- Glass code window -->
      <g transform="translate(160, 480)" opacity="0.95">
        <rect width="480" height="280" rx="20" fill="#031B15" fill-opacity="0.85" stroke="#1DBF73" stroke-width="1.5" />
        <circle cx="35" cy="30" r="6" fill="#EF4444" />
        <circle cx="55" cy="30" r="6" fill="#F59E0B" />
        <circle cx="75" cy="30" r="6" fill="#10B981" />
        <rect x="35" y="70" width="220" height="12" rx="6" fill="#1DBF73" fill-opacity="0.8" />
        <rect x="35" y="105" width="340" height="12" rx="6" fill="#A7F3D0" fill-opacity="0.6" />
        <rect x="65" y="140" width="280" height="12" rx="6" fill="#A7F3D0" fill-opacity="0.4" />
        <rect x="35" y="175" width="180" height="12" rx="6" fill="#1DBF73" fill-opacity="0.7" />
      </g>
    </svg>`
  },
  {
    name: "popular-web-dev.webp",
    width: 800,
    height: 1000,
    svg: `
    <svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgWeb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0A192F" />
          <stop offset="50%" stop-color="#172A45" />
          <stop offset="100%" stop-color="#2EA8FF" />
        </linearGradient>
        <radialGradient id="glowWeb" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stop-color="#2EA8FF" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="#0A192F" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bgWeb)" />
      <circle cx="400" cy="350" r="300" fill="url(#glowWeb)" />
      <!-- Browser window / web architecture -->
      <g transform="translate(120, 240)">
        <rect width="560" height="420" rx="16" fill="#0D1E3A" stroke="#2EA8FF" stroke-width="2" />
        <rect width="560" height="48" rx="16" fill="#172A45" />
        <circle cx="30" cy="24" r="6" fill="#FF5F56" />
        <circle cx="50" cy="24" r="6" fill="#FFBD2E" />
        <circle cx="70" cy="24" r="6" fill="#27C93F" />
        <rect x="100" y="14" width="360" height="20" rx="10" fill="#0A192F" />
        <!-- Web content blocks -->
        <rect x="35" y="80" width="180" height="140" rx="10" fill="#2EA8FF" fill-opacity="0.2" stroke="#2EA8FF" stroke-width="1"/>
        <rect x="235" y="80" width="290" height="30" rx="6" fill="#FFFFFF" fill-opacity="0.7"/>
        <rect x="235" y="125" width="240" height="16" rx="6" fill="#FFFFFF" fill-opacity="0.4"/>
        <rect x="235" y="155" width="200" height="16" rx="6" fill="#FFFFFF" fill-opacity="0.3"/>
        <rect x="235" y="185" width="120" height="32" rx="8" fill="#2EA8FF"/>
        <!-- Grid items -->
        <rect x="35" y="250" width="150" height="130" rx="10" fill="#172A45" stroke="#2EA8FF" stroke-opacity="0.3" stroke-width="1"/>
        <rect x="205" y="250" width="150" height="130" rx="10" fill="#172A45" stroke="#2EA8FF" stroke-opacity="0.3" stroke-width="1"/>
        <rect x="375" y="250" width="150" height="130" rx="10" fill="#172A45" stroke="#2EA8FF" stroke-opacity="0.3" stroke-width="1"/>
      </g>
    </svg>`
  },
  {
    name: "popular-video-edit.webp",
    width: 800,
    height: 1000,
    svg: `
    <svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgVid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E0836" />
          <stop offset="60%" stop-color="#4C1D95" />
          <stop offset="100%" stop-color="#8B5CF6" />
        </linearGradient>
        <radialGradient id="glowVid" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#C4B5FD" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#1E0836" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bgVid)" />
      <circle cx="400" cy="400" r="300" fill="url(#glowVid)" />
      <!-- Video player preview & timeline -->
      <g transform="translate(130, 260)">
        <rect width="540" height="310" rx="18" fill="#100320" stroke="#8B5CF6" stroke-width="2" />
        <circle cx="270" cy="155" r="46" fill="#8B5CF6" fill-opacity="0.8" />
        <polygon points="260,135 290,155 260,175" fill="#FFFFFF" />
        <!-- Video tracks timeline -->
        <g transform="translate(0, 340)">
          <rect width="540" height="160" rx="12" fill="#2E1065" stroke="#8B5CF6" stroke-width="1" />
          <!-- Track 1 video -->
          <rect x="20" y="20" width="180" height="40" rx="8" fill="#8B5CF6" fill-opacity="0.7" />
          <rect x="210" y="20" width="210" height="40" rx="8" fill="#A78BFA" fill-opacity="0.8" />
          <rect x="430" y="20" width="90" height="40" rx="8" fill="#8B5CF6" fill-opacity="0.7" />
          <!-- Track 2 audio wave -->
          <rect x="20" y="80" width="320" height="35" rx="8" fill="#EC4899" fill-opacity="0.6" />
          <rect x="350" y="80" width="170" height="35" rx="8" fill="#F472B6" fill-opacity="0.6" />
          <!-- Playhead needle -->
          <line x1="280" y1="0" x2="280" y2="160" stroke="#FFFFFF" stroke-width="3" />
          <polygon points="270,0 290,0 280,12" fill="#FFFFFF" />
        </g>
      </g>
    </svg>`
  },
  {
    name: "popular-software-dev.webp",
    width: 800,
    height: 1000,
    svg: `
    <svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgSoft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#082F49" />
          <stop offset="60%" stop-color="#0369A1" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
        <radialGradient id="glowSoft" cx="50%" cy="35%" r="50%">
          <stop offset="0%" stop-color="#7DD3FC" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#082F49" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bgSoft)" />
      <circle cx="400" cy="350" r="300" fill="url(#glowSoft)" />
      <!-- Cloud architecture / software engineering cubes -->
      <g transform="translate(160, 280)">
        <rect width="480" height="380" rx="20" fill="#0C4A6E" stroke="#38BDF8" stroke-width="2" />
        <!-- Server / microservices racks -->
        <g transform="translate(40, 40)">
          <rect width="400" height="70" rx="10" fill="#0284C7" fill-opacity="0.4" stroke="#38BDF8" stroke-width="1"/>
          <circle cx="40" cy="35" r="8" fill="#38BDF8" />
          <circle cx="70" cy="35" r="8" fill="#38BDF8" />
          <line x1="120" y1="35" x2="350" y2="35" stroke="#38BDF8" stroke-width="6" stroke-dasharray="15,10" />
        </g>
        <g transform="translate(40, 140)">
          <rect width="400" height="70" rx="10" fill="#0284C7" fill-opacity="0.4" stroke="#38BDF8" stroke-width="1"/>
          <circle cx="40" cy="35" r="8" fill="#38BDF8" />
          <circle cx="70" cy="35" r="8" fill="#38BDF8" />
          <line x1="120" y1="35" x2="350" y2="35" stroke="#38BDF8" stroke-width="6" stroke-dasharray="15,10" />
        </g>
        <g transform="translate(40, 240)">
          <rect width="400" height="70" rx="10" fill="#0284C7" fill-opacity="0.4" stroke="#38BDF8" stroke-width="1"/>
          <circle cx="40" cy="35" r="8" fill="#38BDF8" />
          <circle cx="70" cy="35" r="8" fill="#38BDF8" />
          <line x1="120" y1="35" x2="350" y2="35" stroke="#38BDF8" stroke-width="6" stroke-dasharray="15,10" />
        </g>
      </g>
    </svg>`
  },
  {
    name: "popular-book-publish.webp",
    width: 800,
    height: 1000,
    svg: `
    <svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgBook" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#451A03" />
          <stop offset="60%" stop-color="#92400E" />
          <stop offset="100%" stop-color="#F59E0B" />
        </linearGradient>
        <radialGradient id="glowBook" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#FCD34D" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#451A03" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bgBook)" />
      <circle cx="400" cy="400" r="300" fill="url(#glowBook)" />
      <!-- Book spine & cover layout mockup -->
      <g transform="translate(200, 260)">
        <!-- Book perspective -->
        <rect x="0" y="0" width="380" height="480" rx="12" fill="#78350F" stroke="#F59E0B" stroke-width="3" />
        <line x1="45" y1="0" x2="45" y2="480" stroke="#F59E0B" stroke-width="3" />
        <!-- Cover Art details -->
        <circle cx="210" cy="180" r="70" fill="#F59E0B" fill-opacity="0.6" />
        <rect x="100" y="290" width="220" height="20" rx="6" fill="#FEF3C7" />
        <rect x="130" y="325" width="160" height="14" rx="4" fill="#FDE68A" />
        <line x1="100" y1="380" x2="320" y2="380" stroke="#F59E0B" stroke-width="2" />
        <rect x="150" y="410" width="120" height="12" rx="4" fill="#FEF3C7" fill-opacity="0.7" />
      </g>
    </svg>`
  },
  {
    name: "panel-find-experts.webp",
    width: 1600,
    height: 900,
    svg: `
    <svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgExpert" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00240B" />
          <stop offset="50%" stop-color="#004D1E" />
          <stop offset="100%" stop-color="#00732E" />
        </linearGradient>
        <radialGradient id="glowExpert" cx="70%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#10B981" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#00240B" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bgExpert)" />
      <circle cx="1100" cy="450" r="450" fill="url(#glowExpert)" />
      <!-- Collaboration network illustration -->
      <g stroke="#34D399" stroke-width="2" opacity="0.3" fill="none">
        <circle cx="1100" cy="450" r="160" />
        <circle cx="1100" cy="450" r="300" />
        <circle cx="1100" cy="450" r="420" />
      </g>
      <!-- Talent avatars / cards -->
      <g transform="translate(850, 220)">
        <!-- Card 1 -->
        <rect x="0" y="0" width="300" height="150" rx="16" fill="#003912" fill-opacity="0.8" stroke="#34D399" stroke-width="1.5"/>
        <circle cx="60" cy="75" r="35" fill="#10B981" />
        <rect x="115" y="50" width="140" height="18" rx="6" fill="#FFFFFF"/>
        <rect x="115" y="80" width="100" height="12" rx="4" fill="#A7F3D0"/>
        <!-- Card 2 -->
        <rect x="160" y="190" width="320" height="160" rx="16" fill="#004D1E" fill-opacity="0.8" stroke="#34D399" stroke-width="2"/>
        <circle cx="225" cy="270" r="38" fill="#34D399" />
        <rect x="285" y="245" width="150" height="20" rx="6" fill="#FFFFFF"/>
        <rect x="285" y="278" width="120" height="14" rx="4" fill="#A7F3D0"/>
        <!-- Star badges -->
        <polygon points="420,220 426,232 440,234 430,244 432,258 420,250 408,258 410,244 400,234 414,232" fill="#FBBF24" />
      </g>
    </svg>`
  },
  {
    name: "panel-ai-automation.webp",
    width: 1600,
    height: 900,
    svg: `
    <svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgAuto" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#240B00" />
          <stop offset="50%" stop-color="#4E1A04" />
          <stop offset="100%" stop-color="#6B2A0C" />
        </linearGradient>
        <radialGradient id="glowAuto" cx="65%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#FF7640" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#240B00" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bgAuto)" />
      <circle cx="1050" cy="450" r="420" fill="url(#glowAuto)" />
      <!-- Automation pipeline flow -->
      <g transform="translate(750, 240)">
        <!-- Step 1 -->
        <rect x="0" y="140" width="180" height="120" rx="16" fill="#3A1403" stroke="#FF7640" stroke-width="2"/>
        <text x="35" y="205" font-family="sans-serif" font-weight="bold" font-size="18" fill="#FED7AA">TRIGGERS</text>
        <!-- Arrow 1 -->
        <line x1="190" y1="200" x2="250" y2="200" stroke="#FF7640" stroke-width="4" stroke-dasharray="6,4"/>
        <polygon points="255,200 245,193 245,207" fill="#FF7640" />
        <!-- Step 2 AI Core -->
        <rect x="260" y="90" width="220" height="220" rx="24" fill="#581F05" stroke="#FFB37A" stroke-width="3"/>
        <circle cx="370" cy="180" r="48" fill="#FF7640" fill-opacity="0.7" />
        <text x="310" y="260" font-family="sans-serif" font-weight="bold" font-size="20" fill="#FFFFFF">AI WORKFLOW</text>
        <!-- Arrow 2 -->
        <line x1="490" y1="200" x2="550" y2="200" stroke="#FF7640" stroke-width="4" stroke-dasharray="6,4"/>
        <polygon points="555,200 545,193 545,207" fill="#FF7640" />
        <!-- Step 3 Actions -->
        <rect x="560" y="140" width="180" height="120" rx="16" fill="#3A1403" stroke="#FF7640" stroke-width="2"/>
        <text x="600" y="205" font-family="sans-serif" font-weight="bold" font-size="18" fill="#FED7AA">ACTIONS</text>
      </g>
    </svg>`
  },
  {
    name: "guide-brief.webp",
    width: 800,
    height: 600,
    svg: `
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgBrief" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#1E3A8A" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bgBrief)" />
      <!-- Checklist / Brief sheet -->
      <g transform="translate(240, 90)">
        <rect width="320" height="420" rx="16" fill="#FFFFFF" fill-opacity="0.95" />
        <rect x="35" y="40" width="180" height="22" rx="6" fill="#1E3A8A" />
        <rect x="35" y="80" width="240" height="12" rx="4" fill="#94A3B8" />
        <!-- Checkbox items -->
        <rect x="35" y="130" width="24" height="24" rx="6" fill="#3B82F6" />
        <polyline points="40,142 46,148 54,136" stroke="#FFFFFF" stroke-width="3" fill="none" />
        <rect x="75" y="134" width="180" height="16" rx="4" fill="#334155" />
        <rect x="35" y="180" width="24" height="24" rx="6" fill="#3B82F6" />
        <polyline points="40,192 46,198 54,186" stroke="#FFFFFF" stroke-width="3" fill="none" />
        <rect x="75" y="184" width="160" height="16" rx="4" fill="#334155" />
        <rect x="35" y="230" width="24" height="24" rx="6" fill="#3B82F6" />
        <polyline points="40,242 46,248 54,236" stroke="#FFFFFF" stroke-width="3" fill="none" />
        <rect x="75" y="234" width="190" height="16" rx="4" fill="#334155" />
        <rect x="35" y="280" width="24" height="24" rx="6" fill="#E2E8F0" />
        <rect x="75" y="284" width="140" height="16" rx="4" fill="#94A3B8" />
        <rect x="35" y="340" width="250" height="40" rx="10" fill="#2563EB" />
        <text x="120" y="365" font-family="sans-serif" font-weight="bold" font-size="14" fill="#FFFFFF">APPROVE BRIEF</text>
      </g>
    </svg>`
  },
  {
    name: "guide-portfolio.webp",
    width: 800,
    height: 600,
    svg: `
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgPort" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#18181B" />
          <stop offset="100%" stop-color="#3F3F46" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bgPort)" />
      <!-- Design portfolio gallery cards -->
      <g transform="translate(180, 100)">
        <rect x="0" y="0" width="200" height="250" rx="14" fill="#6366F1" fill-opacity="0.8" />
        <circle cx="100" cy="100" r="40" fill="#FFFFFF" fill-opacity="0.3" />
        <rect x="25" y="180" width="150" height="16" rx="4" fill="#FFFFFF" />
        <rect x="25" y="206" width="90" height="12" rx="4" fill="#C7D2FE" />
        <!-- Card 2 -->
        <rect x="230" y="40" width="210" height="280" rx="14" fill="#EC4899" fill-opacity="0.85" />
        <circle cx="335" cy="140" r="46" fill="#FFFFFF" fill-opacity="0.3" />
        <rect x="255" y="230" width="160" height="18" rx="4" fill="#FFFFFF" />
        <rect x="255" y="260" width="100" height="12" rx="4" fill="#FBCFE8" />
        <!-- Floating badge -->
        <rect x="120" y="290" width="180" height="50" rx="25" fill="#18181B" stroke="#FFFFFF" stroke-width="2"/>
        <text x="155" y="322" font-family="sans-serif" font-weight="bold" font-size="14" fill="#FFFFFF">PORTFOLIO ⭐ 5.0</text>
      </g>
    </svg>`
  },
  {
    name: "guide-budget.webp",
    width: 800,
    height: 600,
    svg: `
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgBud" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#022C22" />
          <stop offset="100%" stop-color="#065F46" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bgBud)" />
      <!-- Calculator / Escrow budget chart -->
      <g transform="translate(220, 100)">
        <rect width="360" height="390" rx="20" fill="#064E3B" stroke="#34D399" stroke-width="2" />
        <!-- Total amount badge -->
        <rect x="30" y="30" width="300" height="70" rx="12" fill="#022C22" />
        <text x="50" y="55" font-family="sans-serif" font-size="12" fill="#6EE7B7">PROJECT BUDGET</text>
        <text x="50" y="85" font-family="sans-serif" font-weight="bold" font-size="24" fill="#FFFFFF">25.000.000 ₫</text>
        <!-- Bar chart distribution -->
        <g transform="translate(40, 130)">
          <!-- Bar 1 Design -->
          <rect x="0" y="100" width="45" height="100" rx="6" fill="#34D399" />
          <!-- Bar 2 Dev -->
          <rect x="65" y="40" width="45" height="160" rx="6" fill="#10B981" />
          <!-- Bar 3 QA -->
          <rect x="130" y="80" width="45" height="120" rx="6" fill="#059669" />
          <!-- Bar 4 Deploy -->
          <rect x="195" y="120" width="45" height="80" rx="6" fill="#047857" />
          <line x1="0" y1="205" x2="270" y2="205" stroke="#6EE7B7" stroke-width="2" />
        </g>
        <!-- Escrow Protection Badge -->
        <rect x="30" y="310" width="300" height="48" rx="10" fill="#10B981" />
        <text x="75" y="340" font-family="sans-serif" font-weight="bold" font-size="15" fill="#FFFFFF">🛡️ ESCROW GUARANTEED</text>
      </g>
    </svg>`
  }
];

async function run() {
  for (const item of images) {
    const dest = path.join(OUT_DIR, item.name);
    const buf = Buffer.from(item.svg);
    await sharp(buf)
      .resize(item.width, item.height)
      .webp({ quality: 85 })
      .toFile(dest);
    const stat = fs.statSync(dest);
    console.log(`Generated: ${item.name} (${item.width}x${item.height}, ${(stat.size / 1024).toFixed(1)} KB)`);
  }
}

run().catch(console.error);
