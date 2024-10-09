<?php
// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired


// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// get_equipment.php

include 'db_connection_info.php';

try {
    if (isset($_GET['id'])) {
        // Fetch a single equipment item
        $stmt = $conn->prepare("SELECT * FROM equipment WHERE id = :id");
        $stmt->bindParam(':id', $_GET['id']);
        $stmt->execute();
        $equipment = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($equipment);
    } else {
        // Fetch all equipment
        $stmt = $conn->query("SELECT * FROM equipment");
        $equipmentList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($equipmentList);
    }
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
