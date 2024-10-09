<?php
// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired


// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// delete_equipment.php

include 'db_connection_info.php';

$id = $_GET['id'];

// Delete equipment
$stmt = $conn->prepare("DELETE FROM equipment WHERE id = :id");
$stmt->bindParam(':id', $id);
$stmt->execute();

echo "Success";
?>
