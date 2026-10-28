interface Props {
  valor: string;
  onMudar: (valor: string) => void;
}

export function BuscaAlunos({ valor, onMudar }: Props) {
  return (
    <div className="busca">
      <label htmlFor="campo-busca">Buscar por nome ou matrícula</label>
      <input
        id="campo-busca"
        type="search"
        value={valor}
        placeholder="Ex.: Maria ou 202602"
        onChange={(evento) => onMudar(evento.target.value)}
      />
    </div>
  );
}
