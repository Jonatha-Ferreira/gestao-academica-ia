interface TextoProps {
  texto: string;
}

export function IndicadorCarregando({ texto }: TextoProps) {
  return (
    <p className="feedback carregando" role="status">
      {texto}
    </p>
  );
}

export function MensagemErro({ mensagem }: { mensagem: string }) {
  return (
    <p className="feedback erro" role="alert">
      {mensagem}
    </p>
  );
}

export function EstadoVazio({ texto }: TextoProps) {
  return <p className="feedback vazio">{texto}</p>;
}
