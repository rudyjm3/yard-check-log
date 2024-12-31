<?php
//save_equipment.php


// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired


// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// save_equipment.php

include 'db_connection_info.php';

// Collect form data
$unit_id = $_POST['unit_id'];
$equipment_name = $_POST['equipment_name'];
$manufacturer = $_POST['manufacturer'];
$model = $_POST['model'];
$rental_rate_4h = $_POST['rental_rate_4h'];
$rental_rate_daily = $_POST['rental_rate_daily'];
$rental_rate_weekly = $_POST['rental_rate_weekly'];
$rental_rate_monthly = $_POST['rental_rate_monthly'];
$image_url = $_POST['image_url']; // New line to collect image URL

try {
    if (!empty($_POST['equipment_id'])) {
        // Update existing equipment
        $stmt = $conn->prepare("UPDATE equipment SET
            unit_id = :unit_id,
            equipment_name = :equipment_name,
            manufacturer = :manufacturer,
            model = :model,
            rental_rate_4h = :rental_rate_4h,
            rental_rate_daily = :rental_rate_daily,
            rental_rate_weekly = :rental_rate_weekly,
            rental_rate_monthly = :rental_rate_monthly,
            image_url = :image_url
            WHERE id = :id");

        $params = [
            ':unit_id' => $unit_id,
            ':equipment_name' => $equipment_name,
            ':manufacturer' => $manufacturer,
            ':model' => $model,
            ':rental_rate_4h' => $rental_rate_4h,
            ':rental_rate_daily' => $rental_rate_daily,
            ':rental_rate_weekly' => $rental_rate_weekly,
            ':rental_rate_monthly' => $rental_rate_monthly,
            ':image_url' => $image_url,
            ':id' => $_POST['equipment_id']
        ];
    } else {
        // Insert new equipment
        $stmt = $conn->prepare("INSERT INTO equipment
            (unit_id, equipment_name, manufacturer, model, rental_rate_4h, rental_rate_daily, rental_rate_weekly, rental_rate_monthly, image_url)
            VALUES
            (:unit_id, :equipment_name, :manufacturer, :model, :rental_rate_4h, :rental_rate_daily, :rental_rate_weekly, :rental_rate_monthly, :image_url)");

        $params = [
            ':unit_id' => $unit_id,
            ':equipment_name' => $equipment_name,
            ':manufacturer' => $manufacturer,
            ':model' => $model,
            ':rental_rate_4h' => $rental_rate_4h,
            ':rental_rate_daily' => $rental_rate_daily,
            ':rental_rate_weekly' => $rental_rate_weekly,
            ':rental_rate_monthly' => $rental_rate_monthly,
            ':image_url' => $image_url
        ];
    }

    // Execute the statement with parameters
    $stmt->execute($params);

    // Return success response
    echo json_encode(['status' => 'success', 'message' => 'Equipment saved successfully.']);
} catch (PDOException $e) {
    // Return error response
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
