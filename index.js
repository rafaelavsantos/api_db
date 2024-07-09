const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'api_db'
};

const client = new Client(dbConfig);

app.use(cors({
  origin: 'http://localhost:9000'
}));

app.use(express.json()); // Adiciona middleware para interpretar JSON no corpo das requisições

async function startServer() {
  try {
    await client.connect();
    console.log('Conectando ao banco de dados...');

    const createTables = `
      CREATE TABLE IF NOT EXISTS usuario(
        id SERIAL PRIMARY KEY, 
        email VARCHAR(50) NOT NULL,
        password VARCHAR(60)
      ); 
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

    // Rota para listar todos os agendamentos
    app.get('/agendamentos', async (req, res) => {
      try {
        const query = `
          SELECT 
            a.id, 
            a.data, 
            a.hora, 
            c.nome AS cliente, 
            a.concluido
          FROM agendamento a
          JOIN cliente c ON a.cliente_id = c.id
        `;
        const result = await client.query(query);
        res.json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        res.status(500).send('Erro ao buscar agendamentos!');
      }
    });

    // Rota para criar um novo agendamento
    app.post('/agendamentos', async (req, res) => {
      const { data, hora, cliente_id, servico_id } = req.body;
      const query = `
        INSERT INTO agendamento (data, hora, cliente_id, servico_id, concluido)
        VALUES ($1, $2, $3, $4, false)
        RETURNING *;
      `;
      const values = [data, hora, cliente_id, servico_id];

      try {
        const result = await client.query(query, values);
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao criar agendamento:', err);
        res.status(500).send('Erro ao criar agendamento');
      }
    });

    // Rota para atualizar um agendamento
    app.put('/agendamentos/:id', async (req, res) => {
      const { data, hora, cliente_id, servico_id } = req.body;
      const { id } = req.params;
      const query = `
        UPDATE agendamento
        SET data = $1, hora = $2, cliente_id = $3, servico_id = $4
        WHERE id = $5
        RETURNING *;
      `;
      const values = [data, hora, cliente_id, servico_id, id];

      try {
        const result = await client.query(query, values);
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar agendamento:', err);
        res.status(500).send('Erro ao atualizar agendamento');
      }
    });

    // Rota para excluir um agendamento
    app.delete('/agendamentos/:id', async (req, res) => {
      const { id } = req.params;
      const query = 'DELETE FROM agendamento WHERE id = $1 RETURNING *;';
      const values = [id];

      try {
        const result = await client.query(query, values);
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao excluir agendamento:', err);
        res.status(500).send('Erro ao excluir agendamento');
      }
    });

    // Rota para listar todos os clientes
    app.get('/clientes', async (req, res) => {
      try {
        const query = 'SELECT * FROM cliente';
        const result = await client.query(query);
        res.json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
        res.status(500).send('Erro ao buscar clientes!');
      }
    });

    // Rota para criar um novo cliente
    app.post('/clientes', (req, res) => {
      const { nome, sobrenome, endereco, sexo, idade, celular } = req.body;
      const query = `
        INSERT INTO cliente (nome, sobrenome, endereco, sexo, idade, celular)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [nome, sobrenome, endereco, sexo, idade, celular];

      client.query(query, values, (err, results) => {
        if (err) {
          console.error('Erro ao criar cliente:', err);
          res.status(500).send('Erro ao criar cliente');
          return;
        }
        res.json(results.rows[0]);
      });
    });

    // Rota para atualizar um cliente
    app.put('/clientes/:id', (req, res) => {
      const { nome, sobrenome, endereco, sexo, idade, celular } = req.body;
      const { id } = req.params;
      const query = `
        UPDATE cliente
        SET nome = $1, sobrenome = $2, endereco = $3, sexo = $4, idade = $5, celular = $6
        WHERE id = $7
        RETURNING *;
      `;
      const values = [nome, sobrenome, endereco, sexo, idade, celular, id];

      client.query(query, values, (err, results) => {
        if (err) {
          console.error('Erro ao atualizar cliente:', err);
          res.status(500).send('Erro ao atualizar cliente');
          return;
        }
        res.json(results.rows[0]);
      });
    });

    // Rota para deletar um cliente
    app.delete('/clientes/:id', (req, res) => {
      const { id } = req.params;
      const query = 'DELETE FROM cliente WHERE id = $1 RETURNING *;';
      const values = [id];

      client.query(query, values, (err, results) => {
        if (err) {
          console.error('Erro ao deletar cliente:', err);
          res.status(500).send('Erro ao deletar cliente');
          return;
        }
        res.json(results.rows[0]);
      });
    });

    // Rota para listar todos os usuários
    app.get('/usuarios', async (req, res) => {
      try {
        const query = 'SELECT * FROM usuario';
        const result = await client.query(query);
        res.json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        res.status(500).send('Erro ao buscar usuários!');
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
  }
}

startServer();

