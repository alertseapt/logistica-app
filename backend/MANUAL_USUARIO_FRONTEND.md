# Manual de Utilização da API Backend para Frontend

## 1. Introdução

Este manual descreve como o frontend deve interagir com a API backend da aplicação de logística. A API gerencia agendamentos de coleta/entrega e informações de clientes.

A API está hospedada em `[BASE_URL_DA_API]` (substitua pela URL base real da sua API).

## 2. Autenticação

A autenticação é gerenciada no backend através do Firebase Admin SDK. O frontend não precisa enviar tokens de autenticação específicos nos cabeçalhos das requisições para os endpoints listados abaixo.

## 3. Endpoints

### 3.1. Agendamentos

#### `GET /agendamentos`

Retorna uma lista de todos os agendamentos.

**Parâmetros de Query (opcionais):**

*   `status`: Filtra agendamentos pelo status (ex: `agendado`, `recebido`, `informado`, `em tratativa`, `a paletizar`, `paletizado`, `fechado`).
*   `cliente`: Filtra agendamentos pelo ID do cliente.
*   `data`: Filtra agendamentos por uma data específica (formato: `YYYY-MM-DD`).
*   `mes`: Filtra agendamentos por um mês específico (formato: `YYYY-MM`).

**Exemplo de Requisição:**

```
GET /agendamentos?status=agendado&mes=2024-07
```

**Exemplo de Resposta (200 OK):**

```json
[
  {
    "id": "xxxxxxxxxxxx",
    "numeroNF": "12345",
    "chaveAcesso": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "data": { "_seconds": 1690858800, "_nanoseconds": 0 }, // Exemplo de Timestamp Firestore
    "ePrevisao": false,
    "volumes": 10,
    "clienteId": "yyyyyyyyyyyy",
    "cliente": {
      "nome": "Cliente Exemplo",
      "cnpj": "12.345.678/0001-99"
    },
    "status": "agendado",
    "observacoes": "Observação sobre o agendamento",
    "historicoStatus": [
      {
        "status": "agendado",
        "timestamp": { "_seconds": 1690858800, "_nanoseconds": 0 }
      }
    ]
  }
  // ... outros agendamentos
]
```

---

#### `GET /agendamentos/:id`

Retorna um agendamento específico pelo seu ID.

**Parâmetros da Rota:**

*   `id`: ID do agendamento.

**Exemplo de Requisição:**

```
GET /agendamentos/xxxxxxxxxxxx
```

**Exemplo de Resposta (200 OK):**

```json
{
  "id": "xxxxxxxxxxxx",
  "numeroNF": "12345",
  "chaveAcesso": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "data": { "_seconds": 1690858800, "_nanoseconds": 0 },
  "ePrevisao": false,
  "volumes": 10,
  "clienteId": "yyyyyyyyyyyy",
  "cliente": {
    "nome": "Cliente Exemplo",
    "cnpj": "12.345.678/0001-99"
  },
  "status": "agendado",
  "observacoes": "Observação sobre o agendamento",
  "historicoStatus": [
    {
      "status": "agendado",
      "timestamp": { "_seconds": 1690858800, "_nanoseconds": 0 }
    }
  ]
}
```

**Resposta de Erro (404 Not Found):**

```json
{
  "error": "Agendamento não encontrado"
}
```

---

#### `POST /agendamentos`

Cria um novo agendamento.

**Corpo da Requisição (JSON):**

```json
{
  "numeroNF": "12345", // Opcional se chaveAcesso for fornecida
  "chaveAcesso": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Opcional se numeroNF for fornecido
  "data": "2024-07-31T12:00:00.000Z", // Obrigatório se ePrevisao for false. Data no formato ISO 8601 (UTC) ou timestamp. Será normalizada para meio-dia.
  "ePrevisao": false, // Boolean. Obrigatório. True se for apenas uma previsão sem data definida.
  "volumes": 10, // Number. Opcional, default 0.
  "clienteId": "yyyyyyyyyyyy", // String. Obrigatório. ID do cliente.
  "observacoes": "Alguma observação" // String. Opcional.
}
```

