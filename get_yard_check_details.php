<?php
// get_yard_check_details.php

include 'db_connection.php';

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

$yardCheck['equipment_statuses'] = $equipmentStatuses;

echo json_encode($yardCheck);
?>
