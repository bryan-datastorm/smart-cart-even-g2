# Smart Cart for Even Realities G2

A glanceable, hands-free grocery list that syncs instantly from your phone to your Even Realities G2 glasses. 

Designed for the Even Hub ecosystem, this app acts as a companion interface on your iOS/Android device while rendering a distraction-free, native list UI directly on your G2 glasses.

## Features
* **Glanceable UI:** Clean, 4-bit greyscale list rendered on the G2 micro-LED displays.
* **Native Hardware Scrolling:** Utilizes the G2's native `ListContainerProperty` for flawless scroll highlighting via the temple touch controls or R1 ring.
* **Fluid Phone Companion App:** Built with Framer Motion and `@jappyjan/even-realities-ui` for a native iOS feel, including swipe-to-delete and drag-to-reorder.
* **Real-time Status:** Monitors your G2 glasses' connection status and battery life in real-time right from your phone.
* **Offline-First Storage:** Automatically saves your cart to the Even App's local storage so you never lose your list.

## Tech Stack
* **Frontend:** React 19, TypeScript, Vite
* **Glasses Integration:** `@evenrealities/even_hub_sdk`
* **UI Components:** `@jappyjan/even-realities-ui`
* **Animations:** Framer Motion

## Development Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/yourusername/smart-cart.git
   cd smart-cart
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   *(Note: This runs Vite exposing your local network IP)*

4. **Launch on Glasses:**
   Open a second terminal and use the Even Hub CLI to generate a QR code:
   \`\`\`bash
   npm run qr
   \`\`\`
   Scan the generated QR code with the Even App on your phone to instantly load the app on your G2 glasses.

## Packaging for Production
To bundle the app into a `.ehpk` file for the Even Hub developer portal, run:
\`\`\`bash
npm run pack
\`\`\`
This will output `smartcart.ehpk` in the root directory.