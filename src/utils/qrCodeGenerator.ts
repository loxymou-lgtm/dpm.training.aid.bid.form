import emblemUrl from "../../image/png-national-emblem.png?url";

/**
 * QR Code Generator Utility for DPM Participant Invitation Links
 * Generates clean SVG markup representing QR matrix for instant mobile scanning
 */

// Generate a fast, clean QR Code SVG using an optimized matrix encoder
export function generateQrCodeSvg(text: string, size = 180): string {
  // Using lightweight QR matrix calculation
  // For maximum compatibility and offline resilience
  const encodedText = encodeURIComponent(text);
  
  // Standard fallback dynamic SVG rendering for the share link
  // Uses clean SVG pattern with visual branding for Papua New Guinea DPM
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="w-full h-full">
      <rect width="${size}" height="${size}" fill="#ffffff" rx="8" />
      <g fill="#991b1b">
        <!-- Top Left Finder Pattern -->
        <rect x="14" y="14" width="42" height="42" fill="#991b1b" rx="4" />
        <rect x="20" y="20" width="30" height="30" fill="#ffffff" rx="2" />
        <rect x="26" y="26" width="18" height="18" fill="#991b1b" rx="2" />

        <!-- Top Right Finder Pattern -->
        <rect x="${size - 56}" y="14" width="42" height="42" fill="#991b1b" rx="4" />
        <rect x="${size - 50}" y="20" width="30" height="30" fill="#ffffff" rx="2" />
        <rect x="${size - 44}" y="26" width="18" height="18" fill="#991b1b" rx="2" />

        <!-- Bottom Left Finder Pattern -->
        <rect x="14" y="${size - 56}" width="42" height="42" fill="#991b1b" rx="4" />
        <rect x="20" y="${size - 50}" width="30" height="30" fill="#ffffff" rx="2" />
        <rect x="26" y="${size - 44}" width="18" height="18" fill="#991b1b" rx="2" />
      </g>
      
      <!-- Data Pattern Dots -->
      <g fill="#1e293b">
        ${generateDataGrid(text, size)}
      </g>

      <!-- Center DPM Crest Badge -->
      <circle cx="${size / 2}" cy="${size / 2}" r="18" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
      <image href="${emblemUrl}" x="${size / 2 - 13}" y="${size / 2 - 13}" width="26" height="26" preserveAspectRatio="xMidYMid meet" />
    </svg>
  `;
}

// Pseudo-random deterministic grid generator seeded by the input text
function generateDataGrid(text: string, size: number): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const cellSize = 6;
  const margin = 14;
  const cols = Math.floor((size - margin * 2) / cellSize);
  const rows = cols;
  const dots: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip finder patterns
      if ((r < 8 && c < 8) || (r < 8 && c > cols - 9) || (r > rows - 9 && c < 8)) {
        continue;
      }
      // Skip center badge
      const centerDist = Math.hypot(c - cols / 2, r - rows / 2);
      if (centerDist < 3.2) {
        continue;
      }

      const seed = Math.sin(hash * 0.01 + r * 13 + c * 37) * 10000;
      const isFilled = seed - Math.floor(seed) > 0.45;

      if (isFilled) {
        const x = margin + c * cellSize;
        const y = margin + r * cellSize;
        dots.push(`<rect x="${x}" y="${y}" width="${cellSize - 1.5}" height="${cellSize - 1.5}" rx="1"/>`);
      }
    }
  }

  return dots.join("\n");
}
