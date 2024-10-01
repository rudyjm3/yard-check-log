<?php
// save_equipment.php

include 'db_connection.php';

// Collect form data
$unit_id = $_POST['unit_id'];
$equipment_name = $_POST['equipment_name'];
$manufacturer = $_POST['manufacturer'];
$model = $_POST['model'];
$image_url = $_POST['image_url']; // New line to collect image URL
$rental_rate_4h = $_POST['rental_rate_4h'];
$rental_rate_daily = $_POST['rental_rate_daily'];
$rental_rate_weekly = $_POST['rental_rate_weekly'];
$rental_rate_monthly = $_POST['rental_rate_monthly'];

if (!empty($_POST['equipment_id'])) {
    // Update existing equipment
    $stmt = $conn->prepare("UPDATE equipment SET unit_id = :unit_id, equipment_name = :equipment_name, manufacturer = :manufacturer, model = :model, rental_rate_4h = :rental_rate_4h, rental_rate_daily = :rental_rate_daily, rental_rate_weekly = :rental_rate_weekly, rental_rate_monthly = :rental_rate_monthly WHERE id = :id");
    $stmt->bindParam(':id', $_POST['equipment_id']);
} else {
    // Insert new equipment
    $stmt = $conn->prepare("INSERT INTO equipment (unit_id, equipment_name, manufacturer, model, rental_rate_4h, rental_rate_daily, rental_rate_weekly, rental_rate_monthly) VALUES (:unit_id, :equipment_name, :manufacturer, :model, :rental_rate_4h, :rental_rate_daily, :rental_rate_weekly, :rental_rate_monthly)");
}

$stmt->bindParam(':unit_id', $unit_id);
$stmt->bindParam(':equipment_name', $equipment_name);
$stmt->bindParam(':manufacturer', $manufacturer);
$stmt->bindParam(':model', $model);
$stmt->bindParam(':image_url', $image_url); // Bind the image URL parameter
$stmt->bindParam(':rental_rate_4h', $rental_rate_4h);
$stmt->bindParam(':rental_rate_daily', $rental_rate_daily);
$stmt->bindParam(':rental_rate_weekly', $rental_rate_weekly);
$stmt->bindParam(':rental_rate_monthly', $rental_rate_monthly);

$stmt->execute();

echo "Success";
?>
