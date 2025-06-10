<?php
// Disable error reporting for production
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

try {
    // Get JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON format');
    }

    if (!isset($data['order']) || !is_array($data['order'])) {
        throw new Exception('Invalid data format');
    }

    require_once 'db_connection_info.php';
    
    $conn->beginTransaction();

    // Reset all positions
    $resetStmt = $conn->prepare("UPDATE equipment SET display_order = 0");
    $resetStmt->execute();

    // Update with new positions
    $stmt = $conn->prepare("UPDATE equipment SET display_order = :position WHERE id = :id");
    
    foreach ($data['order'] as $item) {
        if (!isset($item['id']) || !isset($item['position'])) {
            throw new Exception('Invalid item format');
        }
        
        $result = $stmt->execute([
            ':position' => $item['position'],
            ':id' => $item['id']
        ]);
        
        if (!$result) {
            throw new Exception('Failed to update item order');
        }
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Order updated successfully']);

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to update equipment order'
    ]);
}
?>
