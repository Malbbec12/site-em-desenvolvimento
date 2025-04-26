-- Tabela de Lojistas
CREATE TABLE lojistas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lojista_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lojista_id) REFERENCES lojistas(id) ON DELETE CASCADE
);

-- Tabela de Ordens de Serviço
CREATE TABLE ordens_servico (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cliente_id BIGINT NOT NULL,
    descricao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tabela de Status da Ordem de Serviço (Histórico de movimentações)
CREATE TABLE status_ordem_servico (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ordem_servico_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE
);
