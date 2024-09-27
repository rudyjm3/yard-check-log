<?php
// delete_equipment.php

include 'db_connection.php';

$id = $_GET['id'];

// Delete equipment
$stmt = $conn->prepare("DELETE FROM equipment WHERE id = :id");
$stmt->bindParam(':id', $id);
$stmt->execute();

echo "Success";
?>
