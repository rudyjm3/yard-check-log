<?php
// db_connection.php

$servername = "localhost";
$username = "rudyjm33"; // Replace with your actual username
$password = "Matrix_1645"; // Replace with your actual password
$dbname = "u207292155_yard_check_db";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // Set PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
}
?>
