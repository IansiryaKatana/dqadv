import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'

const LAST_UPDATED = '1 September 2026'

const SECTIONS = [
  { id: 'who-we-are', title: '1. Who we are' },
  { id: 'guest-use', title: '2. You can use the app as a guest' },
  { id: 'information-we-collect', title: '3. Information we collect' },
  { id: 'information-we-do-not-collect', title: '4. Information we do not collect' },
  { id: 'how-we-use-information', title: '5. How we use information' },
  { id: 'who-we-share-information-with', title: '6. Who we share information with' },
  { id: 'how-long-we-keep-information', title: '7. How long we keep information' },
  { id: 'security-and-international-transfers', title: '8. Security and international transfers' },
  { id: 'your-rights', title: '9. Your rights' },
  { id: 'children', title: '10. Children' },
  { id: 'changes', title: '11. Changes' },
  { id: 'contact', title: '12. Contact' },
] as const

const linkClass = 'text-dq-black underline decoration-dq-gold/50 underline-offset-2 transition-colors hover:text-dq-gold'

function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="type-title text-dq-black">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="type-body text-dq-muted">{children}</p>
}

function CollectItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="type-label text-dq-black">{label}</dt>
      <dd className="type-body mt-2 text-dq-muted">{children}</dd>
    </div>
  )
}

