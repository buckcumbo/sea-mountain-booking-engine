import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { PHONE } from "@/lib/contact";

export default function InquiryForm({ type, showPropertyAddress = false, submitLabel = "Submit" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", propertyAddress: "", message: "", website: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.message.trim()) errs.message = "Required";
    if (showPropertyAddress && !form.propertyAddress.trim()) errs.propertyAddress = "Required";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // Submissions go through the submitInquiry backend function (direct
      // Inquiry.create is closed via RLS) so spam is honeypot- and rate-limited.
      const res = await base44.functions.invoke("submitInquiry", {
        type,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        propertyAddress: showPropertyAddress ? form.propertyAddress.trim() : undefined,
        message: form.message.trim(),
        website: form.website, // honeypot — hidden field, humans leave it empty
      });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      track("inquiry_submit");
      setDone(true);
    } catch {
      setSubmitError(`Something went wrong. Please try again or call us at ${PHONE}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-coast-sand flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-coast-ocean" />
        </div>
        <h3 className="font-heading text-xl font-semibold text-coast-navy mb-1">Thank you!</h3>
        <p className="text-muted-foreground text-sm">
          We've received your message and will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative bg-card border border-border rounded-2xl p-6 space-y-4">
      {/* Honeypot — visually hidden; bots that fill it are dropped server-side */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="inquiry-website">Website</label>
        <input
          id="inquiry-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={set("website")}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" error={errors.name} required>
          <Input value={form.name} onChange={set("name")} className="h-10" />
        </Field>
        <Field label="Email" error={errors.email} required>
          <Input type="email" value={form.email} onChange={set("email")} className="h-10" />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone">
          <Input value={form.phone} onChange={set("phone")} className="h-10" />
        </Field>
        {showPropertyAddress && (
          <Field label="Property Address" error={errors.propertyAddress} required>
            <Input value={form.propertyAddress} onChange={set("propertyAddress")} className="h-10" />
          </Field>
        )}
      </div>
      <Field label="Message" error={errors.message} required>
        <Textarea rows={5} value={form.message} onChange={set("message")} />
      </Field>
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      <Button
        type="submit"
        disabled={submitting}
        className="bg-coast-navy hover:bg-coast-navy-soft text-white w-full sm:w-auto"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}