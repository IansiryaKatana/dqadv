import { Link } from '@tanstack/react-router'
import { ArrowLeft, Download } from 'lucide-react'
import type { QuranEdition } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'

export function QuranEditionPage({ edition }: { edition: QuranEdition }) {
  return (
    <>
      <section className="bg-dq-cream/40 py-8 md:py-12">
        <Container>
          <Link
            to="/quran"
            className="type-label mb-8 inline-flex items-center gap-2 text-dq-muted transition-colors hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            All languages
          </Link>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <img
              src={edition.featuredImageUrl}
              alt={edition.language}
              className="w-full rounded-2xl object-contain"
            />
            <div className="flex flex-col justify-center gap-5">
              <h1 className="type-headline text-dq-black">{edition.language}</h1>
              <p className="type-body text-dq-muted">
                Read or download the Qur'an translation in {edition.language}.
              </p>
              {edition.pdfUrl ? (
                <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
                  <a href={edition.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    DOWNLOAD PDF
                  </a>
                </Button>
              ) : (
                <p className="type-body text-dq-muted">PDF coming soon for this language.</p>
              )}
            </div>
          </div>
        </Container>
      </section>
      <DonationCtaBanner />
    </>
  )
}
