<?php
// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired


// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// delete_equipment.php

require 'db_connection_info.php';

$equipmentId = $_GET['id'];

// Instead of deleting, mark as deleted
$stmt = $conn->prepare("UPDATE equipment SET is_deleted = 1 WHERE id = ?");
$stmt->bind_param("i", $equipmentId);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['status' => 'success', 'message' => 'Equipment marked as deleted successfully']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to mark equipment as deleted']);
}

$stmt->close();
$conn->close();
?>
