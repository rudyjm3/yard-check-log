<?php
// header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
// header("Pragma: no-cache"); // HTTP 1.0 compatibility
// header("Expires: 0"); // Ensures the content is always considered expired


// submit_yard_check.php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'db_connection_info.php';

// **At the top of the script, after including dependencies
error_log('Received data in submit_yard_check.php:');
error_log('user_name: ' . $_POST['user_name']);
error_log('check_date: ' . $_POST['check_date']);
error_log('check_time: ' . $_POST['check_time']);
error_log('submission_date_time: ' . $_POST['submission_date_time']);
//** */

// **Add this line temporarily to log the default time zone:
//error_log('PHP Default Time Zone: ' . date_default_timezone_get());
// **

// Collect form data
$user_name = $_POST['user_name'];
$date = $_POST['check_date'];
$check_time = $_POST['check_time']; // AM/PM value
$submission_date_time = $_POST['submission_date_time']; // Use the submitted local date and time

// **Log the received data
error_log('Received submission_date_time: ' . $submission_date_time);
//**  */

// Extract submission_time from submission_date_time
$submission_time = date('H:i:s', strtotime($submission_date_time));

// ***Use DateTime object with the server's time zone to parse the local time
$submissionDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $submission_date_time);

// ***Extract submission_time from submission_date_time
$submission_time = $submissionDateTime->format('H:i:s');


// Check if this is an update or a new submission
$yard_check_id = isset($_POST['yard_check_id']) ? $_POST['yard_check_id'] : null;

try {
    // Check for duplicate yard check, excluding the current one if editing
    $query = "SELECT * FROM yard_checks WHERE date = :date AND check_time = :check_time";
    if ($yard_check_id) {
        $query .= " AND id != :yard_check_id";
    }
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':date', $date);
    $stmt->bindParam(':check_time', $check_time);
    if ($yard_check_id) {
        $stmt->bindParam(':yard_check_id', $yard_check_id);
    }
    $stmt->execute();
    $existingYardCheck = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingYardCheck) {
        // Duplicate found
        echo json_encode([
            'status' => 'error',
            'message' => 'A yard check for this date and time has already been submitted.',
            'existingYardCheck' => $existingYardCheck
        ]);
        exit;
    }

    if ($yard_check_id) {
      // Update existing yard check
      $stmt = $conn->prepare("UPDATE yard_checks SET user_name = :user_name, date = :date, check_time = :check_time, submission_time = :submission_time, submission_date_time = :submission_date_time WHERE id = :id");
      $stmt->bindParam(':user_name', $user_name);
      $stmt->bindParam(':date', $date);
      $stmt->bindParam(':check_time', $check_time);
      $stmt->bindParam(':submission_time', $submission_time);
      $stmt->bindParam(':submission_date_time', $submission_date_time);
      $stmt->bindParam(':id', $yard_check_id);
      $stmt->execute();

        // Delete existing equipment statuses
        $stmt = $conn->prepare("DELETE FROM yard_check_equipment_status WHERE yard_check_id = :yard_check_id");
        $stmt->bindParam(':yard_check_id', $yard_check_id);
        $stmt->execute();

        // Re-insert equipment statuses
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'equipment_status_') === 0) {
                $unit_id = substr($key, strlen('equipment_status_'));
                $equipment_status = $value;

                // Get equipment ID
                $stmt = $conn->prepare("SELECT id FROM equipment WHERE unit_id = :unit_id");
                $stmt->bindParam(':unit_id', $unit_id);
                $stmt->execute();
                $equipment = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($equipment) {
                    $equipment_id = $equipment['id'];
                    // Insert status
                    $stmt = $conn->prepare("INSERT INTO yard_check_equipment_status (yard_check_id, equipment_id, equipment_status) VALUES (:yard_check_id, :equipment_id, :equipment_status)");
                    $stmt->bindParam(':yard_check_id', $yard_check_id);
                    $stmt->bindParam(':equipment_id', $equipment_id);
                    $stmt->bindParam(':equipment_status', $equipment_status);
                    $stmt->execute();
                }
            }
        }

        echo json_encode(['status' => 'success', 'message' => 'Yard check updated successfully.']);
    } else {
// **Before executing the INSERT statement
error_log('Inserting into database:');
error_log('user_name: ' . $user_name);
error_log('date: ' . $date);
error_log('check_time: ' . $check_time);
error_log('submission_time: ' . $submission_time);
error_log('submission_date_time: ' . $submission_date_time);
//

        // Insert new yard check
        $stmt = $conn->prepare("INSERT INTO yard_checks (user_name, date, check_time, submission_time, submission_date_time) VALUES (:user_name, :date, :check_time, :submission_time, :submission_date_time)");
        $stmt->bindParam(':user_name', $user_name);
        $stmt->bindParam(':date', $date);
        $stmt->bindParam(':check_time', $check_time);
        $stmt->bindParam(':submission_time', $submission_time);
        $stmt->bindParam(':submission_date_time', $submission_date_time);
        $stmt->execute();

        $yard_check_id = $conn->lastInsertId();

      // Log Processed Time Values:
        $submission_date_time = $_POST['submission_date_time'];
        $submission_time = date('H:i:s', strtotime($submission_date_time));


// **Log the processed times
error_log('Processed submission_date_time: ' . $submission_date_time);
error_log('Extracted submission_time: ' . $submission_time);
// **

        // Insert equipment statuses
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'equipment_status_') === 0) {
                $unit_id = substr($key, strlen('equipment_status_'));
                $equipment_status = $value;

                // Get equipment ID
                $stmt = $conn->prepare("SELECT id FROM equipment WHERE unit_id = :unit_id");
                $stmt->bindParam(':unit_id', $unit_id);
                $stmt->execute();
                $equipment = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($equipment) {
                    $equipment_id = $equipment['id'];
                    // Insert status
                    $stmt = $conn->prepare("INSERT INTO yard_check_equipment_status (yard_check_id, equipment_id, equipment_status) VALUES (:yard_check_id, :equipment_id, :equipment_status)");
                    $stmt->bindParam(':yard_check_id', $yard_check_id);
                    $stmt->bindParam(':equipment_id', $equipment_id);
                    $stmt->bindParam(':equipment_status', $equipment_status);
                    $stmt->execute();
                }
            }
        }

        echo json_encode(['status' => 'success', 'message' => 'Yard check submitted successfully.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
