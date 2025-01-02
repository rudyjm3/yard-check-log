<?php
// activate_equipment.php

include 'db_connection_info.php';

$id = $_GET['id'];

try {
    // Mark the equipment as active again
    $stmt = $conn->prepare("UPDATE equipment
                            SET is_active = 1
                            WHERE id = :id");
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    echo json_encode(['status' => 'success', 'message' => 'Equipment activated successfully.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
