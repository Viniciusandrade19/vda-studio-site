import { useEffect, useRef } from 'react';

import { PRIVACY_EVENT as EVENT } from '../lib/privacy';

/** Política de privacidade em diálogo nativo (foco preso, Esc fecha, volta o foco ao botão de origem). */
export function Privacy() {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const open = () => {
      opener.current = document.activeElement as HTMLElement | null;
      ref.current?.showModal();
    };
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      className="privacy"
      aria-labelledby="privacy-title"
      onClose={() => opener.current?.focus()}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="privacy__body">
        <h2 id="privacy-title">Privacidade</h2>
        <p>
          Os dados do formulário de cotação (nome, WhatsApp, tipo, modelo e ano do veículo e, se você quiser, a cidade) são usados
          só para responder à sua solicitação.
        </p>
        <h3>Para onde eles vão</h3>
        <p>
          Quando o site está ligado a um sistema de atendimento, a solicitação é enviada para esse sistema. Sem essa ligação, o
          site abre o WhatsApp com a mensagem pronta e nada é enviado até você tocar em Enviar na conversa.
        </p>
        <h3>O que fica no seu aparelho</h3>
        <p>
          Enquanto você preenche, um rascunho fica salvo só nesta aba do navegador, para não se perder se a página recarregar. Ele
          some quando você fecha a aba, expira em 24 horas e é apagado assim que a solicitação é enviada ou quando você começa
          uma nova. O site não usa cookies nem ferramentas de rastreamento.
        </p>
        <h3>Seus direitos</h3>
        <p>
          Você pode pedir a qualquer momento para consultar, corrigir ou apagar seus dados, pelo mesmo WhatsApp do atendimento,
          como prevê a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>
        <button type="button" className="btn btn--solid privacy__close" onClick={close} autoFocus>
          <span className="btn__label">
            <span className="btn__text">Fechar</span>
          </span>
        </button>
      </div>
    </dialog>
  );
}
