# Meu Portfolio

Esta pasta contém o site e um backend Node.js para envio de mensagens de contacto de forma segura.

## Como usar

1. Copie `.env.example` para `.env`.
2. Preencha os valores com as credenciais SMTP do seu serviço de email.
3. Instale dependências:

```bash
npm install
```

4. Execute o servidor:

```bash
npm start
```

5. Abra o browser em:

```bash
http://localhost:3000
```

## Segurança

O `index.html` não contém nenhuma senha. As credenciais SMTP ficam apenas no arquivo `.env`, que não deve ser versionado.

## Variáveis de ambiente

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` ou `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `TO_EMAIL`