**Notas sobre o campo `data`:**
*   Se `ePrevisao` for `true`, o campo `data` pode ser `null` ou omitido.
*   Se `ePrevisao` for `false`, o campo `data` é obrigatório.
*   A data será armazenada normalizada para o meio-dia (12:00:00) do dia fornecido para evitar problemas de fuso horário.

**Exemplo de Resposta (201 Created):**

```json
{
  "id": "zzzzzzzzzzzz",
  "numeroNF": "12345",
  "chaveAcesso": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "data": { "_seconds": 1690858800, "_nanoseconds": 0 }, // Data normalizada
  "ePrevisao": false,
  "volumes": 10,
  "clienteId": "yyyyyyyyyyyy",
  "cliente": {
    "nome": "Cliente Exemplo",
    "cnpj": "12.345.678/0001-99"
  },
  "status": "agendado", // Status inicial
  "observacoes": "Alguma observação",
  "historicoStatus": [
    {
      "status": "agendado",
      "timestamp": { "_seconds": 1690858800, "_nanoseconds": 0 } // Timestamp da criação
    }
  ]
}
```

**Respostas de Erro:**

*   `400 Bad Request`: Se campos obrigatórios não forem fornecidos ou se o cliente não for encontrado.
    ```json
    { "error": "Cliente é obrigatório" }
    // ou
    { "error": "Data ou indicação de previsão é obrigatória" }
    // ou
    { "error": "Cliente não encontrado" }
    ```

---

#### `PUT /agendamentos/:id`

Atualiza um agendamento existente.

**Parâmetros da Rota:**

*   `id`: ID do agendamento a ser atualizado.

**Corpo da Requisição (JSON):** (Forneça apenas os campos a serem atualizados)

```json
{
  "numeroNF": "54321",
  "chaveAcesso": "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "data": "2024-08-01T12:00:00.000Z", // Data no formato ISO 8601 (UTC) ou timestamp. Será normalizada para meio-dia. Pode ser null.
  "ePrevisao": true,
  "volumes": 15,
  "clienteId": "wwwwwwwwwwww", // Se o clienteId for alterado, as informações do cliente no agendamento serão atualizadas.
  "observacoes": "Observação atualizada"
}
```

**Notas sobre o campo `data`:**
*   Se `data` for fornecido como `null`, o agendamento será marcado como sem data específica (geralmente usado com `ePrevisao: true`).
*   Se `ePrevisao` for alterado, o campo `data` deve ser consistente (ou seja, `null` se `ePrevisao: true`).

**Exemplo de Resposta (200 OK):**

```json
{
  "id": "xxxxxxxxxxxx",
  "numeroNF": "54321",
  "chaveAcesso": "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "data": { "_seconds": 1690945200, "_nanoseconds": 0 },
  "ePrevisao": true,
  "volumes": 15,
  "clienteId": "wwwwwwwwwwww",
  "cliente": {
    "nome": "Novo Cliente Exemplo",
    "cnpj": "98.765.432/0001-11"
  },
  "status": "agendado", // O status não é alterado por este endpoint
  "observacoes": "Observação atualizada",
  "historicoStatus": [ /* ... */ ]
}
```

**Respostas de Erro:**

*   `404 Not Found`: Se o agendamento não for encontrado.
    ```json
    { "error": "Agendamento não encontrado" }
    ```
*   `400 Bad Request`: Se o `clienteId` fornecido não existir.
    ```json
    { "error": "Cliente não encontrado" }
    ```

---

#### `PATCH /agendamentos/:id/status`

Atualiza o status de um agendamento.

**Parâmetros da Rota:**

*   `id`: ID do agendamento.

**Corpo da Requisição (JSON):**

