import type { CapacitorConfig } from "@capacitor/cli";

// The app loads the hosted Next.js site (it needs the server for search and audit).
// Dev: CAP_SERVER_URL=http://<your-computer-LAN-IP>:3100 on the same Wi-Fi as the phone.
// Release: set it to the deployed https URL.
const url = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.hassan.commandcenter",
  appName: "Command Center",
  webDir: "cap-web",
  server: url ? { url, cleartext: url.startsWith("http://") } : undefined,
  android: { backgroundColor: "#1b1e27" },
};

export default config;
