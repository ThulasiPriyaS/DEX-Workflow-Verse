import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { Buffer } from 'buffer';
import { loadTokenList } from "@/lib/solana/tokenList";

// Polyfill Buffer for Solana web3.js compatibility
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Load Jupiter devnet token list before mounting the app
(async () => {
  try {
    await loadTokenList('devnet');
    console.log('Loaded Jupiter devnet token list');
  } catch (err) {
    console.warn('Failed to load Jupiter devnet token list at startup:', err);
  }

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="dark">
      <App />
    </ThemeProvider>
  );
})();
