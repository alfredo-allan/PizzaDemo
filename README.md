# Abbondanza Delivery

Nova versão do sistema de pedidos da Pizzaria Abbondanza: loja, conta do cliente e painel da loja.
Next.js 15 (App Router), React 19, Tailwind CSS, Context API, GSAP e dados mockados.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

Sem nenhuma configuração o projeto roda inteiro em modo demonstração.

## Contas de teste

O botão **Demo** no canto inferior esquerdo troca de perfil sem digitar nada.

| Perfil  | E-mail                       | Observação                               |
| ------- | ---------------------------- | ---------------------------------------- |
| Cliente | `cliente@demo.com`           | 2 endereços salvos, 3 pedidos            |
| Admin   | `admin@demo.com`             | acesso a `/admin`                        |
| Cliente | `marina.tavares@exemplo.com` | verificação em duas etapas ligada        |

A senha das contas de exemplo está em `src/data/customers.json`.

## O que tem

**Loja**
- Home com a pizza em SVG montada, girada e fatiada pela rolagem (GSAP ScrollTrigger com pin e scrub), faixa que corre com o scroll, trilho horizontal dos mais pedidos, paralaxe nas categorias e consulta de CEP ao vivo.
- Cardápio com 415 itens em 16 categorias, busca por nome, ingrediente ou número, barra de categorias que acompanha a rolagem.
- Montador de pizza: tamanho, até 2 sabores (vale o mais caro), borda e adicionais.
- Carrinho lateral, checkout em uma página (dados, entrega ou retirada, pagamento) e acompanhamento do pedido.
- Tema claro/escuro com `darkMode: 'class'`, salvo no localStorage e seguindo o sistema na primeira visita.

**Conta**
- Cadastro só com e-mail, telefone, senha e endereço. O CEP vem primeiro e preenche o resto pelo ViaCEP.
- Vários endereços salvos, verificação em duas etapas por e-mail e recuperação de senha por código.

**Painel (`/admin`)**
- Visão geral: faturamento, pedidos do dia, ticket médio, últimos pedidos, cadastros recentes, bairros e itens mais vendidos.
- Pedidos em colunas por status, com avanço em um clique.
- Cardápio: novo item, edição de preço na própria linha, disponível/esgotado, excluir.
- Clientes (com endereços e histórico), Endereços (com taxa por CEP) e Integrações (estado de cada uma).

Abra o painel em uma aba e a loja em outra: as duas leem o mesmo localStorage e se atualizam sozinhas.

## Integrações

| Integração   | Estado                    | Onde                                                        |
| ------------ | ------------------------- | ----------------------------------------------------------- |
| ViaCEP       | funcionando               | `src/lib/viacep.ts`, `src/components/AddressFields.tsx`      |
| Mercado Pago | preparado, simulado       | `src/lib/mercadopago.ts`, `src/app/api/mercadopago/payment`  |
| SMTP         | preparado, simulado       | `src/app/api/email/route.ts`                                 |

Para ligar Mercado Pago e SMTP, copie `.env.example` para `.env.local` e preencha.
Sem SMTP, os códigos aparecem numa "caixa de entrada de demonstração" na tela.

Pendências antes de produção:
- Banco de dados e API no lugar do localStorage (os contextos em `src/context` já isolam esse acesso).
- Senhas com hash e sessão no servidor; hoje a autenticação é toda simulada no navegador.
- Gerar e validar os códigos de e-mail no servidor, com limite de tentativas.
- Webhook do Mercado Pago para confirmar Pix pago.
- Taxa de entrega por distância (hoje é por faixa de CEP, em `src/lib/store.ts`).
- Fotos próprias dos produtos. As atuais são do Unsplash, sorteadas por categoria.

## Estrutura

```
scripts/raw/            cardápio levantado do sistema atual (texto)
scripts/build-mocks.mjs gera os JSON de src/data  ->  npm run mocks
src/data/               products.json, orders.json, customers.json, categories.json, option-groups.json
src/context/            ThemeContext, AuthContext, CartContext, DataContext
src/lib/store.ts        dados da loja: horários, taxas, bordas (troque para outra loja)
src/app/(loja)/         home, cardápio, checkout, pedidos, conta, entrar, cadastro
src/app/admin/          painel
src/app/api/            email, mercadopago/payment, status
```
