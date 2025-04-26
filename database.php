<?php
// database.php - Conexão com o banco de dados usando PDO

$host = 'localhost';       // Nome do host (ou IP)
$db   = 'nome_do_banco';    // Nome do seu banco de dados
$user = 'usuario';          // Nome do usuário do banco
$pass = 'senha';            // Senha do banco
$charset = 'utf8mb4';       // Charset para suporte completo a UTF-8

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // lança exceções em erros
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // resultado como array associativo
    PDO::ATTR_EMULATE_PREPARES   => false,                  // usa prepared statements reais
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Se der erro, mata o script e exibe a mensagem
    throw new PDOException('Erro de conexão com o banco de dados: ' . $e->getMessage());
}
?>
