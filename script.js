// --- SIDEBAR NAVIGATION LOGIC ---
function switchTab(tabId, clickedElement) {
    // 1. Hide all screens
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.remove('active-tab'));

    // 2. Remove 'active' highlight from all menu items
    const allMenuItems = document.querySelectorAll('.nav-menu li');
    allMenuItems.forEach(item => item.classList.remove('active'));

    // 3. Show the selected screen and highlight the clicked menu item
    document.getElementById(tabId).classList.add('active-tab');
    clickedElement.classList.add('active');

    // 4. Update the page title to match the menu item
    document.getElementById('page-title').innerText = clickedElement.innerText.substring(2); // Removes the emoji
}
// ---------------------------------
const form = document.getElementById('medicine-form');
const tableBody = document.querySelector('tbody');
const nameInput = document.getElementById('med-name');
const timeInput = document.getElementById('med-time');

let reminders = JSON.parse(localStorage.getItem('medicineList')) || [];

function formatAMPM(time24) {
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

function displayReminders() {
    tableBody.innerHTML = ''; 

    reminders.forEach(function(reminder, index) {
        const newRow = document.createElement('tr');
        
        // If it's taken, add our new CSS class to strike through the text
        if (reminder.taken) {
            newRow.classList.add('taken-row');
        }
        
        const displayTime = formatAMPM(reminder.time);
        
        // We added a checkbox input right before the medicine name
        newRow.innerHTML = `
            <td>
                <input type="checkbox" onchange="toggleTaken(${index})" ${reminder.taken ? 'checked' : ''} style="cursor: pointer; transform: scale(1.2);">
                ${reminder.name}
            </td>
            <td>${displayTime}</td>
            <td><button onclick="deleteReminder(${index})" style="background-color: #e74c3c;">Delete</button></td>
        `;
        
        tableBody.appendChild(newRow);
    });
}

// A database of known dangerous drug combinations
const drugConflicts = {
    "aspirin": ["ibuprofen", "warfarin", "naproxen"],
    "ibuprofen": ["aspirin", "ketorolac"],
    "warfarin": ["aspirin", "ibuprofen"]
};

form.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const newMedName = nameInput.value.trim();
    const normalizedNewMed = newMedName.toLowerCase();

    // 1. Check for dangerous conflicts in existing reminders
    let conflictFound = false;
    let conflictingDrug = "";

    // If the new medicine is in our database, check it against saved medicines
    if (drugConflicts[normalizedNewMed]) {
        for (let reminder of reminders) {
            const existingMed = reminder.name.toLowerCase();
            
            if (drugConflicts[normalizedNewMed].includes(existingMed)) {
                conflictFound = true;
                conflictingDrug = reminder.name;
                break;
            }
        }
    }

    // 2. Abort if a conflict is detected
    if (conflictFound) {
        alert(`[CRITICAL WARNING]: ${newMedName} severely conflicts with ${conflictingDrug}!\nReminder aborted due to dangerous drug interaction.`);
        nameInput.value = ''; // Clear input
        return; // Stop the function completely so it is not saved
    }

    // 3. Otherwise, save normally
    const newReminder = {
        name: newMedName,
        time: timeInput.value,
        taken: false 
    };

    reminders.push(newReminder);
    localStorage.setItem('medicineList', JSON.stringify(reminders)); 

    nameInput.value = '';
    timeInput.value = '';

    displayReminders(); 
});

// NEW: Function to handle clicking the checkbox
window.toggleTaken = function(index) {
    // Flips the status between true and false
    reminders[index].taken = !reminders[index].taken; 
    localStorage.setItem('medicineList', JSON.stringify(reminders));
    displayReminders();
};

window.deleteReminder = function(index) {
    reminders.splice(index, 1); 
    localStorage.setItem('medicineList', JSON.stringify(reminders)); 
    displayReminders(); 
};

displayReminders();

let lastCheckedMinute = "";
setInterval(function() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    if (currentTime !== lastCheckedMinute) {
        lastCheckedMinute = currentTime;

        reminders.forEach(function(reminder) {
            // Only trigger the alert if the medicine has NOT been marked as taken
            if (reminder.time === currentTime && !reminder.taken) {
                const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                chime.play();
                
                setTimeout(function() {
                    alert(`⏰ Time to take your medicine: ${reminder.name}!`);
                }, 200);
            }
        });
    }
}, 1000);
// --- INVENTORY MANAGEMENT LOGIC ---
const invForm = document.getElementById('inventory-form');
const invTableBody = document.getElementById('inventory-table-body');
const invNameInput = document.getElementById('inv-name');
const invQtyInput = document.getElementById('inv-qty');

