const express = require('express');
const cors = require('cors');
const agendamentosRoutes = require('./routes/agendamentosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/clientes', clientesRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});