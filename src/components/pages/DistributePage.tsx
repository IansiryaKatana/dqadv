import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { DistributeForm } from '#/components/forms/DistributeForm'

export function DistributePage() {
  return (
    <>
      <PageHero
        eyebrow="Partner with us"
        title="Become a"
        highlight="Distributor"
        description="Join our registered distributor network and help place the Qur'an in mosques, centres, schools, hospitals, and homes across your region."
        variant="dark"
      />
      <section className="bg-white pt-16 md:pt-24 pb-16 md:pb-24">
        <Container className="max-w-3xl">
          <DistributeForm />
        </Container>
      </section>
    </>
  )
}
