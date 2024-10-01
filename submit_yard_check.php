<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// submit_yard_check.php

include 'db_connection_info.php';

// Collect form data
$user_name = $_POST['user_name'];
$date = $_POST['check_date'];
$check_time = $_POST['check_time'];
$submission_time = date('H:i:s');
$submission_date_time = $_POST['submission_date_time'];

// Check for duplicate yard check
$stmt = $conn->prepare("SELECT * FROM yard_checks WHERE date = :date AND check_time = :check_time");
$stmt->bindParam(':date', $date);
$stmt->bindParam(':check_time', $check_time);
$stmt->execute();
$existingYardCheck = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existingYardCheck) {
    // Duplicate found
    echo json_encode([
        'status' => 'error',
        'existingYardCheck' => $existingYardCheck
    ]);
    exit;
}

// Insert yard check
$stmt = $conn->prepare("INSERT INTO yard_checks (user_name, date, check_time, submission_time, submission_date_time) VALUES (:user_name, :date, :check_time, :submission_time, :submission_date_time)");
$stmt->bindParam(':user_name', $user_name);
$stmt->bindParam(':date', $date);
$stmt->bindParam(':check_time', $check_time);
$stmt->bindParam(':submission_time', $submission_time);
$stmt->bindParam(':submission_date_time', $submission_date_time);
$stmt->execute();

$yard_check_id = $conn->lastInsertId();

// Insert equipment statuses
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

echo json_encode(['status' => 'success']);
?>
