// Large equipment array temporary storage
// const largeEquipment = [
//   ... // If you want to keep it, or omit. It's commented out anyway.
// ];

/* assets/js/app.js */

/* -------------------------
   1. GLOBAL VARIABLES
------------------------- */
let equipmentData = [];   // Will be populated from the server
let currentMonday = null; // Tracks Monday for the displayed week

/* -------------------------
   2. HELPER FUNCTIONS
------------------------- */

/**
 * getOrdinalSuffix(day) -> e.g. 1->'st',2->'nd',3->'rd',4->'th'
 */
function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Convert a Date -> "YYYY-MM-DD"
 */
function formatAsYyyyMmDd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth()+1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert "YYYY-MM-DD" -> "MM/DD/YYYY"
 * for the no-submissions message
 */
function formatDateForDisplay(isoDateStr) {
  const [yyyy, mm, dd] = isoDateStr.split('-');
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Return array of date strings from start->end inclusive, "YYYY-MM-DD".
 */
function getDatesInRange(startStr, endStr) {
  const dates = [];
  const start = new Date(startStr + "T00:00:00");
  const end   = new Date(endStr + "T00:00:00");
  while (start <= end) {
    dates.push(formatAsYyyyMmDd(start));
    start.setDate(start.getDate() + 1);
  }
  return dates;
}

/* -------------------------
   3. DISPLAY CURRENT DATE/TIME
------------------------- */

function displayCurrentDateTime() {
  const now = new Date();

  const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = daysOfWeek[now.getDay()];

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const monthName = monthNames[now.getMonth()];

  const dayNumber = now.getDate();
  const suffix = getOrdinalSuffix(dayNumber);
  const dayNumberWithSuffix = `${dayNumber}${suffix}`;

  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const formattedTime = `${hours}:${minutesStr}${ampm}`;

  const displayString = `${dayName} ${monthName} ${dayNumberWithSuffix} ${year} - Current Time: ${formattedTime}`;

  // #current-date
  const currentDateElement = document.getElementById('current-date');
  if (currentDateElement) {
    currentDateElement.textContent = displayString;
  }

  // Also set #check-date to today's YYYY-MM-DD
  const checkDateInput = document.getElementById('check-date');
  if (checkDateInput) {
    const mm = String(now.getMonth()+1).padStart(2,'0');
    const dd = String(now.getDate()).padStart(2,'0');
    const yyyy = now.getFullYear();
    checkDateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDateTime();
});

/* -------------------------
   4. SIDE MENU COLLAPSE / ACTIVE
------------------------- */

function sideMenuCollapse() {
  const navContainer = document.getElementById('side-nav-container');
  const collapseBtn = document.getElementById('menu-collapse-btn');

  navContainer.classList.toggle('side-nav-container-collapsed');
  if (navContainer.classList.contains('side-nav-container-collapsed')) {
    collapseBtn.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
  } else {
    collapseBtn.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
  }
}

function setActiveMenuItem() {
  const contentContainers = document.querySelectorAll('.content-section-container');
  const sideMenuItems = document.querySelectorAll('.side-menu-item');
  sideMenuItems.forEach(item => item.classList.remove('side-menu-item-active'));

  contentContainers.forEach((element, index) => {
    const displayStyle = window.getComputedStyle(element).display;
    if (displayStyle === 'block' && sideMenuItems[index]) {
      sideMenuItems[index].classList.add('side-menu-item-active');
    }
  });
}

/* -------------------------
   5. SHOW SUBMITTED YARD CHECKS
------------------------- */

/**
 * Show "Submitted Yard Checks" for the current local Monday→Sunday.
 */
function showSubmittedYardChecks() {
   // debugger;
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'none';
  document.getElementById('submitted-yard-checks').style.display = 'block';

  const now = new Date();
  now.setHours(0,0,0,0);

  // dayOfWeek=0..6 (Sun..Sat). offset => how many days from now to Monday
  const dayOfWeek = now.getDay();
  const offset = (dayOfWeek + 6) % 7;
  console.log('showSubmittedYardChecks => dayOfWeek=', dayOfWeek, ' offset=', offset);

  currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - offset);

  // Sunday = Monday + 6
  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);

  const startDate = formatAsYyyyMmDd(currentMonday);
  const endDate   = formatAsYyyyMmDd(sunday);

  loadSubmittedYardChecks(startDate, endDate);

  setActiveMenuItem();
}

