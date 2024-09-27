<?php
// get_submitted_yard_checks.php

include 'db_connection.php';

try {
    // Fetch all submitted yard checks
    $stmt = $conn->query("SELECT * FROM yard_checks ORDER BY date DESC, check_time ASC");
    $yardChecks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each yard check, calculate stats
    $result = [];
    foreach ($yardChecks as $yardCheck) {
        $yardCheckId = $yardCheck['id'];
        $stmt = $conn->prepare("SELECT yces.*, e.unit_id, e.equipment_name, e.rental_rate_daily FROM yard_check_equipment_status yces JOIN equipment e ON yces.equipment_id = e.id WHERE yces.yard_check_id = :yard_check_id");
        $stmt->bindParam(':yard_check_id', $yardCheckId);
        $stmt->execute();
        $equipmentStatuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
        $yardCheck['submission_time'] = $yardCheck['submission_time'];

        $result[] = $yardCheck;
    }

    echo json_encode($result);
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
