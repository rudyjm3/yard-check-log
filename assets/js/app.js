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
let currentSortable = null;
let currentAlertDiscrepancies = [];
let currentAlertMissingSubmissions = [];
let currentInspectionAlerts = [];

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
 * Convert a Date -> 'YYYY-MM-DD'
 */
function formatAsYyyyMmDd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth()+1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert 'YYYY-MM-DD' -> 'MM/DD/YYYY'
 * for the no-submissions message
 */
function formatDateForDisplay(isoDateStr) {
  const [yyyy, mm, dd] = isoDateStr.split('-');
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Return array of date strings from start->end inclusive, 'YYYY-MM-DD'.
 */
function getDatesInRange(startStr, endStr) {
  const dates = [];
  const start = new Date(startStr + 'T00:00:00');
  const end   = new Date(endStr + 'T00:00:00');
  while (start <= end) {
    dates.push(formatAsYyyyMmDd(start));
    start.setDate(start.getDate() + 1);
  }
  return dates;
}

/* -------------------
WEATHER API 
------------------- */
// Fetch Weather Data from Meteosource API (RapidAPI)
// 1. Gets today's date in YYYY-MM-DD format (to match API format)
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 2. Formats a date string from API to readable form (like 'Wednesday, April 30, 2025')
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  const formattedDate = `${weekdays[date.getUTCDay()]}, ${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  return formattedDate;
}

// 3. Maps icon numbers to the correct file path in assets
function getMappedIcon(iconNumber) {
  return `assets/images/metrosource-weather-icons/set02/big/${iconNumber}.png`;
}
// Format weather text to be more readable
function formatWeatherText(text) {
  return text
    .replace(/_/g, ' ')                    // replace underscores with spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // capitalize first letter of each word
}

// 4. Main function that processes and displays weather data
function displayWeatherData(data) {
  const todayString = getTodayDateString();
  console.log('Today String:', todayString); // Debug today's date

  // Find the forecast object for today
  const todayIndex = data.daily.data.findIndex(day => day.day === todayString);
  if (todayIndex === -1) {
    console.error("Today's weather data not found. Data:", data.daily.data);
    return;
  }
  console.log('Today Index:', todayIndex, 'Data at Index:', data.daily.data[todayIndex]); // Debug index and data

  // Get today's forecast for current-weather-card
  const currentWeather = data.daily.data[todayIndex];
  document.querySelector('.current-weather-date-txt').textContent = formatDate(currentWeather.day);
  document.querySelector('.current-temp').textContent = `${Math.round(currentWeather.temperature)}\u00B0F`;
  document.querySelector('.current-hi-temp').textContent = `${Math.round(currentWeather.temperature_max)}\u00B0F`;
  document.querySelector('.current-lo-temp').textContent = `${Math.round(currentWeather.temperature_min)}\u00B0F`;
  document.querySelector('.weather-description').textContent = formatWeatherText(currentWeather.weather);
  document.querySelector('.weather-summary').textContent = currentWeather.summary;
  document.querySelector('.current-weather-card .weather-icon').src = getMappedIcon(currentWeather.icon);

  // Get the next 6 forecast days, explicitly excluding today
  const upcomingDays = data.daily.data.slice(todayIndex + 1, todayIndex + 7);
  console.log('Upcoming Days Raw:', upcomingDays.map(day => day.day)); // Debug raw days
  const weatherDaysWrapper = document.querySelector('.weather-days-wrapper');
  weatherDaysWrapper.innerHTML = ''; // Clear previous content

  // Limit to 6 days and use proper date formatting
  if (upcomingDays.length >= 6) {
    upcomingDays.slice(0, 6).forEach(day => {
      const dateObj = new Date(day.day + 'T00:00:00'); // Ensure local date parsing
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });
      const dayNumber = parseInt(dateObj.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' }), 10);
      const formattedDate = `${weekday} ${dayNumber}${getOrdinalSuffix(dayNumber)}`;

      console.log('Processing Day:', day.day, 'Formatted as:', formattedDate); // Debug each day

      const cardHTML = `
        <div class='weather-days-card glassmorphism-white'>
          <div class='weather-day-date'>
            <p class='weather-day'><span class='date'>${formattedDate}</span></p>
          </div>
          <div class='weather-info-wrapper'>
            <div class='weather-icon-wrapper'>
              <img src='${getMappedIcon(day.icon)}' alt='Weather Icon' class='weather-icon'> 
            </div>
            <div class='weather-temps-wrapper'>
              <p class='hi-temp'>${Math.round(day.temperature_max)}\u00B0F</p>
              <p class='lo-temp'>${Math.round(day.temperature_min)}\u00B0F</p>
            </div>
          </div>
        </div>
      `;
      weatherDaysWrapper.insertAdjacentHTML('beforeend', cardHTML);
    });
  } else {
    weatherDaysWrapper.innerHTML = '<p>Insufficient forecast data for the next 6 days.</p>';
    console.warn('Insufficient days:', upcomingDays.length);
  }
}

// 5. Fetches the weather data from the API and kicks off the display
async function fetchWeatherData() {
  const url = 'https://ai-weather-by-meteosource.p.rapidapi.com/daily?place_id=sevierville&language=en&units=us';
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': '0f232f78d2msh80bdc35b786d01dp1a92dcjsn0ab324d9264b',
      'x-rapidapi-host': 'ai-weather-by-meteosource.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data); // For debugging
    displayWeatherData(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

// 6. Run everything after the DOM is ready
document.addEventListener('DOMContentLoaded', fetchWeatherData);


/* ---------------------
YARDCHECK DISCREPANCY AND MISSING SUBMISSION ALERTS
--------------------- */
function displayDiscrepancyAlerts(
  discrepancies = currentAlertDiscrepancies,
  missingSubmissions = currentAlertMissingSubmissions,
  inspectionAlerts = currentInspectionAlerts
) {
  currentAlertDiscrepancies = Array.isArray(discrepancies) ? discrepancies : [];
  currentAlertMissingSubmissions = Array.isArray(missingSubmissions) ? missingSubmissions : [];
  currentInspectionAlerts = Array.isArray(inspectionAlerts) ? inspectionAlerts : [];

  const wrapper = document.querySelector('.alerts-card-wrapper');
  if (!wrapper) {
    console.error('Error: .alerts-card-wrapper not found in DOM');
    return;
  }
  wrapper.innerHTML = ''; // Clear previous alerts

  console.log('Discrepancies:', JSON.stringify(currentAlertDiscrepancies, null, 2));
  console.log('Missing Submissions:', JSON.stringify(currentAlertMissingSubmissions, null, 2));
  console.log('Inspection Alerts:', JSON.stringify(currentInspectionAlerts, null, 2));

  // Display missing submission alerts
  if (currentAlertMissingSubmissions.length) {
    currentAlertMissingSubmissions.forEach(({ type, message }) => {
      let title;
      if (type === 'week') {
        title = 'Missing Week Yard Checks';
      } else if (type === 'day') {
        title = 'Missing Daily Yard Check';
      } else {
        title = `Missing ${type.toUpperCase()} Yard Check`;
      }

      const card = document.createElement('div');
      card.className = 'alert-card';
      card.innerHTML = `
        <p class='alert-title'>${title}</p>
        <p class='alert-description'>${message}</p>
      `;
      wrapper.appendChild(card);
    });
  }

  // Display discrepancy alerts
  if (currentAlertDiscrepancies.length) {
    currentAlertDiscrepancies.forEach(({ type, date, expected, actual, note }) => {
      const title = type === 'rented_out'
        ? 'Rental Count Discrepancy'
        : 'Service Status Discrepancy';

      const itemLabel = type === 'rented_out'
        ? 'rented out'
        : 'out of service';

      const noteText = note ? ` (${note})` : '';
      const card = document.createElement('div');
      card.className = 'alert-card';
      card.innerHTML = `
        <p class='alert-title'>${title}</p>
        <p class='alert-description'>
          On <strong>${new Date(date).toLocaleDateString()}</strong>, AM shows 
          <strong>${actual}</strong> ${itemLabel}, but previous PM had 
          <strong>${expected}</strong>.${noteText} Please verify.
        </p>
      `;
      wrapper.appendChild(card);
    });
  }

  // Display inspection alerts
  if (currentInspectionAlerts.length) {
    currentInspectionAlerts.forEach(({ formType, title, description, buttonLabel = 'Complete Inspection', buttonClass }) => {
      const card = document.createElement('div');
      card.className = 'alert-card';

      const titleEl = document.createElement('p');
      titleEl.className = 'alert-title';
      titleEl.textContent = title;

      const descriptionEl = document.createElement('p');
      descriptionEl.className = 'alert-description';
      descriptionEl.textContent = description;

      const buttonWrapper = document.createElement('div');
      buttonWrapper.className = 'alert-button-wrapper';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = buttonClass || 'alert-btn-inspection';
      button.textContent = buttonLabel;
      button.addEventListener('click', () => handleOverdueInspectionClick(formType));

      buttonWrapper.appendChild(button);
      card.append(titleEl, descriptionEl, buttonWrapper);
      wrapper.appendChild(card);
    });
  }
}

// New loader for just the alerts
function loadYardCheckAlerts(startDate, endDate) {
  console.log(`Fetching alerts for ${startDate} to ${endDate} at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
  fetch(`get_submitted_yard_checks.php?start=${startDate}&end=${endDate}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('Received data:', JSON.stringify(data, null, 2));
      if (data.status === 'error') {
        console.error('Server error:', data.message);
        const wrapper = document.querySelector('.alerts-card-wrapper');
        if (wrapper) {
          wrapper.innerHTML = `<div class='alert-card'><p class='alert-description'>Error: ${data.message}</p></div>`;
        }
        return;
      }
      currentAlertDiscrepancies = Array.isArray(data.discrepancies) ? data.discrepancies : [];
      currentAlertMissingSubmissions = Array.isArray(data.missingSubmissions) ? data.missingSubmissions : [];
      displayDiscrepancyAlerts();
    })
    .catch(error => {
      console.error('Error loading yard check alerts:', error);
      const wrapper = document.querySelector('.alerts-card-wrapper');
      if (wrapper) {
        wrapper.innerHTML = "<div class='alert-card'><p class='alert-description'>Unable to load alerts at this time. Please try again later.</p></div>";
      }
    });
}

/* -------------------------
// ... (Other functions unchanged until DOMContentLoaded)
------------------------- */

// Update DOMContentLoaded to ensure alerts load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded triggered at', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  displayCurrentDateTime();
  showDashboard();
  const today = new Date();
  today.setHours(0,0,0,0); // Normalize to midnight
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const offset = (dayOfWeek + 6) % 7; // Offset to previous Monday
  const first = new Date(today);
  first.setDate(today.getDate() - offset); // Monday of current week
  const last = new Date(first);
  last.setDate(first.getDate() + 6); // Sunday of current week
  const startDate = first.toISOString().slice(0, 10);
  const endDate = last.toISOString().slice(0, 10);
  console.log('Loading alerts for week:', startDate, 'to', endDate);
  loadYardCheckAlerts(startDate, endDate);
});

/* ---------------------
SCROLL TO TOP BUTTON 
-------------------- */

const container = document.getElementById('main-content-container');
const scrollToTopButton = document.getElementById('scrollToTopButton');

// Listen for scroll events on the container
container.addEventListener('scroll', function() {
   const scrollPercent = container.scrollTop / (container.scrollHeight - container.clientHeight);

   // Toggle the 'show' class if scrolled more than 25%
   if (scrollPercent > 0.25) {
      scrollToTopButton.classList.add('show');
   } else {
      scrollToTopButton.classList.remove('show');
   }
});

// Function to smoothly scroll to the top of the container
function scrollToTop() {
   container.scrollTo({ top: 0, behavior: 'smooth' });
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
  const menuIcon = document.getElementsByClassName('menu-collapse-icon')[0];

  navContainer.classList.toggle('side-nav-container-collapsed');
//   if (navContainer.classList.contains('side-nav-container-collapsed')) {
//     collapseBtn.innerHTML = '<i class='fa-solid fa-angle-right'></i>';
//   } else {
//     collapseBtn.innerHTML = '<i class='fa-solid fa-angle-left'></i>';
//   }
  if (navContainer.classList.contains('side-nav-container-collapsed')) {
    menuIcon.classList.remove('side-menu-btn-open-state');
  } else {
    menuIcon.classList.add('side-menu-btn-open-state');
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
 * Show 'Submitted Yard Checks' for the current local Mondayâ†’Sunday.
 */
function showSubmittedYardChecks() {
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('pickup-truck-inspection').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'none';
  document.getElementById('submitted-yard-checks').style.display = 'block';

  const now = new Date();
  now.setHours(0,0,0,0);

  const dayOfWeek = now.getDay();
  const offset = (dayOfWeek + 6) % 7;
  console.log('showSubmittedYardChecks => dayOfWeek=', dayOfWeek, ' offset=', offset);

  currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - offset);

  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);

  const startDate = formatAsYyyyMmDd(currentMonday);
  const endDate   = formatAsYyyyMmDd(sunday);

  loadSubmittedYardChecks(startDate, endDate);
  loadYardCheckAlerts(startDate, endDate); // Refresh alerts

  closeActiveInspectionModal({ resetForm: true });
  hideInspectionSuccess();
  hideInspectionWarningModal();
  setActiveMenuItem();
}

/**
 * Load yard checks for [startDate..endDate].
 * If none => single â€œno submissionsâ€ message,
 * else partial placeholders for missing AM/PM.
 */
function loadSubmittedYardChecks(startDate, endDate) {
  let url = 'get_submitted_yard_checks.php';
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }

  fetch(url)
    .then(resp => resp.json())
    .then(response => {
      const yardChecksListDiv = document.getElementById('yard-checks-list');
      yardChecksListDiv.innerHTML = '';

      // Get the yard checks array from the response
      const data = response.yardChecks;

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

      // Handle discrepancies if needed
      const discrepancies = response.discrepancies;
      if (discrepancies && discrepancies.length > 0) {
        console.log('Discrepancies found:', discrepancies);
        // You can handle discrepancies here if needed
      }

      // Rest of the existing function remains the same
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
               <div class='card-col-title-wrapper'>
                  <p class='ampm-txt'>${checkTime} Submission -</p>
                  <p class='user-name-txt'>Submitted by:<span class='user-name-txt-data'> ${yardCheck.user_name}</span></p>
                  <p class='time-submitted-txt'>Time submitted: <span class='time-submitted-txt-data'>${formattedTime}</span></p>
               </div>
               <div class='card-col-content-wrapper'>
                  <div class='card-col-content-block'>
                     <p>Available</p>
                     <p class='available-num-data'> ${yardCheck.equipment_available}</p>
                  </div>
                  <div class='card-col-content-block'>
                     <p>Rented out</p> 
                     <p class='rented-out-num-data'>${yardCheck.equipment_rented_out}</p>
                  </div>
                  <div class='card-col-content-block'>
                     <p>Out of service</p> 
                     <p class='out-of-service-num-data'>${yardCheck.equipment_out_of_service}</p>
                  </div>
                  <div class='card-col-content-block'>
                     <p>Total equipment</p> 
                     <p class='total-equipment-num-data'>${yardCheck.total_equipment}</p>
                  </div>
               </div>
              
               ${
                  checkTime === 'PM'
                     ? `<p class='est-profit-txt'><strong>Estimated profit:</strong> $<span class='profit-amount'>${yardCheck.estimated_profit.toFixed(2)}</span></p>`
                     : ''
               }
              
               <p class='profit-loss-txt'><strong>Profit loss:</strong> $<span class='loss-amount'>${yardCheck.profit_loss.toFixed(2)}</span>
               </p>
              
               <div class='button-wrapper'>
                  <button onclick='viewYardCheckDetails(${yardCheck.id})'>View Yard Check</button>
                  <button onclick='editYardCheck(${yardCheck.id})'>Edit Yard Check</button>
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
    alert('Please select both a start and end date.');
    return;
  }

  loadSubmittedYardChecks(startDate, endDate);

  /* update currentMonday to the â€œstartâ€ date so Next/Prev know where to begin */
  currentMonday = new Date(startDate + 'T00:00:00');
}

/* -------------------------
   7. YARD CHECK FORM SUBMISSION
------------------------- */

 // Show Yard Check Form
 function showYardCheckForm() {
   document.getElementById('dashboard-container').style.display = 'none';
   if (currentSortable) {
     currentSortable.destroy();
     currentSortable = null;
   }

   // clearYardCheckForm();
   document.getElementById('lg-equipment-yard-check-form').style.display = 'block';
   document.getElementById('pickup-truck-inspection').style.display = 'none';
   document.getElementById('equipment-management').style.display = 'none';
   document.getElementById('submitted-yard-checks').style.display = 'none';
   document.getElementById('equipment-stats').style.display = 'none';
   populateEquipmentList();
   // Set the active class
   setActiveMenuItem();
}

// Function to populate equipment list in the Yard Check Form
async function populateEquipmentList() {
   try {
     const response = await fetch('get_equipment.php?onlyActive=true');
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
         imageHTML = `<img src='${equipment.image_url}' alt='${equipment.equipment_name}' class='equipment-image'>`;
       }
 
       // Equipment label with equipment image and info
       const label = document.createElement('label');
       label.htmlFor = `equipment-status-${equipment.unit_id}`;
       label.innerHTML = `
         <div class='img-eq-info-wrapper'>
           <div class='image-wrapper'>
             ${imageHTML}
           </div>
           <div class='eq-info-wrapper'>
             <p class='rental-id-label'>Unit ID - <span class='rental-id-num'>${equipment.unit_id}</span></p>
             <p class='equipment-name'>${equipment.equipment_name}</p>
             <div class='view-more-wrapper'>
               <a href='#' onclick='toggleEquipmentInfo(event, '${equipment.unit_id}')'>View more info</a>
               <div id='equipment-info-${equipment.unit_id}' class='equipment-info' style='display: none;'>
                 <p><strong>Manufacturer:</strong> ${equipment.manufacturer}</p>
                 <p><strong>Model:</strong> ${equipment.model}</p>
               </div>
             </div>
           </div>
         </div>
         <!-- Selection wrapper appended here -->
       `;
 
       // Create wrapper for the equipment status radio buttons
       const statusOptionWrapper = document.createElement('div');
       statusOptionWrapper.classList.add('option-wrapper');
       const statusLabel = document.createElement('label');
       statusLabel.classList.add('status-label');
       statusLabel.textContent = 'Equipment Status';
       statusOptionWrapper.appendChild(statusLabel);
 
       // Create a wrapper for radio buttons and radio labels
       const radioBtnGroupWrapper = document.createElement('div');
       radioBtnGroupWrapper.classList.add('radio-btn-group-wrapper');
 
       // Array of equipment status options
       const statuses = ['Available', 'Rented', 'Out of Service'];
 
       // Create a radio button and its label for each status option
       statuses.forEach(status => {
         const radioContainer = document.createElement('div');
         radioContainer.classList.add('radio-option');
 
         const radioInput = document.createElement('input');
         radioInput.type = 'radio';
         // Use a common name so that only one option can be selected per equipment
         radioInput.name = `equipment_status_${equipment.unit_id}`;
         // Create a unique id for each radio button
         radioInput.id = `equipment-status-${equipment.unit_id}-${status.toLowerCase().replace(/\s+/g, '-')}`;
         radioInput.value = status;
         radioInput.required = true;
 
         const radioLabel = document.createElement('label');
         radioLabel.htmlFor = radioInput.id;
         radioLabel.textContent = status;
 
         radioContainer.appendChild(radioInput);
         radioContainer.appendChild(radioLabel);
         radioBtnGroupWrapper.appendChild(radioContainer);
       });
 
       // Append the radio buttons group wrapper to the status option wrapper
       statusOptionWrapper.appendChild(radioBtnGroupWrapper);
 
       // Append the equipment label and the status option wrapper to the equipmentDiv
       equipmentDiv.appendChild(label);
       equipmentDiv.appendChild(statusOptionWrapper);
 
       // Append the equipmentDiv to the equipmentListDiv
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
    showSubmittedYardChecks();
});

function showDuplicateSubmissionMessage(existingYardCheck) {
  const dateObj = new Date(existingYardCheck.date);
  const formattedDate = ('0' + (dateObj.getMonth()+1)).slice(-2) + '/' +
                        ('0' + dateObj.getDate()).slice(-2) + '/' +
                        dateObj.getFullYear();

  const messageContent = `
    <div class='message'>
      <p>A yard check for this date and time has already been submitted.</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${existingYardCheck.check_time}</p>
      <p><strong>Submitted by:</strong> ${existingYardCheck.user_name}</p>
      <button onclick='viewYardCheckDetails(${existingYardCheck.id})'>View Submitted Yard Check</button>
      <button onclick='closeMessage()'>Close</button>
    </div>
  `;
  document.getElementById('message-container').innerHTML = messageContent;
}

function closeMessage() {
  document.getElementById('message-container').innerHTML = '';
}

/* -------------------------
    TRUCK INSPECTION FORMS
------------------------- */
const INSPECTION_CHECKBOX_LABELS = {
  all_fluids_topped: 'All fluids are topped off',
  license_plate_present: 'License plate present with up-to-date sticker',
  damage_to_vehicle: 'Damage to the vehicle',
  tires_inflation_and_wear: 'Tires for appropriate inflation, tread wear and cuts',
  lights_operation_and_lens: 'Headlights, tail lights and turn signals for cracked lens and operation',
  glass_and_mirrors: 'Glass and mirrors for cracks and operation',
  wipers_operation_and_wear: 'Windshield wipers for operation and wear',
  bed_and_tailgate: 'Truck bed sides and tail gate for operation and broken hinges',
  load_sensor_checked: 'Load sensor inspected and activated',
  decals_condition: 'Decals are present and in good condition',
  tow_hitch_locked_or_welded: 'Tow hitch has a weld or locking mechanism (2015+ models)',
  seatbelts: 'Seatbelts for operation, cuts or frays',
  horn_operation: 'Steering wheel horn for operation',
  parking_brake: 'Parking brake engages',
  spare_tire_inflated: 'Spare tire properly inflated (vans only) and tools',
  ac_heater: 'AC and heating are operational',
  registration_insurance: 'Registration, insurance card, and accident documents in glove box',
  decals_interior: 'Interior decals are present and in good condition',
  toll_transponder: 'Toll transponder (if applicable)',
  fire_extinguisher: 'Fire extinguisher present, charged, inspection current'
};

const INSPECTION_CATEGORY_ORDER = [
  { key: 'truck_fluids', label: 'Truck Fluids' },
  { key: 'truck_exterior', label: 'Truck Exterior' },
  { key: 'truck_interior', label: 'Truck Interior' }
];

const TRUCK_INSPECTION_PAGE_SIZE = 5;

let truckInspectionHistoryData = [];
let truckInspectionHistoryFiltered = [];
let truckInspectionHistoryListEl = null;
let truckInspectionForms = { pro: null, rental: null };
let truckInspectionModals = { pro: null, rental: null };
let truckInspectionToggleButtons = [];
let truckInspectionSuccessModal = null;
let truckInspectionWarningModal = null;
let truckInspectionSection = null;
let truckInspectionFilterFormTypeEl = null;
let truckInspectionFilterSearchEl = null;
let truckInspectionPaginationStatusEl = null;
let truckInspectionPaginationButtons = { prev: null, next: null };
let truckInspectionHistoryPage = 1;
let activeInspectionModalType = null;
let truckInspectionSearchDebounce = null;
let truckInspectionWarningMessageEl = null;
let truckInspectionWarningProceedBtn = null;
let truckInspectionWarningCancelBtn = null;
let pendingInspectionStartType = null;
let truckInspectionServerSummary = null;

function getInspectionFormLabel(type) {
  return type === 'pro' ? 'Load N Go Inspection' : 'Rental Pickup Inspection';
}

function formatInspectionDateTime(value) {
  if (!value) return 'N/A';
  const date = parseInspectionDate(value);
  if (!date) return value;
  const normalized = String(value);
  const hasTime = /T\d|\s\d/.test(normalized);
  if (hasTime) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatInspectionDate(value) {
  const date = parseInspectionDate(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function fallbackChecklistLabel(value) {
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapChecklistValues(values = []) {
  if (!Array.isArray(values)) return [];
  return values.map(code => INSPECTION_CHECKBOX_LABELS[code] || fallbackChecklistLabel(code));
}

function setInspectionSubmitButtonLabel(form, label) {
  if (!form) return;
  const submitBtn = form.querySelector('.inspection-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = label;
  }
}

function resetInspectionForm(form) {
  if (!form) return;
  form.reset();
  const idField = form.querySelector("input[name='id']");
  if (idField) idField.value = '';
  const dateField = form.querySelector('input[type="date"][data-default-today="true"]');
  if (dateField) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateField.value = `${yyyy}-${mm}-${dd}`;
  }
  form.dataset.editing = 'false';
  const defaultLabel = form.dataset.submitDefault || 'Submit Inspection';
  setInspectionSubmitButtonLabel(form, defaultLabel);
}

function populateInspectionForm(form, record) {
  if (!form || !record) return;
  resetInspectionForm(form);

  const idField = form.querySelector("input[name='id']");
  if (idField) idField.value = record.id;
  form.dataset.editing = 'true';

  const dateField = form.querySelector("input[name='inspection_date']");
  if (dateField) dateField.value = record.inspection_date || '';

  const inspectorField = form.querySelector("input[name='inspected_by']");
  if (inspectorField) inspectorField.value = record.inspected_by || '';

  ['truck_fluids', 'truck_exterior', 'truck_interior'].forEach((groupName) => {
    const values = new Set(Array.isArray(record[groupName]) ? record[groupName] : []);
    form.querySelectorAll(`input[name='${groupName}[]']`).forEach((input) => {
      input.checked = values.has(input.value);
    });
  });

  const commentsField = form.querySelector("textarea[name='inspection_comments']");
  if (commentsField) commentsField.value = record.inspection_comments || '';

  setInspectionSubmitButtonLabel(form, 'Update Inspection');
}

function buildChecklistContainer(record) {
  const container = document.createElement('div');
  container.className = 'inspection-history-checklist';

  INSPECTION_CATEGORY_ORDER.forEach(({ key, label }) => {
    const friendlyItems = mapChecklistValues(record[key]);
    if (!friendlyItems.length) return;

    const section = document.createElement('div');
    section.className = 'inspection-history-checklist-section';

    const heading = document.createElement('h4');
    heading.textContent = label;
    section.appendChild(heading);

    const list = document.createElement('ul');
    friendlyItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    section.appendChild(list);
    container.appendChild(section);
  });

  if (!container.children.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No checklist items recorded.';
    container.appendChild(emptyMessage);
  }

  return container;
}

function openInspectionModal(type, options = {}) {
  const { resetForm = true, record = null } = options;
  const modal = truckInspectionModals[type];
  const form = truckInspectionForms[type];
  if (!modal || !form) return;

  if (resetForm) {
    resetInspectionForm(form);
  }

  if (record) {
    populateInspectionForm(form, record);
  }

  truckInspectionToggleButtons.forEach((btn) => {
    if (btn.dataset.inspectionTarget === type) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  activeInspectionModalType = type;

  const firstField = form.querySelector('input, textarea, select');
  if (firstField) {
    firstField.focus({ preventScroll: true });
  }
}

function closeActiveInspectionModal(options = {}) {
  const { resetForm = false } = options;
  if (!activeInspectionModalType) return;

  const modal = truckInspectionModals[activeInspectionModalType];
  const form = truckInspectionForms[activeInspectionModalType];
  if (modal) {
    modal.classList.add('hidden');
  }
  if (resetForm && form) {
    resetInspectionForm(form);
  }

  truckInspectionToggleButtons.forEach((btn) => btn.classList.remove('is-active'));
  unlockBodyScrollIfNoModal();
  activeInspectionModalType = null;
}

function showInspectionSuccess(message) {
  if (!truckInspectionSuccessModal) return;
  const messageEl = truckInspectionSuccessModal.querySelector('#inspection-success-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
  truckInspectionSuccessModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function hideInspectionSuccess() {
  if (!truckInspectionSuccessModal) return;
  truckInspectionSuccessModal.classList.add('hidden');
  unlockBodyScrollIfNoModal();
}

async function submitInspectionForm(form) {
  const formData = new FormData(form);
  const isEdit = Boolean(formData.get('id'));
  try {
    const response = await fetch('submit_truck_inspection_form.php', {
      method: 'POST',
      body: formData
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== 'success') {
      alert(payload.message || 'There was a problem saving the inspection.');
      return;
    }

    closeActiveInspectionModal({ resetForm: true });
    showInspectionSuccess(isEdit ? 'Inspection updated successfully.' : 'Inspection submitted successfully.');
    await fetchTruckInspectionHistory();
  } catch (error) {
    console.error(error);
    alert('Network or server error while saving.');
  }
}

function updateInspectionPaginationControls(totalItems, totalPages) {
  if (truckInspectionPaginationStatusEl) {
    if (totalItems === 0) {
      truckInspectionPaginationStatusEl.textContent = 'No results';
    } else {
      const label = totalItems === 1 ? 'result' : 'results';
      truckInspectionPaginationStatusEl.textContent = `Page ${truckInspectionHistoryPage} of ${totalPages} | ${totalItems} ${label}`;
    }
  }

  if (truckInspectionPaginationButtons.prev) {
    truckInspectionPaginationButtons.prev.disabled = truckInspectionHistoryPage <= 1 || totalItems === 0;
  }
  if (truckInspectionPaginationButtons.next) {
    truckInspectionPaginationButtons.next.disabled = truckInspectionHistoryPage >= totalPages || totalItems === 0;
  }
}

function renderTruckInspectionHistory() {
  if (!truckInspectionHistoryListEl) return;

  truckInspectionHistoryListEl.innerHTML = '';

  const totalItems = truckInspectionHistoryFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / TRUCK_INSPECTION_PAGE_SIZE));
  if (truckInspectionHistoryPage > totalPages) {
    truckInspectionHistoryPage = totalPages;
  }

  const startIndex = (truckInspectionHistoryPage - 1) * TRUCK_INSPECTION_PAGE_SIZE;
  const pageItems = truckInspectionHistoryFiltered.slice(startIndex, startIndex + TRUCK_INSPECTION_PAGE_SIZE);

  if (!pageItems.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'inspection-history-empty';
    emptyState.textContent = truckInspectionHistoryData.length
      ? 'No inspections match your current filters.'
      : 'No inspections have been submitted yet. Completed inspections will appear here.';
    truckInspectionHistoryListEl.appendChild(emptyState);
    updateInspectionPaginationControls(totalItems, totalPages);
    return;
  }

  const fragment = document.createDocumentFragment();

  pageItems.forEach((record) => {
    const item = document.createElement('article');
    item.className = 'inspection-history-item';
    item.dataset.id = String(record.id);

    const meta = document.createElement('div');
    meta.className = 'inspection-history-meta';

    const typeSpan = document.createElement('span');
    typeSpan.textContent = getInspectionFormLabel(record.form_type);

    const inspectionDateSpan = document.createElement('span');
    const inspectionDateDisplay = formatInspectionDate(record.inspection_date || record.created_at);
    inspectionDateSpan.textContent = `Inspection Date: ${inspectionDateDisplay}`;

    const inspectorSpan = document.createElement('span');
    inspectorSpan.textContent = `Completed by: ${record.inspected_by || 'Unknown'}`;

    meta.append(typeSpan, inspectionDateSpan);

    if (record.created_at) {
      const submittedSpan = document.createElement('span');
      submittedSpan.textContent = `Submitted: ${formatInspectionDateTime(record.created_at)}`;
      meta.appendChild(submittedSpan);
    }

    if (record.updated_at) {
      const updatedSpan = document.createElement('span');
      updatedSpan.textContent = `Last Updated: ${formatInspectionDateTime(record.updated_at)}`;
      meta.appendChild(updatedSpan);
    }

    meta.appendChild(inspectorSpan);

    const commentsRow = document.createElement('div');
    commentsRow.className = 'inspection-history-comments';

    const commentsLabel = document.createElement('span');
    commentsLabel.className = 'inspection-history-comments-label';
    commentsLabel.textContent = 'Comments:';

    const fullComment = (record.inspection_comments || '').trim();
    const commentsText = document.createElement('span');
    commentsText.className = 'inspection-history-comments-text';

    if (!fullComment) {
      commentsText.textContent = 'No comments were provided.';
      commentsText.dataset.expanded = 'true';
      commentsRow.append(commentsLabel, commentsText);
    } else {
      const needsToggle = fullComment.length > 80;
      const truncated = needsToggle ? `${fullComment.slice(0, 80)}…` : fullComment;

      commentsText.textContent = truncated;
      commentsText.dataset.fullText = fullComment;
      commentsText.dataset.truncatedText = truncated;
      commentsText.dataset.expanded = needsToggle ? 'false' : 'true';

      commentsRow.append(commentsLabel, commentsText);

      if (needsToggle) {
        commentsText.classList.add('inspection-comment-visual');
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'inspection-history-toggle';
        toggleBtn.dataset.action = 'toggle-comment';
        toggleBtn.dataset.id = String(record.id);
        toggleBtn.textContent = 'View more';
        toggleBtn.classList.add('inspection-history-toggle-inline');
        commentsRow.append(toggleBtn);
      }
    }

    const actions = document.createElement('div');
    actions.className = 'inspection-history-actions';

    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'inspection-history-action';
    viewBtn.dataset.action = 'view';
    viewBtn.dataset.id = String(record.id);
    viewBtn.textContent = 'Generate PDF';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'inspection-history-action';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = String(record.id);
    editBtn.textContent = 'Edit';

    const checklistBtn = document.createElement('button');
    checklistBtn.type = 'button';
    checklistBtn.className = 'inspection-history-action';
    checklistBtn.dataset.action = 'toggle-checklist';
    checklistBtn.dataset.id = String(record.id);
    checklistBtn.textContent = 'View Checklist';

    actions.append(viewBtn, editBtn, checklistBtn);

    const checklist = buildChecklistContainer(record);

    item.append(meta, commentsRow, actions, checklist);
    fragment.appendChild(item);
  });

  truckInspectionHistoryListEl.appendChild(fragment);
  updateInspectionPaginationControls(totalItems, totalPages);
}

function applyInspectionHistoryFilters() {
  const typeFilter = truckInspectionFilterFormTypeEl ? truckInspectionFilterFormTypeEl.value : 'all';
  const searchTerm = truckInspectionFilterSearchEl ? truckInspectionFilterSearchEl.value.trim().toLowerCase() : '';

  truckInspectionHistoryFiltered = truckInspectionHistoryData.filter((record) => {
    if (typeFilter !== 'all' && record.form_type !== typeFilter) {
      return false;
    }
    if (searchTerm) {
      const haystack = [
        record.inspected_by,
        record.inspection_comments,
        record.inspection_date,
        getInspectionFormLabel(record.form_type)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    }
    return true;
  });

  truckInspectionHistoryPage = 1;
  renderTruckInspectionHistory();
}

function changeInspectionHistoryPage(delta) {
  const totalItems = truckInspectionHistoryFiltered.length;
  if (!totalItems) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / TRUCK_INSPECTION_PAGE_SIZE));
  const nextPage = truckInspectionHistoryPage + delta;
  if (nextPage < 1 || nextPage > totalPages) return;

  truckInspectionHistoryPage = nextPage;
  renderTruckInspectionHistory();
}

function handleInspectionHistoryClick(event) {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const recordId = actionButton.dataset.id;

  if (action === 'toggle-comment') {
    const commentsRow = actionButton.closest('.inspection-history-comments');
    const textEl = commentsRow ? commentsRow.querySelector('.inspection-history-comments-text') : null;
    if (!textEl) return;
    const isExpanded = textEl.dataset.expanded === 'true';
    const newExpanded = !isExpanded;
    textEl.textContent = newExpanded ? textEl.dataset.fullText || '' : textEl.dataset.truncatedText || '';
    textEl.dataset.expanded = newExpanded ? 'true' : 'false';
    textEl.classList.toggle('inspection-comment-visual', !newExpanded);
    actionButton.textContent = newExpanded ? 'View less' : 'View more';
    actionButton.classList.toggle('is-expanded', newExpanded);
    return;
  }

  if (action === 'toggle-checklist') {
    const item = actionButton.closest('.inspection-history-item');
    const checklist = item ? item.querySelector('.inspection-history-checklist') : null;
    if (!checklist) return;
    const isVisible = checklist.classList.toggle('is-visible');
    actionButton.textContent = isVisible ? 'Hide Checklist' : 'View Checklist';
    return;
  }

  if (!recordId) return;
  const record = truckInspectionHistoryData.find((entry) => String(entry.id) === String(recordId));
  if (!record) return;

  if (action === 'view') {
    window.open(`generate_truck_inspection_pdf.php?id=${record.id}`, '_blank');
    return;
  }

  if (action === 'edit') {
    openInspectionModal(record.form_type, { resetForm: true, record });
    if (truckInspectionSection) {
      truckInspectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

async function fetchTruckInspectionHistory() {
  if (!truckInspectionHistoryListEl) return;

  try {
    const response = await fetch('get_truck_inspections.php', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || payload.status !== 'success') {
      console.error(payload.message || 'Failed to load inspection history.');
      return;
    }
    truckInspectionHistoryData = Array.isArray(payload.data) ? payload.data : [];
    truckInspectionServerSummary = payload.meta ?? payload.summary ?? null;
    applyInspectionHistoryFilters();
    updateInspectionOverdueAlerts(truckInspectionServerSummary);
  } catch (error) {
    console.error('Unable to load inspection history.', error);
  }
}

function buildInspectionAlertsFromMissing(missingTypes, periodLabel) {
  if (!Array.isArray(missingTypes) || !missingTypes.length) {
    return [];
  }

  return missingTypes.map((type) => {
    const formLabel = getInspectionFormLabel(type);
    return {
      formType: type,
      title: `${formLabel} Past Due`,
      description: `No ${formLabel.toLowerCase()} has been submitted for ${periodLabel}.`,
      buttonLabel: 'Complete Inspection',
      buttonClass: 'alert-btn-inspection'
    };
  });
}

function updateInspectionOverdueAlerts(summary = null) {
  const today = new Date();
  if (today.getDate() < 2) {
    currentInspectionAlerts = [];
    displayDiscrepancyAlerts();
    return;
  }

  if (summary && Array.isArray(summary.missing_form_types)) {
    const periodLabel = (() => {
      if (summary.period_label) {
        return summary.period_label;
      }
      const summaryYear = typeof summary.current_year === 'number'
        ? summary.current_year
        : today.getFullYear();
      const summaryMonthRaw = typeof summary.current_month === 'number'
        ? summary.current_month
        : today.getMonth() + 1; // convert to 1-based
      const normalizedMonthIndex = Math.min(12, Math.max(1, parseInt(summaryMonthRaw, 10) || (today.getMonth() + 1))) - 1;
      const periodDate = new Date(summaryYear, normalizedMonthIndex, 1);
      return periodDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    })();

    currentInspectionAlerts = buildInspectionAlertsFromMissing(summary.missing_form_types, periodLabel);
    displayDiscrepancyAlerts();
    return;
  }

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const fallbackPeriodLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const missingTypes = ['pro', 'rental'].filter(
    (type) => !findInspectionSubmissionForMonth(type, currentYear, currentMonth)
  );

  currentInspectionAlerts = buildInspectionAlertsFromMissing(missingTypes, fallbackPeriodLabel);
  displayDiscrepancyAlerts();
}

function hasInspectionSubmissionForMonth(formType, year, month) {
  return Boolean(findInspectionSubmissionForMonth(formType, year, month));
}

function isDateInYearMonth(value, year, month) {
  const date = parseInspectionDate(value);
  if (!date) return false;
  return date.getFullYear() === year && date.getMonth() === month;
}

function parseInspectionDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  let normalized = String(value).trim();
  if (!normalized || normalized === '0000-00-00') return null;

  if (!normalized.includes('T')) {
    normalized = normalized.includes(' ') ? normalized.replace(' ', 'T') : `${normalized}T00:00:00`;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findInspectionSubmissionForMonth(formType, year, month) {
  const normalizedTarget = String(formType || '').trim().toLowerCase();
  let latest = null;

  truckInspectionHistoryData.forEach((record) => {
    const recordType = String(record.form_type || '').trim().toLowerCase();
    if (recordType !== normalizedTarget) return;

    const inspectionDate = record.inspection_date && record.inspection_date !== '0000-00-00'
      ? record.inspection_date
      : null;

    if (inspectionDate) {
      if (isDateInYearMonth(inspectionDate, year, month)) {
        const parsed = parseInspectionDate(inspectionDate);
        if (parsed && (!latest || parsed > latest.date)) {
          latest = { record, date: parsed, sourceValue: inspectionDate, sourceField: 'inspection_date' };
        }
      }
      return;
    }

    const fallback = record.created_at || null;
    if (!fallback) return;
    if (!isDateInYearMonth(fallback, year, month)) return;

    const parsed = parseInspectionDate(fallback);
    if (!parsed) return;

    if (!latest || parsed > latest.date) {
      latest = { record, date: parsed, sourceValue: fallback, sourceField: 'created_at' };
    }
  });

  return latest;
}

function findLatestInspectionForCurrentMonth(formType) {
  const today = new Date();
  return findInspectionSubmissionForMonth(formType, today.getFullYear(), today.getMonth());
}

function handleInspectionStart(formType) {
  const submissionInfo = findLatestInspectionForCurrentMonth(formType);
  if (submissionInfo) {
    showInspectionWarningModal(formType, submissionInfo);
  } else {
    openInspectionModal(formType, { resetForm: true });
  }
}

function showInspectionWarningModal(formType, submissionInfo) {
  if (!truckInspectionWarningModal || !truckInspectionWarningMessageEl) {
    openInspectionModal(formType, { resetForm: true });
    return;
  }

  pendingInspectionStartType = formType;
  const formLabel = getInspectionFormLabel(formType);
  const record = submissionInfo.record;
  const inspector = record.inspected_by ? record.inspected_by : 'Unknown';
  const submittedValue = submissionInfo.sourceValue || record.inspection_date || record.created_at;
  const submittedAt = submissionInfo.sourceField === 'created_at'
    ? formatInspectionDateTime(submittedValue)
    : formatInspectionDate(submittedValue);

  truckInspectionWarningMessageEl.textContent = `${formLabel} was already submitted on ${submittedAt} by ${inspector}. You can proceed to record another inspection for this month if needed.`;
  truckInspectionWarningModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function hideInspectionWarningModal() {
  if (truckInspectionWarningModal) {
    truckInspectionWarningModal.classList.add('hidden');
  }
  pendingInspectionStartType = null;
  unlockBodyScrollIfNoModal();
}

function handleInspectionWarningCancel() {
  hideInspectionWarningModal();
}

function handleInspectionWarningProceed() {
  const type = pendingInspectionStartType;
  hideInspectionWarningModal();
  if (type) {
    openInspectionModal(type, { resetForm: true });
  }
}

function unlockBodyScrollIfNoModal() {
  const isInspectionModalOpen = Boolean(activeInspectionModalType);
  const isWarningOpen = truckInspectionWarningModal && !truckInspectionWarningModal.classList.contains('hidden');
  const isSuccessOpen = truckInspectionSuccessModal && !truckInspectionSuccessModal.classList.contains('hidden');

  if (!isInspectionModalOpen && !isWarningOpen && !isSuccessOpen) {
    document.body.classList.remove('modal-open');
  }
}

function handleOverdueInspectionClick(type) {
  showPickupTruckInspectionForm();
  openInspectionModal(type, { resetForm: true });
}

function prepareInspectionForm(form) {
  if (!form) return;
  const submitBtn = form.querySelector('.inspection-submit-btn');
  if (submitBtn && !form.dataset.submitDefault) {
    form.dataset.submitDefault = submitBtn.textContent.trim();
  }
}

function handleGeneratePdfClick(formType) {
  const form = truckInspectionForms[formType];
  if (!form) return;
  const idField = form.querySelector("input[name='id']");
  const recordId = idField ? idField.value.trim() : '';
  if (!recordId) {
    alert('Please submit the inspection before generating a PDF.');
    return;
  }
  window.open(`generate_truck_inspection_pdf.php?id=${recordId}`, '_blank');
}

function bindTruckInspectionForms() {
  const section = document.getElementById('pickup-truck-inspection');
  if (!section || section.dataset.bound === 'true') {
    if (!truckInspectionHistoryListEl && section) {
      truckInspectionHistoryListEl = section.querySelector('#inspection-history-list');
    }
    return;
  }

  section.dataset.bound = 'true';
  truckInspectionSection = section;

  truckInspectionForms = {
    pro: section.querySelector('#pro-truck-inspection-form'),
    rental: section.querySelector('#rental-pickup-truck-inspection-form')
  };

  truckInspectionModals = {
    pro: section.querySelector('#pro-inspection-modal'),
    rental: section.querySelector('#rental-inspection-modal')
  };

  truckInspectionToggleButtons = Array.from(section.querySelectorAll('.inspection-toggle-btn'));
  truckInspectionHistoryListEl = section.querySelector('#inspection-history-list');
  truckInspectionSuccessModal = section.querySelector('#inspection-success-modal');
  truckInspectionWarningModal = section.querySelector('#inspection-warning-modal');
  truckInspectionFilterFormTypeEl = section.querySelector('#inspection-filter-form-type');
  truckInspectionFilterSearchEl = section.querySelector('#inspection-filter-search');
  truckInspectionPaginationStatusEl = section.querySelector('#inspection-pagination-status');
  truckInspectionPaginationButtons = {
    prev: section.querySelector("[data-action='prev-page']"),
    next: section.querySelector("[data-action='next-page']")
  };
  truckInspectionWarningMessageEl = section.querySelector('#inspection-warning-message');
  truckInspectionWarningProceedBtn = section.querySelector('[data-action="warning-proceed"]');
  truckInspectionWarningCancelBtn = section.querySelector('[data-action="warning-cancel"]');

  Object.values(truckInspectionForms).forEach(prepareInspectionForm);

  truckInspectionToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.inspectionTarget;
      if (!target) return;
      handleInspectionStart(target);
    });
  });

  Object.entries(truckInspectionModals).forEach(([type, modal]) => {
    if (!modal) return;
    const closeBtn = modal.querySelector("[data-action='close-modal']");
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeActiveInspectionModal({ resetForm: true }));
    }
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeActiveInspectionModal({ resetForm: true });
      }
    });
  });

  const cancelButtons = section.querySelectorAll('.inspection-cancel-btn');
  cancelButtons.forEach((btn) => {
    btn.addEventListener('click', () => closeActiveInspectionModal({ resetForm: true }));
  });

  Object.entries(truckInspectionForms).forEach(([type, form]) => {
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitInspectionForm(form);
    });
  });

  if (truckInspectionHistoryListEl) {
    truckInspectionHistoryListEl.addEventListener('click', handleInspectionHistoryClick);
  }

  if (truckInspectionFilterFormTypeEl) {
    truckInspectionFilterFormTypeEl.addEventListener('change', applyInspectionHistoryFilters);
  }
  if (truckInspectionFilterSearchEl) {
    truckInspectionFilterSearchEl.addEventListener('input', () => {
      if (truckInspectionSearchDebounce) {
        clearTimeout(truckInspectionSearchDebounce);
      }
      truckInspectionSearchDebounce = setTimeout(applyInspectionHistoryFilters, 200);
    });
  }

  if (truckInspectionPaginationButtons.prev) {
    truckInspectionPaginationButtons.prev.addEventListener('click', () => changeInspectionHistoryPage(-1));
  }
  if (truckInspectionPaginationButtons.next) {
    truckInspectionPaginationButtons.next.addEventListener('click', () => changeInspectionHistoryPage(1));
  }

  if (truckInspectionSuccessModal) {
    const closeBtn = truckInspectionSuccessModal.querySelector("[data-action='close']");
    if (closeBtn) {
      closeBtn.addEventListener('click', hideInspectionSuccess);
    }
    truckInspectionSuccessModal.addEventListener('click', (event) => {
      if (event.target === truckInspectionSuccessModal) {
        hideInspectionSuccess();
      }
    });
  }

  if (truckInspectionWarningModal) {
    truckInspectionWarningModal.addEventListener('click', (event) => {
      if (event.target === truckInspectionWarningModal) {
        handleInspectionWarningCancel();
      }
    });
  }
  if (truckInspectionWarningCancelBtn) {
    truckInspectionWarningCancelBtn.addEventListener('click', handleInspectionWarningCancel);
  }
  if (truckInspectionWarningProceedBtn) {
    truckInspectionWarningProceedBtn.addEventListener('click', handleInspectionWarningProceed);
  }

  renderTruckInspectionHistory();
}/* -------------------------
   8. EQUIPMENT MANAGEMENT
------------------------- */

function showEquipmentManagement() {
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('pickup-truck-inspection').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'block';
  document.getElementById('submitted-yard-checks').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'none';

  showActiveEquipmentTab();
  loadEquipmentLists();
  closeActiveInspectionModal({ resetForm: true });
  hideInspectionSuccess();
  setActiveMenuItem();
}

function showActiveEquipmentTab() {
  document.getElementById('tab-active-equipment').classList.add('tab-active');
  document.getElementById('tab-deactivated-equipment').classList.remove('tab-active');
  document.getElementById('pickup-truck-inspection').style.display = 'none';
  document.getElementById('active-equipment-container').style.display = 'block';
  document.getElementById('deactivated-equipment-container').style.display = 'none';
  initializeEquipmentSorting();
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
          imageHTML = `<img src='${equipment.image_url}' alt='${equipment.equipment_name}' class='equipment-image'>`;
        }
        const equipmentHTML = `
          <div class='drag-handle'>
            <i class='fa-solid fa-grip-vertical' data-tooltip='Drag to reorder'></i>
          </div>
          <div class='equipment-image-wrapper'>${imageHTML}</div>
          <div class='equipment-info-container'>
            <div class='equipment-txt-wrapper'>
              <p>Unit ID: <span class='eq-list-id-num-txt'>${equipment.unit_id}</span></p>
              <p>Name: <span class='eq-list-name-txt'>${equipment.equipment_name}</span></p>
              <p>Manufacturer: <span class='eq-list-manufacturer-txt'>${equipment.manufacturer}</span></p>
              <p>Model: <span class='eq-list-model-txt'>${equipment.model}</span></p>
            </div>
            <div class='equipment-rates-wrapper'>
              <p><strong>Rental Rates:</strong></p>
              <ul class='rental-rates-list'>
                <li>4 Hours: $${parseFloat(equipment.rental_rate_4h || 0).toFixed(2)}</li>
                <li>Daily: $${parseFloat(equipment.rental_rate_daily || 0).toFixed(2)}</li>
                <li>Weekly: $${parseFloat(equipment.rental_rate_weekly || 0).toFixed(2)}</li>
                <li>Monthly: $${parseFloat(equipment.rental_rate_monthly || 0).toFixed(2)}</li>
              </ul>
            </div>
          </div>
        `;
        let actionButtonsHTML = `
          <button class='equipment-edit-button' onclick='showEditEquipmentForm(${equipment.id})'>
            <span class='eq-list-btn-icon'><i class='fa-solid fa-pen-to-square'></i></span> Edit 
          </button>
        `;
        if (equipment.is_active == 1) {
          actionButtonsHTML += `
            <button class='equipment-delete-button' onclick='deactivateEquipment(${equipment.id})'>
              <span class='eq-list-btn-icon'><i class='fa-solid fa-ban'></i></span> Deactivate 
            </button>
          `;
        } else {
          actionButtonsHTML += `
            <button class='equipment-reactivate-button' onclick='activateEquipment(${equipment.id})'>
              <span class='eq-list-btn-icon'><i class='fa-solid fa-check'></i></span> Reactivate 
            </button>
          `;
        }

        equipmentItemDiv.innerHTML = `
          ${equipmentHTML}
          <div class='equipment-button-wrapper'>
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
        loadEquipmentLists();
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
 
   // Format the date from 'YYYY-MM-DD' to 'MM/DD/YYYY'
   const [year, month, day] = yardCheck.date.split('-');
   const formattedDate = `${month}/${day}/${year}`;
 
   const equipmentStatuses = yardCheck.equipment_statuses.map(status => {
     const statusClass = status.equipment_status.toLowerCase().replace(/ /g, '-');
     return `
       <div>
         <p><strong>Unit ID:</strong> ${status.unit_id}</p>
         <p><strong>Equipment Name:</strong> ${status.equipment_name}</p>
         <p>
           <strong>Status:</strong> 
           <span class='status-print-color status-${statusClass}'>
             ${status.equipment_status}
           </span>
         </p>
       </div>
       <hr>
     `;
   }).join('');
 
   const modalContent = `
      <div class='modal'>
         <div class='modal-content'>
            <span class='close-button' onclick='closeModal()'>&times;</span>
            <h2>Yard Check Details</h2>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${yardCheck.check_time}</p>
            <p><strong>Submitted by:</strong> ${yardCheck.user_name}</p>
            <div>${equipmentStatuses}</div>
            <button onclick='editYardCheck(${yardCheck.id})'>Edit</button>
            <button onclick='printYardCheck(${yardCheck.id})'>Print</button>
         </div>
      </div>
   `;
 
   modalContainer.innerHTML = modalContent;
   modalContainer.style.display = 'block';
}

function closeModal() {
  document.getElementById('modal-container').style.display = 'none';
}
// Close modal when clicking outside of it 'view yard check'
addEventListener('click', function(event) {
  const modal = document.getElementsByClassName('modal');
  if (event.target === modal[0]) {
    closeModal();
  }
});

async function editYardCheck(id) {
  try {
    const response = await fetch(`get_yard_check_details.php?id=${id}`);
    const data = await response.json();
    closeModal();
    showYardCheckForm();
    await populateYardCheckForm(data);
    console.log('Yard Check Form populated with:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

async function populateYardCheckForm(yardCheck) {
  document.getElementById('user-name').value = yardCheck.user_name;
  document.getElementById('check-time').value = yardCheck.check_time;
  document.getElementById('check-date').value = yardCheck.date;
console.log(yardCheck.user_name);
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

   // yardCheck.equipment_statuses.forEach(status => {
   //    const select = document.getElementById(`equipment-status-${status.unit_id}`);
   //    if (select) {
   //       select.value = status.equipment_status;
   //    }
   // });
   yardCheck.equipment_statuses.forEach(status => {
      const unitId = status.unit_id;
      const savedStatus = status.equipment_status; // e.g. 'Available'
      const allRadios = document.getElementsByName(`equipment_status_${unitId}`);
      console.log(allRadios, 'for unitId:', unitId, 'with savedStatus:', savedStatus);
      // allRadios is a NodeList of three radio inputs for that unitId
      allRadios.forEach(radio => {
         if (radio.value === savedStatus) {
            radio.checked = true;
         }
      });
   });
   
}

/* -------------------------
   10. EQUIPMENT STATS
------------------------- */

function showEquipmentStats() {
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('pickup-truck-inspection').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'none';
  document.getElementById('submitted-yard-checks').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'block';
  loadEquipmentStats();
  closeActiveInspectionModal({ resetForm: true });
  hideInspectionSuccess();
  setActiveMenuItem();
}

function loadEquipmentStats() {
  const dateRange = document.getElementById('stats-date-range').value;
  const countSelect = document.getElementById('stats-count');
  const listCountRaw = countSelect ? parseInt(countSelect.value, 10) : NaN;
  const listCount = Number.isNaN(listCountRaw) ? 5 : Math.min(10, Math.max(3, listCountRaw));
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

  fetch(`get_equipment_stats.php?start_date=${startDate}&end_date=${endDate}&limit=${listCount}`)
    .then(resp => resp.json())
    .then(stats => {
      displayEquipmentStats(stats);
    })
    .catch(err => console.error('Error:', err));
}

function displayEquipmentStats(stats) {
  const statsDisplay = document.getElementById('stats-display');
  statsDisplay.innerHTML = '';

  const totalProfit = Number(stats.total_estimated_profit || 0).toFixed(2);
  const sections = [];

  sections.push(`
    <div class="stats-block stats-total-profit">
      <h3>Total Estimated Profit: $<span class='profit-amount'>${totalProfit}</span></h3>
    </div>
  `);

  const limitValue = Number(stats.requested_limit || 0);
  const listLabelCount = limitValue || (Array.isArray(stats.top_equipment) ? stats.top_equipment.length : 0);
  const topList = Array.isArray(stats.top_equipment) ? stats.top_equipment : [];
  const bottomList = Array.isArray(stats.bottom_equipment) ? stats.bottom_equipment : [];

  const renderList = (items) => {
    if (!items.length) {
      return '<p class="empty-stats-msg">No equipment data for this range.</p>';
    }
    return `<ol>${items.map(item => {
      const profit = Number(item.estimated_profit || 0).toFixed(2);
      return `<li>${item.equipment_name} - Days Rented: ${item.days_rented}, Estimated Profit: $<span class='profit-amount'>${profit}</span></li>`;
    }).join('')}</ol>`;
  };

  sections.push(`
    <div class="stats-block stats-top-list">
      <h4>Top ${listLabelCount} Most Popular Equipment</h4>
      ${renderList(topList)}
    </div>
  `);

  sections.push(`
    <div class="stats-block stats-bottom-list">
      <h4>Bottom ${listLabelCount} Least Popular Equipment</h4>
      ${renderList(bottomList)}
    </div>
  `);

  const totalLoss = Number(stats.total_profit_loss || 0).toFixed(2);
  const lossDetails = Array.isArray(stats.profit_loss_details) ? stats.profit_loss_details : [];
  let lossContent = `<p>Total: $<span class='loss-amount'>${totalLoss}</span></p>`;

  if (lossDetails.length) {
    lossContent += `<ul class="profit-loss-list">${lossDetails.map(item => {
      const amount = Number(item.profit_loss || 0).toFixed(2);
      const daysDown = item.days_out_of_service ?? 0;
      return `<li>${item.equipment_name} - Days Down: ${daysDown}, Estimated Loss: $<span class='loss-amount'>${amount}</span></li>`;
    }).join('')}</ul>`;
  } else {
    lossContent += '<p class="empty-stats-msg">No downtime recorded for this range.</p>';
  }

  sections.push(`
    <div class="stats-block profit-loss-section">
      <h4>Total Profit Loss</h4>
      ${lossContent}
    </div>
  `);

  if (Array.isArray(stats.potential_sales) && stats.potential_sales.length) {
    sections.push(`
      <div class="stats-block stats-potential-sales">
        <h4>Potential Sales for Non-Rented Equipment</h4>
        <ul>${stats.potential_sales.map(item => {
          const potential = Number(item.potential_profit || 0).toFixed(2);
          return `<li>${item.equipment_name} - Potential Profit: $<span class='profit-amount'>${potential}</span></li>`;
        }).join('')}</ul>
      </div>
    `);
  }

  statsDisplay.innerHTML = sections.join('');
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
    document.getElementById('custom-date-range-wrapper').style.display = 'block';
  } else {
    document.getElementById('custom-date-range-wrapper').style.display = 'none';
  }
});

function initializeEquipmentSorting() {
    const activeList = document.getElementById('active-equipment-list');
    if (!activeList) return;

    // Destroy existing instance if it exists
    if (currentSortable) {
        currentSortable.destroy();
    }

    // Create new instance
    currentSortable = new Sortable(activeList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        // Add these new options
        onStart: function(evt) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
        },
        onEnd: function(evt) {
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            document.body.style.mozUserSelect = '';
            document.body.style.msUserSelect = '';
            
            const items = Array.from(activeList.children);
            const order = items.map((item, index) => {
                const editButton = item.querySelector('.equipment-edit-button');
                const onclick = editButton.getAttribute('onclick');
                const match = onclick.match(/showEditEquipmentForm\((\d+)\)/);
                
                if (!match) {
                    console.error('Could not extract ID from:', onclick);
                    return null;
                }
                
                return {
                    id: parseInt(match[1], 10),
                    position: index + 1
                };
            }).filter(item => item !== null);

            if (order.length > 0) {
                console.log('Saving order:', order);
                saveEquipmentOrder(order);
            } else {
                console.error('No valid items to save');
            }
        }
    });
}

