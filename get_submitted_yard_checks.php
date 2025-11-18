<?php
// get_submitted_yard_checks.php

// Enable error reporting for development (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/yard-check-log/php_errors.log'); // Update for your environment

// Include DB connection
include 'db_connection_info.php';

// Set JSON header
header('Content-Type: application/json');

// Read query parameters for date filtering
$startDate = isset($_GET['start']) ? $_GET['start'] : null;
$endDate   = isset($_GET['end'])   ? $_GET['end']   : null;

try {
    // Validate date parameters
    if ($startDate && $endDate) {
        $start = DateTime::createFromFormat('Y-m-d', $startDate);
        $end = DateTime::createFromFormat('Y-m-d', $endDate);
        if (!$start || !$end) {
            error_log("Invalid date format: start=$startDate, end=$endDate");
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid date format for start or end date'
            ]);
            exit;
        }
    } else {
        error_log("No date range provided: start=$startDate, end=$endDate");
        // Fetch all yard checks if no date range (for View Submitted Yard Checks)
        $stmt = $conn->query("SELECT * FROM yard_checks ORDER BY date DESC, check_time ASC");
        $yardChecks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $missingSubmissions = []; // No missing submissions without date range
    }

    // If date range provided, filter yard checks
    if ($startDate && $endDate) {
        $stmt = $conn->prepare("
            SELECT *
            FROM yard_checks
            WHERE date BETWEEN :startDate AND :endDate
            ORDER BY date ASC, check_time ASC
        ");
        $stmt->bindParam(':startDate', $startDate);
        $stmt->bindParam(':endDate', $endDate);
        $stmt->execute();
        $yardChecks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    error_log("Fetched " . count($yardChecks) . " yard checks for $startDate to $endDate");
    error_log("Raw yard checks data: " . json_encode($yardChecks));

    // 2. For each yard check, fetch related equipment statuses and calculate stats
    $result = [];
    foreach ($yardChecks as $yardCheck) {
        $yardCheckId = $yardCheck['id'];

        $stmt2 = $conn->prepare("
            SELECT yces.*, e.unit_id, e.equipment_name, e.rental_rate_daily
            FROM yard_check_equipment_status yces
            JOIN equipment e ON yces.equipment_id = e.id
            WHERE yces.yard_check_id = :yard_check_id
        ");
        $stmt2->bindParam(':yard_check_id', $yardCheckId);
        $stmt2->execute();
        $equipmentStatuses = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $totalEquipment = count($equipmentStatuses);
        $available = 0;
        $rentedOut = 0;
        $outOfService = 0;
        $estimatedProfit = 0;
        $profitLoss = 0;

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

        $yardCheck['total_equipment'] = $totalEquipment;
        $yardCheck['equipment_available'] = $available;
        $yardCheck['equipment_rented_out'] = $rentedOut;
        $yardCheck['equipment_out_of_service'] = $outOfService;
        $yardCheck['estimated_profit'] = $estimatedProfit;
        $yardCheck['profit_loss'] = $profitLoss;
        $yardCheck['equipment_statuses'] = $equipmentStatuses;

        $result[] = $yardCheck;
    }

    // 6a) Detect PM→next-day AM mismatches
    $discrepancies = [];
    for ($i = 0; $i < count($result) - 1; $i++) {
        $cur = $result[$i];
        $nxt = $result[$i + 1];

        error_log("Comparing: $cur[date] $cur[check_time] vs $nxt[date] $nxt[check_time]");

        if ($cur['check_time'] === 'PM' && $nxt['check_time'] === 'AM') {
            $pmDate = new DateTime($cur['date'] . ' 12:00:00');
            $amDate = new DateTime($nxt['date'] . ' 00:00:00');
            $diff = $pmDate->diff($amDate)->days;

            error_log("Date diff: $diff days, PM rented: $cur[equipment_rented_out], AM rented: $nxt[equipment_rented_out], PM out: $cur[equipment_out_of_service], AM out: $nxt[equipment_out_of_service]");

            if ($diff <= 1) {
                // Check for drops or unexpected increases
                if ((int)$nxt['equipment_rented_out'] < (int)$cur['equipment_rented_out']) {
                    $discrepancies[] = [
                        'type' => 'rented_out',
                        'date' => $nxt['date'],
                        'expected' => (int)$cur['equipment_rented_out'],
                        'actual' => (int)$nxt['equipment_rented_out'],
                    ];
                    error_log("Discrepancy found: rented_out drop from $cur[equipment_rented_out] to $nxt[equipment_rented_out]");
                }
                if ((int)$nxt['equipment_out_of_service'] < (int)$cur['equipment_out_of_service']) {
                    $discrepancies[] = [
                        'type' => 'out_of_service',
                        'date' => $nxt['date'],
                        'expected' => (int)$cur['equipment_out_of_service'],
                        'actual' => (int)$nxt['equipment_out_of_service'],
                    ];
                    error_log("Discrepancy found: out_of_service drop from $cur[equipment_out_of_service] to $nxt[equipment_out_of_service]");
                }
                // Optionally flag unexpected increases
                if ((int)$nxt['equipment_rented_out'] > (int)$cur['equipment_rented_out'] + 1) {
                    $discrepancies[] = [
                        'type' => 'rented_out',
                        'date' => $nxt['date'],
                        'expected' => (int)$cur['equipment_rented_out'],
                        'actual' => (int)$nxt['equipment_rented_out'],
                        'note' => 'Unexpected increase'
                    ];
                    error_log("Discrepancy found: rented_out unexpected increase from $cur[equipment_rented_out] to $nxt[equipment_rented_out]");
                }
                if ((int)$nxt['equipment_out_of_service'] > (int)$cur['equipment_out_of_service'] + 1) {
                    $discrepancies[] = [
                        'type' => 'out_of_service',
                        'date' => $nxt['date'],
                        'expected' => (int)$cur['equipment_out_of_service'],
                        'actual' => (int)$nxt['equipment_out_of_service'],
                        'note' => 'Unexpected increase'
                    ];
                    error_log("Discrepancy found: out_of_service unexpected increase from $cur[equipment_out_of_service] to $nxt[equipment_out_of_service]");
                }
            }
        }
    }

    // 6b) Detect missing submissions
    $missingSubmissions = [];
    if ($startDate && $endDate) {
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);
        $interval = new DateInterval('P1D');
        $dateRange = new DatePeriod($start, $interval, $end->modify('+1 day')); // Include end date

        $yardChecksByDate = [];
        foreach ($result as $yardCheck) {
            if (in_array($yardCheck['check_time'], ['AM', 'PM'])) {
                $yardChecksByDate[$yardCheck['date']][] = $yardCheck['check_time'];
            }
        }

        error_log("Yard checks by date: " . json_encode($yardChecksByDate));

        $hasAnySubmission = !empty($result);
        if (!$hasAnySubmission) {
            $startFormatted = $start->format('m/d/Y');
            $endFormatted = (new DateTime($endDate))->format('m/d/Y');
            $missingSubmissions[] = [
                'type' => 'week',
                'message' => "There have been no submissions for this week ($startFormatted thru $endFormatted)."
            ];
        } else {
            foreach ($dateRange as $date) {
                $dateStr = $date->format('Y-m-d');
                $formattedDate = $date->format('m/d/Y');
                $dayName = $date->format('l');

                if (!isset($yardChecksByDate[$dateStr])) {
                    $missingSubmissions[] = [
                        'type' => 'day',
                        'date' => $dateStr,
                        'message' => "No yard check submissions (AM or PM) for $dayName, $formattedDate."
                    ];
                } else {
                    $checkTimes = $yardChecksByDate[$dateStr];
                    if (!in_array('AM', $checkTimes)) {
                        $missingSubmissions[] = [
                            'type' => 'am',
                            'date' => $dateStr,
                            'message' => "Missing AM yard check submission for $dayName, $formattedDate."
                        ];
                    }
                    if (!in_array('PM', $checkTimes)) {
                        $missingSubmissions[] = [
                            'type' => 'pm',
                            'date' => $dateStr,
                            'message' => "Missing PM yard check submission for $dayName, $formattedDate."
                        ];
                    }
                }
            }
        }

        error_log("Missing submissions: " . json_encode($missingSubmissions));
    }

    // 6c) Return yard checks, discrepancies, and missing submissions
    echo json_encode([
        'yardChecks' => $result,
        'discrepancies' => $discrepancies,
        'missingSubmissions' => $missingSubmissions
    ]);

} catch (Exception $e) {
    error_log("Server error: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
exit;
?>
