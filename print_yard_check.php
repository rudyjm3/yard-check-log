<?php
// print_yard_check.php


// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired


// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// print_yard_check.php

include 'db_connection_info.php';

$id = $_GET['id'];

// Fetch yard check details
$stmt = $conn->prepare("SELECT * FROM yard_checks WHERE id = :id");
$stmt->bindParam(':id', $id);
$stmt->execute();
$yardCheck = $stmt->fetch(PDO::FETCH_ASSOC);

// Fetch equipment statuses
$stmt = $conn->prepare("SELECT yces.*, e.unit_id, e.equipment_name FROM yard_check_equipment_status yces JOIN equipment e ON yces.equipment_id = e.id WHERE yces.yard_check_id = :yard_check_id");
$stmt->bindParam(':yard_check_id', $id);
$stmt->execute();
$equipmentStatuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

?>

<!DOCTYPE html>
<html>
<head>
   <title>Yard Check Print</title>
   <style>
      body { font-family: Arial, sans-serif; }
      h2 { text-align: center; }
      .equipment-item { border-bottom: 1px solid #ccc; padding: 10px 0; }
      .equipment-item:last-child { border-bottom: none; }
      .status-print-color {
         color: #f6f6f6;
         font-weight: 600;
         padding: 5px 8px;
         border-radius: 4px;
      }

      .status-available {
      background-color: #0dca1c; /* Green */
      }

      .status-rented {
      background-color: #4aa5eb; /* Blue */
      }

      .status-out-of-service {
      background-color: #dc3545; /* Red */
      }
    </style>
</head>
<body>

   <h2>Yard Check Details</h2>
   <p><strong>Date:</strong> 
      <?php echo date('m/d/Y', strtotime($yardCheck['date'])); ?>
   </p>
   <p><strong>Time:</strong> <?php echo $yardCheck['check_time']; ?></p>
   <p><strong>Submitted by:</strong> <?php echo $yardCheck['user_name']; ?></p>
   <hr>
   <h3>Equipment Statuses</h3>
   <?php foreach ($equipmentStatuses as $status): ?>
      <div class="equipment-item">
            <p><strong>Unit ID:</strong> <?php echo $status['unit_id']; ?></p>
            <p><strong>Equipment Name:</strong> <?php echo $status['equipment_name']; ?></p>
            <p><strong>Status:</strong> <span class="status-print-color status-<?php echo strtolower(str_replace(' ', '-', $status['equipment_status'])); ?>">
            <?php echo $status['equipment_status']; ?>
            </span></p>
      </div>
   <?php endforeach; ?>
   <script>
      window.onload = function() {
            window.print();
      };
   </script>
</body>
</html>
