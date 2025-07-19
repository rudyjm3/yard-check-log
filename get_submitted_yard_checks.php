<?php
// get_submitted_yard_checks.php

// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired

// Enable error reporting for development (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include DB connection
include 'db_connection_info.php';

// Set JSON header
header('Content-Type: application/json');

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
        $stmt->bindParam(':endDate', $endDate);
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

    // 6a) Detect PM→next-day AM mismatches
    $discrepancies = [];
    for ($i = 0; $i < count($result) - 1; $i++) {
        $cur = $result[$i];
        $nxt = $result[$i + 1];

        if ($cur['check_time'] === 'PM' && $nxt['check_time'] === 'AM') {
            // Map AM/PM to specific times for DateTime
            $pmTime = $cur['check_time'] === 'PM' ? '12:00:00' : '00:00:00';
            $amTime = $nxt['check_time'] === 'AM' ? '00:00:00' : '12:00:00';

            $pmDate = new DateTime($cur['date'] . ' ' . $pmTime);
            $amDate = new DateTime($nxt['date'] . ' ' . $amTime);

            if ($pmDate->diff($amDate)->days <= 1) {
                // rented-out drop?
                if ((int)$nxt['equipment_rented_out'] < (int)$cur['equipment_rented_out']) {
                    $discrepancies[] = [
                        'type'     => 'rented_out',
                        'date'     => $nxt['date'],
                        'expected' => (int)$cur['equipment_rented_out'],
                        'actual'   => (int)$nxt['equipment_rented_out'],
                    ];
                }
                // out-of-service drop?
                if ((int)$nxt['equipment_out_of_service'] < (int)$cur['equipment_out_of_service']) {
                    $discrepancies[] = [
                        'type'     => 'out_of_service',
                        'date'     => $nxt['date'],
                        'expected' => (int)$cur['equipment_out_of_service'],
                        'actual'   => (int)$nxt['equipment_out_of_service'],
                    ];
                }
            }
        }
    }

    // 6b) Return yard checks + discrepancies
    echo json_encode([
        'yardChecks'    => $result,
        'discrepancies' => $discrepancies
    ]);

} catch (Exception $e) {
    // Return error as JSON
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
exit;
?>