export function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy"
        highlight="Policy"
        description={`Last updated ${LAST_UPDATED}`}
        variant="cream"
      />

      <section className="bg-white pt-16 pb-16 md:pt-24 md:pb-24">
        <Container>
          <article className="mx-auto max-w-3xl">
            <nav aria-label="On this page" className="mb-12 rounded-2xl border border-dq-border bg-dq-cream/40 p-6 md:p-8">
              <p className="type-eyebrow mb-4 text-dq-muted">On this page</p>
              <ol className="flex flex-col gap-2">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="type-body text-dq-black transition-colors hover:text-dq-gold">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex flex-col gap-12">
              <PolicySection id="who-we-are" title="1. Who we are">
                <dl className="flex flex-col gap-4">
                  <div>
                    <dt className="type-label text-dq-black">Controller</dt>
                    <dd className="type-body mt-2 text-dq-muted">Mercy 4 All Foundation (Donate Quran project)</dd>
                  </div>
                  <div>
                    <dt className="type-label text-dq-black">Website</dt>
                    <dd className="type-body mt-2 text-dq-muted">
                      <Link to="/" className={linkClass}>
                        https://donatequran.com
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="type-label text-dq-black">Support</dt>
                    <dd className="type-body mt-2 text-dq-muted">
                      <Link to="/contact" className={linkClass}>
                        https://donatequran.com/contact
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="type-label text-dq-black">Email</dt>
                    <dd className="type-body mt-2 text-dq-muted">
                      <a href="mailto:support@donatequran.com" className={linkClass}>
                        support@donatequran.com
                      </a>
                    </dd>
                  </div>
                </dl>
              </PolicySection>

              <PolicySection id="guest-use" title="2. You can use the app as a guest">
                <P>
                  You do not need an account for core features (donate, order a free Quran, read, Qibla, learn, Ask a
                  Scholar).
                </P>
                <P>
                  If you create an account, we can show your donation receipts, order history, saved addresses, and
                  scholar questions across devices.
                </P>
              </PolicySection>

              <PolicySection id="information-we-collect" title="3. Information we collect">
                <P>
                  We (and our processors listed below) collect the following. “Collect” means information is sent off
                  your device and stored so we can run the app.
                </P>
                <dl className="flex flex-col gap-6">
                  <CollectItem label="Account (optional)">
                    name; email address; user ID (your account identifier). Collected when you sign up, sign in, or
                    update your profile.
                  </CollectItem>
                  <CollectItem label="Donations">
                    purchase history (amount, one-time or monthly, status, receipt identifiers); optional “on behalf of”
                    or donor name you type. Donations are paid through the App Store or Google Play (via RevenueCat). We
                    never receive or store your card number, Apple Pay details, or Google Play payment details. Monthly
                    donations are subscriptions you manage in your Apple ID or Google Play account.
                  </CollectItem>
                  <CollectItem label="Quran orders">
                    physical address (street, city, postcode); language, quantity, and order reference; postage payment
                    identifiers (not card numbers). Printed Qurans are free. Postage is paid with Stripe. Card details
                    are entered in Stripe’s payment sheet. We do not store full card numbers. You may optionally allow
                    the camera so Stripe can scan a card; images are used only to complete that payment and are not
                    stored by us. If you are signed in, you may save a delivery address for later orders.
                  </CollectItem>
                  <CollectItem label="Ask a Scholar">
                    name, email, topic, and your question. Questions go to our team privately. They are not posted on a
                    public feed.
                  </CollectItem>
                  <CollectItem label="Notifications (optional)">
                    a push notification token (device ID), stored with your account if you are signed in. Used for order
                    updates, donation confirmations, and scholar replies. You can refuse or turn notifications off in
                    device settings.
                  </CollectItem>
                  <CollectItem label="Location (optional)">
                    precise location, only if you allow it, to show Qibla direction and prayer times. Location is not
                    saved on your profile. A short-lived request may be sent to a magnetic-declination service so the
                    compass can use true north. You can refuse location or revoke it later in system settings.
                  </CollectItem>
                  <CollectItem label="Diagnostics">
                    crash data from Firebase Crashlytics in release builds. We do not attach crash reports to your name.
                    We use them only to keep the app stable.
                  </CollectItem>
                  <CollectItem label="On your device only (not collected by us)">
                    the Qibla compass uses motion / magnetometer sensors. Bookmarks and some preferences may be stored
                    locally on the phone.
                  </CollectItem>
                </dl>
              </PolicySection>

              <PolicySection id="information-we-do-not-collect" title="4. Information we do not collect">
                <P>
                  Phone numbers; payment card numbers or bank details; contacts, photos, or microphone recordings;
                  advertising identifiers for ads; analytics of taps, screens, or in-app behaviour; sensitive
                  information as a distinct field (we do not ask you to declare religion, health, or similar
                  categories). We do not show ads and we do not use your data for tracking.
                </P>
              </PolicySection>

              <PolicySection id="how-we-use-information" title="5. How we use information">
                <P>
                  Create and manage your optional account; process donations and send receipts (when email is
                  configured); fulfil free Quran orders and postage; answer Ask a Scholar questions; send the optional
                  notifications you allow; show Qibla and prayer times when location is allowed; keep the app secure
                  and reliable (including crash diagnostics); meet accounting, charity, and legal duties.
                </P>
                <P>
                  Legal bases (UK GDPR), as applicable: performing a contract (account, donations, orders); legitimate
                  interests (security, crash repair, charity operations); consent (location, notifications, optional
                  form fields); and legal obligation (records we must keep).
                </P>
              </PolicySection>

              <PolicySection id="who-we-share-information-with" title="6. Who we share information with">
                <P>
                  Only processors who help us run Donate Quran: Supabase (account and database); RevenueCat (store
                  donation purchases); Apple / Google (in-app donation payments); Stripe (postage); Firebase Cloud
                  Messaging (push); Firebase Crashlytics (crash reports); NOAA or equivalent (magnetic declination when
                  location is allowed).
                </P>
                <P>
                  When you read, search, or listen to the Quran, your device requests text from alquran.cloud and
                  recitation audio from EveryAyah.
                </P>
                <P>We do not sell personal data. We do not share it with advertising networks or data brokers.</P>
              </PolicySection>

              <PolicySection id="how-long-we-keep-information" title="7. How long we keep information">
                <P>
                  Account profile: until you delete your account, or it is inactive and we no longer need it. Push
                  tokens: until you sign out, delete your account, or notifications are disabled. Scholar questions:
                  while we are answering them and for a reasonable follow-up period. Donation and order records: as long
                  as needed for fulfilment, receipts, charity accounting, and law (we may keep anonymised amounts and
                  counts after account deletion). Crash logs: for a limited diagnostic period. Location: not stored on
                  your profile.
                </P>
              </PolicySection>

              <PolicySection id="security-and-international-transfers" title="8. Security and international transfers">
                <P>
                  Application data is stored with Supabase using access controls (including row-level security). Payment
                  cards are handled by Apple, Google, or Stripe. Processors may be outside the United Kingdom; we rely
                  on safeguards permitted under UK data protection law.
                </P>
              </PolicySection>

              <PolicySection id="your-rights" title="9. Your rights">
                <P>
                  You may ask us to access, correct, or delete your data; restrict or object to certain processing;
                  receive a copy of data you provided; or withdraw consent (location, notifications) in device settings.
                  Email{' '}
                  <a href="mailto:support@donatequran.com" className={linkClass}>
                    support@donatequran.com
                  </a>
                  . You may also complain to the UK ICO.
                </P>
                <P>
                  Delete your account in the app: Profile → Delete account (you must be signed in). Deletion removes
                  your login and profile. Donation and order records may be kept in anonymised or limited form for
                  accounting and fulfilment. Store subscriptions must be cancelled in your Apple ID or Google Play
                  settings; deleting the app account does not cancel a store subscription by itself.
                </P>
              </PolicySection>

              <PolicySection id="children" title="10. Children">
                <P>
                  Donate Quran is rated for a general audience and is not directed at children under 13. We do not
                  knowingly collect personal data from children under 13. If you believe we have, contact us and we
                  will delete it.
                </P>
              </PolicySection>

              <PolicySection id="changes" title="11. Changes">
                <P>
                  We may update this policy. The Last updated date at the top will change when we do.
                </P>
              </PolicySection>

              <PolicySection id="contact" title="12. Contact">
                <P>Mercy 4 All Foundation — Donate Quran</P>
                <P>
                  Email:{' '}
                  <a href="mailto:support@donatequran.com" className={linkClass}>
                    support@donatequran.com
                  </a>
                </P>
                <P>
                  Contact form:{' '}
                  <Link to="/contact" className={linkClass}>
                    https://donatequran.com/contact
                  </Link>
                </P>
                <P>
                  This policy:{' '}
                  <Link to="/privacy-policy" className={linkClass}>
                    https://donatequran.com/privacy-policy
                  </Link>
                </P>
              </PolicySection>
            </div>
          </article>
        </Container>
      </section>
    </>
  )
}
