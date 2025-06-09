<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');
header('Content-Type: application/json');

try {
    // Get JSON data
    $json = file_get_contents('php://input');
    error_log("Received data: " . $json);

    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    if (!isset($data['order']) || !is_array($data['order'])) {
        throw new Exception('Invalid data format');
    }

    // Connect to database - Fix the include path
    require_once 'db_connection_info.php';
    
    // Start transaction
    $conn->beginTransaction();

    // First reset all positions
    $resetStmt = $conn->prepare("UPDATE equipment SET display_order = 0");
    $resetStmt->execute();

    // Then update with new positions
    $stmt = $conn->prepare("UPDATE equipment SET display_order = :position WHERE id = :id");
    
    foreach ($data['order'] as $item) {
        error_log("Processing item: id=" . $item['id'] . ", position=" . $item['position']);
        
        if (!isset($item['id']) || !isset($item['position'])) {
            throw new Exception('Invalid item format');
        }
        
        $result = $stmt->execute([
            ':position' => $item['position'],
            ':id' => $item['id']
        ]);
        
        if (!$result) {
            throw new Exception('Failed to update item: ' . implode(', ', $stmt->errorInfo()));
        }
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Equipment order updated successfully']);

} catch (Exception $e) {
    error_log("Error in reorder_equipment.php: " . $e->getMessage());
    
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
