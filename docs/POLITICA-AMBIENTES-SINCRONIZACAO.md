# Política de ambientes e sincronização inicial — Vertical Adoração

Data: 27/10/2026
Status: estratégia aprovada pelo responsável; execução da sincronização **pendente de inventário e backup**.

## Decisão
1. Homologação (`ministerio-louvor-staging`, D1 `louvor-staging`) é a referência dos dados reais para a **sincronização inicial**.
2. Produção (`ministerio-louvor`, D1 `louvor-db`) deve receber os dados funcionais ausentes da homologação, **sem perda ou sobrescrita de dados exclusivos da produção**.
3. Após a sincronização, produção é a origem dos dados operacionais reais; homologação é independente, destinada a testes.
4. Mudanças futuras em produção exigem plano específico com prioridade de impacto mínimo, testes, backup e rollback.
5. Não estabelecer sincronização automática contínua entre ambientes.

## Identificadores D1
- Staging: `a5a48f44-69dd-4040-ba03-25b36197a07b`.
- Produção: `b3205ce2-14d6-4b9f-b93f-02457fb34c62`.

## Execução segura — ainda não realizada
1. Suspender temporariamente alterações de cadastros em ambos os ambientes durante a janela de conciliação.
2. Exportar backups separados e verificar sua integridade antes de qualquer escrita.
3. Inventariar tabelas, contagens e registros de ambos os bancos (integrantes, funções, eventos, disponibilidades, atribuições, equipes e configurações).
4. Confrontar chaves naturais e relacionamentos, incluindo IDs que podem divergir entre bancos; nunca copiar IDs sem remapeamento verificado.
5. Preservar administrador, credenciais, hashes de senha, sessões e segredos; planejar acesso dos integrantes com segurança.
6. Preparar e revisar um script idempotente de importação/conciliação, com validação de conflitos e execução de teste em cópia isolada.
7. Executar migração aprovada somente após backup e validação, conferir contagens, integridade e acessos.
8. Registrar evidências e estabelecer linha de base. Não copiar dados de produção de volta para staging automaticamente.

## Pendências
- Acesso operacional de leitura aos dois bancos D1 para inventário e exportação.
- Identificação e resolução de divergências entre registros.
- Implementação de consulta de escalas por mês/ano, em mudança separada e homologada antes de produção.
- Aprovação específica do plano técnico e da execução de migração após inventário.

## Proteção
Nenhuma operação de escrita ou migração remota está autorizada por este documento, isoladamente.