```json
{
  "status": "recebido" // Novo status para o agendamento
}
```

**Status Permitidos:**

*   `agendado`
*   `recebido`
*   `informado`
*   `em tratativa`
*   `a paletizar`
*   `paletizado`
*   `fechado`

**Regras de Transição de Status:**

*   O status `informado` só pode ser aplicado se o status atual for `recebido` ou `informado`.
*   De `informado`, só é possível alterar para: `informado`, `em tratativa`, `a paletizar`.

**Exemplo de Resposta (200 OK):**

```json
{
  "id": "xxxxxxxxxxxx",
  "numeroNF": "12345",
  "chaveAcesso": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "data": { "_seconds": 1690858800, "_nanoseconds": 0 },
  "ePrevisao": false,
  "volumes": 10,
  "clienteId": "yyyyyyyyyyyy",
  "cliente": { /* ... */ },
  "status": "recebido", // Novo status
  "observacoes": "Observação sobre o agendamento",
  "historicoStatus": [
    {
      "status": "agendado",
      "timestamp": { "_seconds": 1690858800, "_nanoseconds": 0 }
    },
    {
      "status": "recebido",
      "timestamp": { "_seconds": 1690862400, "_nanoseconds": 0 } // Timestamp da atualização do status
    }
  ]
}
```

**Respostas de Erro:**

*   `400 Bad Request`: Se o status não for informado, for inválido ou a transição não for permitida.
    ```json
    { "error": "Status é obrigatório" }
    // ou
    { "error": "Status inválido" }
    // ou
    { "error": "O status informado só pode ser aplicado a agendamentos com status recebido ou informado. Status atual: [status_atual]" }
    // ou
    { "error": "De status informado, só é possível alterar para: informado, em tratativa, a paletizar" }
    ```
*   `404 Not Found`: Se o agendamento não for encontrado.
    ```json
    { "error": "Agendamento não encontrado" }
    ```

---

#### `DELETE /agendamentos/:id`

Exclui um agendamento.

**Parâmetros da Rota:**

*   `id`: ID do agendamento a ser excluído.

**Exemplo de Requisição:**

```
DELETE /agendamentos/xxxxxxxxxxxx
```

**Exemplo de Resposta (200 OK):**

```json
{
  "message": "Agendamento excluído com sucesso"
}
```

**Resposta de Erro (404 Not Found):**

```json
{
  "error": "Agendamento não encontrado"
}
```

---

#### `GET /agendamentos/busca/nf`

Busca agendamentos pelo número da Nota Fiscal (NF) ou pela chave de acesso da NF.

**Parâmetros de Query:**

*   `termo`: Número da NF (ex: "12345") ou chave de acesso completa (44 caracteres). Obrigatório.

**Exemplo de Requisição:**

```
GET /agendamentos/busca/nf?termo=12345
// ou
GET /agendamentos/busca/nf?termo=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Exemplo de Resposta (200 OK):**

```json
[
  {
    "id": "xxxxxxxxxxxx",
    "numeroNF": "12345",
    // ... restante dos dados do agendamento
  }
]
```
Se nenhum agendamento for encontrado, retorna uma lista vazia `[]`.

**Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Termo de busca é obrigatório"
}
```

---

### 3.2. Clientes

#### `GET /clientes`

Retorna uma lista de todos os clientes.

**Exemplo de Requisição:**

```
GET /clientes
```

**Exemplo de Resposta (200 OK):**

```json
[
  {
    "id": "yyyyyyyyyyyy",
    "nome": "Cliente Exemplo 1",
    "cnpj": "12.345.678/0001-99",
    "observacoes": "Observações sobre o cliente 1"
  },
  {
    "id": "zzzzzzzzzzzz",
    "nome": "Cliente Exemplo 2",
    "cnpj": "98.765.432/0001-11",
    "observacoes": ""
  }
  // ... outros clientes
]
```

---

