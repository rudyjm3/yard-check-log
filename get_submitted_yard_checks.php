<?php
// get_submitted_yard_checks.php

// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include DB connection
include 'db_connection_info.php';

// Read optional query parameters for date filtering
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
$endDate   = isset($_GET['end_date'])   ? $_GET['end_date']   : null;

try {
    // 1. Build main query, conditionally filtering by start/end date
    if ($startDate && $endDate) {
        // Filter by date range
        $stmt = $conn->prepare("
            SELECT *
            FROM yard_checks
            WHERE date BETWEEN :startDate AND :endDate
            ORDER BY date DESC, check_time ASC
        ");
        $stmt->bindParam(':startDate', $startDate);
        $stmt->bindParam(':endDate',   $endDate);
        $stmt->execute();
    } else {
        // No date filter => fetch all yard checks
        $stmt = $conn->query("SELECT * FROM yard_checks ORDER BY date DESC, check_time ASC");
    }

    $yardChecks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. For each yard check, fetch related equipment statuses and calculate stats
    $result = [];
    foreach ($yardChecks as $yardCheck) {
        $yardCheckId = $yardCheck['id'];

        // Retrieve equipment statuses associated with this yard_check_id
        $stmt2 = $conn->prepare("
            SELECT yces.*, e.unit_id, e.equipment_name, e.rental_rate_daily
            FROM yard_check_equipment_status yces
            JOIN equipment e ON yces.equipment_id = e.id
            WHERE yces.yard_check_id = :yard_check_id
        ");
        $stmt2->bindParam(':yard_check_id', $yardCheckId);
        $stmt2->execute();
        $equipmentStatuses = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // Initialize counters
        $totalEquipment   = count($equipmentStatuses);
        $available        = 0;
        $rentedOut        = 0;
        $outOfService     = 0;
        $estimatedProfit  = 0;
        $profitLoss       = 0;

        // 3. Tally stats based on equipment_status
        foreach ($equipmentStatuses as $status) {
            switch ($status['equipment_status']) {
                case 'Available':
                    $available++;
                    break;
                case 'Rented':
                    $rentedOut++;
                    $estimatedProfit += $status['rental_rate_daily'];
                    break;
                case 'Out of Service':
                    $outOfService++;
                    $profitLoss += $status['rental_rate_daily'];
                    break;
            }
        }

        // 4. Attach stats to the yardCheck array
        $yardCheck['total_equipment']              = $totalEquipment;
        $yardCheck['equipment_available']          = $available;
        $yardCheck['equipment_rented_out']         = $rentedOut;
        $yardCheck['equipment_out_of_service']     = $outOfService;
        $yardCheck['estimated_profit']             = $estimatedProfit;
        $yardCheck['profit_loss']                  = $profitLoss;

        // 5. Push this yard check (with computed stats) into the final result
        $result[] = $yardCheck;
    }

    // 6. Output the final array as JSON
    echo json_encode($result);

} catch (PDOException $e) {
    // In case of error, send an error message as JSON
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
