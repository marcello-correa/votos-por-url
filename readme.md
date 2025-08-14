# 📊 Votos por URL

Projeto **experimental** desenvolvido para facilitar a leitura e a estruturação de dados de votações da **Câmara dos Deputados** a partir de sua **API de Dados Abertos**. A proposta é simples: o usuário insere a **URL oficial** de uma votação da Câmara e o sistema transforma essa informação em uma requisição limpa para a API, retornando os dados de forma organizada e pronta para análise.

---

## 🛠 Tecnologias utilizadas
- **Next.js** (React + Node.js)
- **TypeScript** para tipagem estática
- **API de Dados Abertos da Câmara dos Deputados**
- **Vercel** para deploy

---

## ⚙️ Como funciona
1. **Entrada** – O usuário insere a URL da votação publicada no site da Câmara, algo como:  
https://www.camara.leg.br/votacoes/ID_DA_VOTACAO

2. **Processamento** – O código em **TypeScript** extrai o **ID da votação** da URL informada. Esse ID é usado para montar a requisição para o endpoint correto da API de Dados Abertos. A API retorna os dados da votação (deputados, partidos, votos etc.) em formato JSON.

3. **Saída** – Os dados são processados e exibidos de forma estruturada na interface, permitindo também exportar as informações para análise posterior.

---

## 🚀 Como rodar localmente
1. **Clonar o repositório**

git clone https://github.com/seu-usuario/votos-por-url.git
cd votos-por-url
Instalar dependências

npm install
Rodar o servidor de desenvolvimento

npm run dev
O projeto ficará disponível em http://localhost:3000

📦 Deploy
Este projeto está publicado na Vercel:
🔗 https://votos-por-url.vercel.app

📄 Licença
Este projeto é de uso experimental e sem fins lucrativos. Os dados utilizados são públicos e disponibilizados pela Câmara dos Deputados.

✍️ Autor: Marcello Corrêa