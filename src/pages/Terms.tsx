import React from 'react';
import { LegalPageLayout } from '../components/LegalPageLayout';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <h2 className="text-base font-bold text-slate-100">{title}</h2>
    <div className="space-y-2 text-slate-400">{children}</div>
  </section>
);

const Terms: React.FC = () => (
  <LegalPageLayout
    title="Terms of Service"
    badge="Legal & ownership"
    path="/terms"
    description="The rules for using Shotage, creating exports, sharing designs, and purchasing credits."
    updated="September 8, 2026"
  >
    <Section title="1. Acceptance and eligibility">
      <p>
        By accessing or using Shotage, you agree to these Terms. If you do not agree, do not use the
        service. You must be legally able to enter into this agreement in your jurisdiction. If you
        use Shotage for an organization, you confirm that you are authorized to bind it.
      </p>
    </Section>

    <Section title="2. Accounts and authentication">
      <p>
        Shotage supports email magic links and Google or GitHub sign-in through Neon Auth. You are
        responsible for access to your email or provider account and for activity performed through
        your Shotage account. Do not share authentication links or attempt to access another user’s
        account.
      </p>
      <p>
        Google and GitHub may apply their own terms and policies to your use of their sign-in
        services. Shotage does not receive or store your Google, GitHub, or email password.
      </p>
    </Section>

    <Section title="3. Studio use and shared designs">
      <p>
        Most canvas editing and image or video rendering occurs in your browser. If you choose
        <strong className="font-semibold text-slate-200"> Share Design</strong>, Shotage sends the
        design name, publisher name, project settings, a preview thumbnail, and any media embedded
        in the project, your account identifier, and your selected visibility to Morphic CMS so the
        share can work. Private designs are limited to the account that created them. Public designs
        can be opened by their link and are submitted for review before they may appear in Explore.
      </p>
      <p>
        You must have the rights needed to upload, edit, export, and share your content. Do not
        share confidential information or content that infringes another person’s rights.
      </p>
    </Section>

    <Section title="4. Credits and payments">
      <p>
        Some exports require Shotage credits. Credit packs are one-time purchases, not
        subscriptions. The price, included credits, and estimated export capacity are displayed
        before checkout. Credits are personal to your account, non-transferable, and have no cash
        value. They do not expire under normal operation.
      </p>
      <p>
        Polar acts as merchant of record and authorized reseller for purchases made through Polar
        Checkout. Polar processes payment details, tax, receipts, refunds, and chargebacks. Shotage
        does not receive your full card number. Taxes and the final charged amount are shown during
        checkout.
      </p>
      <p>
        Export costs are shown before export. Shotage may reserve credits while an export is being
        generated, settle them after success, and release them after a detected failure or
        cancellation. A matching retry may be free when the interface says so. See the{' '}
        <a href="/refund-policy" className="font-semibold text-pastel-pink hover:underline">
          Refund Policy
        </a>{' '}
        for purchase refund rules.
      </p>
    </Section>

    <Section title="5. Your content and exported work">
      <p>
        As between you and Shotage, you retain your rights in content you provide and exports you
        create. You grant Shotage and its service providers only the limited permission required to
        operate features you request, such as storing and serving a shared design.
      </p>
      <p>
        Shotage does not grant rights to third-party trademarks, images, fonts, icons, templates, or
        other material included in your work. You remain responsible for confirming that your use of
        those materials is permitted.
      </p>
    </Section>

    <Section title="6. Acceptable use">
      <p>
        You may not use Shotage to break the law, violate intellectual-property or privacy rights,
        distribute malware, impersonate others, exploit or disrupt the service, bypass credit or
        security controls, automate abusive traffic, or publish unlawful, deceptive, or harmful
        content.
      </p>
    </Section>

    <Section title="7. Availability and changes">
      <p>
        Shotage is provided on an “as is” and “as available” basis. Browser capabilities, local
        device resources, third-party services, or maintenance may affect features and export
        results. We may improve, replace, suspend, or discontinue features and will try to give
        reasonable notice when a material change affects paid credits.
      </p>
    </Section>

    <Section title="8. Suspension and termination">
      <p>
        We may restrict or suspend access when reasonably necessary to address fraud, abuse,
        security risk, legal obligations, or a material breach of these Terms. You may stop using
        Shotage at any time. To request account deletion, contact us at the address below.
      </p>
    </Section>

    <Section title="9. Disclaimers and limitation of liability">
      <p>
        To the maximum extent permitted by law, Shotage disclaims implied warranties and is not
        liable for indirect, incidental, special, consequential, or punitive damages, loss of data,
        profits, or business opportunity. Nothing in these Terms excludes rights or liability that
        cannot lawfully be excluded.
      </p>
    </Section>

    <Section title="10. Updates and contact">
      <p>
        We may update these Terms as the service changes. The date above identifies the latest
        version. Material changes will be communicated through the service or another reasonable
        channel. Questions can be sent to{' '}
        <a
          href="mailto:support@shotage.studio"
          className="font-semibold text-pastel-pink hover:underline"
        >
          support@shotage.studio
        </a>
        . Please also review our{' '}
        <a href="/privacy" className="font-semibold text-pastel-pink hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </Section>
  </LegalPageLayout>
);

export default Terms;
