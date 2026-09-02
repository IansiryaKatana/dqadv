import { Link } from '@tanstack/react-router'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'

export function CheckoutCancelPage({ reference }: { reference?: string }) {
  return (
    <section className="py-20 md:py-28">
      <Container className="max-w-xl text-center">
        <h1 className="type-headline text-dq-black">Payment cancelled</h1>
        <p className="type-body mt-4 text-dq-muted">
          Nothing was charged. You can try again when you are ready.
        </p>
        {reference ? (
          <p className="mt-3 text-sm text-dq-muted">
            Reference: <span className="font-mono text-dq-black">{reference}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold">
            <Link to="/donate">GIVE</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/order-free-qurans" search={{ product: undefined, qty: undefined }}>
              ORDER A QUR&apos;AN
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
