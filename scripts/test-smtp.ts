import "dotenv/config";
import { getSmtpConfig, isSmtpConfigured, sendTestEmail } from "../src/lib/mailer";

async function main() {
  const cfg = getSmtpConfig();
  console.log("configured:", isSmtpConfigured(cfg), cfg ? { host: cfg.host, port: cfg.port, user: cfg.user, from: cfg.from, secure: cfg.secure } : null);
  if (!cfg) {
    console.log("SMTP not configured — set SMTP_HOST/USER/PASS");
    process.exit(1);
  }
  const to = process.argv[2];
  if (!to) {
    console.log("usage: npx tsx scripts/test-smtp.ts you@example.com");
    process.exit(1);
  }
  const ok = await sendTestEmail({ to });
  console.log(ok ? "test email sent OK" : "send failed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
