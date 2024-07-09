const { Client } = require('pg');
const express = require('express');
const cors = require('cors');
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

app.use(cors({
  origin: 'http://localhost:9000'
}));

async function startServer() {
  try {
    await client.connect();
    console.log('Conectando ao banco de dados...');

    // Create table
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

     // Rota para listar todos os clientes
     app.get('/usuario', async (req, res) => {
      try {
        const query = 'SELECT * FROM usuario';
        const result = await client.query(query);
        console.log('Usuarios: ', result.rows);
        res.json(result.rows)
      } catch (err) {
        console.error('Erro ao buscar usuário: ', err);
        res.status(500).send('Erro ao buscar usuário!');
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
