<?php
// deactivate_equipment.php

include 'db_connection_info.php';

$id = $_GET['id'];

try {
    // Instead of DELETE, we set is_active = 0
    $stmt = $conn->prepare("UPDATE equipment
                            SET is_active = 0
                            WHERE id = :id");
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    echo json_encode(['status' => 'success', 'message' => 'Equipment deactivated successfully.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