function saveEquipmentOrder(order) {
    fetch('reorder_equipment.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: order })
    })
    .then(async response => {
        const text = await response.text();
        console.log('Raw response:', text);
        
        try {
            const data = JSON.parse(text);
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
            return data;
        } catch (e) {
            throw new Error(`Parse error: ${e.message}\nRaw response: ${text}`);
        }
    })
    .then(data => {
        if (data.status === 'success') {
            console.log('Order saved successfully');
        } else {
            console.error('Server error:', data.message);
        }
    })
    .catch(error => {
        console.error('Error saving order:', error);
        alert('Failed to save equipment order. Please try again.');
    });
}

// -------------------------
// DASHBOARD
// -------------------------

function showDashboard() {
  document.getElementById('dashboard-container').style.display = 'block';
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('pickup-truck-inspection').style.display = 'none';
  document.getElementById('equipment-management').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'none';
  document.getElementById('submitted-yard-checks').style.display = 'none';
  closeActiveInspectionModal({ resetForm: true });
  hideInspectionSuccess();
  setActiveMenuItem();
}


// Update the DOMContentLoaded event listener to show dashboard by default
document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDateTime();
//   checkMissingYardChecks();
  setTodayOnNewInspectionForms();
  bindTruckInspectionForms();
  fetchTruckInspectionHistory();
  showDashboard(); // Make dashboard visible by default
});

