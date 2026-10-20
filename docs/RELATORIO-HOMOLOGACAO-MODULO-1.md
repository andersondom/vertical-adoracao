# Vertical Adoração — Relatório de homologação do Módulo 1

**Data:** 20/10/2026
**Ambiente:** Cloudflare staging isolado (Worker `ministerio-louvor-staging`, D1 `louvor-staging`)
**Branch:** `feature/modulo-1-fundacao-seguranca`
**Pull request:** https://github.com/andersondom/vertical-adoracao/pull/1
**Produção:** nenhuma alteração; merge não realizado.

## Resultados funcionais informados pelo responsável

1. Cadastro inicial do administrador — aprovado.
2. Login do administrador — aprovado.
3. Logout e exigência de nova autenticação — aprovado.
4. Bloqueio após cinco tentativas incorretas — aprovado.
5. Liberação após quinze minutos — aprovado.
6. Criação e login de integrante comum — aprovado.
7. Restrição de funções administrativas na interface — aprovado.
8. Bloqueio de chamada administrativa pela API — mensagem “Acesso negado” confirmada; status HTTP não registrado no relato.
9. Desativação de integrante e bloqueio de novo login — aprovado.
10. Revogação de sessão ativa após desativação — aprovado.
11. Ausência da opção de autodesativação do administrador na interface — aprovado.

**Síntese:** 11 verificações funcionais com comportamento esperado relatado.

## Verificação automatizada adicional

Foi incluído `tests/self-deactivation.test.js` para verificar que a API rejeita a autodesativação do administrador (HTTP 400, mensagem de erro específica) sem realizar outras consultas/escritas no banco simulado.

**Commit testado:** `5d13a8651401c76b9aa1c6877b484b5f201a2e63`
**GitHub Actions:** https://github.com/andersondom/vertical-adoracao/actions/runs/39471715735
**Resultado confirmado:** `completed / success`.

## Incidente corrigido

O bootstrap inicial no staging falhou por solicitar 210.000 iterações PBKDF2, acima do limite de 100.000 observado no runtime. A correção para 100.000 iterações foi incluída no commit `b589860`, com teste de regressão; o responsável confirmou cadastro e login após atualização do staging.

## Pendências para homologação técnica integral

- Registrar evidência de expiração natural de sessão, se exigida.
- Verificar criação de evento, disponibilidade, trilha de auditoria e demais funções abrangidas pelo escopo do Módulo 1.
- Registrar backup e restauração em banco de teste independente, se exigidos no plano de homologação.
- Confirmar que o relatório e os testes correspondem ao commit que será eventualmente submetido à aprovação final.

**Conclusão:** verificações executadas e CI aprovadas; não há autorização de merge ou publicação em produção. As pendências acima não foram declaradas aprovadas.