/**
 * Load yard checks for [startDate..endDate].
 * If none => single “no submissions” message,
 * else partial placeholders for missing AM/PM.
 */
function loadSubmittedYardChecks(startDate, endDate) {
   debugger;
  let url = 'get_submitted_yard_checks.php';
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }

  fetch(url)
    .then(resp => resp.json())
    .then(data => {
      const yardChecksListDiv = document.getElementById('yard-checks-list');
      yardChecksListDiv.innerHTML = '';

      if (!data || data.length === 0) {
        const displayStart = formatDateForDisplay(startDate);
        const displayEnd   = formatDateForDisplay(endDate);

        const noDataCard = document.createElement('div');
        noDataCard.classList.add('yard-check-card');
        noDataCard.innerHTML = `
          <h3>There have been no submissions for this week
          (${displayStart} thru ${displayEnd}).</h3>
        `;
        yardChecksListDiv.appendChild(noDataCard);
        return;
      }

      // We have partial or full data => group by date+check_time
      const yardChecksByDate = {};
      data.forEach(item => {
        if (!yardChecksByDate[item.date]) {
          yardChecksByDate[item.date] = {};
        }
        yardChecksByDate[item.date][item.check_time] = item;
      });

      // Build array of 7 days from start->end
      const weekDates = getDatesInRange(startDate, endDate);

      weekDates.forEach(dateStr => {
        const dayMap = yardChecksByDate[dateStr] || {};

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('yard-check-card');

        const [yyyy, mm, dd] = dateStr.split('-');
        const dateObj = new Date(+yyyy, +mm-1, +dd);

        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const monthNames= ['January','February','March','April','May','June',
                           'July','August','September','October','November','December'];

        const dayName = dayNames[dateObj.getDay()];
        const monthName = monthNames[dateObj.getMonth()];
        const dayNum = dateObj.getDate();
        const suffix = getOrdinalSuffix(dayNum);
        const year = dateObj.getFullYear();

        const cardTitle = `${dayName}, ${monthName} ${dayNum}${suffix}, ${year} - Yard Check`;
        cardDiv.innerHTML = `<h3>${cardTitle}</h3>`;

        const cardContentDiv = document.createElement('div');
        cardContentDiv.classList.add('card-content');

        ['AM','PM'].forEach(checkTime => {
          const yardCheck = dayMap[checkTime];
          const columnDiv = document.createElement('div');
          columnDiv.classList.add('card-column');

          if (yardCheck) {
            const submissionDateTime = new Date(yardCheck.submission_date_time);
            let hours = submissionDateTime.getHours();
            const minutes = submissionDateTime.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
            const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
            const formattedTime = `${hours}:${minutesStr} ${ampm}`;

            columnDiv.innerHTML = `
              <h4>${checkTime} Submission</h4>
              <p><strong>Total equipment:</strong> ${yardCheck.total_equipment}</p>
              <p><strong>Equipment available:</strong> ${yardCheck.equipment_available}</p>
              <p><strong>Equipment rented out:</strong> ${yardCheck.equipment_rented_out}</p>
              ${
                checkTime === 'PM'
                  ? `<p class="est-profit-txt"><strong>Estimated profit:</strong> $<span class="profit-amount">${yardCheck.estimated_profit.toFixed(2)}</span></p>`
                  : ''
              }
              <p><strong>Equipment out of service:</strong> ${yardCheck.equipment_out_of_service}</p>
              <p class="profit-loss-txt"><strong>Profit loss:</strong> $<span class="loss-amount">${yardCheck.profit_loss.toFixed(2)}</span></p>
              <p><strong>Submitted by:</strong> ${yardCheck.user_name}</p>
              <p class="time-submitted-txt"><strong>Time submitted:</strong> ${formattedTime}</p>
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
      });
    })
    .catch(err => console.error('Error fetching yard checks:', err));
}

/** SHIFT currentMonday +7 days => next week. */
function showNextWeek() {
  currentMonday.setDate(currentMonday.getDate() + 7);
  console.log(currentMonday);
  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);

  const startDate = formatAsYyyyMmDd(currentMonday);
  const endDate   = formatAsYyyyMmDd(sunday);
  loadSubmittedYardChecks(startDate, endDate);
}
console.log(currentMonday);
/** SHIFT currentMonday -7 days => previous week. */
function showPreviousWeek() {
  currentMonday.setDate(currentMonday.getDate() - 7);
  console.log(currentMonday);
  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);

  const startDate = formatAsYyyyMmDd(currentMonday);
  const endDate   = formatAsYyyyMmDd(sunday);
  loadSubmittedYardChecks(startDate, endDate);
}

/* -------------------------
   6. FILTER SUBMITTED YARD CHECKS
------------------------- */

/**
 * Filter yard checks by custom date range (startInput..endInput).
 */
function filterSubmittedYardChecks() {
  const startInput = document.getElementById('filter-start-date');
  const endInput   = document.getElementById('filter-end-date');
  const startDate = startInput.value;
  const endDate   = endInput.value;

  if (!startDate || !endDate) {
    alert("Please select both a start and end date.");
    return;
  }

  loadSubmittedYardChecks(startDate, endDate);

  /* update currentMonday to the “start” date so Next/Prev know where to begin */
  currentMonday = new Date(startDate + "T00:00:00");
}

/* -------------------------
   7. YARD CHECK FORM SUBMISSION
------------------------- */

document.getElementById('lg-equipment-yard-check-form').addEventListener('submit', function(e) {
  e.preventDefault();

  function formatDateToLocalString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    const hh = String(date.getHours()).padStart(2,'0');
    const mm = String(date.getMinutes()).padStart(2,'0');
    const ss = String(date.getSeconds()).padStart(2,'0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  const now = new Date();
  const submissionDateTimeLocal = formatDateToLocalString(now);

  const formData = new FormData(this);
  formData.append('submission_date_time', submissionDateTimeLocal);

  fetch('submit_yard_check.php', { method: 'POST', body: formData })
    .then(resp => resp.json())
    .then(result => {
      if (result.status === 'error') {
        showDuplicateSubmissionMessage(result.existingYardCheck);
      } else {
        alert(result.message);
        this.reset();
        displayCurrentDateTime();
        const yardCheckIdInput = document.getElementById('yard-check-id');
        if (yardCheckIdInput) {
          yardCheckIdInput.value = '';
        }
      }
    })
    .catch(error => console.error('Error:', error));
});

function showDuplicateSubmissionMessage(existingYardCheck) {
  const dateObj = new Date(existingYardCheck.date);
  const formattedDate = ('0' + (dateObj.getMonth()+1)).slice(-2) + '/' +
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
  document.getElementById('message-container').innerHTML = messageContent;
}

function closeMessage() {
  document.getElementById('message-container').innerHTML = '';
}

/* -------------------------
   8. EQUIPMENT MANAGEMENT
------------------------- */

function showEquipmentManagement() {
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'block';
  document.getElementById('submitted-yard-checks').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'none';

  showActiveEquipmentTab();
  loadEquipmentLists();
  setActiveMenuItem();
}

function showActiveEquipmentTab() {
  document.getElementById('tab-active-equipment').classList.add('tab-active');
  document.getElementById('tab-deactivated-equipment').classList.remove('tab-active');
  document.getElementById('active-equipment-container').style.display = 'block';
  document.getElementById('deactivated-equipment-container').style.display = 'none';
}

function showDeactivatedEquipmentTab() {
  document.getElementById('tab-active-equipment').classList.remove('tab-active');
  document.getElementById('tab-deactivated-equipment').classList.add('tab-active');
  document.getElementById('active-equipment-container').style.display = 'none';
  document.getElementById('deactivated-equipment-container').style.display = 'block';
}

function loadEquipmentLists() {
  fetch('get_equipment.php')
    .then(response => response.json())
    .then(data => {
      const activeDiv = document.getElementById('active-equipment-list');
      const inactiveDiv = document.getElementById('deactivated-equipment-list');
      activeDiv.innerHTML = '';
      inactiveDiv.innerHTML = '';

      data.forEach(equipment => {
        const equipmentItemDiv = document.createElement('div');
        equipmentItemDiv.classList.add('equipment-item');

        let imageHTML = '';
        if (equipment.image_url) {
          imageHTML = `<img src="${equipment.image_url}" alt="${equipment.equipment_name}" class="equipment-image">`;
        }
        const equipmentHTML = `
          <div class="equipment-image-wrapper">${imageHTML}</div>
          <div class="equipment-info-container">
            <div class="equipment-txt-wrapper">
              <p>Unit ID: <span class="eq-list-id-num-txt">${equipment.unit_id}</span></p>
              <p>Name: <span class="eq-list-name-txt">${equipment.equipment_name}</span></p>
              <p>Manufacturer: <span class="eq-list-manufacturer-txt">${equipment.manufacturer}</span></p>
              <p>Model: <span class="eq-list-model-txt">${equipment.model}</span></p>
            </div>
            <div class="equipment-rates-wrapper">
              <p><strong>Rental Rates:</strong></p>
              <ul class="rental-rates-list">
                <li>4 Hours: $${parseFloat(equipment.rental_rate_4h || 0).toFixed(2)}</li>
                <li>Daily: $${parseFloat(equipment.rental_rate_daily || 0).toFixed(2)}</li>
                <li>Weekly: $${parseFloat(equipment.rental_rate_weekly || 0).toFixed(2)}</li>
                <li>Monthly: $${parseFloat(equipment.rental_rate_monthly || 0).toFixed(2)}</li>
              </ul>
            </div>
          </div>
        `;
        let actionButtonsHTML = `
          <button class="equipment-edit-button" onclick="showEditEquipmentForm(${equipment.id})">
            Edit <span class="eq-list-btn-icon"><i class="fa-solid fa-pen-to-square"></i></span>
          </button>
        `;
        if (equipment.is_active == 1) {
          actionButtonsHTML += `
            <button class="equipment-delete-button" onclick="deactivateEquipment(${equipment.id})">
              Deactivate <span class="eq-list-btn-icon"><i class="fa-solid fa-ban"></i></span>
            </button>
          `;
        } else {
          actionButtonsHTML += `
            <button class="equipment-reactivate-button" onclick="activateEquipment(${equipment.id})">
              Reactivate <span class="eq-list-btn-icon"><i class="fa-solid fa-check"></i></span>
            </button>
          `;
        }

        equipmentItemDiv.innerHTML = `
          ${equipmentHTML}
          <div class="equipment-button-wrapper">
            ${actionButtonsHTML}
          </div>
        `;

        if (equipment.is_active == 1) {
          activeDiv.appendChild(equipmentItemDiv);
        } else {
          inactiveDiv.appendChild(equipmentItemDiv);
        }
      });
    })
    .catch(error => console.error('Error:', error));
}

function deactivateEquipment(id) {
  if (confirm('Are you sure you want to deactivate this equipment?')) {
    fetch(`deactivate_equipment.php?id=${id}`)
      .then(resp => resp.json())
      .then(result => {
        if (result.status === 'success') {
          alert(result.message);
          loadEquipmentLists();
        } else {
          alert('Error: ' + result.message);
        }
      })
      .catch(err => console.error('Error:', err));
  }
}

function activateEquipment(id) {
  if (confirm('Are you sure you want to reactivate this equipment?')) {
    fetch(`activate_equipment.php?id=${id}`)
      .then(resp => resp.json())
      .then(result => {
        if (result.status === 'success') {
          alert(result.message);
          loadEquipmentLists();
        } else {
          alert('Error: ' + result.message);
        }
      })
      .catch(err => console.error('Error:', err));
  }
}

// Add or Edit Equipment
function showAddEquipmentForm() {
  const equipmentForm = document.getElementById('equipment-form');
  document.getElementById('form-title').textContent = 'Add Equipment';
  document.getElementById('equipment-id').value = '';
  document.getElementById('unit-id').value = '';
  document.getElementById('equipment-name').value = '';
  document.getElementById('manufacturer').value = '';
  document.getElementById('model').value = '';
  document.getElementById('image-url').value = '';
  document.getElementById('rental-rate-4h').value = '';
  document.getElementById('rental-rate-daily').value = '';
  document.getElementById('rental-rate-weekly').value = '';
  document.getElementById('rental-rate-monthly').value = '';

  equipmentForm.style.display = 'block';
  setTimeout(() => {
    equipmentForm.classList.add('show');
  }, 10);
}

function showEditEquipmentForm(id) {
  fetch(`get_equipment.php?id=${id}`)
    .then(resp => resp.json())
    .then(equipment => {
      const equipmentForm = document.getElementById('equipment-form');
      document.getElementById('form-title').textContent = 'Edit Equipment';
      document.getElementById('equipment-id').value = equipment.id;
      document.getElementById('unit-id').value = equipment.unit_id;
      document.getElementById('equipment-name').value = equipment.equipment_name;
      document.getElementById('manufacturer').value = equipment.manufacturer;
      document.getElementById('model').value = equipment.model;
      document.getElementById('image-url').value = equipment.image_url;
      document.getElementById('rental-rate-4h').value = equipment.rental_rate_4h;
      document.getElementById('rental-rate-daily').value = equipment.rental_rate_daily;
      document.getElementById('rental-rate-weekly').value = equipment.rental_rate_weekly;
      document.getElementById('rental-rate-monthly').value = equipment.rental_rate_monthly;

      equipmentForm.style.display = 'block';
      setTimeout(() => {
        equipmentForm.classList.add('show');
      }, 10);
    })
    .catch(err => console.error('Error:', err));
}

function cancelEquipmentForm() {
  const equipmentForm = document.getElementById('equipment-form');
  equipmentForm.classList.remove('show');
  setTimeout(() => {
    equipmentForm.style.display = 'none';
  }, 500);
}

document.getElementById('equipment-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(this);

  fetch('save_equipment.php', { method: 'POST', body: formData })
    .then(resp => resp.json())
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
    .catch(err => console.error('Error:', err));
});

/* -------------------------
   9. VIEW / EDIT YARD CHECK DETAILS
------------------------- */

function viewYardCheckDetails(id) {
  fetch(`get_yard_check_details.php?id=${id}`)
    .then(resp => resp.json())
    .then(yardCheck => {
      showYardCheckDetails(yardCheck);
    })
    .catch(err => console.error('Error:', err));
}

function showYardCheckDetails(yardCheck) {
  const modalContainer = document.getElementById('modal-container');

  // "YYYY-MM-DD" -> "MM/DD/YYYY"
  const [year, month, day] = yardCheck.date.split('-');
  const formattedDate = `${month}/${day}/${year}`;

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
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${yardCheck.check_time}</p>
        <p><strong>Submitted by:</strong> ${yardCheck.user_name}</p>
        <div>${equipmentStatuses}</div>
        <button onclick="editYardCheck(${yardCheck.id})">Edit</button>
        <button onclick="printYardCheck(${yardCheck.id})">Print</button>
      </div>
    </div>
  `;
  modalContainer.innerHTML = modalContent;
  modalContainer.style.display = 'block';
}

function closeModal() {
  document.getElementById('modal-container').style.display = 'none';
}

async function editYardCheck(id) {
  try {
    const response = await fetch(`get_yard_check_details.php?id=${id}`);
    const data = await response.json();
    closeModal();
    showYardCheckForm();
    await populateYardCheckForm(data);
  } catch (err) {
    console.error('Error:', err);
  }
}

async function populateYardCheckForm(yardCheck) {
  document.getElementById('user-name').value = yardCheck.user_name;
  document.getElementById('check-time').value = yardCheck.check_time;
  document.getElementById('check-date').value = yardCheck.date;

  // Hidden yard_check_id if not present
  if (!document.getElementById('yard-check-id')) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.id = 'yard-check-id';
    input.name = 'yard_check_id';
    document.getElementById('lg-equipment-yard-check-form').appendChild(input);
  }
  document.getElementById('yard-check-id').value = yardCheck.id;

  await populateEquipmentList();

  yardCheck.equipment_statuses.forEach(status => {
    const select = document.getElementById(`equipment-status-${status.unit_id}`);
    if (select) {
      select.value = status.equipment_status;
    }
  });
}

/* -------------------------
   10. EQUIPMENT STATS
------------------------- */

function showEquipmentStats() {
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'none';
  document.getElementById('submitted-yard-checks').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'block';
  loadEquipmentStats();
  setActiveMenuItem();
}

function loadEquipmentStats() {
  const dateRange = document.getElementById('stats-date-range').value;
  let startDate, endDate;

  if (dateRange === 'weekly') {
    // This Week (Monday->Sunday)
    const today = new Date();
    today.setHours(0,0,0,0);
    const dw = today.getDay();
    const offset = (dw + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startDate = formatAsYyyyMmDd(monday);
    endDate   = formatAsYyyyMmDd(sunday);

  } else if (dateRange === 'monthly') {
    // This Month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay  = new Date(today.getFullYear(), today.getMonth()+1, 0);
    startDate = formatAsYyyyMmDd(firstDay);
    endDate   = formatAsYyyyMmDd(lastDay);

  } else if (dateRange === 'custom') {
    startDate = document.getElementById('start-date').value;
    endDate   = document.getElementById('end-date').value;
  }

  fetch(`get_equipment_stats.php?start_date=${startDate}&end_date=${endDate}`)
    .then(resp => resp.json())
    .then(stats => {
      displayEquipmentStats(stats);
    })
    .catch(err => console.error('Error:', err));
}

function displayEquipmentStats(stats) {
  const statsDisplay = document.getElementById('stats-display');
  statsDisplay.innerHTML = '';

  const totalProfit = stats.total_estimated_profit.toFixed(2);
  const totalLoss   = stats.total_profit_loss.toFixed(2);

  statsDisplay.innerHTML += `
    <h3>Total Estimated Profit: $<span class="profit-amount">${totalProfit}</span></h3>
    <h3>Total Profit Loss: $<span class="loss-amount">${totalLoss}</span></h3>
  `;

  // Top 8
  let top8HTML = '<h4>Top 8 Most Popular Equipment</h4><ol>';
  stats.top8.forEach(item => {
    top8HTML += `<li>${item.equipment_name} - Days Rented: ${item.days_rented}, Estimated Profit: $<span class="profit-amount">${item.estimated_profit.toFixed(2)}</span></li>`;
  });
  top8HTML += '</ol>';
  statsDisplay.innerHTML += top8HTML;

  // Bottom 8
  let bottom8HTML = '<h4>Bottom 8 Least Popular Equipment</h4><ol>';
  stats.bottom8.forEach(item => {
    bottom8HTML += `<li>${item.equipment_name} - Days Rented: ${item.days_rented}, Estimated Profit: $<span class="profit-amount">${item.estimated_profit.toFixed(2)}</span></li>`;
  });
  bottom8HTML += '</ol>';
  statsDisplay.innerHTML += bottom8HTML;

  // Potential Sales
  if (stats.potential_sales.length > 0) {
    let potentialSalesHTML = '<h4>Potential Sales for Non-Rented Equipment</h4><ul>';
    stats.potential_sales.forEach(item => {
      potentialSalesHTML += `<li>${item.equipment_name} - Potential Profit: $<span class="profit-amount">${item.potential_profit.toFixed(2)}</span></li>`;
    });
    potentialSalesHTML += '</ul>';
    statsDisplay.innerHTML += potentialSalesHTML;
  }
}

/* -------------------------
   11. EXPORT / PRINT
------------------------- */

function exportReport(format) {
  const dateRange = document.getElementById('stats-date-range').value;
  let startDate, endDate;

  if (dateRange === 'weekly') {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dw = today.getDay();
    const offset = (dw + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startDate = formatAsYyyyMmDd(monday);
    endDate   = formatAsYyyyMmDd(sunday);

  } else if (dateRange === 'monthly') {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay  = new Date(today.getFullYear(), today.getMonth()+1, 0);
    startDate = formatAsYyyyMmDd(firstDay);
    endDate   = formatAsYyyyMmDd(lastDay);

  } else if (dateRange === 'custom') {
    startDate = document.getElementById('start-date').value;
    endDate   = document.getElementById('end-date').value;
  }

  window.location.href = `export_report.php?format=${format}&start_date=${startDate}&end_date=${endDate}`;
}

function printYardCheck(id) {
  window.open(`print_yard_check.php?id=${id}`, '_blank');
}

document.getElementById('stats-date-range').addEventListener('change', function() {
  if (this.value === 'custom') {
    document.getElementById('custom-date-range').style.display = 'block';
  } else {
    document.getElementById('custom-date-range').style.display = 'none';
  }
});
