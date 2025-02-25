<?php
// get_equipment.php
include 'db_connection_info.php';

try {
    // If we have an ID param, return that single equipment row:
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = intval($_GET['id']);
        // Using a prepared statement to avoid SQL injection
        $stmt = $conn->prepare("SELECT * FROM equipment WHERE id = ?");
        $stmt->execute([$id]);
        $equipment = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode($equipment);
        exit; // Stop here, since we just wanted that one record
    }

    // Otherwise, if we want only active:
    if (isset($_GET['onlyActive']) && $_GET['onlyActive'] == 'true') {
        $stmt = $conn->query("SELECT * FROM equipment WHERE is_active = 1");
    } else {
        // Return all
        $stmt = $conn->query("SELECT * FROM equipment");
    }

    $equipmentList = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($equipmentList);

} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

