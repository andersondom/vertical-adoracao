# Módulo 3 — Homologação funcional da primeira entrega

**Escopo:** presenças por evento, fechamento manual, correções auditadas e indicadores individuais.

**Ambiente:** somente desenvolvimento local ou staging isolado, com migrações locais aplicadas. **Não usar produção.**

## Pré-condições
1. Executar `npm ci` e `npm run db:local` em ambiente de desenvolvimento.
2. Iniciar com `npm run dev` e acessar a URL local exibida pelo Wrangler.
3. Entrar com administrador de teste; ter pelo menos dois integrantes de teste, duas funções e dois eventos.
4. Confirmar que um integrante está escalado com duas funções no mesmo evento e outro em um segundo evento.

## Checklist de homologação

- [ ] **H01 — Acesso:** administrador visualiza aba **Presenças**; integrante comum não vê a aba.
- [ ] **H02 — Evento:** selecionar evento mostra integrantes escalados e respectivas funções.
- [ ] **H03 — Registro:** marcar presença e informar motivo; salvar e reabrir mantém o registro.
- [ ] **H04 — Justificativa:** marcar ausência justificada sem descrição é rejeitado; com descrição, é salvo.
- [ ] **H05 — Fechamento incompleto:** tentar encerrar com integrante escalado sem registro deve ser bloqueado.
- [ ] **H06 — Fechamento completo:** após registrar todos os escalados, encerrar evento com sucesso.
- [ ] **H07 — Correção:** administrador altera registro de evento fechado, com motivo, sem reabrir o fechamento.
- [ ] **H08 — Indicadores:** integrante consulta **Minha participação** por período.
- [ ] **H09 — Múltiplas funções:** duas funções no mesmo evento geram uma única presença e um compromisso.
- [ ] **H10 — Pendências:** eventos sem fechamento não reduzem a taxa de presença.
- [ ] **H11 — Privacidade:** integrante não consegue consultar indicadores de outro integrante.
- [ ] **H12 — Responsividade:** tela de presença e indicadores é utilizável em celular e desktop.
- [ ] **H13 — Escala bloqueada:** depois do fechamento de presenças, administrador não consegue adicionar ou retirar integrantes da equipe desse evento.
- [ ] **H14 — Confirmação bloqueada:** integrante não consegue confirmar ou recusar escalação de evento cujas presenças já foram encerradas.

## Evidências e resultado
Para cada falha, registrar **código Hxx**, comportamento observado, mensagem de erro e captura de tela quando disponível.

**Critério de aprovação:** 14/14 itens aprovados, sem exposição indevida de dados e sem regressão das funcionalidades existentes.

## Limites desta entrega
Ainda não contempla autorização delegada a líderes, alertas, exportações, dashboards coletivos, revisão/recursos, relatórios programados e demais funcionalidades previstas para etapas seguintes.

## Comandos de validação local
```bash
npm ci
npm run db:local
npm test
npx wrangler deploy --dry-run
npm run dev
```

**Atenção:** `npm run db:remote` e `npm run deploy` não fazem parte da homologação autorizada.
