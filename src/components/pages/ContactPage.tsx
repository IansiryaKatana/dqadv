import { useState } from 'react'
import type { FooterSettings } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { formControlClass } from '#/components/ui/form-controls'
import { cn } from '#/lib/utils'
import { submitPublicForm } from '#/lib/forms/submitPublicForm'

type ContactPageProps = {
  footer: FooterSettings
}

export function ContactPage({ footer }: ContactPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    try {
      await submitPublicForm({
        data: {
          formType: 'contact',
          name,
          email,
          phone: null,
          message,
          payload: {},
        },
      })
      setStatus('sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact"
        highlight="Us"
        description="We'd love to hear from you. Whether you have a question about giving, distribution, or partnerships — our team is here to help."
        variant="cream"
      />

      <section className="bg-white pt-16 md:pt-24 pb-16 md:pb-24">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-dq-border bg-white p-6 md:p-8">
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-name" className="type-label text-dq-black">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={formControlClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-email" className="type-label text-dq-black">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@donatequran.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={formControlClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-message" className="type-label text-dq-black">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn(formControlClass, 'resize-none')}
                />
              </div>
              {status === 'sent' ? (
                <p className="text-sm text-green-700">Thank you — we'll be in touch soon.</p>
              ) : null}
              {status === 'error' ? (
                <p className="text-sm text-red-600">Something went wrong. Please try again or email us directly.</p>
              ) : null}
              <Button type="submit" variant="gold" className="w-full" disabled={status === 'sending'}>
                {status === 'sending' ? 'SENDING...' : 'SEND MESSAGE'}
              </Button>
            </form>

            <div className="flex flex-col gap-8">
              <div>
                <h2 className="type-title mb-4 text-dq-black">Reach us directly</h2>
                <ul className="type-body space-y-3 text-dq-muted">
                  <li>
                    <span className="type-label text-dq-black">Email</span>
                    <br />
                    <a href={`mailto:${footer.email}`} className="hover:text-dq-gold">
                      {footer.email}
                    </a>
                  </li>
                </ul>
              </div>
              {footer.socialLinks.length > 0 ? (
                <div>
                  <h2 className="type-title mb-4 text-dq-black">Follow us</h2>
                  <ul className="flex flex-wrap gap-4">
                    {footer.socialLinks.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="type-label text-dq-gold hover:text-dq-black"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