let inventory = JSON.parse(localStorage.getItem('inventoryList')) || [];

function displayInventory() {
    invTableBody.innerHTML = ''; 

    inventory.forEach(function(item, index) {
        const newRow = document.createElement('tr');
        
        // Highlights low stock in red text
        const stockStyle = item.quantity < 10 ? 'color: #e74c3c; font-weight: bold;' : '';

        newRow.innerHTML = `
            <td>${item.name}</td>
            <td style="${stockStyle}">${item.quantity} units</td>
            <td><button onclick="deleteInventory(${index})" style="background-color: #e74c3c; padding: 6px 10px;">Remove</button></td>
        `;
        
        invTableBody.appendChild(newRow);
    });
}

invForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const newName = invNameInput.value.trim();
    const newQty = parseInt(invQtyInput.value);

    // Check if medicine already exists to update stock instead of duplicating
    const existingItemIndex = inventory.findIndex(item => item.name.toLowerCase() === newName.toLowerCase());

    if (existingItemIndex !== -1) {
        inventory[existingItemIndex].quantity += newQty;
    } else {
        inventory.push({ name: newName, quantity: newQty });
    }

    localStorage.setItem('inventoryList', JSON.stringify(inventory)); 
    invNameInput.value = '';
    invQtyInput.value = '';
    displayInventory(); 
});

window.deleteInventory = function(index) {
    inventory.splice(index, 1); 
    localStorage.setItem('inventoryList', JSON.stringify(inventory)); 
    displayInventory(); 
};

// Draw inventory table on page load
displayInventory();
// ----------------------------------
// --- PATIENT MANAGEMENT LOGIC ---
const patForm = document.getElementById('patient-form');
const patTableBody = document.getElementById('patient-table-body');
const patNameInput = document.getElementById('pat-name');
const patAgeInput = document.getElementById('pat-age');
const patDiseaseInput = document.getElementById('pat-disease');

// Load saved patients or start empty
let patients = JSON.parse(localStorage.getItem('patientList')) || [];

