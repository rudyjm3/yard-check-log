// Large equipment array temporary storage
const largeEquipment = [
   { unit_id: "3417389", 
      equipment_name: "35' Towable Boom Lift",
      manufacturer: "JLG Lift",
      model:"T350",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 269.00,
         daily: 359.00,
         weekly: 1077.00,
         monthly: 2693.00
      },
   },

   { unit_id: "3574941", 
      equipment_name: "24\" Trencher",
      manufacturer: "Barreto",
      model: "912",
      rental_rates: {
         four_hours: 179.00,
         daily: 239.00,
         weekly: 717.00,
         monthly: 1793.00
      }
   },
   { unit_id: "3417390", 
      equipment_name: "36\" Trencher",
      manufacturer: "Barreto",
      model: "E2036",
      rental_rates: {
         four_hours: 209.00,
         daily: 279.00,
         weekly: 837.00,
         monthly: 1835.00
      }
   },
   { unit_id: "3438645", 
      equipment_name: "Stump Grinder",
      manufacturer: "Barreto",
      model: "30-SG",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 232.00,
         daily: 309.00,
         weekly: 989.00,
         monthly: 2473.00
      }
   },
   { unit_id: "3543208", 
      equipment_name: "Mini Skid Steer",
      manufacturer: "Toro",
      model: "Dingo TX427",
      imageUrl: "https://images.thdstatic.com/productImages/72c5af06-d142-421e-ab7d-e4094e048036/svn/kubota-k008-64_600.jpg",
      rental_rates: {
         four_hours: 232.00,
         daily: 309.00,
         weekly: 989.00,
         monthly: 2473.00
      }
   },
   { unit_id: "09169", 
      equipment_name: "Log Spliter",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 81.00,
         daily: 116.00,
         weekly: 464.00,
         monthly: 1392.00
      }
   },
   { unit_id: "3590741", 
      equipment_name: "19' Scissor Lift on Trailer",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 229.00,
         daily: 229.00,
         weekly: 687.00,
         monthly: 0
      }
   },
   { unit_id: "", 
      equipment_name: "5' x 8' Dump Trailer",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 0,
         daily: 0,
         weekly: 0,
         monthly: 0
      }
   },
   { unit_id: "3408242", 
      equipment_name: "6' x 10' Dump Trailer",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 149.00,
         daily: 199.00,
         weekly: 597.00,
         monthly: 0
      }
   },
   { unit_id: "04832", 
      equipment_name: "Channel Frame Trailer 5' x 8'",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 39.00,
         daily: 55.00,
         weekly: 220.00,
         monthly: 0
      }
   },
   { unit_id: "05979", 
      equipment_name: "Channel Frame Trailer 5' x 8'",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 39.00,
         daily: 55.00,
         weekly: 220.00,
         monthly: 0
      }
   },
   { unit_id: "02932", 
      equipment_name: "Lawn & Garden Trailer 3'x 5'",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 21.00,
         daily: 30.00,
         weekly: 120.00,
         monthly: 0
      }
   },
   { unit_id: "07644", 
      equipment_name: "Solid Wall Trailer 5'x 8'",
      manufacturer: "",
      model: "",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 42.00,
         daily: 60.00,
         weekly: 240.00,
         monthly: 0
      }
   },

];


/* assets/js/app.js */

