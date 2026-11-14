# LF Desenvolvimentos

Biolink comercial + portfólio de **Leonardo Feitosa**, desenvolvedor full stack em João Pessoa, PB.

| Página | Caminho | O que é |
|---|---|---|
| Biolink | `/` (`index.html`) | Venda de biolinks com domínio próprio: simulador, antes/depois, portfólio de clientes, preço e FAQ |
| Portfólio | `/portfolio/` | Portfólio de dev: terminal interativo, stack que filtra projetos, experiência, projetos e GitHub ao vivo |

## Interações

Todas ficam em `assets/fx.js`, que as duas páginas compartilham:

- grade de pontos que reage ao cursor/toque, com ondas de choque ao clicar
- cursor customizado (só com mouse)
- tilt 3D + spotlight em elementos com `data-tilt`
- olhos que seguem o cursor em `data-eye` (o ponto do logo LF)
- reveal no scroll em `data-reveal`
- confete (`LF.confetti(x, y)`): clique 5x no olho do logo 👀

Respeita `prefers-reduced-motion`.

## Editar

- **WhatsApp**: constante `WHATSAPP` no `<script>` de cada página (DDI + DDD, só números).
- **Projetos, experiência e stack do portfólio**: arrays `PROJECTS`, `JOBS` e `STACK` em `portfolio/index.html`.
- **Sites de clientes**: `SITES` em cada página.

É um site estático, sem build. Para publicar, use GitHub Pages ou Vercel apontando para a raiz do repositório.
