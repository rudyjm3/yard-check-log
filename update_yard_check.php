<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// update_yard_check.php

include 'db_connection_info.php';

$yard_check_id = $_POST['yard_check_id'];
$user_name = $_POST['user_name'];
$date = $_POST['check_date'];
$check_time = $_POST['check_time'];

// Update yard check
$stmt = $conn->prepare("UPDATE yard_checks SET user_name = :user_name, date = :date, check_time = :check_time WHERE id = :id");
$stmt->bindParam(':user_name', $user_name);
$stmt->bindParam(':date', $date);
$stmt->bindParam(':check_time', $check_time);
$stmt->bindParam(':id', $yard_check_id);
$stmt->execute();

// Delete existing equipment statuses
$stmt = $conn->prepare("DELETE FROM yard_check_equipment_status WHERE yard_check_id = :yard_check_id");
$stmt->bindParam(':yard_check_id', $yard_check_id);
$stmt->execute();

// Insert new equipment statuses
foreach ($_POST as $key => $value) {
    if (strpos($key, 'equipment_status_') === 0) {
        $unit_id = substr($key, strlen('equipment_status_'));
        $equipment_status = $value;

        // Get equipment ID
        $stmt = $conn->prepare("SELECT id FROM equipment WHERE unit_id = :unit_id");
        $stmt->bindParam(':unit_id', $unit_id);
        $stmt->execute();
        $equipment = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($equipment) {
            $equipment_id = $equipment['id'];
            // Insert status
            $stmt = $conn->prepare("INSERT INTO yard_check_equipment_status (yard_check_id, equipment_id, equipment_status) VALUES (:yard_check_id, :equipment_id, :equipment_status)");
            $stmt->bindParam(':yard_check_id', $yard_check_id);
            $stmt->bindParam(':equipment_id', $equipment_id);
            $stmt->bindParam(':equipment_status', $equipment_status);
            $stmt->execute();
        }
    }
}

echo "Success";
?>
