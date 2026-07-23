import { Link } from '@tanstack/react-router'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center bg-dq-cream/40 py-16">
      <Container className="text-center">
        <p className="type-eyebrow mb-3 text-dq-muted">404</p>
        <h1 className="type-headline text-dq-black">
          Page not <span className="text-dq-gold">found</span>
        </h1>
        <p className="type-body mx-auto mt-4 max-w-md text-dq-muted">
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold">
            <Link to="/">GO HOME</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/donate">GIVE NOW</Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
