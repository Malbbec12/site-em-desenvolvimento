// Importando o módulo de conexão com o banco
const db = require('./dbConnection');

/**
 * Função para salvar os dados do formulário da ordem de serviço
 * Esta função será chamada pelo evento do botão "Salvar" no formulário do lojista
 */
async function salvarDados() {
  try {
    // 1. Capturar os dados do formulário
    const codigo = document.getElementById('ordem').value;
    const nomeCliente = document.getElementById('nome').value;
    const marcaModelo = document.getElementById('modelo').value;
    const servico = document.getElementById('servico').value;
    const status = document.getElementById('status').value;
    
    // Validação básica dos campos obrigatórios
    if (!codigo || !nomeCliente || !marcaModelo) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return false;
    }
    
    // 2. Obter cliente ou criar se não existir
    let clienteId;
    
    // Verificar se o cliente já existe pelo nome
    const clientesExistentes = await db.executeQuery(
      'SELECT id FROM clientes WHERE nome = ?',
      [nomeCliente]
    );
    
    if (clientesExistentes.length > 0) {
      // Cliente já existe
      clienteId = clientesExistentes[0].id;
    } else {
      // Cliente não existe, criar novo
      const novoClienteResult = await db.executeQuery(
        'INSERT INTO clientes (nome) VALUES (?)',
        [nomeCliente]
      );
      clienteId = novoClienteResult.insertId;
    }
    
    // 3. Verificar se a ordem já existe
    const ordensExistentes = await db.executeQuery(
      'SELECT id, status FROM ordens_servico WHERE codigo = ?',
      [codigo]
    );
    
    // 4. Processar baseado na existência da ordem
    if (ordensExistentes.length > 0) {
      // Ordem já existe, atualizar dados
      const ordemId = ordensExistentes[0].id;
      const statusAnterior = ordensExistentes[0].status;
      
      // Atualizar ordem de serviço
      await db.executeQuery(
        `UPDATE ordens_servico 
         SET cliente_id = ?, 
             marca_modelo = ?, 
             servico_executado = ?,
             status = ?
         WHERE id = ?`,
        [clienteId, marcaModelo, servico, status, ordemId]
      );
      
      // Registrar alteração de status se houver mudança
      if (statusAnterior !== status) {
        // Assumindo que o usuário logado tem ID 1 (admin)
        const usuarioId = 1;
        await db.executeQuery(
          `INSERT INTO historico_status 
           (ordem_id, status_anterior, status_novo, usuario_id, observacao)
           VALUES (?, ?, ?, ?, ?)`,
          [ordemId, statusAnterior, status, usuarioId, `Status atualizado via formulário`]
        );
        
        // Atualizar datas especiais baseado no status
        if (status === 'Orçamento aprovado') {
          await db.executeQuery(
            'UPDATE ordens_servico SET data_aprovacao = CURRENT_TIMESTAMP WHERE id = ?',
            [ordemId]
          );
        } else if (status === 'Celular está pronto') {
          await db.executeQuery(
            'UPDATE ordens_servico SET data_conclusao = CURRENT_TIMESTAMP WHERE id = ?',
            [ordemId]
          );
        }
      }
      
      alert(`Ordem de serviço #${codigo} atualizada com sucesso!`);
      
    } else {
      // Ordem não existe, criar nova
      const novaOrdem = await db.executeQuery(
        `INSERT INTO ordens_servico 
         (codigo, cliente_id, marca_modelo, servico_executado, status)
         VALUES (?, ?, ?, ?, ?)`,
        [codigo, clienteId, marcaModelo, servico, status]
      );
      
      // Registrar primeiro status no histórico
      const ordemId = novaOrdem.insertId;
      // Assumindo que o usuário logado tem ID 1 (admin)
      const usuarioId = 1;
      await db.executeQuery(
        `INSERT INTO historico_status 
         (ordem_id, status_anterior, status_novo, usuario_id, observacao)
         VALUES (?, ?, ?, ?, ?)`,
        [ordemId, null, status, usuarioId, 'Ordem criada']
      );
      
      alert(`Nova ordem de serviço #${codigo} criada com sucesso!`);
    }
    
    // 5. Limpar o formulário após salvar
    limparFormulario();
    return true;
    
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    alert(`Erro ao salvar dados: ${error.message}`);
    return false;
  }
}

/**
 * Função para consultar uma ordem de serviço pelo código
 * Esta função será chamada pelo evento do botão "Consultar" na área do cliente
 */
