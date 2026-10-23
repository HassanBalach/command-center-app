import type { CapacitorConfig } from "@capacitor/cli";

// The app loads the hosted Next.js site (it needs the server for search and audit).
// Default: the deployed site. For local testing set CAP_SERVER_URL=http://<LAN-IP>:3100.
const url = process.env.CAP_SERVER_URL ?? "https://command-center-app-puce.vercel.app";

const config: CapacitorConfig = {
  appId: "com.hassan.commandcenter",
  appName: "Jeb Kharcha",
  webDir: "cap-web",
  server: url ? { url, cleartext: url.startsWith("http://") } : undefined,
  android: { backgroundColor: "#1b1e27" },
};

export default config;
