# Meu Portfolio

Site estático de Filipe Braz, publicado em [www.rfcb.pt](https://www.rfcb.pt) através da Vercel. Não tem backend nem passo de build.

## Estrutura

- `index.html`: conteúdo da página
- `styles.css`: estilos
- `script.js`: idioma, menu mobile, janela de contacto e envio do formulário
- `motion.js`: scroll suave, animações, cores das secções e percurso do queijo
- `cheese.js`: queijo 3D desenhado num shader WebGL, sem modelos nem texturas
- `cheese.webp`: imagem do queijo, usada quando o WebGL não está disponível e na imagem de partilha
- `vendor/`: GSAP, ScrollTrigger e Lenis, alojados no próprio site
- `translations.js`: textos em PT, EN, DE e ES
- `fonts/`: fontes Bricolage Grotesque, Instrument Serif, DM Sans e JetBrains Mono (licença OFL), alojadas no próprio site
- `vercel.json`: cabeçalhos de segurança, incluindo o CSP
- `banner.html`: fonte da imagem `og-image.png`; não é publicado (ver `.vercelignore`)

## Correr localmente

```bash
npx serve .
```

## Formulário de contacto

O formulário envia as mensagens através da [Web3Forms](https://web3forms.com). A `access_key` no `index.html` é pública por natureza e não é uma password.

A proteção contra spam usa o hCaptcha, com a sitekey partilhada que a Web3Forms indica para o plano gratuito. O script só é carregado quando alguém abre o formulário. Para o captcha ser exigido no servidor, tem de estar ativo no painel da Web3Forms, em **Block Spam**.

## Ativar o botão do CV

1. Coloca o ficheiro na raiz do projeto com o nome `cv.pdf`.
2. Em `index.html`, remove o atributo `hidden` do link `Download CV`.

## Cabeçalhos de segurança

O CSP só permite scripts e estilos alojados no próprio site ou servidos pelo hCaptcha. Um serviço externo novo, ou CSS e JS diretamente no HTML, obriga a atualizar o `vercel.json`.
