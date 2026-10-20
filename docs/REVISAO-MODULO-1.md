# Revisão local de segurança — Módulo 1

## Verificações adicionais

- Testes de sessão: ausência de cookie, expiração, usuário desativado, dados públicos, flags do cookie e logout.
- Verificação automatizada de que o pipeline CI não contém publicação ou migração remota.
- Comparação da configuração de staging com a configuração de produção, sem provisionar recursos.

## Restrições

A verificação do pipeline é uma salvaguarda de configuração, não um mecanismo de isolamento de credenciais. O GitHub Actions continua sem credenciais de publicação por desenho. Não adicionar secrets Cloudflare a esse workflow de testes.

## Riscos ainda abertos

1. A migração 0002 deve ser aplicada a um D1 de staging exclusivo antes de qualquer publicação da nova versão.
2. O controle de tentativas de login por e-mail e IP não substitui defesa global por IP, WAF e observabilidade.
3. A autenticação e as permissões exigem testes end-to-end em ambiente isolado.
4. O endpoint de bootstrap precisa de revisão específica de concorrência e controles de implantação.
5. Recuperação de backups, rollback e proteção administrativa da branch principal ainda não foram homologados.

**Estado:** PR permanece em rascunho. Não autoriza merge nem publicação.
