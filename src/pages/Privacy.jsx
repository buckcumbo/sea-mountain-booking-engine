import React from "react";
import Seo from "@/components/Seo";

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Seo title="Privacy | Sea Mountain Vacations" path="/privacy" />
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-coast-navy mb-3">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 15, 2026</p>
      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <Section title="Who We Are">
          <p>Our website address is: https://seamountainvacations.com/</p>
        </Section>

        <Section title="Information We Collect">
          <p>
            We collect several types of information in connection with your use of our website and
            services, including:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong className="text-coast-navy">Contact Information</strong> such as your name,
              email address, phone number, and mailing address when you make a booking or inquiry.
            </li>
            <li>
              <strong className="text-coast-navy">Booking &amp; Travel Details</strong> including
              travel dates, number of guests, property preferences, and special requests.
            </li>
            <li>
              <strong className="text-coast-navy">Payment Information</strong> such as credit card
              details or billing information necessary to process your reservation. Payment
              transactions are handled by secure third-party processors and we do not store full
              payment card details on our servers.
            </li>
            <li>
              <strong className="text-coast-navy">Account Information</strong> if you register on
              our site, including your username and profile details.
            </li>
            <li>
              <strong className="text-coast-navy">Technical Data</strong> such as IP address,
              browser type, device information, and cookies collected automatically when you visit
              our site.
            </li>
          </ul>
        </Section>

        <Section title="Cookies and Cookie Consent">
          <p>
            Our website uses cookies — small text files stored on your device — to improve your
            browsing experience, remember your preferences, and analyze site traffic. By continuing
            to use our website, you consent to the use of cookies in accordance with this policy. If
            you create an account and log in, we set cookies to save your login information and
            preferences. Login cookies last for two days; preference cookies last for a year. If you
            log out, login cookies are removed.
          </p>
        </Section>

        <Section title="Embedded Content from Other Websites">
          <p>
            Pages on this site may include embedded content (e.g. videos, images, maps). Embedded
            content from other websites behaves in the exact same way as if the visitor has visited
            the other website. These websites may collect data about you, use cookies, embed
            additional third-party tracking, and monitor your interaction with that embedded content,
            including tracking your interaction if you have an account and are logged in to that
            website.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            We may use third-party services to operate and improve our website and booking
            experience. These may include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong className="text-coast-navy">Analytics providers</strong> (such as Google
              Analytics) to understand how visitors use our site.
            </li>
            <li>
              <strong className="text-coast-navy">Payment processors</strong> to securely handle
              reservation payments.
            </li>
            <li>
              <strong className="text-coast-navy">Booking and property management platforms</strong>{" "}
              to manage reservations and guest communications.
            </li>
            <li>
              <strong className="text-coast-navy">Email and marketing platforms</strong> to send
              booking confirmations and promotional communications.
            </li>
          </ul>
          <p>
            Each of these third parties operates under their own privacy policies and data
            practices. We encourage you to review their policies if you have concerns about how they
            handle your data.
          </p>
        </Section>

        <Section title="SMS and Text Messaging">
          <p>
            Sea Mountain Vacations may offer an SMS/text messaging program that allows us to send
            you updates, promotions, booking confirmations, and other relevant communications. By
            opting into our text messaging program, you consent to receive recurring automated text
            messages at the phone number provided. Message and data rates may apply. You may opt out
            of receiving text messages at any time by replying STOP to any message we send. For
            help, reply HELP or contact us at the information provided below.
          </p>
          <p>
            <strong className="text-coast-navy">SMS Opt-In Data:</strong> We do not sell, rent,
            share, or disclose your SMS opt-in information or phone number to any third parties for
            marketing purposes. Your consent to receive text messages is never sold or transferred.
          </p>
        </Section>

        <Section title="Who We Share Your Data With">
          <p>
            If you request a password reset, your IP address will be included in the reset email. We
            do not sell your personal information to third parties. We may share your data with
            trusted service providers who assist us in operating our website and fulfilling bookings,
            strictly as necessary to provide those services.
          </p>
        </Section>

        <Section title="Data Security">
          <p>
            We take reasonable technical and organizational measures to protect your personal
            information from unauthorized access, use, or disclosure. While no method of
            transmission over the internet is 100% secure, we are committed to safeguarding the data
            you share with us.
          </p>
        </Section>

        <Section title="How Long We Retain Your Data">
          <p>
            For users that register on our website, we store the personal information they provide
            in their user profile. All users can see, edit, or delete their personal information at
            any time (except they cannot change their username). Website administrators can also see
            and edit that information.
          </p>
        </Section>

        <Section title="What Rights You Have Over Your Data">
          <p>
            If you have an account on this site, you can request to receive an exported file of the
            personal data we hold about you, including any data you have provided to us. You can also
            request that we erase any personal data we hold about you. This does not include any data
            we are obliged to keep for administrative, legal, or security purposes.
          </p>
        </Section>

        <Section title="California Residents – CCPA Rights">
          <p>
            If you are a California resident, you may have additional rights under the California
            Consumer Privacy Act (CCPA), including the right to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Know what personal information we collect and how it is used and shared.</li>
            <li>Request deletion of your personal information, subject to certain exceptions.</li>
            <li>
              Opt out of the sale of your personal information. We do not sell your personal
              information.
            </li>
            <li>Not be discriminated against for exercising your privacy rights.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the information in the Privacy
            Contact section below.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            Our website is not directed at children under the age of 13, and we do not knowingly
            collect personal information from children under 13. If you believe we have inadvertently
            collected such information, please contact us immediately so we can take steps to delete
            it.
          </p>
        </Section>

        <Section title="Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices
            or legal requirements. When we do, we will revise the "Last Updated" date at the top of
            this page. Your continued use of our website after any changes constitutes your
            acceptance of the updated policy. We encourage you to review this page periodically.
          </p>
        </Section>

        <Section title="Privacy Contact">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or how
            your personal information is handled, please contact us at:{" "}
            <a
              href="mailto:privacy@seamountainvacations.com"
              className="text-coast-ocean hover:underline"
            >
              privacy@seamountainvacations.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}