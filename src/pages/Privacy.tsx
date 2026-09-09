import React from 'react';
import { LegalPageLayout } from '../components/LegalPageLayout';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <h2 className="text-base font-bold text-slate-100">{title}</h2>
    <div className="space-y-2 text-slate-400">{children}</div>
  </section>
);

const Privacy: React.FC = () => (
  <LegalPageLayout
    title="Privacy Policy"
    badge="Privacy & data"
    path="/privacy"
    description="How Shotage collects, uses, shares, and protects information when you use the service."
    updated="September 8, 2026"
  >
    <Section title="1. Scope and contact">
      <p>
        This policy applies to Shotage’s website, Studio, account, credit, purchase, export, and
        design-sharing features. Questions or privacy requests can be sent to{' '}
        <a
          href="mailto:support@shotage.studio"
          className="font-semibold text-pastel-pink hover:underline"
        >
          support@shotage.studio
        </a>
        .
      </p>
    </Section>

    <Section title="2. Information we collect">
      <p>
        <strong className="font-semibold text-slate-200">Account information:</strong> when you use
        an email magic link, Google, or GitHub, Neon Auth provides an account identifier and may
        provide your email address, display name, and profile image. Shotage does not receive or
        store your password for these services.
      </p>
      <p>
        <strong className="font-semibold text-slate-200">Credits and transactions:</strong> we store
        your credit balance, credit ledger, purchase identifiers and status, product, amount,
        currency, refunds, and export reservation details such as export type, format, scale,
        duration, stage count, and a project hash. The project hash recognizes protected retries; it
        is not the project content itself.
      </p>
      <p>
        <strong className="font-semibold text-slate-200">Device storage:</strong> Shotage may use
        local or session storage in your browser to restore Studio work and remember interface
        choices. This data normally remains on that device until you clear it or use a reset
        feature.
      </p>
      <p>
        <strong className="font-semibold text-slate-200">Technical information:</strong> our
        hosting, authentication, security, and payment providers may process request information
        such as IP address, browser or device details, timestamps, and security events to deliver
        and protect their services.
      </p>
    </Section>

    <Section title="3. Local creation and optional sharing">
      <p>
        Canvas editing and export rendering generally happen locally in your browser. Your source
        screenshots, images, and videos are not uploaded merely because you edit or export them.
      </p>
      <p>
        When you intentionally use{' '}
        <strong className="font-semibold text-slate-200">Share Design</strong>, Shotage uploads the
        design name, publisher name, serialized project settings, preview thumbnail, and media
        embedded in that shared project to Morphic CMS together with your Shotage user identifier
        and selected visibility. Private designs are restricted to their owner. Public designs can
        be accessed through their link and are reviewed before possible inclusion in Explore. Do not
        share sensitive or confidential content.
      </p>
    </Section>

    <Section title="4. How we use information">
      <p>
        We use information to authenticate users, maintain accounts and balances, fulfill exports,
        process purchases and refunds, provide purchase history and shared links, prevent fraud or
        abuse, troubleshoot the service, comply with law, and communicate about requested support or
        material service changes. We do not sell your personal information.
      </p>
      <p>
        Google user data is used only to sign you in, identify your Shotage account, and display
        basic account information such as your name or avatar. Shotage does not use Google user data
        for advertising or train AI models with it.
      </p>
    </Section>

    <Section title="5. Service providers and disclosure">
      <p>We disclose information only as needed to operate Shotage, including:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Neon Auth for authentication and Neon Postgres for account and credit records;</li>
        <li>Google or GitHub when you choose that sign-in method;</li>
        <li>Polar as merchant of record for checkout, tax, receipts, refunds, and disputes;</li>
        <li>Morphic CMS for designs you intentionally share;</li>
        <li>Cloudflare Turnstile for abuse prevention on the sharing flow; and</li>
        <li>hosting and infrastructure providers that deliver and secure the service.</li>
      </ul>
      <p>
        These providers process information under their own terms and privacy policies. We may also
        disclose information when required by law, to protect users or the service, or as part of a
        business reorganization subject to appropriate safeguards.
      </p>
    </Section>

    <Section title="6. Retention and security">
      <p>
        We retain account, balance, transaction, security, and shared-design records for as long as
        reasonably necessary to provide the service, maintain financial and fraud records, resolve
        disputes, and meet legal obligations. Different providers may apply their own retention
        periods. We use reasonable safeguards, but no online service can guarantee absolute
        security.
      </p>
    </Section>

    <Section title="7. Your choices and rights">
      <p>
        You may sign out at any time and can disconnect Shotage from your Google or GitHub account
        through that provider’s controls. You may request access, correction, deletion, or another
        privacy right available in your jurisdiction by emailing us. We may need to verify your
        identity, and some financial or security records may be retained where legally required.
      </p>
      <p>
        To request deletion of your Shotage account and associated personal data, email the address
        above from the email connected to your account with the subject “Shotage account deletion.”
        Also identify any shared-design links you want removed.
      </p>
    </Section>

    <Section title="8. Children and international processing">
      <p>
        Shotage is not directed to children under 13, or a higher minimum age where local law
        requires it. Service providers may process information in countries other than yours, where
        privacy laws may differ, using safeguards required by applicable law.
      </p>
    </Section>

    <Section title="9. Policy updates">
      <p>
        We may update this policy when Shotage or its providers change. We will update the date
        above and provide additional notice when required.
      </p>
    </Section>
  </LegalPageLayout>
);

export default Privacy;
