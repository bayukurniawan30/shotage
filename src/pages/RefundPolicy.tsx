import React from 'react';
import { LegalPageLayout } from '../components/LegalPageLayout';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <h2 className="text-base font-bold text-slate-100">{title}</h2>
    <div className="space-y-2 text-slate-400">{children}</div>
  </section>
);

const RefundPolicy: React.FC = () => (
  <LegalPageLayout
    title="Refund Policy"
    badge="Purchases & refunds"
    path="/refund-policy"
    description="When a Shotage credit-pack purchase may be refunded and how to request help."
    updated="September 8, 2026"
  >
    <Section title="1. Credit-pack purchases">
      <p>
        Shotage currently sells one-time credit packs rather than subscriptions. Credits are
        delivered to the Shotage account used at checkout after Polar confirms payment.
      </p>
    </Section>

    <Section title="2. Fourteen-day refund requests">
      <p>
        You may request a refund within 14 days of purchase. Subject to applicable law, refunds are
        normally approved when the credits from that purchase have not been used. Because credits
        fund immediately delivered digital export services, a request may be declined or reduced
        when some or all purchased credits have already been consumed.
      </p>
      <p>
        We will also review requests involving a duplicate charge, unauthorized purchase, incorrect
        pack, credits that were not delivered, or a material technical failure that prevented use.
        This policy does not limit consumer rights that cannot be waived under applicable law.
      </p>
    </Section>

    <Section title="3. How to request a refund">
      <p>
        Email{' '}
        <a
          href="mailto:support@shotage.studio?subject=Shotage%20refund%20request"
          className="font-semibold text-pastel-pink hover:underline"
        >
          support@shotage.studio
        </a>{' '}
        from the address connected to your Shotage account. Include the purchase date, credit-pack
        name, Polar order or receipt number, and reason for the request. Do not send card numbers or
        other sensitive payment credentials.
      </p>
    </Section>

    <Section title="4. Polar is the merchant of record">
      <p>
        Polar is the merchant of record and authorized reseller for Shotage purchases. Approved
        refunds are issued through Polar to the original payment method; Shotage does not send
        refunds outside Polar Checkout. Polar may review, approve, deny, or independently issue a
        refund under its buyer terms, card-network rules, fraud controls, and applicable law.
      </p>
    </Section>

    <Section title="5. Credits after a refund">
      <p>
        A full or partial refund removes the corresponding number of credits from your Shotage
        account. Processing is driven by Polar’s verified webhook, so your balance and purchase
        status may take a short time to update. Spending credits after requesting a refund may
        affect eligibility and may create a negative credit adjustment that must be resolved before
        further paid exports.
      </p>
    </Section>

    <Section title="6. Processing time and disputes">
      <p>
        We aim to acknowledge requests promptly. After Polar issues a refund, the time needed for it
        to appear depends on the payment method and financial institution. Please contact us first
        so we can investigate before opening a payment dispute. Nothing here restricts a lawful
        chargeback right.
      </p>
    </Section>

    <Section title="7. Policy changes">
      <p>
        The policy in effect on the purchase date generally applies to that purchase, except where a
        later change is required by law or is more favorable to you.
      </p>
    </Section>
  </LegalPageLayout>
);

export default RefundPolicy;