function displayPatients() {
    patTableBody.innerHTML = ''; 

    patients.forEach(function(patient, index) {
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td><strong>${patient.name}</strong></td>
            <td>${patient.age}</td>
            <td><span style="background-color: #e8f4f8; padding: 4px 8px; border-radius: 4px; color: #2980b9; font-weight: 500;">${patient.disease}</span></td>
            <td><button onclick="deletePatient(${index})" style="background-color: #e74c3c; padding: 6px 10px;">Remove</button></td>
        `;
        
        patTableBody.appendChild(newRow);
    });
}

patForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const newPatient = {
        name: patNameInput.value.trim(),
        age: patAgeInput.value,
        disease: patDiseaseInput.value.trim()
    };

    patients.push(newPatient);
    localStorage.setItem('patientList', JSON.stringify(patients)); 

    // Clear the form
    patNameInput.value = '';
    patAgeInput.value = '';
    patDiseaseInput.value = '';
    
    displayPatients(); 
});

window.deletePatient = function(index) {
    patients.splice(index, 1); 
    localStorage.setItem('patientList', JSON.stringify(patients)); 
    displayPatients(); 
};

// Draw patient table on page load
displayPatients();
// ----------------------------------
// --- DISEASE & TREATMENT LOGIC ---
const disForm = document.getElementById('disease-form');
const disTableBody = document.getElementById('disease-table-body');
const disNameInput = document.getElementById('dis-name');
const disMedInput = document.getElementById('dis-med');

// Load saved treatments or start empty
let treatments = JSON.parse(localStorage.getItem('treatmentList')) || [];

function displayTreatments() {
    disTableBody.innerHTML = ''; 

    treatments.forEach(function(treatment, index) {
        const newRow = document.createElement('tr');
        
        // Formats the medicines as a neat, comma-separated list
        const medsList = treatment.medicines.map(med => 
            `<span style="background-color: #eef2f5; padding: 4px 8px; border-radius: 4px; margin-right: 5px; border: 1px solid #ccc;">${med}</span>`
        ).join('');

        newRow.innerHTML = `
            <td><strong>${treatment.disease}</strong></td>
            <td>${medsList}</td>
            <td><button onclick="deleteTreatment(${index})" style="background-color: #e74c3c; padding: 6px 10px;">Remove</button></td>
        `;
        
        disTableBody.appendChild(newRow);
    });
}

disForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const disName = disNameInput.value.trim();
    const disMed = disMedInput.value.trim();

    // Check if the disease already exists in our database
    const existingIndex = treatments.findIndex(t => t.disease.toLowerCase() === disName.toLowerCase());

    if (existingIndex !== -1) {
        // If the disease exists, add the new medicine to it (preventing duplicates)
        if (!treatments[existingIndex].medicines.includes(disMed)) {
            treatments[existingIndex].medicines.push(disMed);
        }
    } else {
        // If it's a new disease, create a new entry with an array containing the first medicine
        treatments.push({
            disease: disName,
            medicines: [disMed]
        });
    }

    localStorage.setItem('treatmentList', JSON.stringify(treatments)); 

    disNameInput.value = '';
    disMedInput.value = '';
    
    displayTreatments(); 
});

window.deleteTreatment = function(index) {
    treatments.splice(index, 1); 
    localStorage.setItem('treatmentList', JSON.stringify(treatments)); 
    displayTreatments(); 
};

// Draw treatments table on page load
displayTreatments();
// ----------------------------------
// --- ALERTS & SYSTEM BACKUP LOGIC ---

// 1. Function to check system health and generate alerts
window.displayAlerts = function() {
    const alertsList = document.getElementById('system-alerts-list');
    alertsList.innerHTML = '';
    let hasAlerts = false;

    // Scan inventory for low stock (less than 10 items)
    inventory.forEach(function(item) {
        if (item.quantity < 10) {
            hasAlerts = true;
            const alertItem = document.createElement('li');
            alertItem.innerHTML = `⚠️ <strong>Low Stock Warning:</strong> ${item.name} only has ${item.quantity} units remaining!`;
            alertItem.style.cssText = "background-color: #fdf2e9; border-left: 4px solid #e67e22; padding: 12px; margin-bottom: 10px; border-radius: 4px; color: #d35400;";
            alertsList.appendChild(alertItem);
        }
    });

    // If everything is fine, show a success message
    if (!hasAlerts) {
        alertsList.innerHTML = '<li style="color: #27ae60; font-weight: bold; padding: 10px;">✅ All systems normal. No active alerts.</li>';
    }
};

// 2. Function to package and download all data
window.downloadBackup = function() {
    // Gather everything from localStorage
    const systemData = {
        reminders: JSON.parse(localStorage.getItem('medicineList')) || [],
        inventory: JSON.parse(localStorage.getItem('inventoryList')) || [],
        patients: JSON.parse(localStorage.getItem('patientList')) || [],
        treatments: JSON.parse(localStorage.getItem('treatmentList')) || []
    };

    // Convert to a formatted JSON text string
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(systemData, null, 2));
    
    // Create an invisible download link, click it, and remove it
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute("href", dataStr);
    downloadLink.setAttribute("download", "MedAdmin_Backup.json");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
};

// Ensure alerts update whenever inventory is changed
const originalDisplayInventory = displayInventory;
window.displayInventory = function() {
    originalDisplayInventory();
    displayAlerts(); 
};

// Draw alerts on page load
displayAlerts();
// ------------------------------------
// --- INTERACTIVE NEON CURSOR LOGIC ---
const cursorRing = document.createElement('div');
cursorRing.classList.add('custom-cursor');
document.body.appendChild(cursorRing);

// Make the ring follow the mouse
document.addEventListener('mousemove', function(e) {
    cursorRing.style.left = e.clientX + 'px';
    cursorRing.style.top = e.clientY + 'px';
});

// Expand the ring when hovering over clickable elements
document.addEventListener('mouseover', function(e) {
    const clickableElements = ['BUTTON', 'LI', 'INPUT'];
    // Trigger if hovering over a button/input, or anywhere inside a table row
    if (clickableElements.includes(e.target.tagName) || e.target.closest('tr')) {
        cursorRing.classList.add('hover-active');
    }
});

// Shrink the ring when the mouse leaves
document.addEventListener('mouseout', function(e) {
    const clickableElements = ['BUTTON', 'LI', 'INPUT'];
    if (clickableElements.includes(e.target.tagName) || e.target.closest('tr')) {
        cursorRing.classList.remove('hover-active');
    }
});

// Pulse effect when you click the mouse
document.addEventListener('mousedown', function() {
    cursorRing.style.transform = 'translate(-50%, -50%) scale(0.7)';
});
document.addEventListener('mouseup', function() {
    cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
});
// ------------------------------------