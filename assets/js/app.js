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

// 2. Formats a date string from API to readable form (like "Wednesday, April 30, 2025")
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
  console.log("Today String:", todayString); // Debug today’s date

  // Find the forecast object for today
  const todayIndex = data.daily.data.findIndex(day => day.day === todayString);
  if (todayIndex === -1) {
    console.error("Today's weather data not found. Data:", data.daily.data);
    return;
  }
  console.log("Today Index:", todayIndex, "Data at Index:", data.daily.data[todayIndex]); // Debug index and data

  // Get today's forecast for current-weather-card
  const currentWeather = data.daily.data[todayIndex];
  document.querySelector('.current-weather-date-txt').textContent = formatDate(currentWeather.day);
  document.querySelector('.current-temp').textContent = `${Math.round(currentWeather.temperature)}°F`;
  document.querySelector('.current-hi-temp').textContent = `${Math.round(currentWeather.temperature_max)}°F`;
  document.querySelector('.current-lo-temp').textContent = `${Math.round(currentWeather.temperature_min)}°F`;
  document.querySelector('.weather-description').textContent = formatWeatherText(currentWeather.weather);
  document.querySelector('.weather-summary').textContent = currentWeather.summary;
  document.querySelector('.current-weather-card .weather-icon').src = getMappedIcon(currentWeather.icon);

  // Get the next 6 forecast days, explicitly excluding today
  const upcomingDays = data.daily.data.slice(todayIndex + 1, todayIndex + 7);
  console.log("Upcoming Days Raw:", upcomingDays.map(day => day.day)); // Debug raw days
  const weatherDaysWrapper = document.querySelector('.weather-days-wrapper');
  weatherDaysWrapper.innerHTML = ''; // Clear previous content

  // Limit to 6 days and use proper date formatting
  if (upcomingDays.length >= 6) {
    upcomingDays.slice(0, 6).forEach(day => {
      const dateObj = new Date(day.day + 'T00:00:00'); // Ensure local date parsing
      const options = { weekday: 'short', day: 'numeric', timeZone: 'America/New_York' };
      const formattedDate = dateObj.toLocaleDateString('en-US', options);

      console.log("Processing Day:", day.day, "Formatted as:", formattedDate); // Debug each day

      const cardHTML = `
        <div class="weather-days-card glassmorphism-white">
          <div class="weather-day-date">
            <p class="weather-day"><span class="date">${formattedDate}</span></p>
          </div>
          <div class="weather-info-wrapper">
            <div class="weather-icon-wrapper">
              <img src="${getMappedIcon(day.icon)}" alt="Weather Icon" class="weather-icon"> 
            </div>
            <div class="weather-temps-wrapper">
              <p class="hi-temp">${Math.round(day.temperature_max)}°F</p>
              <p class="lo-temp">${Math.round(day.temperature_min)}°F</p>
            </div>
          </div>
        </div>
      `;
      weatherDaysWrapper.insertAdjacentHTML('beforeend', cardHTML);
    });
  } else {
    weatherDaysWrapper.innerHTML = '<p>Insufficient forecast data for the next 6 days.</p>';
    console.warn("Insufficient days:", upcomingDays.length);
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
function displayDiscrepancyAlerts(discrepancies, missingSubmissions) {
  const wrapper = document.querySelector('.alerts-card-wrapper');
  if (!wrapper) {
    console.error('Error: .alerts-card-wrapper not found in DOM');
    return;
  }
  wrapper.innerHTML = ''; // Clear previous alerts

  console.log('Discrepancies:', JSON.stringify(discrepancies, null, 2));
  console.log('Missing Submissions:', JSON.stringify(missingSubmissions, null, 2));

  // Display missing submission alerts
  if (missingSubmissions && missingSubmissions.length) {
    missingSubmissions.forEach(({ type, message, date }) => {
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
        <p class="alert-title">${title}</p>
        <p class="alert-description">${message}</p>
      `;
      wrapper.appendChild(card);
    });
  } else {
    console.warn('No missing submissions found or missingSubmissions is undefined');
  }

  // Display discrepancy alerts
  if (discrepancies && discrepancies.length) {
    discrepancies.forEach(({ type, date, expected, actual, note }) => {
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
        <p class="alert-title">${title}</p>
        <p class="alert-description">
          On <strong>${new Date(date).toLocaleDateString()}</strong>, AM shows 
          <strong>${actual}</strong> ${itemLabel}, but previous PM had 
          <strong>${expected}</strong>.${noteText} Please verify.
        </p>
      `;
      wrapper.appendChild(card);
    });
  } else {
    console.warn('No discrepancies found');
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
          wrapper.innerHTML = `<div class="alert-card"><p class="alert-description">Error: ${data.message}</p></div>`;
        }
        return;
      }
      displayDiscrepancyAlerts(data.discrepancies || [], data.missingSubmissions || []);
    })
    .catch(error => {
      console.error('Error loading yard check alerts:', error);
      const wrapper = document.querySelector('.alerts-card-wrapper');
      if (wrapper) {
        wrapper.innerHTML = '<div class="alert-card"><p class="alert-description">Unable to load alerts at this time. Please try again later.</p></div>';
      }
    });
}

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
  const offset = (dayOfWeek + 6) % 7; // Offset to previous Monday
  console.log('showSubmittedYardChecks => dayOfWeek=', dayOfWeek, ' offset=', offset);

  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - offset);

  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);

  const startDate = formatAsYyyyMmDd(currentMonday);
  const endDate = formatAsYyyyMmDd(sunday);

  loadSubmittedYardChecks(startDate, endDate);
  loadYardCheckAlerts(startDate, endDate); // Refresh alerts

  setActiveMenuItem();
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
//     collapseBtn.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
//   } else {
//     collapseBtn.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
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
 * Show "Submitted Yard Checks" for the current local Monday→Sunday.
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
               <div class="card-col-title-wrapper">
                  <p class="ampm-txt">${checkTime} Submission -</p>
                  <p class="user-name-txt">Submitted by:<span class="user-name-txt-data"> ${yardCheck.user_name}</span></p>
                  <p class="time-submitted-txt">Time submitted: <span class="time-submitted-txt-data">${formattedTime}</span></p>
               </div>
               <div class="card-col-content-wrapper">
                  <div class="card-col-content-block">
                     <p>Available</p>
                     <p class="available-num-data"> ${yardCheck.equipment_available}</p>
                  </div>
                  <div class="card-col-content-block">
                     <p>Rented out</p> 
                     <p class="rented-out-num-data">${yardCheck.equipment_rented_out}</p>
                  </div>
                  <div class="card-col-content-block">
                     <p>Out of service</p> 
                     <p class="out-of-service-num-data">${yardCheck.equipment_out_of_service}</p>
                  </div>
                  <div class="card-col-content-block">
                     <p>Total equipment</p> 
                     <p class="total-equipment-num-data">${yardCheck.total_equipment}</p>
                  </div>
               </div>
              
               ${
                  checkTime === 'PM'
                     ? `<p class="est-profit-txt"><strong>Estimated profit:</strong> $<span class="profit-amount">${yardCheck.estimated_profit.toFixed(2)}</span></p>`
                     : ''
               }
              
               <p class="profit-loss-txt"><strong>Profit loss:</strong> $<span class="loss-amount">${yardCheck.profit_loss.toFixed(2)}</span>
               </p>
              
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
         imageHTML = `<img src="${equipment.image_url}" alt="${equipment.equipment_name}" class="equipment-image">`;
       }
 
       // Equipment label with equipment image and info
       const label = document.createElement('label');
       label.htmlFor = `equipment-status-${equipment.unit_id}`;
       label.innerHTML = `
         <div class="img-eq-info-wrapper">
           <div class="image-wrapper">
             ${imageHTML}
           </div>
           <div class="eq-info-wrapper">
             <p class="rental-id-label">Unit ID - <span class="rental-id-num">${equipment.unit_id}</span></p>
             <p class="equipment-name">${equipment.equipment_name}</p>
             <div class="view-more-wrapper">
               <a href="#" onclick="toggleEquipmentInfo(event, '${equipment.unit_id}')">View more info</a>
               <div id="equipment-info-${equipment.unit_id}" class="equipment-info" style="display: none;">
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
    TRUCK INSPECTION FORMS
------------------------- */
// === Truck inspection forms wiring ===
function bindTruckInspectionForms() {
  const proForm = document.getElementById('pro-truck-inspection-form');
  const rentalForm = document.getElementById('rental-pickup-truck-inspection-form');

  async function handleSubmit(form) {
    const fd = new FormData(form); // includes form_type, inspection_date, inspected_by, arrays, comments
    try {
      const res = await fetch('submit_truck_inspection_form.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        alert(data.message || 'There was a problem saving the inspection.');
        return;
      }
      alert(`Inspection saved. (ID: ${data.id})`);
      // Optional: form.reset();
      // Optional: window.print();
    } catch (err) {
      console.error(err);
      alert('Network or server error while saving.');
    }
  }

  if (proForm) {
    proForm.addEventListener('submit', (e) => { e.preventDefault(); handleSubmit(proForm); });
    const printBtn = document.getElementById('print-pro-truck-inspection');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  }
  if (rentalForm) {
    rentalForm.addEventListener('submit', (e) => { e.preventDefault(); handleSubmit(rentalForm); });
    const printBtn = document.getElementById('print-rental-truck-inspection');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  }
}

// Make sure this runs when inspection view is shown AND on first load
document.addEventListener('DOMContentLoaded', () => {
  bindTruckInspectionForms();
});

// If you’re toggling views, call this inside showPickupTruckInspectionForm()
function showPickupTruckInspectionForm() {
  // hide others, show inspection section
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('lg-equipment-yard-check-form').style.display = 'none';
  document.getElementById('submitted-yard-checks').style.display = 'none';
  document.getElementById('equipment-stats').style.display = 'none';

  const section = document.getElementById('pickup-truck-inspection');
  if (section) section.style.display = 'block';

  // (re)bind to be safe if the DOM was swapped
  bindTruckInspectionForms();
}



/* -------------------------
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
          imageHTML = `<img src="${equipment.image_url}" alt="${equipment.equipment_name}" class="equipment-image">`;
        }
        const equipmentHTML = `
          <div class="drag-handle">
            <i class="fa-solid fa-grip-vertical" data-tooltip="Drag to reorder"></i>
          </div>
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
            <span class="eq-list-btn-icon"><i class="fa-solid fa-pen-to-square"></i></span> Edit 
          </button>
        `;
        if (equipment.is_active == 1) {
          actionButtonsHTML += `
            <button class="equipment-delete-button" onclick="deactivateEquipment(${equipment.id})">
              <span class="eq-list-btn-icon"><i class="fa-solid fa-ban"></i></span> Deactivate 
            </button>
          `;
        } else {
          actionButtonsHTML += `
            <button class="equipment-reactivate-button" onclick="activateEquipment(${equipment.id})">
              <span class="eq-list-btn-icon"><i class="fa-solid fa-check"></i></span> Reactivate 
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
 
   // Format the date from "YYYY-MM-DD" to "MM/DD/YYYY"
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
           <span class="status-print-color status-${statusClass}">
             ${status.equipment_status}
           </span>
         </p>
       </div>
       <hr>
     `;
   }).join('');
 
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
// Close modal when clicking outside of it "view yard check"
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
      const savedStatus = status.equipment_status; // e.g. "Available"
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
  setActiveMenuItem();
}

// Update the DOMContentLoaded event listener to show dashboard by default
document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDateTime();
//   checkMissingYardChecks();
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
   setActiveMenuItem();
//   hideAllSections(); // hide other main content

//   fetch('pickup-truck-monthly-inspection-form.html')
//     .then(response => response.text())
//     .then(html => {
//       document.getElementById("main-content-container").innerHTML = html;
//     })
//     .catch(error => {
//       console.error("Failed to load form:", error);
//     });
}

// 2. Check if inspection is overdue (after 5th of current month)
function checkForOverdueInspection() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const inspectionKey = `pickup_inspection_${today.getFullYear()}_${today.getMonth() + 1}`;
  const wasSubmitted = localStorage.getItem(inspectionKey);

  if (dayOfMonth > 4 && !wasSubmitted) {
    showInspectionAlert();
  }
}

// 3. Display alert card in dashboard alerts section
function showInspectionAlert() {
  const alertContainer = document.querySelector(".alerts-card-wrapper");
  if (!alertContainer) return;

  const alertCard = document.createElement("div");
  alertCard.className = "alert-card";
  alertCard.innerHTML = `
    <p class="alert-title">Past Due Inspection</p>
    <p class="alert-description">The pickup truck monthly inspection is past due. Please complete this month's inspection.</p>
    <div class="alert-button-wrapper">
      <button class="alert-btn-yardcheck" onclick="showPickupTruckInspectionForm()">Go to Inspection Form</button>
    </div>
  `;

  alertContainer.appendChild(alertCard);
}

// 4. Run overdue check on page load
document.addEventListener("DOMContentLoaded", checkForOverdueInspection);
