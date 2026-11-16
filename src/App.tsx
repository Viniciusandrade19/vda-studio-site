import { useScrollFx } from './hooks/useScrollFx';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { WhyUs } from './components/WhyUs';
import { Garage } from './components/Garage';
import { HowItWorks } from './components/HowItWorks';
import { Assistance } from './components/Assistance';
import { Coverage } from './components/Coverage';
import { QuoteForm } from './components/QuoteForm';
import { Faq } from './components/Faq';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Privacy } from './components/Privacy';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { RoadProgress } from './components/RoadProgress';
import { Intro } from './components/Intro';

/**
 * Jornada comercial:
 * hero → benefícios → coberturas por veículo → como funciona → diferenciais (assistência 24h e
 * abrangência nacional) → cotação → dúvidas → CTA final → rodapé institucional.
 */
export default function App() {
  useScrollFx();

  return (
    <>
      <Intro />
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Nav />
      <main id="conteudo">
        <Hero />
        <WhyUs />
        <Garage />
        <HowItWorks />
        <Assistance />
        <Coverage />
        <QuoteForm />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <Privacy />
      <FloatingWhatsApp />
      <RoadProgress />
    </>
  );
}
