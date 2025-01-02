<?php
// get_equioment.php


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
   if (isset($_GET['onlyActive']) && $_GET['onlyActive'] == 'true') {
      $stmt = $conn->query("SELECT * FROM equipment WHERE is_active = 1");
  } else {
      $stmt = $conn->query("SELECT * FROM equipment");
  }
  $equipmentList = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($equipmentList);
  
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
