import type { Chamado, Mesa, StatusChamado, TipoChamado } from "../tipos";

/** Lançado quando a gravação esbarra numa regra de unicidade do banco. */
export class ErroConflito extends Error {
  constructor(mensagem = "Registro duplicado") {
    super(mensagem);
    this.name = "ErroConflito";
  }
}

/** Tudo o que o sistema precisa do banco de dados. */
export interface Store {
  listarMesas(): Promise<Mesa[]>;
  buscarMesa(numero: number): Promise<Mesa | null>;
  /** Cria as mesas que ainda não existem e ignora as repetidas. */
  criarMesas(numeros: number[]): Promise<number>;
  atualizarMesa(id: string, dados: { numero?: number; ativa?: boolean }): Promise<Mesa | null>;
  removerMesa(id: string): Promise<boolean>;

  listarChamadosAbertos(): Promise<Chamado[]>;
  buscarChamados(mesa: number, ids: string[]): Promise<Chamado[]>;
  chamadoAberto(mesa: number, tipo: TipoChamado): Promise<Chamado | null>;
  ultimoChamado(mesa: number, tipo: TipoChamado): Promise<Chamado | null>;
  criarChamado(mesa: number, tipo: TipoChamado): Promise<Chamado>;
  atualizarStatus(id: string, status: StatusChamado): Promise<Chamado | null>;
}