#### `GET /clientes/:id`

Retorna um cliente específico pelo seu ID.

**Parâmetros da Rota:**

*   `id`: ID do cliente.

**Exemplo de Requisição:**

```
GET /clientes/yyyyyyyyyyyy
```

**Exemplo de Resposta (200 OK):**

```json
{
  "id": "yyyyyyyyyyyy",
  "nome": "Cliente Exemplo 1",
  "cnpj": "12.345.678/0001-99",
  "observacoes": "Observações sobre o cliente 1"
}
```

**Resposta de Erro (404 Not Found):**

```json
{
  "error": "Cliente não encontrado"
}
```

---

#### `POST /clientes`

Cria um novo cliente.

**Corpo da Requisição (JSON):**

```json
{
  "nome": "Novo Cliente", // String. Obrigatório.
  "cnpj": "11.222.333/0001-44", // String. Obrigatório.
  "observacoes": "Observação opcional" // String. Opcional.
}
```

**Exemplo de Resposta (201 Created):**

```json
{
  "id": "wwwwwwwwwwww",
  "nome": "Novo Cliente",
  "cnpj": "11.222.333/0001-44",
  "observacoes": "Observação opcional"
}
```

**Respostas de Erro:**

*   `400 Bad Request`: Se campos obrigatórios não forem fornecidos ou se o CNPJ já estiver cadastrado.
    ```json
    { "error": "Nome é obrigatório" }
    // ou
    { "error": "CNPJ é obrigatório" }
    // ou
    { "error": "CNPJ já cadastrado" }
    ```

---

#### `PUT /clientes/:id`

Atualiza um cliente existente.

**Parâmetros da Rota:**

*   `id`: ID do cliente a ser atualizado.

**Corpo da Requisição (JSON):** (Forneça apenas os campos a serem atualizados)

```json
{
  "nome": "Cliente Atualizado",
  "cnpj": "55.666.777/0001-88", // Se o CNPJ for alterado, deve ser único.
  "observacoes": "Observação atualizada"
}
```

**Nota:** Se o `nome` ou `cnpj` de um cliente for alterado, todos os agendamentos associados a este cliente terão as informações de `cliente.nome` e `cliente.cnpj` atualizadas automaticamente.

**Exemplo de Resposta (200 OK):**

```json
{
  "id": "yyyyyyyyyyyy",
  "nome": "Cliente Atualizado",
  "cnpj": "55.666.777/0001-88",
  "observacoes": "Observação atualizada"
}
```

**Respostas de Erro:**

*   `404 Not Found`: Se o cliente não for encontrado.
    ```json
    { "error": "Cliente não encontrado" }
    ```
*   `400 Bad Request`: Se o CNPJ fornecido já estiver cadastrado para outro cliente.
    ```json
    { "error": "CNPJ já cadastrado para outro cliente" }
    ```

---

#### `DELETE /clientes/:id`

Exclui um cliente.

**Parâmetros da Rota:**

*   `id`: ID do cliente a ser excluído.

**Restrição:** Um cliente não pode ser excluído se houver agendamentos associados a ele.

**Exemplo de Requisição:**

```
DELETE /clientes/yyyyyyyyyyyy
```

**Exemplo de Resposta (200 OK):**

```json
{
  "message": "Cliente excluído com sucesso"
}
```

**Respostas de Erro:**

*   `404 Not Found`: Se o cliente não for encontrado.
    ```json
    { "error": "Cliente não encontrado" }
    ```
*   `400 Bad Request`: Se existirem agendamentos associados ao cliente.
    ```json
    { "error": "Não é possível excluir o cliente pois existem agendamentos associados" }
    ```

## 4. Modelos de Dados (Data Models)

### 4.1. Agendamento

