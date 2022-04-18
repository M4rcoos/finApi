const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];
/**cpf-String,
name-String,
id-uuid,
statement[],*/

//criando uma função para verificar se o CPf ja existe...
function veryfiyIfExistaccountCPF(request, response, next) {
  //criando uma variavel que ira receber o cpf do nosso Headers
  const { cpf } = request.headers;

  //criando uma condição que ira verificar se o cpf recebido ja existe no banco de dados
  const customer = customers.find((customer) => customer.cpf == cpf);

  //se o cpf recebido for um cpf que não é valido irá retornar um status e a mensagem
  if (!customer) {
    return response.status(400).json({ error: "customer not found" });
  }

  request.customer = customer;

  //se todas verificações for aprovada passa para o proximo ...
  return next();
}

//criando a function para deposito...
function getBalance(statement) {
  //criando uma variavel que esta recebdo uma função reduce()
  //O método reduce() em JavaScript é usado para reduzir o array a um único valor e executa uma função fornecida para
  // cada valor do array (da esquerda para a direita) e o valor de retorno da função é armazenado em um acumulador .

  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

//criando um usuario com cpf e nome
app.post("/account", (request, response) => {
  //amarzenando o cpf e o nome em uma variavel...
  //cpf e nome  esta vindo do request.body
  const { cpf, name } = request.body;

  //criando uma variavel que ira custumer.some
  //(some vai fazer uma busca e ira retorna verdadeiro ou falso de acordo com a condição que passarmos para dentro dele)
  const customerAlreadyExists = customers.some(
    (customers) => customers.cpf === cpf
  );
  //fazendo a verificação se (customerAlreadyExists) for verdadeiro  a condição ira retorna um status e um JSON
  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

//criando a rota de extrato
app.get("/statement", veryfiyIfExistaccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

//criando a rota de extrato
app.post("/deposit", veryfiyIfExistaccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", veryfiyIfExistaccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "insufficient funds!" });
  }
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", veryfiyIfExistaccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statemant) =>
      statemant.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put("/account", veryfiyIfExistaccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});
app.get("/account", veryfiyIfExistaccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});
app.delete("/account", veryfiyIfExistaccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get("/balance", veryfiyIfExistaccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);
