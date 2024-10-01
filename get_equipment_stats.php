<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// get_equipment_stats.php

include 'db_connection_info.php';

$start_date = $_GET['start_date'];
$end_date = $_GET['end_date'];

// Fetch all equipment
$stmt = $conn->query("SELECT * FROM equipment");
$equipmentList = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Initialize stats arrays
$total_estimated_profit = 0;
$total_profit_loss = 0;
$equipmentStats = [];

foreach ($equipmentList as $equipment) {
    $equipment_id = $equipment['id'];
    $equipment_name = $equipment['equipment_name'];
    $rental_rate_daily = $equipment['rental_rate_daily'];

    // Fetch rental days
    $stmt = $conn->prepare("
        SELECT COUNT(DISTINCT date) as days_rented
        FROM yard_check_equipment_status yces
        JOIN yard_checks yc ON yces.yard_check_id = yc.id
        WHERE yces.equipment_id = :equipment_id
          AND yces.equipment_status = 'Rented'
          AND yc.date BETWEEN :start_date AND :end_date
    ");
    $stmt->bindParam(':equipment_id', $equipment_id);
    $stmt->bindParam(':start_date', $start_date);
    $stmt->bindParam(':end_date', $end_date);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $days_rented = $result['days_rented'];

    // Calculate estimated profit
    $estimated_profit = calculateEstimatedProfit($days_rented, $rental_rate_daily, $equipment['rental_rate_weekly'], $equipment['rental_rate_monthly']);

    // Fetch out of service days
    $stmt = $conn->prepare("
        SELECT COUNT(DISTINCT date) as days_out_of_service
        FROM yard_check_equipment_status yces
        JOIN yard_checks yc ON yces.yard_check_id = yc.id
        WHERE yces.equipment_id = :equipment_id
          AND yces.equipment_status = 'Out of Service'
          AND yc.date BETWEEN :start_date AND :end_date
    ");
    $stmt->bindParam(':equipment_id', $equipment_id);
    $stmt->bindParam(':start_date', $start_date);
    $stmt->bindParam(':end_date', $end_date);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $days_out_of_service = $result['days_out_of_service'];

    // Calculate profit loss
    $profit_loss = $days_out_of_service * $rental_rate_daily;

    // Update totals
    $total_estimated_profit += $estimated_profit;
    $total_profit_loss += $profit_loss;

    // Prepare equipment stats
    $equipmentStats[] = [
        'equipment_name' => $equipment_name,
        'days_rented' => $days_rented,
        'estimated_profit' => $estimated_profit,
        'days_out_of_service' => $days_out_of_service,
        'profit_loss' => $profit_loss,
        'was_rented' => $days_rented > 0,
        'is_out_of_service' => $days_out_of_service > 0,
        'potential_profit' => ($days_rented == 0 && $days_out_of_service == 0) ? calculatePotentialProfit($start_date, $end_date, $rental_rate_daily) : 0
    ];
}

// Sort equipment stats for Top 8 and Bottom 8
usort($equipmentStats, function($a, $b) {
    return $b['days_rented'] - $a['days_rented'];
});

// Top 8
$top8 = array_slice($equipmentStats, 0, 8);

// Exclude equipment that was out of service from Bottom 8
$bottomList = array_filter($equipmentStats, function($item) {
    return !$item['is_out_of_service'] && $item['was_rented'];
});
$bottomList = array_reverse($bottomList);
$bottom8 = array_slice($bottomList, 0, 8);

// Potential Sales for Non-Rented Equipment
$potential_sales = array_filter($equipmentStats, function($item) {
    return $item['days_rented'] == 0 && !$item['is_out_of_service'];
});

echo json_encode([
    'total_estimated_profit' => $total_estimated_profit,
    'total_profit_loss' => $total_profit_loss,
    'top8' => $top8,
    'bottom8' => $bottom8,
    'potential_sales' => $potential_sales
]);

function calculateEstimatedProfit($days_rented, $daily_rate, $weekly_rate, $monthly_rate) {
    if ($days_rented >= 28 && $monthly_rate > 0) {
        // Use monthly rate
        $months = floor($days_rented / 28);
        $remaining_days = $days_rented % 28;
        $profit = $months * $monthly_rate + $remaining_days * $daily_rate;
    } elseif ($days_rented >= 7 && $weekly_rate > 0) {
        // Use weekly rate
        $weeks = floor($days_rented / 7);
        $remaining_days = $days_rented % 7;
        $profit = $weeks * $weekly_rate + $remaining_days * $daily_rate;
    } else {
        // Use daily rate
        $profit = $days_rented * $daily_rate;
    }
    return $profit;
}

function calculatePotentialProfit($start_date, $end_date, $daily_rate) {
    $start = new DateTime($start_date);
    $end = new DateTime($end_date);
    $interval = $start->diff($end);
    $days = $interval->days + 1;
    return $days * $daily_rate;
}
?>
