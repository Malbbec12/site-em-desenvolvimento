<?php
// save_order.php - Save service order data to database

// Include database connection
require_once 'database.php';

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data from request body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Check if all required fields are present
    if (isset($data['order_id']) && isset($data['client_name']) && 
        isset($data['device_model']) && isset($data['service_description']) && 
        isset($data['status'])) {
        
        try {
            // Begin transaction
            $pdo->beginTransaction();
            
            // Check if the order already exists
            $stmt = $pdo->prepare("SELECT order_id FROM service_orders WHERE order_id = ?");
            $stmt->execute([$data['order_id']]);
            $exists = $stmt->fetch();
            
            if ($exists) {
                // Update existing order
                $stmt = $pdo->prepare("
                    UPDATE service_orders 
                    SET client_name = ?, device_model = ?, service_description = ?, status = ?
                    WHERE order_id = ?
                ");
                $stmt->execute([
                    $data['client_name'],
                    $data['device_model'],
                    $data['service_description'],
                    $data['status'],
                    $data['order_id']
                ]);
            } else {
                // Insert new order
                $stmt = $pdo->prepare("
                    INSERT INTO service_orders (order_id, client_name, device_model, service_description, status)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['order_id'],
                    $data['client_name'],
                    $data['device_model'],
                    $data['service_description'],
                    $data['status']
                ]);
            }
            
            // Insert into status history
            $stmt = $pdo->prepare("
                INSERT INTO status_history (order_id, status)
                VALUES (?, ?)
            ");
            $stmt->execute([
                $data['order_id'],
                $data['status']
            ]);
            
            // Commit transaction
            $pdo->commit();
            
            // Send success response
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Ordem de serviço salva com sucesso']);
            
        } catch (PDOException $e) {
            // Rollback transaction on error
            $pdo->rollBack();
            
            // Send error response
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Erro ao salvar: ' . $e->getMessage()]);
        }
        
    } else {
        // Missing required fields
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
    }
} else {
    // Method not allowed
    header('HTTP/1.1 405 Method Not Allowed');
    header('Allow: POST');
    echo 'Method Not Allowed';
}
