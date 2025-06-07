<?php
// update_asset_order.php
header('Content-Type: application/json');
require_once 'db_connection_info.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['ordered']) || !is_array($data['ordered'])) {
  echo json_encode(['success' => false, 'error' => 'Invalid payload']);
  exit;
}

$orderedIds = $data['ordered']; // e.g. ["3","7","1","2", …]

// Begin transaction to update multiple rows
$conn->beginTransaction();

try {
  // Prepare a statement to update display_order for one record
  $stmt = $conn->prepare("
    UPDATE equipment
    SET display_order = :pos
    WHERE id = :id
  ");

  // Loop through ordered IDs, assign incrementing positions
  foreach ($orderedIds as $position => $id) {
    $stmt->bindValue(':pos', $position, PDO::PARAM_INT);
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();
  }

  $conn->commit();
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  $conn->rollBack();
  echo json_encode([
    'success' => false,
    'error' => $e->getMessage()
  ]);
}