| Campo             | Tipo                                     | Descrição                                                                                                                                  | Obrigatório (Criação) |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `id`              | String                                   | ID único do agendamento (gerado pelo Firestore).                                                                                           | N/A (Gerado)          |
| `numeroNF`        | String                                   | Número da Nota Fiscal.                                                                                                                     | Opcional\*            |
| `chaveAcesso`     | String                                   | Chave de acesso da Nota Fiscal (44 caracteres).                                                                                            | Opcional\*            |
| `data`            | Timestamp (Firestore) / String (ISO8601) | Data do agendamento (normalizada para meio-dia). `null` se `ePrevisao` for `true`.                                                          | Sim (se `ePrevisao`=false) |
| `ePrevisao`       | Boolean                                  | `true` se for apenas uma previsão de agendamento (sem data definida), `false` caso contrário.                                              | Sim                   |
| `volumes`         | Number                                   | Quantidade de volumes.                                                                                                                     | Não (Default: 0)      |
| `clienteId`       | String                                   | ID do cliente associado.                                                                                                                   | Sim                   |
| `cliente`         | Object                                   | Objeto contendo informações básicas do cliente (copiadas no momento da criação/atualização do agendamento).                                | N/A (Populado)        |
| `cliente.nome`    | String                                   | Nome do cliente.                                                                                                                           | N/A                   |
| `cliente.cnpj`    | String                                   | CNPJ do cliente.                                                                                                                           | N/A                   |
| `status`          | String                                   | Status atual do agendamento (ex: `agendado`, `recebido`, etc.).                                                                              | N/A (Default: `agendado`) |
| `observacoes`     | String                                   | Observações adicionais sobre o agendamento.                                                                                                | Não                   |
| `historicoStatus` | Array de Objects                         | Histórico de alterações de status. Cada objeto contém `status` (String) e `timestamp` (Timestamp Firestore).                                | N/A (Populado)        |

\* `numeroNF` ou `chaveAcesso` deve ser fornecido. Se `chaveAcesso` for fornecida, `numeroNF` pode ser extraído dela.

### 4.2. Cliente

| Campo         | Tipo   | Descrição                                           | Obrigatório (Criação) |
| ------------- | ------ | --------------------------------------------------- | --------------------- |
| `id`          | String | ID único do cliente (gerado pelo Firestore).        | N/A (Gerado)          |
| `nome`        | String | Nome do cliente.                                    | Sim                   |
| `cnpj`        | String | CNPJ do cliente (deve ser único).                   | Sim                   |
| `observacoes` | String | Observações adicionais sobre o cliente.             | Não                   |

### 4.3. Timestamp (Firestore)

Datas são frequentemente representadas no formato Timestamp do Firestore:

```json
{
  "_seconds": 1690858800, // Segundos desde a época Unix
  "_nanoseconds": 0        // Fração de nanossegundos
}
```

Ao enviar datas para a API (ex: no corpo de um `POST` ou `PUT`), utilize o formato de string ISO 8601 (ex: `"2024-07-31T12:00:00.000Z"`) ou um objeto Date JavaScript, que será convertido para Timestamp no backend.

## 5. Tratamento de Erros

A API utiliza códigos de status HTTP padrão para indicar o sucesso ou falha de uma requisição.

*   `200 OK`: Requisição bem-sucedida.
*   `201 Created`: Recurso criado com sucesso.
*   `400 Bad Request`: Requisição inválida (ex: dados faltando, formato incorreto, violação de regras de negócio). O corpo da resposta geralmente contém um objeto JSON com uma propriedade `error` descrevendo o problema.
*   `404 Not Found`: Recurso solicitado não encontrado. O corpo da resposta geralmente contém um objeto JSON com uma propriedade `error`.
*   `500 Internal Server Error`: Erro inesperado no servidor. O corpo da resposta geralmente contém um objeto JSON com uma propriedade `error`.

**Exemplo de Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Mensagem descritiva do erro."
}
```

---

Este manual deve ser suficiente para o desenvolvimento da integração frontend. Qualquer dúvida, consulte a equipe de backend. 