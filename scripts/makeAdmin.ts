import { adminAuth } from "@/src/lib/firebase/admin";

async function run() {
  const email = "penarandaleynard@gmail.com";
  const user = await adminAuth.getUserByEmail(email);
  await adminAuth.setCustomUserClaims(user.uid, { admin: true });
  console.log("✅ Admin claim set for:", user.uid);
}

run().catch(console.error);

//run this:  node scripts/makeAdmin.mjs