// Function to get ordinal suffix for the day number
function getOrdinalSuffix(day) {
   if (day > 3 && day < 21) return 'th'; // Covers 4th to 20th
   switch (day % 10) {
     case 1:  return 'st';
     case 2:  return 'nd';
     case 3:  return 'rd';
     default: return 'th';
   }
 }
 
 // Function to format and display the current date and time
 function displayCurrentDateTime() {
   const now = new Date();
 
   // Get day of the week
   const daysOfWeek = [
     'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
   ];
   const dayName = daysOfWeek[now.getDay()];
 
   // Get month name
   const monthNames = [
     'January', 'February', 'March', 'April', 'May', 'June',
     'July', 'August', 'September', 'October', 'November', 'December'
   ];
   const monthName = monthNames[now.getMonth()];
 
   // Get day number with ordinal suffix
   const dayNumber = now.getDate();
   const ordinalSuffix = getOrdinalSuffix(dayNumber);
   const dayNumberWithSuffix = `${dayNumber}${ordinalSuffix}`;
 
   // Get year
   const year = now.getFullYear();
 
   // Format time to hh:mm am/pm
   let hours = now.getHours();
   const minutes = now.getMinutes();
   const ampm = hours >= 12 ? 'pm' : 'am';
   hours = hours % 12 || 12; // Convert 0 to 12
   const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
 
   const formattedTime = `${hours}:${minutesStr}${ampm}`;
 
   // Construct the full date and time string
   const formattedDateTime = `${dayName} ${monthName} ${dayNumberWithSuffix} ${year} - Current Time: ${formattedTime}`;
 
   // Display the formatted date and time
   const currentDateElement = document.getElementById('current-date');
   if (currentDateElement) {
     currentDateElement.textContent = formattedDateTime;
   }
 
   // Set the value of the date input field
   const checkDateInput = document.getElementById('check-date');
   if (checkDateInput) {
     const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
     checkDateInput.value = dateStr;
   }
 }
 
 // Call the function when the page loads
 document.addEventListener('DOMContentLoaded', () => {
   displayCurrentDateTime();
 });
 
 // Global variables
 let equipmentData = []; // Will be populated from the server
 
 // Show Yard Check Form
 function showYardCheckForm() {
   document.getElementById('lg-equipment-yard-check-form').style.display = 'block';
   document.getElementById('equipment-management').style.display = 'none';
   document.getElementById('submitted-yard-checks').style.display = 'none';
   document.getElementById('equipment-stats').style.display = 'none';
   populateEquipmentList();
 }
 // Show Yard Check From from submitted yard check page
 function showAddYardCheckForm() {
   showYardCheckForm();
 }
 // Show Equipment Management Section
 function showEquipmentManagement() {
   document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
   document.getElementById('equipment-management').style.display = 'block';
   document.getElementById('submitted-yard-checks').style.display = 'none';
   document.getElementById('equipment-stats').style.display = 'none';
   loadEquipmentListManagement();
 }
 
 // Show Submitted Yard Checks
 function showSubmittedYardChecks() {
   document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
   document.getElementById('equipment-management').style.display = 'none';
   document.getElementById('submitted-yard-checks').style.display = 'block';
   document.getElementById('equipment-stats').style.display = 'none';
   loadSubmittedYardChecks();
 }
 
 // Show Equipment Stats
 function showEquipmentStats() {
   document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
   document.getElementById('equipment-management').style.display = 'none';
   document.getElementById('submitted-yard-checks').style.display = 'none';
   document.getElementById('equipment-stats').style.display = 'block';
   loadEquipmentStats();
 }
 
 // Function to populate equipment list in the Yard Check Form
 async function populateEquipmentList() {
   try {
     const response = await fetch('get_equipment.php');
     const data = await response.json();
     equipmentData = data; // Store the equipment data globally
     const equipmentListDiv = document.getElementById('equipment-list');
     equipmentListDiv.innerHTML = '';
     data.forEach(equipment => {
       // Create a container for each equipment
       const equipmentDiv = document.createElement('div');
       equipmentDiv.classList.add('form-control');
 
       // Create image element if image_url exists
       let imageHTML = '';
       if (equipment.image_url) {
         imageHTML = `<img src="${equipment.image_url}" alt="${equipment.equipment_name}" class="equipment-image">`;
       }
 
       // Equipment label
       const label = document.createElement('label');
       label.htmlFor = `equipment-status-${equipment.unit_id}`;
       label.innerHTML = `
         ${imageHTML}
         <p class="rental-id-label">Unit ID - <span class="rental-id-num">${equipment.unit_id}</span></p>
         <p class="equipment-name">${equipment.equipment_name}</p>
         <a href="#" onclick="toggleEquipmentInfo(event, '${equipment.unit_id}')">View more info</a>
         <div id="equipment-info-${equipment.unit_id}" class="equipment-info" style="display: none;">
           <p><strong>Manufacturer:</strong> ${equipment.manufacturer}</p>
           <p><strong>Model:</strong> ${equipment.model}</p>
         </div>
       `;
 
       // Status select
       const select = document.createElement('select');
       select.name = `equipment_status_${equipment.unit_id}`;
       select.id = `equipment-status-${equipment.unit_id}`;
       select.required = true;
 
       // Options
       const defaultOption = document.createElement('option');
       defaultOption.disabled = true;
       defaultOption.selected = true;
       defaultOption.textContent = 'Select equipment status';
 
       const availableOption = document.createElement('option');
       availableOption.value = 'Available';
       availableOption.textContent = 'Available';
 
       const rentedOption = document.createElement('option');
       rentedOption.value = 'Rented';
       rentedOption.textContent = 'Rented';
 
       const outOfServiceOption = document.createElement('option');
       outOfServiceOption.value = 'Out of Service';
       outOfServiceOption.textContent = 'Out of Service';
 
       // Append options to select
       select.appendChild(defaultOption);
       select.appendChild(availableOption);
       select.appendChild(rentedOption);
       select.appendChild(outOfServiceOption);
 
       // Append label and select to equipmentDiv
       equipmentDiv.appendChild(label);
       equipmentDiv.appendChild(select);
 
       // Append equipmentDiv to equipmentListDiv
       equipmentListDiv.appendChild(equipmentDiv);
     });
   } catch (error) {
     console.error('Error:', error);
   }
 }
 
 // Toggle Equipment Info Display
 function toggleEquipmentInfo(event, unitId) {
   event.preventDefault();
   const infoDiv = document.getElementById(`equipment-info-${unitId}`);
   if (infoDiv.style.display === 'none') {
     infoDiv.style.display = 'block';
   } else {
     infoDiv.style.display = 'none';
   }
 }
 
 // Handle Yard Check Form Submission
 document.getElementById('lg-equipment-yard-check-form').addEventListener('submit', function(e) {
   e.preventDefault(); // Prevent the default form submission
 
   // Capture the user's current local date and time in ISO format without 'Z'
   const now = new Date();
   const submissionDateTimeLocal = now.toISOString().slice(0, -1); // Remove the 'Z' at the end
 
   // Add submission_date_time to the form data
   const formData = new FormData(this);
   formData.append('submission_date_time', submissionDateTimeLocal);
 
   fetch('submit_yard_check.php', {
     method: 'POST',
     body: formData
   })
   .then(response => response.json())
   .then(result => {
     if (result.status === 'error') {
       showDuplicateSubmissionMessage(result.existingYardCheck);
     } else {
       alert(result.message);
       this.reset();
       displayCurrentDateTime();
       // Clear the yard_check_id
       const yardCheckIdInput = document.getElementById('yard-check-id');
       if (yardCheckIdInput) {
         yardCheckIdInput.value = '';
       }
       // Hide the form if needed
     }
   })
   .catch(error => console.error('Error:', error));
 });
 
 // Show Duplicate Submission Message
 function showDuplicateSubmissionMessage(existingYardCheck) {
   const dateObj = new Date(existingYardCheck.date);
   const formattedDate = ('0' + (dateObj.getMonth() + 1)).slice(-2) + '/' +
                         ('0' + dateObj.getDate()).slice(-2) + '/' +
                         dateObj.getFullYear();
 
   const messageContent = `
     <div class="message">
       <p>A yard check for this date and time has already been submitted.</p>
       <p><strong>Date:</strong> ${formattedDate}</p>
       <p><strong>Time:</strong> ${existingYardCheck.check_time}</p>
       <p><strong>Submitted by:</strong> ${existingYardCheck.user_name}</p>
       <button onclick="viewYardCheckDetails(${existingYardCheck.id})">View Submitted Yard Check</button>
       <button onclick="closeMessage()">Close</button>
     </div>
   `;
   // Display the message in the UI
   document.getElementById('message-container').innerHTML = messageContent;
 }
 
 // Close Duplicate Submission Message
 function closeMessage() {
   document.getElementById('message-container').innerHTML = '';
 }
 
 // Load Equipment List for Management
 function loadEquipmentListManagement() {
   fetch('get_equipment.php')
     .then(response => response.json())
     .then(data => {
       const equipmentListDiv = document.getElementById('equipment-list-management');
       equipmentListDiv.innerHTML = '';
       data.forEach(equipment => {
         const equipmentItemDiv = document.createElement('div');
         equipmentItemDiv.classList.add('equipment-item');
 
         // Create image element if image_url exists
         let imageHTML = '';
         if (equipment.image_url) {
           imageHTML = `<img src="${equipment.image_url}" alt="${equipment.equipment_name}" class="equipment-image">`;
         }
 
         equipmentItemDiv.innerHTML = `
           ${imageHTML}
           <p><strong>Unit ID:</strong> ${equipment.unit_id}</p>
           <p><strong>Name:</strong> ${equipment.equipment_name}</p>
           <p><strong>Manufacturer:</strong> ${equipment.manufacturer}</p>
           <p><strong>Model:</strong> ${equipment.model}</p>
           <p><strong>Rental Rates:</strong></p>
           <ul>
             <li>4 Hours: $${parseFloat(equipment.rental_rate_4h || 0).toFixed(2)}</li>
             <li>Daily: $${parseFloat(equipment.rental_rate_daily || 0).toFixed(2)}</li>
             <li>Weekly: $${parseFloat(equipment.rental_rate_weekly || 0).toFixed(2)}</li>
             <li>Monthly: $${parseFloat(equipment.rental_rate_monthly || 0).toFixed(2)}</li>
           </ul>
           <button onclick="showEditEquipmentForm(${equipment.id})">Edit</button>
           <button onclick="deleteEquipment(${equipment.id})">Delete</button>
         `;
 
         equipmentListDiv.appendChild(equipmentItemDiv);
       });
     })
     .catch(error => console.error('Error:', error));
 }
 
 // Show Form to Add New Equipment
 function showAddEquipmentForm() {
   const equipmentForm = document.getElementById('equipment-form');
   document.getElementById('form-title').textContent = 'Add Equipment';
   document.getElementById('equipment-id').value = '';
   document.getElementById('unit-id').value = '';
   document.getElementById('equipment-name').value = '';
   document.getElementById('manufacturer').value = '';
   document.getElementById('model').value = '';
   document.getElementById('image-url').value = ''; // Clear image URL field
   document.getElementById('rental-rate-4h').value = '';
   document.getElementById('rental-rate-daily').value = '';
   document.getElementById('rental-rate-weekly').value = '';
   document.getElementById('rental-rate-monthly').value = '';
   // Clear other fields
 
   // Show the form with animation
   equipmentForm.style.display = 'block';
   setTimeout(() => {
     equipmentForm.classList.add('show');
   }, 10); // Slight delay to trigger CSS transition
 }
 
 // Show Form to Edit Existing Equipment
 function showEditEquipmentForm(id) {
   fetch(`get_equipment.php?id=${id}`)
     .then(response => response.json())
     .then(equipment => {
       const equipmentForm = document.getElementById('equipment-form');
       document.getElementById('form-title').textContent = 'Edit Equipment';
       document.getElementById('equipment-id').value = equipment.id;
       document.getElementById('unit-id').value = equipment.unit_id;
       document.getElementById('equipment-name').value = equipment.equipment_name;
       document.getElementById('manufacturer').value = equipment.manufacturer;
       document.getElementById('model').value = equipment.model;
       document.getElementById('image-url').value = equipment.image_url; // Set image URL field
       document.getElementById('rental-rate-4h').value = equipment.rental_rate_4h;
       document.getElementById('rental-rate-daily').value = equipment.rental_rate_daily;
       document.getElementById('rental-rate-weekly').value = equipment.rental_rate_weekly;
       document.getElementById('rental-rate-monthly').value = equipment.rental_rate_monthly;
       // Populate other fields
 
       // Show the form with animation
       equipmentForm.style.display = 'block';
       setTimeout(() => {
         equipmentForm.classList.add('show');
       }, 10);
     })
     .catch(error => console.error('Error:', error));
 }
 
 // Cancel Add/Edit Form
 function cancelEquipmentForm() {
   const equipmentForm = document.getElementById('equipment-form');
   // Hide the form with animation
   equipmentForm.classList.remove('show');
   setTimeout(() => {
     equipmentForm.style.display = 'none';
   }, 500); // Match the transition duration in CSS
 }
 
 // Handle Equipment Form Submission
 document.getElementById('equipment-form').addEventListener('submit', function(e) {
   e.preventDefault();
   const formData = new FormData(this);
 
   fetch('save_equipment.php', {
     method: 'POST',
     body: formData
   })
   .then(response => response.json())
   .then(result => {
     if (result.status === 'success') {
       alert(result.message);
       this.reset();
       const equipmentForm = document.getElementById('equipment-form');
       equipmentForm.classList.remove('show');
       setTimeout(() => {
         equipmentForm.style.display = 'none';
       }, 500);
       loadEquipmentListManagement();
     } else {
       alert('Error: ' + result.message);
     }
   })
   .catch(error => console.error('Error:', error));
 });
 
 // Delete Equipment
 function deleteEquipment(id) {
   if (confirm('Are you sure you want to delete this equipment?')) {
     fetch(`delete_equipment.php?id=${id}`, {
       method: 'GET'
     })
     .then(response => response.text())
     .then(result => {
       alert('Equipment deleted successfully!');
       loadEquipmentListManagement();
     })
     .catch(error => console.error('Error:', error));
   }
 }
 
 // Load Submitted Yard Checks
 function loadSubmittedYardChecks() {
   fetch('get_submitted_yard_checks.php')
     .then(response => response.json())
     .then(data => {
       const yardChecksListDiv = document.getElementById('yard-checks-list');
       yardChecksListDiv.innerHTML = '';
       // Group yard checks by date
       const yardChecksByDate = {};
       data.forEach(yardCheck => {
         if (!yardChecksByDate[yardCheck.date]) {
           yardChecksByDate[yardCheck.date] = {};
         }
         yardChecksByDate[yardCheck.date][yardCheck.check_time] = yardCheck;
       });
 
       // Create cards for each date
       for (const date in yardChecksByDate) {
         const yardCheckDay = yardChecksByDate[date];
         const cardDiv = document.createElement('div');
         cardDiv.classList.add('yard-check-card');
 
         // Format date for title
         const dateObj = new Date(date);
         const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
         const monthName = ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'][dateObj.getMonth()];
         const dayNumber = dateObj.getDate();
         const ordinalSuffix = getOrdinalSuffix(dayNumber);
         const dayNumberWithSuffix = `${dayNumber}${ordinalSuffix}`;
         const year = dateObj.getFullYear();
 
         const cardTitle = `${dayName}, ${dayNumberWithSuffix}, ${monthName}, ${year} - Yard Check`;
 
         cardDiv.innerHTML = `<h3>${cardTitle}</h3>`;
 
         const cardContentDiv = document.createElement('div');
         cardContentDiv.classList.add('card-content');
 
         ['AM', 'PM'].forEach(checkTime => {
           const yardCheck = yardCheckDay[checkTime];
           const columnDiv = document.createElement('div');
           columnDiv.classList.add('card-column');
 
           if (yardCheck) {
             // Parse the submission_date_time as local time
             const submissionDateTime = new Date(yardCheck.submission_date_time);
 
             // Format submission_time to HH:MM am/pm
             let hours = submissionDateTime.getHours();
             const minutes = submissionDateTime.getMinutes();
             const ampm = hours >= 12 ? 'pm' : 'am';
             hours = hours % 12 || 12; // Convert to 12-hour format
             const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
             const formattedSubmissionTime = `${hours}:${minutesStr} ${ampm}`;
 
             columnDiv.innerHTML = `
               <h4>${checkTime} Submission</h4>
               <p><strong>Total number of equipment:</strong> ${yardCheck.total_equipment}</p>
               <p><strong>Equipment currently available:</strong> ${yardCheck.equipment_available}</p>
               <p><strong>Equipment currently rented out:</strong> ${yardCheck.equipment_rented_out}</p>
               ${checkTime === 'PM' ? `<p><strong>Estimated profit:</strong> $<span class="profit-amount">${yardCheck.estimated_profit.toFixed(2)}</span></p>` : ''}
               <p><strong>Equipment currently out of service:</strong> ${yardCheck.equipment_out_of_service}</p>
               <p><strong>Profit loss:</strong> $<span class="loss-amount">${yardCheck.profit_loss.toFixed(2)}</span></p>
               <p><strong>Submitted by:</strong> ${yardCheck.user_name}</p>
               <p class="time-submitted"><strong>Time submitted:</strong> ${formattedSubmissionTime}</p>
               <div class="button-wrapper">
                 <button onclick="viewYardCheckDetails(${yardCheck.id})">View Yard Check</button>
                 <button onclick="editYardCheck(${yardCheck.id})">Edit Yard Check</button>
               </div>
             `;
           } else {
             columnDiv.innerHTML = `
               <h4>${checkTime} Submission</h4>
               <p>No submission available.</p>
             `;
           }
 
           cardContentDiv.appendChild(columnDiv);
         });
 
         cardDiv.appendChild(cardContentDiv);
         yardChecksListDiv.appendChild(cardDiv);
       }
     })
     .catch(error => console.error('Error:', error));
 }
 
 // View Yard Check Details
 function viewYardCheckDetails(id) {
   fetch(`get_yard_check_details.php?id=${id}`)
     .then(response => response.json())
     .then(yardCheck => {
       showYardCheckDetails(yardCheck);
     })
     .catch(error => console.error('Error:', error));
 }
 
 // Show Yard Check Details in Modal
 function showYardCheckDetails(yardCheck) {
   const modalContainer = document.getElementById('modal-container');
   const equipmentStatuses = yardCheck.equipment_statuses.map(status => `
     <div>
       <p><strong>Unit ID:</strong> ${status.unit_id}</p>
       <p><strong>Equipment Name:</strong> ${status.equipment_name}</p>
       <p><strong>Status:</strong> ${status.equipment_status}</p>
     </div>
     <hr>
   `).join('');
 
   const modalContent = `
     <div class="modal">
       <div class="modal-content">
         <span class="close-button" onclick="closeModal()">&times;</span>
         <h2>Yard Check Details</h2>
         <p><strong>Date:</strong> ${yardCheck.date}</p>
         <p><strong>Time:</strong> ${yardCheck.check_time}</p>
         <p><strong>Submitted by:</strong> ${yardCheck.user_name}</p>
         <div>
           ${equipmentStatuses}
         </div>
         <button onclick="editYardCheck(${yardCheck.id})">Edit</button>
         <button onclick="printYardCheck(${yardCheck.id})">Print</button>
       </div>
     </div>
   `;
   modalContainer.innerHTML = modalContent;
   modalContainer.style.display = 'block';
 }
 
 // Close Modal
 function closeModal() {
   document.getElementById('modal-container').style.display = 'none';
 }
 
 // Edit Yard Check
 async function editYardCheck(id) {
   try {
     // Load the yard check data
     const response = await fetch(`get_yard_check_details.php?id=${id}`);
     const data = await response.json();
     // Close the modal
     closeModal();
     // Show the yard check form
     showYardCheckForm();
     // Populate the form with data
     await populateYardCheckForm(data);
   } catch (error) {
     console.error('Error:', error);
   }
 }
 
 // Populate Yard Check Form with Existing Data
 async function populateYardCheckForm(yardCheck) {
   document.getElementById('user-name').value = yardCheck.user_name;
   document.getElementById('check-time').value = yardCheck.check_time;
   document.getElementById('check-date').value = yardCheck.date;
 
   // Set a hidden input with the yard check ID
   if (!document.getElementById('yard-check-id')) {
     const input = document.createElement('input');
     input.type = 'hidden';
     input.id = 'yard-check-id';
     input.name = 'yard_check_id';
     document.getElementById('lg-equipment-yard-check-form').appendChild(input);
   }
   document.getElementById('yard-check-id').value = yardCheck.id;
 
   // First, populate the equipment list
   await populateEquipmentList();
 
   // Now that the equipment list is populated, set the statuses
   yardCheck.equipment_statuses.forEach(status => {
     const select = document.getElementById(`equipment-status-${status.unit_id}`);
     if (select) {
       select.value = status.equipment_status;
     }
   });
 }
 
 // Load Equipment Stats
 function loadEquipmentStats() {
   const dateRange = document.getElementById('stats-date-range').value;
   let startDate, endDate;
 
   if (dateRange === 'weekly') {
     // This Week (Monday to Sunday)
     const today = new Date();
     const dayOfWeek = today.getDay();
     const monday = new Date(today);
     monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust when day is Sunday
     const sunday = new Date(monday);
     sunday.setDate(monday.getDate() + 6);
 
     startDate = monday.toISOString().split('T')[0];
     endDate = sunday.toISOString().split('T')[0];
   } else if (dateRange === 'monthly') {
     // This Month
     const today = new Date();
     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
     const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
 
     startDate = firstDay.toISOString().split('T')[0];
     endDate = lastDay.toISOString().split('T')[0];
   } else if (dateRange === 'custom') {
     // Custom Range
     startDate = document.getElementById('start-date').value;
     endDate = document.getElementById('end-date').value;
   }
 
   fetch(`get_equipment_stats.php?start_date=${startDate}&end_date=${endDate}`)
     .then(response => response.json())
     .then(stats => {
       displayEquipmentStats(stats);
     })
     .catch(error => console.error('Error:', error));
 }
 
 // Display Equipment Stats
 function displayEquipmentStats(stats) {
   const statsDisplay = document.getElementById('stats-display');
   statsDisplay.innerHTML = '';
 
   // Total Estimated Profit
   const totalProfit = stats.total_estimated_profit.toFixed(2);
   // Total Profit Loss
   const totalLoss = stats.total_profit_loss.toFixed(2);
 
   statsDisplay.innerHTML += `
     <h3>Total Estimated Profit: $<span class="profit-amount">${totalProfit}</span></h3>
     <h3>Total Profit Loss: $<span class="loss-amount">${totalLoss}</span></h3>
   `;
 
   // Top 8 Equipment
   let top8HTML = '<h4>Top 8 Most Popular Equipment</h4><ol>';
   stats.top8.forEach(item => {
     top8HTML += `<li>${item.equipment_name} - Days Rented: ${item.days_rented}, Estimated Profit: $<span class="profit-amount">${item.estimated_profit.toFixed(2)}</span></li>`;
   });
   top8HTML += '</ol>';
   statsDisplay.innerHTML += top8HTML;
 
   // Bottom 8 Equipment
   let bottom8HTML = '<h4>Bottom 8 Least Popular Equipment</h4><ol>';
   stats.bottom8.forEach(item => {
     bottom8HTML += `<li>${item.equipment_name} - Days Rented: ${item.days_rented}, Estimated Profit: $<span class="profit-amount">${item.estimated_profit.toFixed(2)}</span></li>`;
   });
   bottom8HTML += '</ol>';
   statsDisplay.innerHTML += bottom8HTML;
 
   // Potential Sales for Non-Rented Equipment
   if (stats.potential_sales.length > 0) {
     let potentialSalesHTML = '<h4>Potential Sales for Non-Rented Equipment</h4><ul>';
     stats.potential_sales.forEach(item => {
       potentialSalesHTML += `<li>${item.equipment_name} - Potential Profit: $<span class="profit-amount">${item.potential_profit.toFixed(2)}</span></li>`;
     });
     potentialSalesHTML += '</ul>';
     statsDisplay.innerHTML += potentialSalesHTML;
   }
 }
 
 // Export Report
 function exportReport(format) {
   const dateRange = document.getElementById('stats-date-range').value;
   let startDate, endDate;
 
   if (dateRange === 'weekly') {
     // This Week
     const today = new Date();
     const dayOfWeek = today.getDay();
     const monday = new Date(today);
     monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust when day is Sunday
     const sunday = new Date(monday);
     sunday.setDate(monday.getDate() + 6);
 
     startDate = monday.toISOString().split('T')[0];
     endDate = sunday.toISOString().split('T')[0];
   } else if (dateRange === 'monthly') {
     // This Month
     const today = new Date();
     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
     const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
 
     startDate = firstDay.toISOString().split('T')[0];
     endDate = lastDay.toISOString().split('T')[0];
   } else if (dateRange === 'custom') {
     // Custom Range
     startDate = document.getElementById('start-date').value;
     endDate = document.getElementById('end-date').value;
   }
 
   window.location.href = `export_report.php?format=${format}&start_date=${startDate}&end_date=${endDate}`;
 }
 
 // Print Yard Check
 function printYardCheck(id) {
   window.open(`print_yard_check.php?id=${id}`, '_blank');
 }
 
 // Show or Hide Custom Date Range Inputs
 document.getElementById('stats-date-range').addEventListener('change', function() {
   if (this.value === 'custom') {
     document.getElementById('custom-date-range').style.display = 'block';
   } else {
     document.getElementById('custom-date-range').style.display = 'none';
   }
 });