// 1. Load inspection form when nav item clicked
function showPickupTruckInspectionForm() {
   document.getElementById('pickup-truck-inspection').style.display = 'block';
   document.getElementById('dashboard-container').style.display = 'none';
   document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
   document.getElementById('equipment-management').style.display = 'none';
   document.getElementById('equipment-stats').style.display = 'none';
   document.getElementById('submitted-yard-checks').style.display = 'none';
   bindTruckInspectionForms();
   if (truckInspectionHistoryListEl && !truckInspectionHistoryFiltered.length && !truckInspectionHistoryData.length) {
      renderTruckInspectionHistory();
   }
   fetchTruckInspectionHistory();
   closeActiveInspectionModal({ resetForm: true });
   hideInspectionSuccess();
   setActiveMenuItem();
//   hideAllSections(); // hide other main content

//   fetch('pickup-truck-monthly-inspection-form.html')
//     .then(response => response.text())
//     .then(html => {
//       document.getElementById('main-content-container').innerHTML = html;
//     })
//     .catch(error => {
//       console.error('Failed to load form:', error);
//     });
}















function setTodayOnNewInspectionForms() {
  const dateFields = document.querySelectorAll('input[type="date"][data-default-today="true"]');
  if (!dateFields.length) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  dateFields.forEach((field) => {
    const form = field.closest('form');
    if (form && form.dataset.editing === 'true') {
      return;
    }
    field.value = todayStr;
  });
}


















