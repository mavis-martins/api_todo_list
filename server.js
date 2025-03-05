const http = require("http");
const url = require("url");
const db = require("./db");
const qs = require("querystring");

const server = http.createServer((req, res) => {
  const { method, url: reqUrl } = req;
  const parsedUrl = url.parse(reqUrl, true);
  const path = parsedUrl.pathname;

  //Header
  res.setHeader("Content-Type", "application/json");

  //Routes
  if (method === "GET" && path === "/activities") {
    db.query(`SELECT * FROM activity`, (err, result) => {
      if (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal Server Error" }));
        return;
      }
      if (!result || !result.rows) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Erro ao consultar atividades" }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify(result.rows));
    });
  } else if (method === "POST" && path === "/activities") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { name, category } = JSON.parse(body); // ✅ Parseando corretamente o JSON

        if (!name || !category) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: "Os campos 'name' e 'category' são obrigatórios",
            })
          );
          return;
        }

        const query =
          "INSERT INTO activity (name, category, created_at, updated_at) VALUES($1, $2, NOW(), NOW()) RETURNING *";
        db.query(query, [name, category], (err, result) => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Erro ao inserir atividade" }));
            return;
          }
          res.statusCode = 201;
          res.end(JSON.stringify(result.rows[0]));
        });
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "JSON inválido" }));
      }
    });
  } else if (method === "PATCH" && path.startsWith("/activity")) {
    const id = path.split("/")[2];
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const { name, category } = JSON.parse(body);

      const updates = [];
      const values = [];
      let index = 1;

      if (name) {
        updates.push(`name = $${index}`);
        values.push(name);
        index++;
      }

      if (category) {
        updates.push(`category = $${index}`);
        values.push(category);
        index++;
      }

      if (updates.length === 0) {
        res.statusCode = 400;
        return res.end(
          JSON.stringify({ error: "Nenhum campo para atualizar" })
        );
      }

      const query = `UPDATE activity SET ${updates.join(
        ", "
      )}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
      values.push(id);

      db.query(query, values, (err, result) => {
        if (err) {
          res.statusCode = 500;
          return res.end(
            JSON.stringify({ error: "Erro ao atualizar atividade" })
          );
        }
        if (!result || result.rowCount === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: "Atividade não encontrada" }));
        }

        res.statusCode = 200;
        res.end(JSON.stringify(result.rows[0]));
      });
    });
  } else if (method === "DELETE" && path.startsWith("/activity")) {
    const id = path.split("/")[2];
    const query = "DELETE FROM activity WHERE id = $1";
    db.query(query, [id], (err, result) => {
      if (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: "Erro ao excluir atividade" }));
      }
      if (!result || result.rowCount === 0) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Atividade não encontrada" }));
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ message: "Atividade excluída com sucesso" }));
    });
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Route Not Found" }));
  }
});

server.listen(3005, () => {
  console.log("Servidor rodando na porta 3005");
});