async function consultarOrdem() {
  try {
    const codigoConsulta = document.getElementById('consultaOrdem').value;
    const resultado = document.getElementById('resultadoConsulta');
    
    if (!codigoConsulta) {
      resultado.innerHTML = "Por favor, digite o código da ordem de serviço.";
      return;
    }
    
    // Buscar ordem e informações do cliente
    const ordens = await db.executeQuery(
      `SELECT o.*, c.nome as nome_cliente
       FROM ordens_servico o
       JOIN clientes c ON o.cliente_id = c.id
       WHERE o.codigo = ?`,
      [codigoConsulta]
    );
    
    if (ordens.length > 0) {
      const ordem = ordens[0];
      
      // Formatando as datas para exibição
      const dataEntrada = new Date(ordem.data_entrada).toLocaleDateString('pt-BR');
      
      resultado.innerHTML = `
        <strong>Nome:</strong> ${ordem.nome_cliente}<br>
        <strong>Marca/Modelo:</strong> ${ordem.marca_modelo}<br>
        <strong>Serviço:</strong> ${ordem.servico_executado || 'Não especificado'}<br>
        <strong>Status:</strong> ${ordem.status}<br>
        <strong>Data de entrada:</strong> ${dataEntrada}<br>
      `;
      
      // Adicionar informações adicionais baseado no status
      if (ordem.status === 'Orçamento aprovado') {
        const dataAprovacao = new Date(ordem.data_aprovacao).toLocaleDateString('pt-BR');
        resultado.innerHTML += `<strong>Aprovado em:</strong> ${dataAprovacao}<br>`;
      }
      
      if (ordem.status === 'Celular está pronto') {
        const dataConclusao = new Date(ordem.data_conclusao).toLocaleDateString('pt-BR');
        resultado.innerHTML += `<strong>Concluído em:</strong> ${dataConclusao}<br>`;
      }
      
      // Mostrar valor se disponível
      if (ordem.valor_final) {
        resultado.innerHTML += `<strong>Valor:</strong> R$ ${ordem.valor_final.toFixed(2)}<br>`;
      } else if (ordem.valor_orcamento) {
        resultado.innerHTML += `<strong>Valor do orçamento:</strong> R$ ${ordem.valor_orcamento.toFixed(2)}<br>`;
      }
      
    } else {
      resultado.innerHTML = "Ordem de serviço não encontrada.";
    }
    
  } catch (error) {
    console.error('Erro ao consultar ordem:', error);
    document.getElementById('resultadoConsulta').innerHTML = `Erro ao consultar: ${error.message}`;
  }
}

/**
 * Função para carregar dados de uma ordem existente no formulário do lojista
 */
async function carregarOrdem(codigo) {
  try {
    const ordens = await db.executeQuery(
      `SELECT o.*, c.nome as nome_cliente
       FROM ordens_servico o
       JOIN clientes c ON o.cliente_id = c.id
       WHERE o.codigo = ?`,
      [codigo]
    );
    
    if (ordens.length > 0) {
      const ordem = ordens[0];
      
      // Preencher o formulário com os dados
      document.getElementById('ordem').value = ordem.codigo;
      document.getElementById('nome').value = ordem.nome_cliente;
      document.getElementById('modelo').value = ordem.marca_modelo;
      document.getElementById('servico').value = ordem.servico_executado || '';
      
      // Selecionar o status atual
      const selectStatus = document.getElementById('status');
      for (let i = 0; i < selectStatus.options.length; i++) {
        if (selectStatus.options[i].value === ordem.status) {
          selectStatus.selectedIndex = i;
          break;
        }
      }
      
      return true;
    } else {
      alert('Ordem não encontrada!');
      return false;
    }
    
  } catch (error) {
    console.error('Erro ao carregar ordem:', error);
    alert(`Erro ao carregar ordem: ${error.message}`);
    return false;
  }
}

/**
 * Função para limpar o formulário
 */
function limparFormulario() {
  document.getElementById('ordem').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('modelo').value = '';
  document.getElementById('servico').value = '';
  document.getElementById('status').selectedIndex = 0;
}

// Exportar as funções para uso global
module.exports = {
  salvarDados,
  consultarOrdem,
  carregarOrdem,
  limparFormulario
};

// Para uso em navegador, atribuir ao escopo global
if (typeof window !== 'undefined') {
  window.salvarDados = salvarDados;
  window.consultarOrdem = consultarOrdem;
  window.carregarOrdem = carregarOrdem;
  window.limparFormulario = limparFormulario;
}
