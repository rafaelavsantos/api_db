const { Client } = require('pg');
const express = require('express');
const app = express();
const port = 3000;

const dbConfig = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'api_db'
});

const client = new Client(dbConfig);

async function startServer() {
  try {
    await client.connect();
    console.log('Conectando ao banco de dados...');

    // Create table
    const createTables = `
      CREATE TABLE IF NOT EXISTS cliente(
        id SERIAL PRIMARY KEY, 
        nome VARCHAR(50) NOT NULL,
        sobrenome VARCHAR(50) NOT NULL,
        endereco VARCHAR(60),
        sexo CHAR(1),
        idade INT,
        celular VARCHAR(15)
      ); 
      CREATE TABLE IF NOT EXISTS funcionario(
        id SERIAL PRIMARY KEY, 
        nome VARCHAR(50) NOT NULL,
        sobrenome VARCHAR(50) NOT NULL,
        endereco VARCHAR(60),
        sexo CHAR(1),
        idade INT,
        celular VARCHAR(15),
        dt_nasc DATE,
        funcao VARCHAR(20),
        cpf VARCHAR(11) UNIQUE
      );   
      CREATE TABLE IF NOT EXISTS servico(
        id SERIAL PRIMARY KEY, 
        tipo VARCHAR(20) NOT NULL,
        valor_servico REAL NOT NULL,
        quantidade INT,
        duracao TIME,
        funcionario_id INTEGER REFERENCES funcionario(id)
      ); 
      CREATE TABLE IF NOT EXISTS agendamento(
        id SERIAL PRIMARY KEY, 
        data DATE NOT NULL,
        hora TIME NOT NULL,
        
        servico_id INTEGER REFERENCES servico(id),
        cliente_id INTEGER REFERENCES cliente(id)
      ); 
      CREATE TABLE IF NOT EXISTS pagamento (
        id SERIAL PRIMARY KEY, 
        tipo VARCHAR(20) NOT NULL,
        valor REAL NOT NULL,
        
        agendamento_id INTEGER REFERENCES agendamento(id)
      );
    `;
    await client.query(createTables);

    console.log('Tabelas criadas com sucesso');

    app.get("/", (req, res) => {
      res.send("hello world");
    });

    // Rota para listar todos os clientes
    app.get('/clientes', async (req, res) => {
      try {
        const query = 'SELECT * FROM cliente';
        const result = await client.query(query);
        console.log('Clientes: ', result.rows);
        res.json(result.rows)
      } catch (err) {
        console.error('Erro ao buscar clientes: ', err);
        res.status(500).send('Erro ao buscar clientes!');
      }
    });

    // Iniciar o servidor
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados', err);
    client.end().catch((err) => {
      console.error('Erro ao fechar conexão', err);
    });
  };
}

startServer();
