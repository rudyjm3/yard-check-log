// Large equipment array temporary storage
const largeEquipment = [
   { unit_id: "3417389", 
      equipment_name: "35' Towable Boom Lift",
      brand: "JLG Lift",
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
      brand: "Barreto",
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
      brand: "Barreto",
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
      brand: "Barreto",
      model: "30-SG",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 232.00,
         daily: 309.00,
         weekly: 989.00,
         monthly: 2473.00
      }
   },
   { unit_id: "", 
      equipment_name: "Mini Skid Steer",
      brand: "Toro",
      model: "Dingo TX427",
      imageUrl: "http://google.com",
      rental_rates: {
         four_hours: 232.00,
         daily: 309.00,
         weekly: 989.00,
         monthly: 2473.00
      }
   },
   { unit_id: "09169", 
      equipment_name: "Log Spliter",
      brand: "",
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
      brand: "",
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
      brand: "",
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
      brand: "",
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
      brand: "",
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
      brand: "",
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
      brand: "",
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
      brand: "",
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

function eqList (equipmentArray) {
   const output = document.getElementsByClassName('form-wrapper')[0];
   output.innerHTML = '';

   equipmentArray.forEach(item => {
      
      const listItem = `
      <div class="form-control">
         <label for="equipment-status-selection">
            <p class="rental-id-label">Rental ID - 
               <span class="rental-id-num">${item.unit_id}</span>
            </p> 
            <p class="equipment-name">${item.equipment_name}</p>
         </label>
         <select name="equipment-status-selection" id="equipment-status-selection" placeholder="Select equipment status" required>
            <option disabled selected>Select equipment status</option>
            <option value="in">Available</option>
            <option value="out">Rented</option>
            <option value="out of service">Out of Service</option>
         </select>
      </div>   
      `
      output.innerHTML += listItem;
   });
};

eqList(largeEquipment);




// Send form data to database function and create new table row
const submitButton = document.getElementById('submit-button');

submitButton.addEventListener('click', function(event) {
  event.preventDefault();

  const formData = {
   rentalId: document.getElementById('rental-id-number"').value,
   equipmentDescription : document.getElementById('equipment-description-input').value,
   serviceType: document.getElementById('serviceType').value,
   serviceDescription: document.getElementById('serviceDescription').value,
   hourMeter: document.getElementById('hourMeter').value,
   serviceDate: document.getElementById('serviceDate').value,
   techName: document.getElementById('techName').value
};

  sendFormDataToServer(formData);
});

function sendFormDataToServer(formData) {

   fetch('process_maintenance_data.php', {
    method: 'POST',
    body: JSON.stringify(formData)
  })
  .then(response => response.text())
  .then(data => {
    // Update the table with the received data (new row)
    updateTable(data);
  })
  .catch(error => {
    console.error(error);
    // Handle any errors that might occur during the request
  });
}

function updateTable(data) {
   console.log("updateTable function started.");
   // Assuming you have a table with an ID like 'equipment-log-table'
   const tableBody = document.getElementById('equipment-log-table').getElementsByTagName('tbody')[0];
 
   // Parse the JSON data from the server response
   const newEntryData = JSON.parse(data);
   console.log("This is the parse'd data - " + newEntryData);
   // Create new table row element for the new entry
   const newRow = document.createElement('tr');
 
   // Create table cells for each data point in the new entry
   const entryLogNumCell = document.createElement('td');
   entryLogNumCell.classList.add('entry-log-num-col');
   entryLogNumCell.textContent = newEntryData.entryLogNum; // Assuming 'entryLogNum' is a property in the data
 
   const rentalIdCell = document.createElement('td');
   rentalIdCell.classList.add('rental-id-col');
   rentalIdCell.textContent = newEntryData.rentalId; // Assuming 'unitId' is a property in the data

   const equipmentDescriptionCell = document.createElement('td');
   equipmentDescriptionCell.classList.add('equipment-description-col');
   equipmentDescriptionCell.textContent = newEntryData.equipmentDescription; 

   const serviceTypeCell = document.createElement('td');
   serviceTypeCell.classList.add('service-type-col');
   serviceTypeCell.textContent = newEntryData.serviceType;

   const serviceDescriptionCell = document.createElement('td');
   serviceDescriptionCell.classList.add('service-description-col');
   serviceDescriptionCell.textContent = newEntryData.serviceDescription;

   const hourMeterCell = document.createElement('td');
   hourMeterCell.classList.add('hour-meter-col');
   hourMeterCell.textContent = newEntryData.hourMeter;

   const dateCell = document.createElement('td');
   dateCell.classList.add('date-col');
   dateCell.textContent = newEntryData.date;

   const techNameCell = document.createElement('td');
   techNameCell.classList.add('tech-name-col');
   techNameCell.textContent = newEntryData.techName;
 
   const editColCell = document.createElement('td');
   editColCell.classList.add('edit-col');
   editColCell.innerHTML = '<div class="col-wrapper"><span class="edit-log-btn"><i class="fa-solid fa-pen-to-square"></i></span> <span class="delete-log-btn"><i class="fa-solid fa-trash-can"></i></span></div>';
 
   // Append the data cells to the new row
   newRow.appendChild(entryLogNumCell);
   newRow.appendChild(rentalIdCell);
   newRow.appendChild(equipmentDescriptionCell);
   newRow.appendChild(serviceTypeCell);
   newRow.appendChild(serviceDescriptionCell);
   newRow.appendChild(hourMeterCell);
   newRow.appendChild(dateCell);
   newRow.appendChild(techNameCell);
   newRow.appendChild(editColCell);
 
   // Append the new row to the table body
   tableBody.appendChild(newRow);
 }
