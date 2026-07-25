import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest, clientIp } from '../../shared/rateLimit.ts';

// Public inquiry submission endpoint. Inquiry.create RLS is closed to direct
// client writes; all submissions flow through here so we can apply a honeypot
// check and per-IP rate limiting. (Previously bots could create Inquiry rows
// directly, and each row emails every admin via the Inquiry Alerts workflow.)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { type, name, email, phone, propertyAddress, message, website } = payload;

    // Honeypot: the hidden "website" field is invisible to humans. A filled
    // value means a bot — pretend success and drop it silently.
    if (website && String(website).trim() !== "") {
      return Response.json({ ok: true });
    }

    if (!type || !name || !email || !message) {
      return Response.json({ error: "type, name, email and message are required" }, { status: 400 });
    }
    if (!["contact", "property-management"].includes(String(type))) {
      return Response.json({ error: "Invalid inquiry type" }, { status: 400 });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const ip = clientIp(req);
    if (!(await allowRequest(base44, "submitInquiry", ip, 5, 60))) {
      return Response.json(
        { error: "Too many requests. Please try again later, or give us a call." },
        { status: 429 },
      );
    }

    const inquiry = await base44.asServiceRole.entities.Inquiry.create({
      type: String(type),
      name: String(name).trim().slice(0, 200),
      email: cleanEmail,
      phone: phone ? String(phone).trim().slice(0, 50) : "",
      propertyAddress: propertyAddress ? String(propertyAddress).trim().slice(0, 300) : undefined,
      message: String(message).trim().slice(0, 5000),
    });

    return Response.json({ ok: true, id: inquiry.id });
  } catch (error) {
    console.error("[submitInquiry]", error.message);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
});